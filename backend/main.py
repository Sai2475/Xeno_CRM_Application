from fastapi import FastAPI, BackgroundTasks, HTTPException, UploadFile, File, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import csv
import io
import uuid
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Any
from motor.motor_asyncio import AsyncIOMotorClient

import models as models
import database as db
import ai_service as ai

app = FastAPI(title="Xeno AI Command Center")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket Connection Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, campaign_id: str):
        await websocket.accept()
        if campaign_id not in self.active_connections:
            self.active_connections[campaign_id] = []
        self.active_connections[campaign_id].append(websocket)

    def disconnect(self, websocket: WebSocket, campaign_id: str):
        if campaign_id in self.active_connections:
            self.active_connections[campaign_id].remove(websocket)
            if not self.active_connections[campaign_id]:
                del self.active_connections[campaign_id]

    async def broadcast(self, campaign_id: str, message: dict):
        if campaign_id in self.active_connections:
            for connection in self.active_connections[campaign_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    pass

manager = ConnectionManager()

# -- Phase 2: Data Ingestion --
@app.get("/api/customers/stats")
async def get_customer_stats():
    cursor = db.customers_collection.find({})
    customers = await cursor.to_list(length=None)
    
    tier_counts = {}
    class_counts = {}
    risk_ranges = {"Low": 0, "Medium": 0, "High": 0}
    active_vs_risk = {"Active": 0, "At Risk": 0}
    
    for c in customers:
        tier = c.get("membership_type", "Unknown")
        tier_counts[tier] = tier_counts.get(tier, 0) + 1
        
        fav_class = c.get("favorite_class", "Unknown")
        class_counts[fav_class] = class_counts.get(fav_class, 0) + 1
        
        churn = c.get("churn_risk_score", 0)
        if churn < 30:
            risk_ranges["Low"] += 1
        elif churn < 70:
            risk_ranges["Medium"] += 1
        else:
            risk_ranges["High"] += 1
            
        if churn < 70:
            active_vs_risk["Active"] += 1
        else:
            active_vs_risk["At Risk"] += 1
            
    return {
        "tiers": [{"name": k, "value": v} for k, v in tier_counts.items()],
        "classes": [{"name": k, "value": v} for k, v in class_counts.items()],
        "risk": [{"name": k, "value": v} for k, v in risk_ranges.items()],
        "health": [{"name": k, "value": v} for k, v in active_vs_risk.items()]
    }

@app.post("/api/customers/upload")
async def upload_customers(file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload a CSV.")
    
    contents = await file.read()
    csv_reader = csv.DictReader(io.StringIO(contents.decode('utf-8')))
    
    customers_to_insert = []
    def safe_int(val):
        try:
            return int(val)
        except (ValueError, TypeError):
            return 0
            
    def safe_float(val):
        try:
            return float(val)
        except (ValueError, TypeError):
            return 0.0

    for row in csv_reader:
        cancellations = safe_int(row.get('cancellations'))
        
        # Calculate dynamic churn risk score
        churn_score = 0
        last_visit_str = row.get('last_visit_date')
        if last_visit_str:
            try:
                dt = datetime.strptime(last_visit_str[:10], "%Y-%m-%d")
                days_since = (datetime.utcnow() - dt).days
                if days_since > 30:
                    churn_score += 60
            except Exception:
                pass
        
        if cancellations > 0:
            churn_score += (25 * cancellations)
            
        churn_score = min(100, churn_score)

        customers_to_insert.append({
            "email": row.get('email', ''),
            "phone": row.get('phone', ''),
            "name": row.get('name', ''),
            "membership_type": row.get('membership_type') or 'Basic',
            "join_date": row.get('join_date') or None,
            "last_visit_date": row.get('last_visit_date') or None,
            "classes_attended": safe_int(row.get('classes_attended')),
            "favorite_class": row.get('favorite_class') or 'General',
            "cancellations": cancellations,
            "total_spent": safe_float(row.get('total_spent')),
            "purchase_count": safe_int(row.get('purchase_count')),
            "membership_expiry_date": row.get('membership_expiry_date') or None,
            "churn_risk_score": churn_score,
            "created_at": datetime.utcnow().isoformat()
        })
    
    if customers_to_insert:
        # Clear existing data to prevent duplication
        await db.customers_collection.delete_many({})
        await db.customers_collection.insert_many(customers_to_insert)
    
    total_count = await db.customers_collection.count_documents({})
    return {"message": f"Successfully imported {len(customers_to_insert)} customers.", "total_customers": total_count}

# -- Phase 3: AI Chat & Segmentation --
@app.post("/api/ai/chat")
async def ai_chat(request: models.ChatRequest):
    try:
        # If user asks to create a segment, we generate a Mongo query
        if "segment" in request.message.lower() or "customers who" in request.message.lower():
            query_obj = ai.generate_mongo_query(request.message)
            count = await db.customers_collection.count_documents(query_obj)
            return {
                "reply": f"Found {count} customers matching your criteria.",
                "segment_query": query_obj,
                "count": count,
                "action": "segment_created"
            }
        elif "campaign" in request.message.lower() or "message" in request.message.lower():
            # Get real context to avoid hallucinating names in campaign variants
            query_obj = ai.generate_mongo_query(request.message)
            cursor = db.customers_collection.find(query_obj).limit(5)
            sample_customers = await cursor.to_list(length=5)
            real_names = [c.get("name", "Unknown") for c in sample_customers if c.get("name")]
            real_classes = [c.get("favorite_class", "General") for c in sample_customers if c.get("favorite_class")]
            db_context = f"Sample Real Names: {', '.join(real_names)}. Sample Classes: {', '.join(real_classes)}."
            
            draft = ai.generate_campaign_content(request.message, db_context)
            return {
                "reply": "Here are some campaign ideas based on your request.",
                "draft": draft,
                "action": "campaign_drafted"
            }
        else:
            # RAG Pipeline: Always query DB for exact metrics before chatting
            query_obj = ai.generate_mongo_query(request.message)
            matching_count = await db.customers_collection.count_documents(query_obj)
            
            # Sort to get the most relevant/active members for the context
            cursor = db.customers_collection.find(query_obj).sort([("classes_attended", -1), ("total_spent", -1)]).limit(5)
            sample_customers = await cursor.to_list(length=5)
            
            sample_details = []
            for c in sample_customers:
                name = c.get("name", "Unknown")
                classes = c.get("classes_attended", 0)
                spent = c.get("total_spent", 0)
                tier = c.get("membership_type", "Basic")
                sample_details.append(f"{name}: {classes} classes, ${spent} spent, {tier}")
            
            # Fetch all for deep analytics
            all_customers = await db.customers_collection.find({}).to_list(None)
            total_members = len(all_customers)
            
            active_count = 0
            at_risk_count = 0
            total_ltv = 0
            total_classes = 0
            high_risk_revenue = 0
            renewals_due = 0
            
            tier_stats = {"Basic": {"count": 0, "ltv": 0, "active": 0}, "Premium": {"count": 0, "ltv": 0, "active": 0}, "VIP": {"count": 0, "ltv": 0, "active": 0}}
            class_stats = {}
            
            now = datetime.utcnow()
            for c in all_customers:
                tier = c.get("membership_type", "Basic")
                fav_class = c.get("favorite_class", "General")
                spent = c.get("total_spent", 0)
                classes = c.get("classes_attended", 0)
                churn = c.get("churn_risk_score", 0)
                
                total_ltv += spent
                total_classes += classes
                
                if tier not in tier_stats:
                    tier_stats[tier] = {"count": 0, "ltv": 0, "active": 0}
                tier_stats[tier]["count"] += 1
                tier_stats[tier]["ltv"] += spent
                
                if fav_class not in class_stats:
                    class_stats[fav_class] = {"count": 0, "active": 0, "classes": 0}
                class_stats[fav_class]["count"] += 1
                class_stats[fav_class]["classes"] += classes
                
                # Active vs At risk
                is_active = churn < 70
                if is_active:
                    active_count += 1
                    tier_stats[tier]["active"] += 1
                    class_stats[fav_class]["active"] += 1
                else:
                    at_risk_count += 1
                    high_risk_revenue += spent
                    
                # Expiry
                expiry = c.get("membership_expiry_date")
                if expiry:
                    try:
                        exp_dt = datetime.strptime(expiry[:10], "%Y-%m-%d")
                        if 0 <= (exp_dt - now).days <= 30:
                            renewals_due += 1
                    except:
                        pass

            avg_ltv = total_ltv / total_members if total_members else 0
            avg_classes = total_classes / total_members if total_members else 0
            
            # Format Advanced Analytics Context
            db_context = f"FITFLOW ADVANCED ANALYTICS:\n"
            db_context += f"- Total Members: {total_members}\n"
            db_context += f"- Active Members (last 30 days): {active_count} ({int(active_count/total_members*100) if total_members else 0}% retention)\n"
            db_context += f"- High Churn Risk Members: {at_risk_count}\n"
            db_context += f"- Average Lifetime Value: ${avg_ltv:.2f}\n"
            db_context += f"- Total Revenue at Risk: ${high_risk_revenue:.2f}\n"
            db_context += f"- Renewals Due (30 days): {renewals_due}\n\n"
            
            db_context += "TIER ANALYTICS (Retention & LTV):\n"
            for t, stats in tier_stats.items():
                if stats["count"] > 0:
                    ret_rate = int(stats["active"] / stats["count"] * 100)
                    t_avg_ltv = stats["ltv"] / stats["count"]
                    db_context += f"- {t}: {stats['count']} members, {ret_rate}% retention, ${t_avg_ltv:.2f} avg LTV\n"
            
            db_context += "\nCLASS ANALYTICS:\n"
            for cl, stats in class_stats.items():
                if stats["count"] > 0:
                    ret_rate = int(stats["active"] / stats["count"] * 100)
                    avg_att = stats["classes"] / stats["count"]
                    db_context += f"- {cl}: {stats['count']} members, {ret_rate}% retention, {avg_att:.1f} avg classes\n"
            
            db_context += f"\nSpecifically for the user's request, exactly {matching_count} members match the criteria.\n"
            if sample_details:
                db_context += f"Top matching members (use these exact stats!):\n" + "\n".join([f"- {d}" for d in sample_details]) + "\n"
            
            reply = ai.chat_with_agent(request.message, db_context)
            return {
                "reply": reply, 
                "action": "chat",
                "segment_query": query_obj,
                "count": matching_count
            }
    except Exception as e:
        print(f"AI Chat Error: {e}")
        # Fallback handling
        return {
            "reply": "I'm currently experiencing high latency. Would you like to use a standard SMS template for a win-back campaign?",
            "action": "fallback"
        }

@app.post("/api/ai/segment")
async def generate_segment(request: models.SegmentRequest):
    query_obj = ai.generate_mongo_query(request.query)
    cursor = db.customers_collection.find(query_obj).limit(50)
    customers = await cursor.to_list(length=50)
    count = await db.customers_collection.count_documents(query_obj)
    
    formatted = []
    for c in customers:
        churn = c.get("churn_risk_score", 0)
        formatted.append({
            "id": str(c.get("_id", "")),
            "name": c.get("name", ""),
            "email": c.get("email", ""),
            "city": c.get("city", "N/A"),
            "total_spend": c.get("total_spent", 0),
            "health_score": "Red" if churn >= 70 else "Yellow" if churn >= 40 else "Green",
            "favorite_class": c.get("favorite_class", ""),
            "membership_type": c.get("membership_type", "")
        })
        
    return {
        "filter_applied": query_obj,
        "count": count,
        "customers": formatted
    }

# -- Phase 4: Campaign Execution & External Channel Integration --

@app.post("/api/campaigns/send")
async def send_campaign(request: models.LaunchCampaignRequest, background_tasks: BackgroundTasks):
    # Fetch customers matching the segment FIRST so we can count them
    cursor = db.customers_collection.find(request.segment_query)
    customers = await cursor.to_list(length=1000)

    campaign = {
        "name": request.campaign_name or "AI Generated Campaign",
        "segment_criteria": request.segment_query,
        "message_content": request.message_content,
        "channel": request.channel,
        "status": "sending",
        "customer_count": len(customers),
        "created_at": datetime.utcnow()
    }
    result = await db.campaigns_collection.insert_one(campaign)
    campaign_id = str(result.inserted_id)

    import httpx
    
    queued_events = []
    tasks = []
    
    async with httpx.AsyncClient() as client:
        # Spawn external API calls
        for customer in customers:
            customer_id = str(customer.get("_id", ""))
            recipient = customer.get("phone") if request.channel in ["sms", "whatsapp"] else customer.get("email")
            
            # 1. Queue immediately in CRM DB
            queued_events.append({
                "event_id": f"{campaign_id}_{customer_id}_sent",
                "campaign_id": campaign_id,
                "customer_id": customer_id,
                "recipient": recipient,
                "channel": request.channel,
                "status": "sent",
                "timestamp": datetime.utcnow()
            })
            
            # 2. Fire HTTP request to External Channel Service Stub
            payload = {
                "campaign_id": campaign_id,
                "customer_id": customer_id,
                "recipient": str(recipient) if recipient else "",
                "channel": request.channel,
                "message": request.message_content
            }
            # Append post call to tasks list
            channel_url = os.environ.get("CHANNEL_SERVICE_URL", "http://localhost:8001").rstrip("/") + "/send"
            tasks.append(client.post(channel_url, json=payload))
            
        if tasks:
            try:
                # Concurrently fire all requests to simulator
                await asyncio.gather(*tasks, return_exceptions=True)
            except Exception as e:
                print(f"Failed to communicate with Channel Service: {e}")

    if queued_events:
        await db.channel_events_collection.insert_many(queued_events)
        await db.campaigns_collection.update_one(
            {"_id": ObjectId(campaign_id)},
            {"$inc": {"sent": len(customers)}}
        )
        await db.analytics_collection.update_one(
            {"campaign_id": campaign_id, "metric": "sent"},
            {"$inc": {"count": len(customers)}},
            upsert=True
        )

    return {"status": "started", "campaign_id": campaign_id, "customer_count": len(customers)}

from bson import ObjectId

# Webhook Handler with Idempotency
@app.post("/api/receipt")
async def process_channel_event(event_data: dict):
    # Check for duplicate event_id
    existing = await db.channel_events_collection.find_one({"event_id": event_data["event_id"]})
    if existing:
        return # Idempotent handling, do nothing if already processed

    await db.channel_events_collection.insert_one(event_data)

    # Update Analytics aggregate (global)
    await db.analytics_collection.update_one(
        {"campaign_id": event_data["campaign_id"], "metric": event_data["status"]},
        {"$inc": {"count": 1}},
        upsert=True
    )
    
    # Update Campaign object specific metrics
    status = event_data["status"]
    await db.campaigns_collection.update_one(
        {"_id": ObjectId(event_data["campaign_id"])},
        {"$inc": {status: 1}}
    )

    # If converted, simulate customer purchase attribution (closed loop)
    if status == "converted" and event_data.get("customer_id"):
        try:
            await db.customers_collection.update_one(
                {"_id": ObjectId(event_data["customer_id"])},
                {"$inc": {"total_spent": 45.0, "purchase_count": 1}}
            )
        except Exception as e:
            print(f"Failed to attribute conversion to customer: {e}")
    
    # Fetch updated campaign to broadcast accurate totals
    updated_campaign = await db.campaigns_collection.find_one({"_id": ObjectId(event_data["campaign_id"])})

    # Broadcast to specific campaign WebSocket (sending totals)
    await manager.broadcast(event_data["campaign_id"], {
        "event": "status_update",
        "data": {
            "campaign_id": event_data["campaign_id"],
            "sent": updated_campaign.get("sent", 0),
            "delivered": updated_campaign.get("delivered", 0),
            "opened": updated_campaign.get("opened", 0),
            "read": updated_campaign.get("read", 0),
            "clicked": updated_campaign.get("clicked", 0),
            "converted": updated_campaign.get("converted", 0),
            "failed": updated_campaign.get("failed", 0)
        }
    })
    
    # Broadcast to global dashboard WebSocket
    await manager.broadcast("global_dashboard", {
        "event": "global_status_update",
        "data": {
            "status": status
        }
    })

@app.get("/api/campaigns")
async def list_campaigns():
    # Fetch all campaigns, sort by created_at desc, limit 20
    cursor = db.campaigns_collection.find({}).sort("created_at", -1).limit(20)
    campaigns = await cursor.to_list(length=20)
    
    result = []
    for c in campaigns:
        result.append({
            "campaign_id": str(c.get("_id")),
            "name": c.get("name", "Campaign"),
            "channel": c.get("channel", "unknown"),
            "status": c.get("status", "unknown"),
            "customer_count": c.get("customer_count", 0),
            "created_at": c.get("created_at")
        })
    return {"campaigns": result}

@app.get("/api/campaigns/{campaign_id}")
async def get_campaign(campaign_id: str):
    campaign = await db.campaigns_collection.find_one({"_id": ObjectId(campaign_id)})
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return {
        "campaign_id": campaign_id,
        "sent": campaign.get("sent", 0),
        "delivered": campaign.get("delivered", 0),
        "opened": campaign.get("opened", 0),
        "read": campaign.get("read", 0),
        "clicked": campaign.get("clicked", 0),
        "converted": campaign.get("converted", 0),
        "failed": campaign.get("failed", 0)
    }

@app.post("/api/webhooks/channel-events")
async def channel_webhook(event: dict):
    # This acts as the external facing endpoint
    await process_channel_event(event)
    return {"status": "ok"} # Always 200 OK

# -- Phase 5: WebSockets & Analytics --
@app.websocket("/ws/dashboard")
async def websocket_dashboard(websocket: WebSocket):
    await manager.connect(websocket, "global_dashboard")
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, "global_dashboard")

# -- Phase 5: WebSockets & Analytics --
@app.websocket("/ws/campaigns/{campaign_id}")
async def websocket_endpoint(websocket: WebSocket, campaign_id: str):
    await manager.connect(websocket, campaign_id)
    try:
        while True:
            await websocket.receive_text() # keep connection alive
    except WebSocketDisconnect:
        manager.disconnect(websocket, campaign_id)

@app.get("/api/dashboard")
async def get_dashboard():
    total_customers = await db.customers_collection.count_documents({})
    at_risk = await db.customers_collection.count_documents({"churn_risk_score": {"$gte": 70}})
    
    thirty_days_from_now = (datetime.utcnow() + timedelta(days=30)).isoformat()
    renewals_due = await db.customers_collection.count_documents({"membership_expiry_date": {"$lt": thirty_days_from_now}})

    # Get overall analytics
    cursor = db.analytics_collection.find({})
    analytics = await cursor.to_list(length=100)
    
    return {
        "metrics": {
            "total_customers": total_customers,
            "at_risk": at_risk,
            "renewals_due": renewals_due,
            "analytics": [ { "metric": a["metric"], "count": a["count"], "campaign_id": str(a["campaign_id"]) } for a in analytics ]
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
