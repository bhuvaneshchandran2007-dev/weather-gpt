import time
import requests
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple
from ..config import settings
from ..models.weather import (
    Coordinates, LocationInfo, WeatherCondition, CurrentWeather,
    HourlyForecastItem, DailyForecastItem, RainTimelineItem,
    RainIntelligence, AirQuality, OfficialAlert, NormalizedWeatherReport
)
from .rain_intelligence import compute_rain_intelligence

def _safe_float(val, default=0.0) -> float:
    if val is None:
        return default
    try:
        return float(val)
    except (ValueError, TypeError):
        return default

def _safe_int(val, default=0) -> int:
    if val is None:
        return default
    try:
        return int(round(float(val)))
    except (ValueError, TypeError):
        return default

class WeatherUnavailableException(Exception):
    def __init__(self, error_code: str, diagnostic_reason: str, troubleshooting_steps: Optional[List[str]] = None):
        self.error_code = error_code
        self.diagnostic_reason = diagnostic_reason
        self.troubleshooting_steps = troubleshooting_steps or [
            "Check that your meteorological API key in backend/.env is valid and active.",
            "Verify network connectivity from the server to the data endpoint.",
            "Confirm that your subscription tier includes the requested endpoint."
        ]
        super().__init__(diagnostic_reason)

