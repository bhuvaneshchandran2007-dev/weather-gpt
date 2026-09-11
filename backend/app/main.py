from pathlib import Path
from fastapi import FastAPI, Query, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from typing import Optional, List, Dict, Any

from .config import settings
from .models.weather import (
    NormalizedWeatherReport, LocationInfo, WeatherUnavailableResponse,
    RainIntelligence, HourlyForecastItem, DailyForecastItem, OfficialAlert
)
from .models.profession import ProfessionAdvisory
from .models.risk import AiRiskAssessment
from .models.chat import ChatRequest, ChatResponse
from .models.community import CommunityReport, CommunityReportCreate
from .models.user import UserProfile, SavedLocation, LoginRequest
from .services.weather_service import weather_service, WeatherUnavailableException
from .services.rain_intelligence import compute_rain_intelligence
from .services.risk_engine import compute_ai_risks
from .services.profession_engine import generate_profession_advisory
from .services.simulation_engine import SimulationRequest, SimulationResult, run_weather_simulation
from .services.community_service import community_service
from .services.health_service import health_service
from .services.ai_agent import ai_agent
from .services.nwp_service import nwp_orchestrator
from .services.climate_service import climate_service

app = FastAPI(
    title="WeatherGPT API - MoES / IMD",
    description="Conversational AI for Weather Forecasting, Alerts, and Climate Information (SIH Problem Statement 26068)",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FRONTEND_DIST = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
assets_path = FRONTEND_DIST / "assets"
if assets_path.exists():
    app.mount("/assets", StaticFiles(directory=str(assets_path)), name="assets")

@app.exception_handler(WeatherUnavailableException)
async def weather_unavailable_handler(request, exc: WeatherUnavailableException):
    return JSONResponse(
        status_code=503,
        content=WeatherUnavailableResponse(
            status="unavailable",
            error_code=exc.error_code,
            message="REAL DATA CURRENTLY UNAVAILABLE",
            diagnostic_reason=exc.diagnostic_reason,
            troubleshooting_steps=exc.troubleshooting_steps,
            is_real_data=False
        ).model_dump()
    )

@app.get("/", include_in_schema=False)
def root():
    index_file = FRONTEND_DIST / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    return {
        "app": "WeatherGPT",
        "tagline": "Understand the weather. Predict the impact. Know what to do.",
        "organization": "Ministry of Earth Sciences (MoES) / India Meteorological Department (IMD)",
        "sih_problem_statement": "26068",
        "status": "online",
        "api_docs": "/docs"
    }

@app.get("/api/weather/location", response_model=List[LocationInfo])
def search_location(q: str = Query(..., min_length=2, description="Location search query")):
    """Geocoding: resolve natural language query to coordinates."""
    return weather_service.geocode(q)

@app.get("/api/weather/reverse-location", response_model=LocationInfo)
def reverse_location(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude")
):
    """Reverse geocoding: resolve coordinates to city name."""
    return weather_service.reverse_geocode(lat, lon)

@app.get("/api/weather/full", response_model=NormalizedWeatherReport)
def get_full_weather(
    lat: Optional[float] = Query(None),
    lon: Optional[float] = Query(None),
    city: Optional[str] = Query(None)
):
    """Fetch complete normalized real weather report."""
    loc_override = None
    if city and (lat is None or lon is None):
        results = weather_service.geocode(city)
        if not results:
            raise HTTPException(status_code=404, detail=f"Location '{city}' could not be resolved.")
        loc_override = results[0]
        lat = loc_override.lat
        lon = loc_override.lon
    elif lat is None or lon is None:
        # Default to Chennai if no location specified
        lat = 13.0827
        lon = 80.2707

    return weather_service.get_weather_data(lat, lon, location_override=loc_override)

@app.get("/api/weather/current")
def get_current(lat: float, lon: float):
    """Get current observation."""
    report = weather_service.get_weather_data(lat, lon)
    return {
        "location": report.location,
        "current": report.current,
        "data_source": report.data_source,
        "last_updated": report.last_updated,
        "freshness_seconds": report.freshness_seconds
    }

@app.get("/api/weather/hourly", response_model=List[HourlyForecastItem])
def get_hourly(lat: float, lon: float):
    """Get hourly forecast items."""
    report = weather_service.get_weather_data(lat, lon)
    return report.hourly

@app.get("/api/weather/daily", response_model=List[DailyForecastItem])
def get_daily(lat: float, lon: float):
    """Get daily 5-day forecast summaries."""
    report = weather_service.get_weather_data(lat, lon)
    return report.daily

@app.get("/api/weather/rain-timeline", response_model=RainIntelligence)
def get_rain_timeline(lat: float, lon: float):
    """Get dedicated Rain Timeline and intelligence."""
    report = weather_service.get_weather_data(lat, lon)
    return report.rain_intelligence

@app.get("/api/weather/alerts", response_model=List[OfficialAlert])
def get_alerts(lat: float, lon: float):
    """Get connected official meteorological warnings."""
    report = weather_service.get_weather_data(lat, lon)
    return report.official_alerts

@app.post("/api/risk/analyze", response_model=AiRiskAssessment)
def analyze_risks(lat: float = Query(...), lon: float = Query(...)):
    """Dynamic explainable AI risk engine with compound hazard detection."""
    report = weather_service.get_weather_data(lat, lon)
    return compute_ai_risks(report)

@app.post("/api/advisory/profession", response_model=ProfessionAdvisory)
def get_profession_advisory_endpoint(
    profession: str = Query(..., description="Profession ID e.g. farmer, fisherman, driver"),
    lat: float = Query(...),
    lon: float = Query(...)
):
    """Profession Intelligence Engine decision support."""
    report = weather_service.get_weather_data(lat, lon)
    return generate_profession_advisory(profession, report)

@app.post("/api/simulation/run", response_model=SimulationResult)
def run_simulation_endpoint(
    sim_params: SimulationRequest,
    lat: float = Query(...),
    lon: float = Query(...)
):
    """What-If Weather Simulator comparing REAL baseline vs hypothetical shifts."""
    report = weather_service.get_weather_data(lat, lon)
    return run_weather_simulation(report, sim_params)

@app.post("/api/ai/chat", response_model=ChatResponse)
def conversational_chat(req: ChatRequest):
    """Conversational weather AI agent with multilingual reasoning and tool calling."""
    return ai_agent.handle_chat(req)

@app.get("/api/community/reports", response_model=List[CommunityReport])
def list_community_reports(limit: int = 25):
    """Retrieve crowdsourced unverified field reports."""
    return community_service.get_reports(limit=limit)

@app.post("/api/community/reports", response_model=CommunityReport)
def create_community_report(report_in: CommunityReportCreate):
    """Submit a localized unverified community weather report."""
    return community_service.add_report(report_in)

@app.get("/api/data-health")
def get_data_health():
    """System Data Health diagnostic endpoint for SIH judges and telemetry."""
    return health_service.get_system_health()

@app.get("/api/nwp/data")
def get_nwp_data(
    model: str = Query("gfs", description="NWP model name: gfs or wrf"),
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude")
):
    """Numerical Weather Prediction (NWP) model gridded output."""
    return nwp_orchestrator.get_nwp_model_data(model, lat, lon)

@app.get("/api/climate/trends")
def get_climate_trends(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    years: int = Query(10, description="Decadal window span")
):
    """Long-term climate normals, anomalies, and warming trends."""
    return climate_service.get_climate_trends(lat, lon, years)

@app.get("/api/climate/historical")
def get_climate_historical(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    date: str = Query(..., description="Historical date in YYYY-MM-DD format")
):
    """Historical meteorological snapshot for specified past date."""
    return climate_service.get_historical_snapshot(lat, lon, date)

@app.get("/api/technical/details")
def get_technical_details(
    lat: Optional[float] = Query(None),
    lon: Optional[float] = Query(None)
):
    """Technical transparency drawer telemetry (underlying provider, endpoints, latency, and grid metrics)."""
    return {
        "primary_meteorological_feed": "Current Observation & Forecast Feed",
        "api_endpoint": "api.openweathermap.org",
        "last_ping_latency_ms": weather_service.last_api_latency_ms,
        "last_http_status": weather_service.last_api_status_code or 200,
        "last_synced_at": weather_service.last_api_check_time or "Active",
        "nwp_gridded_models": ["NOAA GFS-FV3 (0.25° Grid)", "WRF Mesoscale 3km (Regional)"],
        "climate_reanalysis_engine": "ERA5 Global Atmospheric Reanalysis",
        "coordinates_queried": {"lat": lat, "lon": lon} if lat is not None and lon is not None else None,
        "transparency_note": "This panel displays backend technical architecture and pipeline telemetry for MoES / IMD system audit. Normal user interface displays unified data classifications."
    }


# In-memory user profile store
USER_STORE: Dict[str, UserProfile] = {
    "default": UserProfile(
        user_id="default",
        name="Citizen User",
        role="farmer",
        phone="+91 98765 43210",
        email="citizen@imd.gov.in",
        auto_gps=True,
        preferred_language="en",
        saved_locations=[
            SavedLocation(id="loc-1", label="Home", name="Chennai, Tamil Nadu", lat=13.0827, lon=80.2707),
            SavedLocation(id="loc-2", label="Farm", name="Thanjavur, Tamil Nadu", lat=10.7870, lon=79.1378),
            SavedLocation(id="loc-3", label="Fleet Hub", name="Ennore Port, Chennai", lat=13.2354, lon=80.3236)
        ]
    )
}

@app.post("/api/user/login", response_model=UserProfile)
def login_user(req: LoginRequest):
    """Authenticate or register user session with saved locations."""
    uid = req.identifier.strip().lower()
    if uid not in USER_STORE:
        USER_STORE[uid] = UserProfile(
            user_id=uid,
            name=req.name or "MoES User",
            role=req.role or "farmer",
            email=req.identifier if "@" in req.identifier else None,
            phone=req.identifier if "@" not in req.identifier else None,
            auto_gps=True,
            preferred_language="en",
            saved_locations=[
                SavedLocation(id="loc-default", label="Home Station", name="Chennai, Tamil Nadu", lat=13.0827, lon=80.2707)
            ]
        )
    return USER_STORE[uid]

@app.get("/api/user/profile", response_model=UserProfile)
def get_user_profile(user_id: str = Query("default")):
    """Get active user profile and saved locations."""
    return USER_STORE.get(user_id, USER_STORE["default"])

@app.post("/api/user/profile", response_model=UserProfile)
def update_user_profile(profile: UserProfile):
    """Update user preferences, role, and auto_gps settings."""
    USER_STORE[profile.user_id] = profile
    return profile

@app.post("/api/user/saved-locations", response_model=List[SavedLocation])
def add_saved_location(loc: SavedLocation, user_id: str = Query("default")):
    """Save a favorite location (Home, Farm, Office, Port) for quick teleportation."""
    profile = USER_STORE.get(user_id, USER_STORE["default"])
    # Remove existing with same id if any
    profile.saved_locations = [l for l in profile.saved_locations if l.id != loc.id]
    profile.saved_locations.append(loc)
    return profile.saved_locations

@app.delete("/api/user/saved-locations/{loc_id}")
def delete_saved_location(loc_id: str, user_id: str = Query("default")):
    """Delete a saved location."""
    profile = USER_STORE.get(user_id, USER_STORE["default"])
    profile.saved_locations = [l for l in profile.saved_locations if l.id != loc_id]
    return {"status": "success", "remaining": len(profile.saved_locations)}


@app.get("/{full_path:path}", include_in_schema=False)
def catch_all_spa(full_path: str):
    if full_path.startswith("api/") or full_path.startswith("docs") or full_path.startswith("openapi.json") or full_path.startswith("redoc"):
        raise HTTPException(status_code=404, detail="Not Found")
    file_path = FRONTEND_DIST / full_path
    if file_path.is_file():
        return FileResponse(file_path)
    index_file = FRONTEND_DIST / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    raise HTTPException(status_code=404, detail="Resource Not Found")
