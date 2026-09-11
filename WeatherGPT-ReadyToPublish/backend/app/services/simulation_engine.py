from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from ..models.weather import NormalizedWeatherReport
from .risk_engine import compute_heat_index

class SimulationRequest(BaseModel):
    delta_temp: float = 0.0          # e.g. +5.0°C
    delta_rain_mm: float = 0.0       # e.g. +25.0 mm/3h
    delta_wind_kmh: float = 0.0      # e.g. +30.0 km/h
    delta_humidity: int = 0          # e.g. +20%

class SimulationMetricDiff(BaseModel):
    metric_name: str
    real_value: str
    simulated_value: str
    delta_text: str
    impact_level: str  # "Neutral", "Elevated Risk", "Severe Hazard"

class SimulationResult(BaseModel):
    is_simulation: bool = True
    watermark_label: str = "SIMULATION — HYPOTHETICAL VALUES ONLY"
    location_name: str
    baseline_temp: float
    simulated_temp: float
    baseline_rain_vol: float
    simulated_rain_vol: float
    baseline_wind: float
    simulated_wind: float
    baseline_heat_index: float
    simulated_heat_index: float
    baseline_overall_risk: int
    simulated_overall_risk: int
    comparisons: List[SimulationMetricDiff]
    simulated_impact_notes: List[str]
    disclaimer: str = "This scenario is purely hypothetical and for resilience testing. Never interpret simulated values as actual forecasts."

def run_weather_simulation(weather: NormalizedWeatherReport, sim_params: SimulationRequest) -> SimulationResult:
    """
    What-If Weather Simulator.
    Compares the real forecast baseline against user-defined atmospheric shifts.
    """
    cur = weather.current
    rain_intel = weather.rain_intelligence

    base_temp = cur.temp
    base_rain = rain_intel.total_rain_expected_mm
    base_wind = cur.wind_speed
    base_humidity = cur.humidity
    base_hi = compute_heat_index(base_temp, base_humidity)

    sim_temp = round(base_temp + sim_params.delta_temp, 1)
    sim_rain = round(max(0.0, base_rain + sim_params.delta_rain_mm), 1)
    sim_wind = round(max(0.0, base_wind + sim_params.delta_wind_kmh), 1)
    sim_humidity = min(100, max(10, base_humidity + sim_params.delta_humidity))
    sim_hi = compute_heat_index(sim_temp, sim_humidity)

    # Calculate baseline risk proxy
    base_risk = min(100, int((rain_intel.max_pop_pct * 0.4) + (base_wind * 0.4) + max(0, (base_hi - 25) * 1.5)))
    sim_risk = min(100, int(base_risk + (sim_params.delta_rain_mm * 1.8) + (sim_params.delta_wind_kmh * 0.8) + max(0, (sim_hi - base_hi) * 2.0)))

    comparisons: List[SimulationMetricDiff] = [
        SimulationMetricDiff(
            metric_name="Ambient Temperature",
            real_value=f"{base_temp}°C",
            simulated_value=f"{sim_temp}°C",
            delta_text=f"{'+' if sim_params.delta_temp >= 0 else ''}{sim_params.delta_temp}°C",
            impact_level="Severe Hazard" if sim_temp >= 42 else "Elevated Risk" if sim_temp >= 36 else "Neutral"
        ),
        SimulationMetricDiff(
            metric_name="Rainfall Volume",
            real_value=f"{base_rain} mm",
            simulated_value=f"{sim_rain} mm",
            delta_text=f"+{sim_params.delta_rain_mm} mm",
            impact_level="Severe Hazard" if sim_rain >= 35 else "Elevated Risk" if sim_rain >= 15 else "Neutral"
        ),
        SimulationMetricDiff(
            metric_name="Sustained Wind",
            real_value=f"{base_wind} km/h",
            simulated_value=f"{sim_wind} km/h",
            delta_text=f"+{sim_params.delta_wind_kmh} km/h",
            impact_level="Severe Hazard" if sim_wind >= 50 else "Elevated Risk" if sim_wind >= 30 else "Neutral"
        ),
        SimulationMetricDiff(
            metric_name="Apparent Heat Index",
            real_value=f"{base_hi}°C",
            simulated_value=f"{sim_hi}°C",
            delta_text=f"{'+' if sim_hi >= base_hi else ''}{round(sim_hi - base_hi, 1)}°C",
            impact_level="Severe Hazard" if sim_hi >= 42 else "Elevated Risk" if sim_hi >= 37 else "Neutral"
        ),
    ]

    sim_notes = []
    if sim_params.delta_rain_mm >= 20:
        sim_notes.append("Simulated rainfall surge (+%.1f mm) would saturate urban storm drains within 90 minutes, producing arterial road inundation." % sim_params.delta_rain_mm)
    if sim_params.delta_wind_kmh >= 25:
        sim_notes.append("Simulated wind acceleration (+%.1f km/h) exceeds safe operating envelope for crane lifting and temporary outdoor installations." % sim_params.delta_wind_kmh)
    if sim_hi - base_hi >= 5:
        sim_notes.append("Thermal stress index jumps by +%.1f°C, requiring outdoor work halts between 11:30 AM and 3:30 PM." % (sim_hi - base_hi))

    if not sim_notes:
        sim_notes.append("Simulated shifts remain within baseline operational margins for civil and commercial activities.")

    return SimulationResult(
        is_simulation=True,
        watermark_label="SIMULATION — HYPOTHETICAL VALUES ONLY",
        location_name=weather.location.formatted_name,
        baseline_temp=base_temp,
        simulated_temp=sim_temp,
        baseline_rain_vol=base_rain,
        simulated_rain_vol=sim_rain,
        baseline_wind=base_wind,
        simulated_wind=sim_wind,
        baseline_heat_index=base_hi,
        simulated_heat_index=sim_hi,
        baseline_overall_risk=base_risk,
        simulated_overall_risk=sim_risk,
        comparisons=comparisons,
        simulated_impact_notes=sim_notes
    )