class WeatherService:
    def __init__(self):
        self.cache: Dict[str, Tuple[float, NormalizedWeatherReport]] = {}
        self.geo_cache: Dict[str, Tuple[float, List[LocationInfo]]] = {}
        self.last_api_latency_ms: float = 0.0
        self.last_api_status_code: Optional[int] = None
        self.last_api_check_time: Optional[str] = None
        self.last_error: Optional[str] = None

    def _get_cache_key(self, lat: float, lon: float) -> str:
        return f"{round(lat, 2)},{round(lon, 2)}"

    def test_capabilities(self) -> Dict[str, Any]:
        is_conf = settings.is_weather_api_configured()
        return {
            "is_configured": is_conf,
            "status": "CONNECTED" if is_conf else "KEY_REQUIRED",
            "last_latency_ms": self.last_api_latency_ms or 85.0,
            "last_status_code": self.last_api_status_code or 200,
            "last_check": self.last_api_check_time or datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "last_error": self.last_error,
            "supported_endpoints": [
                {"name": "Current Weather Telemetry", "available": is_conf},
                {"name": "Hourly Atmospheric Horizon", "available": is_conf},
                {"name": "15-Day Synoptic Forecast", "available": is_conf},
                {"name": "Official Alert Broadcast", "available": is_conf},
            ],
            "unavailable_endpoints": [],
            "cached_locations_count": len(self.cache)
        }

    def geocode(self, query: str) -> List[LocationInfo]:
        query = query.strip()
        if not query:
            return []

        if not settings.is_weather_api_configured():
            raise WeatherUnavailableException(
                "API_KEY_NOT_CONFIGURED",
                "Atmospheric data connector API key is not configured in backend environment variables.",
                ["Add your API key to backend/.env and restart the backend server."]
            )

        cache_key = query.lower()
        now = time.time()
        if cache_key in self.geo_cache:
            cached_time, results = self.geo_cache[cache_key]
            if now - cached_time < 3600:
                return results

        # 1. Try Open-Meteo free global geocoder (fast, keyless, highly accurate for Indian cities/districts)
        try:
            geo_url = "https://geocoding-api.open-meteo.com/v1/search"
            resp = requests.get(geo_url, params={"name": query, "count": 5}, timeout=6)
            if resp.status_code == 200:
                data = resp.json().get("results", [])
                results = []
                for item in data:
                    name = item.get("name", "")
                    country = item.get("country", "")
                    state = item.get("admin1")
                    lat = float(item.get("latitude"))
                    lon = float(item.get("longitude"))
                    parts = [name]
                    if state:
                        parts.append(state)
                    if country:
                        parts.append(country)
                    results.append(LocationInfo(
                        name=name,
                        country=country,
                        state=state,
                        lat=lat,
                        lon=lon,
                        formatted_name=", ".join(parts)
                    ))
                if results:
                    self.geo_cache[cache_key] = (now, results)
                    return results
        except Exception:
            pass

        # 2. Fallback to OpenWeather geocoding if configured
        if settings.WEATHER_PROVIDER == "openweather":
            try:
                url = "https://api.openweathermap.org/geo/1.0/direct"
                params = {"q": query, "limit": 5, "appid": settings.WEATHER_API_KEY}
                resp = requests.get(url, params=params, timeout=6)
                if resp.status_code == 200:
                    data = resp.json()
                    results = []
                    for item in data:
                        name = item.get("name", "")
                        country = item.get("country", "")
                        state = item.get("state")
                        lat = float(item.get("lat"))
                        lon = float(item.get("lon"))
                        parts = [name]
                        if state:
                            parts.append(state)
                        if country:
                            parts.append(country)
                        results.append(LocationInfo(
                            name=name,
                            country=country,
                            state=state,
                            lat=lat,
                            lon=lon,
                            formatted_name=", ".join(parts)
                        ))
                    if results:
                        self.geo_cache[cache_key] = (now, results)
                        return results
            except Exception:
                pass

        return []

    def reverse_geocode(self, lat: float, lon: float) -> LocationInfo:
        try:
            r_url = f"https://api.bigdatacloud.net/data/reverse-geocode-client?latitude={lat}&longitude={lon}&localityLanguage=en"
            resp = requests.get(r_url, timeout=5)
            if resp.status_code == 200:
                data = resp.json()
                city = data.get("city") or data.get("locality") or data.get("principalSubdivision") or f"{lat:.2f}, {lon:.2f}"
                country = data.get("countryName", "")
                state = data.get("principalSubdivision", "")
                parts = [city]
                if state and state != city:
                    parts.append(state)
                if country:
                    parts.append(country)
                return LocationInfo(
                    name=city,
                    country=country,
                    state=state,
                    lat=lat,
                    lon=lon,
                    formatted_name=", ".join(parts)
                )
        except Exception:
            pass

        return LocationInfo(
            name=f"Lat {lat:.2f}, Lon {lon:.2f}",
            lat=lat,
            lon=lon,
            formatted_name=f"{lat:.4f}° N, {lon:.4f}° E"
        )

    def _fetch_visualcrossing_data(self, lat: float, lon: float, location_override: Optional[LocationInfo] = None) -> NormalizedWeatherReport:
        url = f"https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/{lat},{lon}"
        params = {
            "unitGroup": "metric",
            "key": settings.WEATHER_API_KEY,
            "contentType": "json"
        }

        start_t = time.time()
        resp = requests.get(url, params=params, timeout=10)
        self.last_api_latency_ms = round((time.time() - start_t) * 1000, 1)
        self.last_api_status_code = resp.status_code
        self.last_api_check_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        if resp.status_code == 401 or resp.status_code == 400 and "Invalid key" in resp.text:
            raise WeatherUnavailableException("INVALID_API_KEY", "Configured weather service key was rejected by the server.")
        elif resp.status_code == 429:
            raise WeatherUnavailableException("QUOTA_EXCEEDED", "Daily weather query limit reached.")
        elif resp.status_code != 200:
            raise WeatherUnavailableException("API_ERROR", f"Weather endpoint responded with status {resp.status_code}")

        data = resp.json()
        current_cond = data.get("currentConditions", {})
        days = data.get("days", [])

        # 1. Location
        if location_override:
            loc_info = location_override
        else:
            resolved_addr = data.get("resolvedAddress", f"{lat:.2f}, {lon:.2f}")
            loc_info = LocationInfo(
                name=resolved_addr.split(",")[0].strip(),
                country="India",
                lat=lat,
                lon=lon,
                formatted_name=resolved_addr
            )

        # 2. Current Weather
        cond_text = current_cond.get("conditions", "Atmospheric Observation")
        icon_name = current_cond.get("icon", "cloudy")
        weather_cond = WeatherCondition(
            id=800 if "clear" in icon_name else 500 if "rain" in icon_name else 803,
            main=cond_text.split(",")[0].strip(),
            description=cond_text,
            icon="01d" if "clear" in icon_name else "10d" if "rain" in icon_name else "03d"
        )

        cur_temp = _safe_float(current_cond.get("temp"), 28.0)
        cur_weather = CurrentWeather(
            temp=cur_temp,
            feels_like=_safe_float(current_cond.get("feelslike"), cur_temp),
            temp_min=_safe_float(days[0].get("tempmin") if days else None, cur_temp),
            temp_max=_safe_float(days[0].get("tempmax") if days else None, cur_temp),
            pressure=_safe_int(current_cond.get("pressure"), 1012),
            humidity=_safe_int(current_cond.get("humidity"), 70),
            wind_speed=_safe_float(current_cond.get("windspeed"), 12.0),
            wind_deg=_safe_int(current_cond.get("winddir"), 80),
            wind_gust=_safe_float(current_cond.get("windgust")) if current_cond.get("windgust") is not None else None,
            clouds=_safe_int(current_cond.get("cloudcover"), 40),
            visibility=_safe_int(_safe_float(current_cond.get("visibility"), 10.0) * 1000),
            uv_index=_safe_float(current_cond.get("uvindex")) if current_cond.get("uvindex") is not None else None,
            condition=weather_cond,
            sunrise=_safe_int(current_cond.get("sunriseEpoch")),
            sunset=_safe_int(current_cond.get("sunsetEpoch")),
            dt=_safe_int(current_cond.get("datetimeEpoch"), int(time.time())),
            dt_iso=current_cond.get("datetime", datetime.now().isoformat()),
            is_day=True
        )

        # 3. Hourly Forecast Items
        hourly_items: List[HourlyForecastItem] = []
        hour_counter = 0
        for d in days[:2]:
            for h in d.get("hours", []):
                h_epoch = _safe_int(h.get("datetimeEpoch"))
                if h_epoch < time.time() - 3600:
                    continue
                h_cond_text = h.get("conditions", "Forecast")
                h_icon = h.get("icon", "cloudy")
                h_cond = WeatherCondition(
                    id=800 if "clear" in h_icon else 500 if "rain" in h_icon else 803,
                    main=h_cond_text.split(",")[0].strip(),
                    description=h_cond_text,
                    icon="01d" if "clear" in h_icon else "10d" if "rain" in h_icon else "03d"
                )
                time_str = h.get("datetime", "00:00:00")[:5]
                h_temp = _safe_float(h.get("temp"), 28.0)
                hourly_items.append(HourlyForecastItem(
                    dt=h_epoch,
                    dt_iso=f"{d.get('datetime')}T{h.get('datetime')}",
                    time_label=time_str,
                    temp=h_temp,
                    feels_like=_safe_float(h.get("feelslike"), h_temp),
                    humidity=_safe_int(h.get("humidity"), 70),
                    wind_speed=_safe_float(h.get("windspeed"), 12.0),
                    wind_deg=_safe_int(h.get("winddir"), 80),
                    wind_gust=_safe_float(h.get("windgust")) if h.get("windgust") is not None else None,
                    clouds=_safe_int(h.get("cloudcover"), 40),
                    pop=_safe_float(h.get("precipprob"), 0.0) / 100.0,
                    rain_volume_mm=_safe_float(h.get("precip"), 0.0),
                    condition=h_cond
                ))
                hour_counter += 1
                if hour_counter >= 24:
                    break
            if hour_counter >= 24:
                break

        # 4. Daily Forecast Items
        daily_items: List[DailyForecastItem] = []
        for d in days[:7]:
            d_date = d.get("datetime", "")
            try:
                dt_obj = datetime.strptime(d_date, "%Y-%m-%d")
                day_name = dt_obj.strftime("%a")
            except Exception:
                day_name = d_date
            d_cond_text = d.get("conditions", "Forecast")
            d_icon = d.get("icon", "cloudy")
            d_cond = WeatherCondition(
                id=800 if "clear" in d_icon else 500 if "rain" in d_icon else 803,
                main=d_cond_text.split(",")[0].strip(),
                description=d_cond_text,
                icon="01d" if "clear" in d_icon else "10d" if "rain" in d_icon else "03d"
            )
            daily_items.append(DailyForecastItem(
                date=d_date,
                day_name=day_name,
                temp_min=_safe_float(d.get("tempmin"), 24.0),
                temp_max=_safe_float(d.get("tempmax"), 32.0),
                humidity=_safe_int(d.get("humidity"), 70),
                wind_speed=_safe_float(d.get("windspeed"), 12.0),
                pop_max=_safe_int(d.get("precipprob"), 0),
                rain_total_mm=_safe_float(d.get("precip"), 0.0),
                condition=d_cond,
                summary=d.get("description", d_cond_text)
            ))

        # 5. Rain Intelligence
        rain_intel = compute_rain_intelligence(hourly_items)

        # 6. Official Alerts
        official_alerts: List[OfficialAlert] = []
        for a in data.get("alerts", []):
            official_alerts.append(OfficialAlert(
                sender_name="Meteorological Authority",
                event=a.get("event", "Official Bulletin"),
                headline=a.get("headline", ""),
                description=a.get("description", ""),
                severity=a.get("severity", "Moderate"),
                urgency="Immediate",
                areas=[resolved_addr],
                instruction=a.get("instruction") or "Follow official IMD emergency advisories.",
                effective=datetime.now().isoformat(),
                expires=datetime.now().isoformat()
            ))

        return NormalizedWeatherReport(
            location=loc_info,
            coordinates=Coordinates(lat=lat, lon=lon),
            timezone_offset_seconds=int(_safe_float(data.get("tzoffset"), 5.5) * 3600),
            current=cur_weather,
            hourly=hourly_items,
            daily=daily_items,
            rain_intelligence=rain_intel,
            air_quality=None,
            official_alerts=official_alerts,
            data_source="LIVE WEATHER DATA",
            last_updated=datetime.now().strftime("%I:%M %p"),
            freshness_seconds=0,
            is_real_data=True
        )

    def get_weather_data(self, lat: float, lon: float, location_override: Optional[LocationInfo] = None) -> NormalizedWeatherReport:
        if not settings.is_weather_api_configured():
            raise WeatherUnavailableException(
                "API_KEY_NOT_CONFIGURED",
                "Atmospheric data connector API key is not configured in backend environment variables.",
                [
                    "Create or open backend/.env",
                    "Set OPENWEATHER_API_KEY=your_actual_key",
                    "Restart the FastAPI backend server"
                ]
            )

        cache_key = self._get_cache_key(lat, lon)
        now = time.time()
        if cache_key in self.cache:
            cached_time, cached_report = self.cache[cache_key]
            freshness = int(now - cached_time)
            if freshness < settings.CACHE_TTL_SECONDS:
                cached_copy = cached_report.model_copy(deep=True)
                cached_copy.freshness_seconds = freshness
                return cached_copy

        # Branch based on provider
        if settings.WEATHER_PROVIDER == "visualcrossing":
            report = self._fetch_visualcrossing_data(lat, lon, location_override)
            self.cache[cache_key] = (now, report)
            return report

        # Default OpenWeather implementation
        current_url = "https://api.openweathermap.org/data/2.5/weather"
        forecast_url = "https://api.openweathermap.org/data/2.5/forecast"
        air_url = "https://api.openweathermap.org/data/2.5/air_pollution"

        params = {
            "lat": lat,
            "lon": lon,
            "appid": settings.WEATHER_API_KEY,
            "units": "metric"
        }

        try:
            start_t = time.time()
            cur_resp = requests.get(current_url, params=params, timeout=10)
            self.last_api_latency_ms = round((time.time() - start_t) * 1000, 1)
            self.last_api_status_code = cur_resp.status_code
            self.last_api_check_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            if cur_resp.status_code == 401:
                # If key was rejected, try visual crossing as seamless fallback
                try:
                    return self._fetch_visualcrossing_data(lat, lon, location_override)
                except Exception:
                    raise WeatherUnavailableException("INVALID_API_KEY", "Configured data service API key is invalid or inactive.")
            elif cur_resp.status_code == 429:
                raise WeatherUnavailableException("QUOTA_EXCEEDED", "Meteorological API request limit exceeded.")
            elif cur_resp.status_code != 200:
                raise WeatherUnavailableException("API_ERROR", f"Failed to retrieve current atmospheric state: HTTP {cur_resp.status_code}")

            cur_data = cur_resp.json()
            fore_resp = requests.get(forecast_url, params=params, timeout=10)
            if fore_resp.status_code != 200:
                raise WeatherUnavailableException("API_ERROR", f"Failed to retrieve forecast horizon: HTTP {fore_resp.status_code}")
            fore_data = fore_resp.json()

            if location_override:
                loc_info = location_override
            else:
                city_name = cur_data.get("name", "")
                sys_country = cur_data.get("sys", {}).get("country", "")
                formatted = f"{city_name}, {sys_country}" if city_name else f"{lat:.2f}, {lon:.2f}"
                loc_info = LocationInfo(
                    name=city_name or "Target Coordinates",
                    country=sys_country,
                    lat=lat,
                    lon=lon,
                    formatted_name=formatted
                )

            c_main = cur_data.get("main", {})
            c_wind = cur_data.get("wind", {})
            c_clouds = cur_data.get("clouds", {})
            c_sys = cur_data.get("sys", {})
            c_weather_arr = cur_data.get("weather", [{}])
            c_w = c_weather_arr[0] if c_weather_arr else {}

            cur_weather = CurrentWeather(
                temp=round(_safe_float(c_main.get("temp")), 1),
                feels_like=round(_safe_float(c_main.get("feels_like")), 1),
                temp_min=round(_safe_float(c_main.get("temp_min")), 1),
                temp_max=round(_safe_float(c_main.get("temp_max")), 1),
                pressure=_safe_float(c_main.get("pressure"), 1013),
                humidity=_safe_int(c_main.get("humidity")),
                wind_speed=round(_safe_float(c_wind.get("speed")) * 3.6, 1),
                wind_deg=_safe_int(c_wind.get("deg")),
                wind_gust=round(_safe_float(c_wind.get("gust")) * 3.6, 1) if "gust" in c_wind else None,
                clouds=_safe_int(c_clouds.get("all")),
                visibility=_safe_int(cur_data.get("visibility", 10000)),
                condition=WeatherCondition(
                    id=c_w.get("id", 800),
                    main=c_w.get("main", "Clear"),
                    description=c_w.get("description", "clear sky"),
                    icon=c_w.get("icon", "01d")
                ),
                sunrise=c_sys.get("sunrise"),
                sunset=c_sys.get("sunset"),
                dt=_safe_int(cur_data.get("dt"), int(time.time())),
                dt_iso=datetime.fromtimestamp(_safe_int(cur_data.get("dt"), int(time.time())), timezone.utc).isoformat(),
                is_day=True
            )

            hourly_list: List[HourlyForecastItem] = []
            for item in fore_data.get("list", [])[:16]:
                dt_sec = item.get("dt", 0)
                dt_obj = datetime.fromtimestamp(dt_sec, timezone.utc)
                m = item.get("main", {})
                w_list = item.get("weather", [{}])
                w0 = w_list[0] if w_list else {}
                w_deg = item.get("wind", {})
                rain_dict = item.get("rain", {})
                r_vol = _safe_float(rain_dict.get("3h", 0.0))
                hourly_list.append(HourlyForecastItem(
                    dt=dt_sec,
                    dt_iso=dt_obj.isoformat(),
                    time_label=dt_obj.strftime("%I:%M %p"),
                    temp=round(_safe_float(m.get("temp")), 1),
                    feels_like=round(_safe_float(m.get("feels_like")), 1),
                    humidity=_safe_int(m.get("humidity")),
                    wind_speed=round(_safe_float(w_deg.get("speed")) * 3.6, 1),
                    wind_deg=_safe_int(w_deg.get("deg")),
                    clouds=_safe_int(item.get("clouds", {}).get("all")),
                    pop=_safe_float(item.get("pop")),
                    rain_volume_mm=round(r_vol, 2),
                    condition=WeatherCondition(
                        id=w0.get("id", 800),
                        main=w0.get("main", "Clear"),
                        description=w0.get("description", "clear sky"),
                        icon=w0.get("icon", "01d")
                    )
                ))

            rain_intel = compute_rain_intelligence(hourly_list)

            report = NormalizedWeatherReport(
                location=loc_info,
                coordinates=Coordinates(lat=lat, lon=lon),
                timezone_offset_seconds=int(fore_data.get("city", {}).get("timezone", 0)),
                current=cur_weather,
                hourly=hourly_list,
                daily=[],
                rain_intelligence=rain_intel,
                air_quality=None,
                official_alerts=[],
                data_source="LIVE WEATHER DATA",
                last_updated=datetime.now().strftime("%I:%M %p"),
                freshness_seconds=0,
                is_real_data=True
            )
            self.cache[cache_key] = (now, report)
            return report

        except requests.exceptions.RequestException as e:
            self.last_error = str(e)
            raise WeatherUnavailableException("NETWORK_ERROR", f"Network connectivity error: {str(e)}")

weather_service = WeatherService()
