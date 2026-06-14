import os
from motor.motor_asyncio import AsyncIOMotorClient
import certifi

MONGODB_URI = os.environ.get("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = "xeno_crm"

if "mongodb+srv" in MONGODB_URI or "ssl=true" in MONGODB_URI.lower() or "tls=true" in MONGODB_URI.lower():
    client = AsyncIOMotorClient(MONGODB_URI, tlsCAFile=certifi.where(), tlsAllowInvalidCertificates=True)
else:
    client = AsyncIOMotorClient(MONGODB_URI)
db = client[DB_NAME]

# Collections
customers_collection = db.customers
campaigns_collection = db.campaigns
messages_collection = db.messages
channel_events_collection = db.channel_events
analytics_collection = db.analytics
