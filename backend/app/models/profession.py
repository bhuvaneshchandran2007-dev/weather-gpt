from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class ProfessionAdvisory(BaseModel):
    profession_id: str
    profession_name: str
    icon: str
    risk_level: str  # "Low", "Moderate", "High", "Critical"
    summary: str
    impact_analysis: List[str]
    action_recommendations: List[str]
    best_time_window: Optional[str] = None
    avoidance_window: Optional[str] = None
    telemetry_summary: Dict[str, Any] = {}
    disclaimer: str = "AI-derived decision support based on real-time meteorological observations."
