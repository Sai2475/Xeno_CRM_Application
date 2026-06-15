import asyncio
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
import certifi

async def check():
    client = AsyncIOMotorClient('mongodb+srv://admin:MySecurePassword123@cluster0.kaic2ph.mongodb.net/?appName=Cluster0', tlsCAFile=certifi.where())
    db = client['xeno_crm']
    campaign = await db.campaigns_collection.find_one({'_id': ObjectId('6a2f439aac8858b90bf3f083')})
    print(f'Campaign: {campaign}')

asyncio.run(check())
