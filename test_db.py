import asyncio, os
from motor.motor_asyncio import AsyncIOMotorClient
async def run():
    client=AsyncIOMotorClient(os.getenv('MONGODB_URI'), tlsAllowInvalidCertificates=True)
    db=client['xeno_crm']
    async for c in db.campaigns_collection.find():
        print(c.get('name'), c.get('segment_criteria'))
asyncio.run(run())
