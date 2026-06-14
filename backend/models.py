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
    membership_type: str = "Basic"
    join_date: Optional[str] = None
    last_visit_date: Optional[str] = None
    classes_attended: int = 0
    favorite_class: Optional[str] = None
    cancellations: int = 0
    total_spent: float = 0.0
    purchase_count: int = 0
    membership_expiry_date: Optional[str] = None
    churn_risk_score: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CampaignModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    name: str
    segment_id: Optional[str] = None
    segment_name: str
    message_id: Optional[str] = None
    channel: str # sms, email, web_push
    status: str # draft, scheduled, sending, sent, completed
    churn_risk_tier: Optional[str] = None
    class_related: bool = False
    membership_related: bool = False
    stats: Dict[str, int] = {
        "sent": 0, "delivered": 0, "opened": 0, "clicked": 0, "failed": 0, 
        "class_attendance": 0, "members_renewed": 0
    }
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
    campaign_name: Optional[str] = "AI Generated Campaign"
