from pydantic import BaseModel, Field
from typing import List, Optional

class SavedLocation(BaseModel):
    id: str
    label: str  # e.g., "Home", "Farm", "Workplace", "Coastal Station"
    name: str
    lat: float
    lon: float

class UserProfile(BaseModel):
    user_id: str
    name: str
    role: str = "farmer"  # Maps to PROFESSIONS
    phone: Optional[str] = None
    email: Optional[str] = None
    auto_gps: bool = True
    preferred_language: str = "en"
    saved_locations: List[SavedLocation] = Field(default_factory=list)

class LoginRequest(BaseModel):
    identifier: str  # Email, Mobile, or Officer Badge ID
    name: Optional[str] = "Citizen User"
    role: Optional[str] = "farmer"
