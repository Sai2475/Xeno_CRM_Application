import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import certifi

async def check():
    client = AsyncIOMotorClient('mongodb+srv://admin:MySecurePassword123@cluster0.kaic2ph.mongodb.net/?appName=Cluster0', tlsCAFile=certifi.where())
    db = client['xeno_crm']
    campaigns = await db.campaigns_collection.find().to_list(length=10)
    print('Campaigns in DB:')
    for c in campaigns:
        print(c)

asyncio.run(check())
