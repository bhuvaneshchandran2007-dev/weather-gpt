from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import requests
import math

class NWPProvider(ABC):
    """Abstract base class for Numerical Weather Prediction (NWP) providers."""
    
    @abstractmethod
    def get_forecast(self, lat: float, lon: float) -> Dict[str, Any]:
        pass

class GFSProvider(NWPProvider):
    """
    Global Forecast System (GFS) Model Provider.
    Retrieves global gridded numerical predictions (0.25° resolution).
    """
    def __init__(self):
        self.model_name = "Global Forecast System (GFS)"
        self.model_id = "GFS-FV3"
        self.resolution = "0.25° (~28 km)"
        self.cycles = ["00Z", "06Z", "12Z", "18Z"]

    def get_forecast(self, lat: float, lon: float) -> Dict[str, Any]:
        # Using Open-Meteo GFS seamless numerical pipeline
        url = "https://api.open-meteo.com/v1/gfs"
        params = {
            "latitude": lat,
            "longitude": lon,
            "hourly": ["temperature_2m", "relative_humidity_2m", "precipitation", "surface_pressure", "wind_speed_10m", "wind_direction_10m", "cape"],
            "forecast_days": 3
        }
        try:
            resp = requests.get(url, params=params, timeout=8)
            if resp.status_code == 200:
                data = resp.json()
                hourly = data.get("hourly", {})
                times = hourly.get("time", [])
                temps = hourly.get("temperature_2m", [])
                precip = hourly.get("precipitation", [])
                pressures = hourly.get("surface_pressure", [])
                wind_spds = hourly.get("wind_speed_10m", [])
                capes = hourly.get("cape", [])

                cur_hour_idx = 0
                now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:00")
                if now_iso in times:
                    cur_hour_idx = times.index(now_iso)

                series = []
                for i in range(min(24, len(times))):
                    series.append({
                        "time": times[i].split("T")[1] if "T" in times[i] else times[i],
                        "temp": round(temps[i], 1) if i < len(temps) and temps[i] is not None else None,
                        "precipitation": round(precip[i], 2) if i < len(precip) and precip[i] is not None else 0.0,
                        "pressure": round(pressures[i], 1) if i < len(pressures) and pressures[i] is not None else None,
                        "wind_speed": round(wind_spds[i], 1) if i < len(wind_spds) and wind_spds[i] is not None else None,
                        "cape": round(capes[i], 0) if i < len(capes) and capes[i] is not None else 0
                    })

                now_utc = datetime.now(timezone.utc)
                cycle_hour = (now_utc.hour // 6) * 6
                run_time_str = f"{now_utc.strftime('%Y-%m-%d')} {cycle_hour:02d}Z Run"

                return {
                    "status": "AVAILABLE",
                    "model": "GFS-FV3 (NOAA Global Forecast System)",
                    "run_cycle": run_time_str,
                    "resolution": self.resolution,
                    "forecast_horizon": "72 Hours",
                    "variables": ["Temperature (2m)", "Convective Available Potential Energy (CAPE)", "Precipitation", "Surface Pressure", "10m Wind Vector"],
                    "current_nwp_snapshot": {
                        "temperature": temps[cur_hour_idx] if cur_hour_idx < len(temps) else None,
                        "convective_cape": capes[cur_hour_idx] if cur_hour_idx < len(capes) else None,
                        "surface_pressure": pressures[cur_hour_idx] if cur_hour_idx < len(pressures) else None,
                        "wind_speed": wind_spds[cur_hour_idx] if cur_hour_idx < len(wind_spds) else None
                    },
                    "hourly_series": series,
                    "data_classification": "MODEL DATA"
                }
        except Exception as e:
            pass

        return {
            "status": "NWP DATA UNAVAILABLE",
            "model": "GFS-FV3",
            "reason": "Numerical prediction server connection timeout or coordinates off model grid.",
            "data_classification": "MODEL DATA"
        }

class WRFProvider(NWPProvider):
    """
    Weather Research and Forecasting (WRF) Regional Model Adapter.
    High-resolution mesoscale numerical weather prediction.
    """
    def __init__(self):
        self.model_name = "Weather Research and Forecasting (WRF)"
        self.resolution = "3 km Meso-Grid"

    def get_forecast(self, lat: float, lon: float) -> Dict[str, Any]:
        # High resolution regional models are run for specific sub-domains
        # If external mesoscale feed is not attached, truthfully state availability
        return {
            "status": "NWP DATA UNAVAILABLE",
            "model": "WRF-ARW Mesoscale 3km",
            "reason": "Regional high-resolution WRF model domain boundary is currently not configured for this sector.",
            "supported_domains": ["South Asia Monsoon Domain (IMD Meso-Grid)", "Coastal Bay of Bengal"],
            "data_classification": "MODEL DATA"
        }

class NWPOrchestrator:
    def __init__(self):
        self.gfs = GFSProvider()
        self.wrf = WRFProvider()

    def get_nwp_model_data(self, model: str, lat: float, lon: float) -> Dict[str, Any]:
        m = (model or "gfs").lower().strip()
        if "wrf" in m:
            return self.wrf.get_forecast(lat, lon)
        return self.gfs.get_forecast(lat, lon)

nwp_orchestrator = NWPOrchestrator()
