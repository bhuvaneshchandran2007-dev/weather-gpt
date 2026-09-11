import os
import time
from datetime import datetime
from typing import Dict, Any
from ..config import settings
from .weather_service import weather_service

class HealthService:
    def get_system_health(self) -> Dict[str, Any]:
        weather_diag = weather_service.test_capabilities()
        
        maps_connected = settings.is_google_maps_configured()
        ai_connected = True  # Local meteorological agent is always fully operational
        gemini_connected = settings.is_gemini_configured()

        return {
            "status": "OPERATIONAL" if weather_diag["is_configured"] else "ACTION_REQUIRED",
            "server_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S IST"),
            "problem_statement": "SIH 26068: WeatherGPT (MoES / IMD)",
            "weather_api": {
                "provider": "OpenWeather",
                "status": weather_diag["status"],
                "is_configured": weather_diag["is_configured"],
                "latency_ms": weather_diag["last_latency_ms"],
                "http_code": weather_diag["last_status_code"],
                "last_check": weather_diag["last_check"],
                "last_error": weather_diag["last_error"],
                "supported_endpoints": weather_diag["supported_endpoints"],
                "unavailable_endpoints": weather_diag["unavailable_endpoints"],
                "cached_locations_count": weather_diag["cached_locations_count"]
            },
            "google_maps": {
                "status": "CONNECTED" if maps_connected else "DISCONNECTED",
                "is_configured": maps_connected,
                "engine_in_use": "Google Maps JavaScript API" if maps_connected else "OpenStreetMap Leaflet GIS Engine",
                "notice": "No key required for base GIS functionality. Add GOOGLE_MAPS_API_KEY in backend/.env to activate Google Maps." if not maps_connected else "Google Maps Platform active."
            },
            "conversational_ai": {
                "status": "CONNECTED",
                "local_meteorological_agent": "OPERATIONAL",
                "gemini_api": "CONNECTED" if gemini_connected else "DISCONNECTED (Local agent active)",
                "supported_languages_count": 14,
                "supported_professions_count": 19,
                "tool_calling_enabled": True
            },
            "voice_ai": {
                "status": "BROWSER_SPEECH_API",
                "input_engine": "Web Speech API (SpeechRecognition)",
                "output_engine": "Web Speech Synthesis (Text-to-Speech)",
                "multilingual_voices_support": True
            },
            "database": {
                "type": "SQLite",
                "path": str(settings.DB_PATH),
                "status": "CONNECTED" if settings.DB_PATH.exists() else "INITIALIZED"
            }
        }

health_service = HealthService()
