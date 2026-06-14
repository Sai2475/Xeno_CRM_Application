from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
import asyncio
import httpx
import random
import os
from datetime import datetime

app = FastAPI(title="Channel Service Simulation")

CRM_WEBHOOK_URL = os.environ.get("CRM_WEBHOOK_URL", "http://localhost:8000/api/receipt")

class SendRequest(BaseModel):
    campaign_id: str
    customer_id: str
    recipient: str
    channel: str
    message: str

async def simulate_message_lifecycle(campaign_id: str, customer_id: str):
    async with httpx.AsyncClient() as client:
        # Simulate Network Delay -> Delivered
        await asyncio.sleep(random.uniform(0.5, 2.0))
        await client.post(CRM_WEBHOOK_URL, json={
            "event_id": f"{campaign_id}_{customer_id}_delivered",
            "campaign_id": campaign_id,
            "customer_id": customer_id,
            "status": "delivered",
            "timestamp": datetime.now().isoformat()
        })
        
        # 80% chance to Open
        if random.random() < 0.8:
            await asyncio.sleep(random.uniform(1.0, 5.0))
            await client.post(CRM_WEBHOOK_URL, json={
                "event_id": f"{campaign_id}_{customer_id}_opened",
                "campaign_id": campaign_id,
                "customer_id": customer_id,
                "status": "opened",
                "timestamp": datetime.now().isoformat()
            })
            
            # 40% chance to Click
            if random.random() < 0.4:
                await asyncio.sleep(random.uniform(1.0, 4.0))
                await client.post(CRM_WEBHOOK_URL, json={
                    "event_id": f"{campaign_id}_{customer_id}_clicked",
                    "campaign_id": campaign_id,
                    "customer_id": customer_id,
                    "status": "clicked",
                    "timestamp": datetime.now().isoformat()
                })
                
                # 20% chance to Convert
                if random.random() < 0.2:
                    await asyncio.sleep(random.uniform(2.0, 10.0))
                    await client.post(CRM_WEBHOOK_URL, json={
                        "event_id": f"{campaign_id}_{customer_id}_converted",
                        "campaign_id": campaign_id,
                        "customer_id": customer_id,
                        "status": "converted",
                        "timestamp": datetime.now().isoformat()
                    })


@app.post("/send")
async def send_message(request: SendRequest, background_tasks: BackgroundTasks):
    background_tasks.add_task(simulate_message_lifecycle, request.campaign_id, request.customer_id)
    return {"status": "accepted", "campaign_id": request.campaign_id, "customer_id": request.customer_id}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
