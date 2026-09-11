from pydantic import BaseModel, Field
from typing import List, Optional

class RiskFactor(BaseModel):
    name: str
    observed_value: str
    threshold_impact: str

class RiskCategoryScore(BaseModel):
    category: str  # "Rain Risk", "Wind Risk", "Heat Risk", "Visibility Risk", "Storm Risk", "Travel Risk", "Outdoor Activity Risk"
    score: int  # 0 - 100
    level: str  # "Minimal", "Low", "Moderate", "High", "Critical"
    color: str  # hex or tailwind class
    summary: str
    contributing_factors: List[RiskFactor] = []

class CompoundRiskAlert(BaseModel):
    hazard_title: str
    severity: str  # "Moderate", "High", "Extreme"
    primary_hazard: str
    secondary_hazard: str
    rationale: str
    recommended_precautions: List[str]

class AiRiskAssessment(BaseModel):
    overall_score: int
    overall_level: str
    categories: List[RiskCategoryScore]
    compound_hazards: List[CompoundRiskAlert] = []
    calculation_basis: str = "Real-time algorithmic synthesis of precipitation probability, rainfall volume, wind gusts, relative humidity heat index, and optical visibility."
    is_official_warning: bool = False
    disclaimer: str = "AI-derived prototype risk score. Not an official meteorological warning."
