from pydantic import BaseModel
from typing import Optional

class CommunityReportCreate(BaseModel):
    location_name: str
    lat: float
    lon: float
    report_type: str  # "Waterlogged Road", "Heavy Downpour", "Strong Wind", "Fallen Tree/Branch", "Hailstorm", "Dense Fog / Low Visibility"
    description: str
    severity: str  # "Moderate", "Severe", "Critical"

class CommunityReport(BaseModel):
    id: int
    location_name: str
    lat: float
    lon: float
    report_type: str
    description: str
    severity: str
    created_at: str
    is_verified: bool = False
    verification_label: str = "UNVERIFIED COMMUNITY REPORT"
