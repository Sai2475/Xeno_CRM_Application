from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type="string")

class CustomerModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    email: str
    phone: str
    name: str
    last_purchase_date: Optional[str] = None
    total_spent: float
    purchase_count: int
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CampaignModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    name: str
    segment_id: Optional[str] = None
    segment_name: str
    message_id: Optional[str] = None
    channel: str # sms, email, web_push
    status: str # draft, scheduled, sending, sent, completed
    total_count: int = 0
    created_by: str = "system"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    sent_at: Optional[datetime] = None

class MessageModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    campaign_id: str
    content: str
    variables: List[str] = []
    channel: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ChannelEventModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    event_id: str # For idempotency
    campaign_id: str
    customer_id: str
    recipient: str
    channel: str
    status: str # sent, delivered, failed, opened, clicked, converted
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = {}

class AnalyticsModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    campaign_id: str
    metric: str # sent, delivered, opened, clicked
    count: int = 0
    rate: float = 0.0
    channel: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class SegmentRequest(BaseModel):
    query: str

class ChatRequest(BaseModel):
    message: str
    context: Optional[Dict[str, Any]] = None

class LaunchCampaignRequest(BaseModel):
    campaign_id: str
    segment_query: Dict[str, Any]
    channel: str
    message_content: str
