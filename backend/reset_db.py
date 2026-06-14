import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def reset_db():
    print("Connecting to MongoDB...")
    uri = os.environ.get("MONGODB_URI")
    
    if not uri:
        try:
            with open('.env', 'r') as f:
                for line in f:
                    if line.startswith('MONGODB_URI='):
                        uri = line.strip().split('=', 1)[1]
        except Exception:
            pass
            
    if not uri:
        uri = "mongodb://localhost:27017"
    import certifi
    if "mongodb+srv" in uri or "ssl=true" in uri.lower() or "tls=true" in uri.lower():
        client = AsyncIOMotorClient(uri, tlsCAFile=certifi.where())
    else:
        client = AsyncIOMotorClient(uri)
    db = client.xeno_crm
    
    print("Dropping collections...")
    await db.customers.delete_many({})
    await db.campaigns.delete_many({})
    await db.channel_events.delete_many({})
    await db.analytics.delete_many({})
    
    count = await db.customers.count_documents({})
    print(f"Database reset complete. Customers count: {count}")

if __name__ == "__main__":
    asyncio.run(reset_db())
