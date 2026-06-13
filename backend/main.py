from fastapi import FastAPI, BackgroundTasks, HTTPException, UploadFile, File, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import csv
import io
import uuid
import asyncio
from datetime import datetime
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
@app.post("/api/customers/upload")
async def upload_customers(file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload a CSV.")
    
    contents = await file.read()
    csv_reader = csv.DictReader(io.StringIO(contents.decode('utf-8')))
    
    customers_to_insert = []
    for row in csv_reader:
        # Expected: id, email, phone, name, last_purchase_date, total_spent, purchase_count
        customers_to_insert.append({
            "email": row.get('email', ''),
            "phone": row.get('phone', ''),
            "name": row.get('name', ''),
            "last_purchase_date": row.get('last_purchase_date', None),
            "total_spent": float(row.get('total_spent', 0)),
            "purchase_count": int(row.get('purchase_count', 0)),
            "created_at": datetime.utcnow()
        })
    
    if customers_to_insert:
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
            draft = ai.generate_campaign_content(request.message)
            return {
                "reply": "Here are some campaign ideas based on your request.",
                "draft": draft,
                "action": "campaign_drafted"
            }
        else:
            reply = ai.chat_with_agent(request.message)
            return {"reply": reply, "action": "chat"}
    except Exception as e:
        print(f"AI Chat Error: {e}")
        # Fallback handling
        return {
            "reply": "I'm currently experiencing high latency. Would you like to use a standard SMS template for a win-back campaign?",
            "action": "fallback"
        }

# -- Phase 4: Campaign Execution & Channel Simulator --
async def simulate_channel_delivery(campaign_id: str, customer: dict, channel: str, message_content: str):
    """Background task to simulate delivery lifecycle"""
    customer_id = str(customer.get("_id", ""))
    recipient = customer.get("phone") if channel == "sms" else customer.get("email")
    
    # helper to post to webhook internally to avoid HTTP overhead
    async def fire_webhook(status: str):
        event_id = f"{campaign_id}_{customer_id}_{status}"
        await process_channel_event({
            "event_id": event_id,
            "campaign_id": campaign_id,
            "customer_id": customer_id,
            "recipient": recipient,
            "channel": channel,
            "status": status,
            "timestamp": datetime.utcnow()
        })

    # 0-2s: Sent
    await asyncio.sleep(1)
    await fire_webhook("sent")

    # 2-5s: Delivered (90% success)
    await asyncio.sleep(2)
    import random
    if random.random() > 0.9:
        await fire_webhook("failed")
        return
    await fire_webhook("delivered")

    # 5-60s: Opened (40% of delivered)
    await asyncio.sleep(random.uniform(3, 10))
    if random.random() <= 0.4:
        await fire_webhook("opened")
        
        # 60-300s: Clicked (15% of opened)
        await asyncio.sleep(random.uniform(5, 15))
        if random.random() <= 0.15:
            await fire_webhook("clicked")

@app.post("/api/campaigns/send")
async def send_campaign(request: models.LaunchCampaignRequest, background_tasks: BackgroundTasks):
    # Fetch customers matching the segment FIRST so we can count them
    cursor = db.customers_collection.find(request.segment_query)
    customers = await cursor.to_list(length=1000)

    campaign = {
        "name": "AI Generated Campaign",
        "segment_criteria": request.segment_query,
        "message_content": request.message_content,
        "channel": request.channel,
        "status": "sending",
        "customer_count": len(customers),
        "created_at": datetime.utcnow()
    }
    result = await db.campaigns_collection.insert_one(campaign)
    campaign_id = str(result.inserted_id)

    queued_events = []
    # Spawn background simulation tasks and queue events
    for customer in customers:
        customer_id = str(customer.get("_id", ""))
        recipient = customer.get("phone") if request.channel == "sms" else customer.get("email")
        
        # 1. Queue immediately
        queued_events.append({
            "event_id": f"{campaign_id}_{customer_id}_queued",
            "campaign_id": campaign_id,
            "customer_id": customer_id,
            "recipient": recipient,
            "channel": request.channel,
            "status": "queued",
            "timestamp": datetime.utcnow()
        })
        
        # 2. Spawn simulation task
        background_tasks.add_task(
            simulate_channel_delivery, 
            campaign_id, 
            customer, 
            request.channel, 
            request.message_content
        )

    if queued_events:
        await db.channel_events_collection.insert_many(queued_events)

    return {"status": "started", "campaign_id": campaign_id, "customer_count": len(customers)}

from bson import ObjectId

# Webhook Handler with Idempotency
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
            "clicked": updated_campaign.get("clicked", 0),
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
        "clicked": campaign.get("clicked", 0),
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
    # Get overall analytics
    cursor = db.analytics_collection.find({})
    analytics = await cursor.to_list(length=100)
    
    return {
        "metrics": {
            "total_customers": total_customers,
            "analytics": [ { "metric": a["metric"], "count": a["count"], "campaign_id": str(a["campaign_id"]) } for a in analytics ]
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
