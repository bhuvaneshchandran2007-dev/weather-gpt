import sys
import uvicorn
from app.config import settings

if __name__ == "__main__":
    print(f"Starting WeatherGPT Backend on http://{settings.HOST}:{settings.PORT}")
    print(f"SIH Problem Statement 26068 (MoES / IMD)")
    print(f"OpenWeather API Configured: {settings.is_openweather_configured()}")
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
