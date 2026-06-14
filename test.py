import asyncio, os
from motor.motor_asyncio import AsyncIOMotorClient

async def run():
    client = AsyncIOMotorClient(os.getenv('MONGODB_URI'), tlsAllowInvalidCertificates=True)
    db = client['xeno_crm']
    types = await db.customers_collection.distinct('membership_type')
    print(f'Tiers in DB: {types}')

asyncio.run(run())
