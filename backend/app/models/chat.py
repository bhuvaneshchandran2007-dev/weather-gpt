from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class ChatMessage(BaseModel):
    role: str
    content: str
    timestamp: Optional[str] = None

class ChatRequest(BaseModel):
    query: str
    location: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    language: Optional[str] = None
    profession: Optional[str] = "general_public"
    history: List[ChatMessage] = []

class WeatherCardSnippet(BaseModel):
    location: str
    temp: float
    feels_like: float
    condition: str
    icon: str
    pop_pct: int
    rain_window: Optional[str] = None
    best_window: Optional[str] = None
    data_source: str = "LIVE WEATHER DATA"
    updated_at: str

class ChatResponse(BaseModel):
    reply: str
    detected_language: str
    detected_language_code: str
    detected_intent: str
    resolved_location: Optional[str] = None
    weather_card: Optional[WeatherCardSnippet] = None
    tools_executed: List[str] = []
    quick_suggestions: List[str] = []
    speech_text: str
    data_freshness_note: str = "LIVE WEATHER DATA • Observation active"
    action_view_state: Optional[str] = None  # "RAIN", "WIND", "ORBIT", "CITY", etc.
    target_lat: Optional[float] = None
    target_lon: Optional[float] = None
