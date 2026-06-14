import asyncio
import random
from datetime import datetime
import httpx
from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Xeno Channel Simulator API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# This points to the CRM Receipt API
CRM_WEBHOOK_URL = "http://localhost:8000/api/webhooks/channel-events"

class SendRequest(BaseModel):
    campaign_id: str
    customer_id: str
    recipient: str
    channel: str
    message: str

async def simulate_lifecycle(data: SendRequest):
    """
    Simulates the lifecycle of a message (sent -> delivered -> opened -> clicked)
    and fires an HTTP POST webhook back to the CRM for each state change.
    """
    async with httpx.AsyncClient() as client:
        async def fire_webhook(status: str):
            payload = {
                "event_id": f"{data.campaign_id}_{data.customer_id}_{status}",
                "campaign_id": data.campaign_id,
                "customer_id": data.customer_id,
                "recipient": data.recipient,
                "channel": data.channel,
                "status": status,
                "timestamp": datetime.utcnow().isoformat()
            }
            try:
                await client.post(CRM_WEBHOOK_URL, json=payload)
            except Exception as e:
                print(f"Failed to fire webhook {status} to CRM: {e}")

        # 0-2s: Sent
        await asyncio.sleep(1)
        await fire_webhook("sent")

        # 2-5s: Delivered (90% success)
        await asyncio.sleep(2)
        if random.random() > 0.9:
            await fire_webhook("failed")
            return
        await fire_webhook("delivered")

        # 5-60s: Opened (40% of delivered)
        await asyncio.sleep(random.uniform(3, 8))
        if random.random() <= 0.4:
            await fire_webhook("opened")
            
            # 2-5s: Read (80% of opened)
            await asyncio.sleep(random.uniform(2, 5))
            await fire_webhook("read")
            
            # 5-15s: Clicked (20% of read)
            await asyncio.sleep(random.uniform(4, 10))
            if random.random() <= 0.20:
                await fire_webhook("clicked")
                
                # 5-10s: Converted (15% of clicked)
                await asyncio.sleep(random.uniform(3, 7))
                if random.random() <= 0.15:
                    await fire_webhook("converted")

@app.post("/simulator/send")
async def handle_send(request: SendRequest, background_tasks: BackgroundTasks):
    """
    The external Send API that the CRM calls. 
    Accepts the payload and processes the simulation asynchronously.
    """
    background_tasks.add_task(simulate_lifecycle, request)
    return {"status": "accepted", "message": "Communication queued for simulation"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
