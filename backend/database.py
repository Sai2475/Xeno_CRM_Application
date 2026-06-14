import os
from motor.motor_asyncio import AsyncIOMotorClient
import certifi

MONGODB_URI = os.environ.get("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = "xeno_crm"

client = AsyncIOMotorClient(MONGODB_URI, tlsCAFile=certifi.where())
db = client[DB_NAME]

# Collections
customers_collection = db.customers
campaigns_collection = db.campaigns
messages_collection = db.messages
channel_events_collection = db.channel_events
analytics_collection = db.analytics
