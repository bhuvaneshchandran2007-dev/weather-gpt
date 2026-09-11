from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class Coordinates(BaseModel):
    lat: float
    lon: float

class LocationInfo(BaseModel):
    name: str
    country: Optional[str] = None
    state: Optional[str] = None
    lat: float
    lon: float
    formatted_name: str

class WeatherCondition(BaseModel):
    id: int
    main: str
    description: str
    icon: str

class CurrentWeather(BaseModel):
    temp: float
    feels_like: float
    temp_min: float
    temp_max: float
    pressure: int
    humidity: int
    wind_speed: float
    wind_deg: int
    wind_gust: Optional[float] = None
    clouds: int
    visibility: int
    uv_index: Optional[float] = None
    condition: WeatherCondition
    sunrise: Optional[int] = None
    sunset: Optional[int] = None
    dt: int
    dt_iso: str
    is_day: bool

class HourlyForecastItem(BaseModel):
    dt: int
    dt_iso: str
    time_label: str
    temp: float
    feels_like: float
    humidity: int
    wind_speed: float
    wind_deg: int
    wind_gust: Optional[float] = None
    clouds: int
    pop: float
    rain_volume_mm: float
    condition: WeatherCondition

class DailyForecastItem(BaseModel):
    date: str
    day_name: str
    temp_min: float
    temp_max: float
    humidity: int
    wind_speed: float
    pop_max: float
    rain_total_mm: float
    condition: WeatherCondition
    summary: str

class RainTimelineItem(BaseModel):
    time_label: str
    dt: int
    pop_pct: int
    rain_mm: float
    intensity: str
    condition: str
    icon: str
    is_rain_likely: bool

class RainIntelligence(BaseModel):
    has_rain_forecast: bool
    next_rain_start: Optional[str] = None
    next_rain_peak: Optional[str] = None
    next_rain_end: Optional[str] = None
    rain_duration_hours: Optional[float] = None
    max_pop_pct: int = 0
    total_rain_expected_mm: float = 0.0
    rain_likelihood: str
    rain_window: Optional[str] = None
    dry_window: Optional[str] = None
    safest_travel_window: Optional[str] = None
    precision_note: str
    timeline: List[RainTimelineItem] = []

class AirQuality(BaseModel):
    aqi: int
    aqi_label: str
    pm2_5: Optional[float] = None
    pm10: Optional[float] = None
    o3: Optional[float] = None
    no2: Optional[float] = None
    so2: Optional[float] = None
    co: Optional[float] = None
    available: bool = True

class OfficialAlert(BaseModel):
    sender_name: str
    event: str
    start: Optional[int] = None
    end: Optional[int] = None
    description: str
    severity: str
    source: str = "OFFICIAL WARNING"
    is_official: bool = True

class NormalizedWeatherReport(BaseModel):
    location: LocationInfo
    coordinates: Coordinates
    timezone_offset_seconds: int = 0
    current: CurrentWeather
    hourly: List[HourlyForecastItem]
    daily: List[DailyForecastItem]
    rain_intelligence: RainIntelligence
    air_quality: Optional[AirQuality] = None
    official_alerts: List[OfficialAlert] = []
    data_source: str = "LIVE WEATHER DATA"
    last_updated: str
    freshness_seconds: int = 0
    is_real_data: bool = True
    notice: Optional[str] = None

class WeatherUnavailableResponse(BaseModel):
    status: str = "unavailable"
    error_code: str
    message: str = "LIVE WEATHER DATA UNAVAILABLE"
    diagnostic_reason: str
    troubleshooting_steps: List[str]
    is_real_data: bool = False
