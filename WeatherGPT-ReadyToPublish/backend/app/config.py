import os
from pathlib import Path
from typing import Optional

def load_env_file(env_path: Path) -> dict:
    """Safely parse .env file without external dependencies."""
    env_vars = {}
    if not env_path.exists():
        return env_vars
    try:
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, val = line.split("=", 1)
                key = key.strip()
                val = val.strip().strip("'\"")
                env_vars[key] = val
    except Exception as e:
        print(f"[Config] Warning loading .env: {e}")
    return env_vars

# Determine base paths
BASE_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = BASE_DIR / ".env"
_file_env = load_env_file(ENV_FILE)

class Settings:
    def __init__(self):
        self.WEATHER_API_KEY: str = os.getenv("WEATHER_API_KEY", _file_env.get("WEATHER_API_KEY", _file_env.get("OPENWEATHER_API_KEY", ""))).strip()
        self.OPENWEATHER_API_KEY: str = os.getenv("OPENWEATHER_API_KEY", _file_env.get("OPENWEATHER_API_KEY", self.WEATHER_API_KEY)).strip()
        if not self.WEATHER_API_KEY and self.OPENWEATHER_API_KEY:
            self.WEATHER_API_KEY = self.OPENWEATHER_API_KEY
            
        # Detect primary provider based on key format (Visual Crossing is 25 chars alphanumeric, OpenWeather is 32 chars hex)
        if len(self.WEATHER_API_KEY) == 25 or (self.WEATHER_API_KEY and self.WEATHER_API_KEY.isupper()):
            self.WEATHER_PROVIDER = "visualcrossing"
        else:
            self.WEATHER_PROVIDER = "openweather"

        self.GOOGLE_MAPS_API_KEY: str = os.getenv("GOOGLE_MAPS_API_KEY", _file_env.get("GOOGLE_MAPS_API_KEY", "")).strip()
        self.GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", _file_env.get("GEMINI_API_KEY", "")).strip()
        
        self.HOST: str = os.getenv("HOST", _file_env.get("HOST", "127.0.0.1")).strip()
        self.PORT: int = int(os.getenv("PORT", _file_env.get("PORT", "8000")).strip())
        self.DEBUG: bool = os.getenv("DEBUG", _file_env.get("DEBUG", "true")).lower() in ("true", "1", "yes")
        self.CACHE_TTL_SECONDS: int = int(os.getenv("CACHE_TTL_SECONDS", _file_env.get("CACHE_TTL_SECONDS", "600")).strip())
        
        self.DATA_DIR: Path = BASE_DIR / "data"
        self.DATA_DIR.mkdir(exist_ok=True)
        self.DB_PATH: Path = self.DATA_DIR / "weathergpt.db"

    def is_weather_api_configured(self) -> bool:
        return bool(self.WEATHER_API_KEY and len(self.WEATHER_API_KEY) > 10 and not self.WEATHER_API_KEY.startswith("YOUR_"))

    def is_openweather_configured(self) -> bool:
        return self.is_weather_api_configured()

    def is_google_maps_configured(self) -> bool:
        return bool(self.GOOGLE_MAPS_API_KEY and len(self.GOOGLE_MAPS_API_KEY) > 10)

    def is_gemini_configured(self) -> bool:
        return bool(self.GEMINI_API_KEY and len(self.GEMINI_API_KEY) > 10)

settings = Settings()
