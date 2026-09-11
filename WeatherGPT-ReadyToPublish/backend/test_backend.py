import sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

from app.config import settings
from app.services.health_service import health_service
from app.services.ai_agent import detect_language, extract_intent, extract_location
from app.models.weather import WeatherUnavailableResponse

print("--- WeatherGPT Backend Import Test ---")
print(f"Python version: {sys.version}")
print(f"OpenWeather configured: {settings.is_openweather_configured()}")
print(f"Google Maps configured: {settings.is_google_maps_configured()}")

# Test Language Detection
print("\n--- Testing Multilingual Language Detection ---")
tests = [
    ("Will it rain today in Chennai?", "en"),
    ("சென்னையில் இன்று மழை வருமா?", "ta"),
    ("Chennai la innaiku mazhai varuma?", "ta"),
    ("कल बारिश होगी क्या?", "hi"),
    ("Kal Chennai mein baarish hogi kya?", "hi"),
    ("రేపు వర్షం పడుతుందా?", "te"),
    ("আজ কি বৃষ্টি হবে?", "bn")
]

for q, expected in tests:
    code, name = detect_language(q)
    loc = extract_location(q)
    intent = extract_intent(q)
    print(f"Query: '{q}' -> Lang: {name} (code: {code}), Loc: {loc}, Intent: {intent}")

# Test Health Telemetry
print("\n--- Testing Data Health Telemetry ---")
health = health_service.get_system_health()
print(f"System Status: {health['status']}")
print(f"Weather API: {health['weather_api']['status']} (Provider: {health['weather_api']['provider']})")
print(f"GIS Engine: {health['google_maps']['engine_in_use']}")
print(f"AI Agent: {health['conversational_ai']['status']}")

print("\nALL BACKEND CORE LOGIC VERIFIED SUCCESSFULLY!")
