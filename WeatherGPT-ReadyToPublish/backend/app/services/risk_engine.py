from typing import List, Optional
from ..models.weather import NormalizedWeatherReport
from ..models.risk import (
    RiskFactor, RiskCategoryScore, CompoundRiskAlert, AiRiskAssessment
)

def compute_heat_index(temp_c: float, humidity: int) -> float:
    """Steadman formula approximation for apparent temperature/heat index in Celsius."""
    if temp_c < 20:
        return temp_c
    # Rothfusz regression equation in Celsius
    t = (temp_c * 9/5) + 32
    rh = humidity
    hi_f = (
        -42.379 + 2.04901523*t + 10.14333127*rh
        - 0.22475541*t*rh - 0.00683783*t*t
        - 0.05481717*rh*rh + 0.00122874*t*t*rh
        + 0.00085282*t*rh*rh - 0.00000199*t*t*rh*rh
    )
    hi_c = (hi_f - 32) * 5/9
    return round(hi_c, 1)

def compute_ai_risks(weather: NormalizedWeatherReport) -> AiRiskAssessment:
    """
    Algorithmic calculation of explainable AI risk scores (0-100) and compound hazards.
    Purely derived from observed and forecasted values.
    """
    cur = weather.current
    rain_intel = weather.rain_intelligence
    hourly = weather.hourly

    categories: List[RiskCategoryScore] = []
    compound_hazards: List[CompoundRiskAlert] = []

    # -------------------------------------------------------------
    # 1. Rain Risk (0 - 100)
    # -------------------------------------------------------------
    rain_factors: List[RiskFactor] = []
    max_pop = rain_intel.max_pop_pct
    rain_vol = rain_intel.total_rain_expected_mm

    # Factor 1: Pop
    pop_impact = int(max_pop * 0.5)
    rain_factors.append(RiskFactor(
        name="Precipitation Probability",
        observed_value=f"{max_pop}%",
        threshold_impact=f"+{pop_impact} pts"
    ))

    # Factor 2: Volume
    vol_impact = min(35, int(rain_vol * 2.5))
    if rain_vol > 0:
        rain_factors.append(RiskFactor(
            name="Expected Rain Accumulation",
            observed_value=f"{rain_vol} mm",
            threshold_impact=f"+{vol_impact} pts"
        ))

    # Factor 3: Current condition
    cond_impact = 0
    if "Rain" in cur.condition.main:
        cond_impact = 15
        rain_factors.append(RiskFactor(
            name="Current Observation",
            observed_value=cur.condition.description,
            threshold_impact="+15 pts (Active Precipitation)"
        ))

    rain_score = min(100, pop_impact + vol_impact + cond_impact)
    rain_level = "Low"
    if rain_score >= 75:
        rain_level = "Critical"
    elif rain_score >= 50:
        rain_level = "High"
    elif rain_score >= 25:
        rain_level = "Moderate"

    categories.append(RiskCategoryScore(
        category="Rain Risk",
        score=rain_score,
        level=rain_level,
        color="#3B82F6",
        summary=f"{rain_level} likelihood of precipitation impact ({rain_score}/100).",
        contributing_factors=rain_factors
    ))

    # -------------------------------------------------------------
    # 2. Wind Risk (0 - 100)
    # -------------------------------------------------------------
    wind_factors: List[RiskFactor] = []
    w_speed = cur.wind_speed
    w_gust = cur.wind_gust or w_speed

    # Max forecast wind
    max_forecast_wind = max([it.wind_speed for it in hourly[:8]], default=w_speed)
    wind_factors.append(RiskFactor(
        name="Sustained Wind Speed",
        observed_value=f"{w_speed} km/h (Peak forecast: {max_forecast_wind} km/h)",
        threshold_impact=f"Base Beaufort rating"
    ))
    if cur.wind_gust:
        wind_factors.append(RiskFactor(
            name="Wind Gusts",
            observed_value=f"{cur.wind_gust} km/h",
            threshold_impact="Turbulence & shear hazard"
        ))

    # Wind scoring: 0-20 (calm/light), 20-40 (moderate), 40-60 (strong), 60-80 (gale), 80+ (storm)
    wind_score = min(100, int((max(w_speed, max_forecast_wind) / 75.0) * 80 + (15 if w_gust > 45 else 0)))
    wind_level = "Low"
    if wind_score >= 70:
        wind_level = "Critical"
    elif wind_score >= 45:
        wind_level = "High"
    elif wind_score >= 25:
        wind_level = "Moderate"

    categories.append(RiskCategoryScore(
        category="Wind Risk",
        score=wind_score,
        level=wind_level,
        color="#10B981",
        summary=f"{wind_level} aerodynamic risk ({wind_score}/100). Sustained {w_speed} km/h.",
        contributing_factors=wind_factors
    ))

    # -------------------------------------------------------------
    # 3. Heat Risk / Wet Bulb (0 - 100)
    # -------------------------------------------------------------
    heat_factors: List[RiskFactor] = []
    hi = compute_heat_index(cur.temp, cur.humidity)
    heat_factors.append(RiskFactor(
        name="Ambient Temperature",
        observed_value=f"{cur.temp}°C",
        threshold_impact="Primary thermal base"
    ))
    heat_factors.append(RiskFactor(
        name="Relative Humidity",
        observed_value=f"{cur.humidity}%",
        threshold_impact=f"Calculated Heat Index: {hi}°C"
    ))

    # Heat risk formula: hi < 28 (low), 28-35 (moderate), 35-41 (high), > 41 (critical)
    if hi >= 42:
        heat_score = min(100, 80 + int((hi - 42) * 4))
        heat_level = "Critical"
    elif hi >= 36:
        heat_score = 60 + int((hi - 36) * 3)
        heat_level = "High"
    elif hi >= 30:
        heat_score = 30 + int((hi - 30) * 4)
        heat_level = "Moderate"
    else:
        heat_score = max(5, int((hi / 30.0) * 25))
        heat_level = "Low"

    categories.append(RiskCategoryScore(
        category="Heat Risk",
        score=heat_score,
        level=heat_level,
        color="#F59E0B",
        summary=f"{heat_level} thermal exposure hazard ({heat_score}/100). Apparent temperature {hi}°C.",
        contributing_factors=heat_factors
    ))

    # -------------------------------------------------------------
    # 4. Visibility Risk (0 - 100)
    # -------------------------------------------------------------
    vis_factors: List[RiskFactor] = []
    vis_m = cur.visibility
    vis_km = round(vis_m / 1000.0, 1)
    vis_factors.append(RiskFactor(
        name="Horizontal Optical Visibility",
        observed_value=f"{vis_km} km ({vis_m} m)",
        threshold_impact="Optical transmission limit"
    ))

    # Visibility scoring: > 8km (low), 4-8km (moderate), 1-4km (high), < 1km (critical fog/haze)
    if vis_m < 1000:
        vis_score = 90
        vis_level = "Critical"
    elif vis_m < 4000:
        vis_score = 60
        vis_level = "High"
    elif vis_m < 8000:
        vis_score = 30
        vis_level = "Moderate"
    else:
        vis_score = 5
        vis_level = "Minimal"

    categories.append(RiskCategoryScore(
        category="Visibility Risk",
        score=vis_score,
        level=vis_level,
        color="#8B5CF6",
        summary=f"{vis_level} visibility limitation ({vis_score}/100). Range: {vis_km} km.",
        contributing_factors=vis_factors
    ))

    # -------------------------------------------------------------
    # 5. Severe Storm Risk (0 - 100)
    # -------------------------------------------------------------
    storm_factors: List[RiskFactor] = []
    storm_score = 10
    if "Thunderstorm" in cur.condition.main or any("Thunderstorm" in it.condition.main for it in hourly[:4]):
        storm_score = 85
        storm_factors.append(RiskFactor(
            name="Convective Storm Signature",
            observed_value="Thunderstorm detected in active forecast period",
            threshold_impact="+75 pts"
        ))
    elif "Rain" in cur.condition.main and cur.wind_speed > 35:
        storm_score = 65
        storm_factors.append(RiskFactor(
            name="High-Wind Rain Convection",
            observed_value=f"{cur.wind_speed} km/h winds during rainfall",
            threshold_impact="+55 pts"
        ))
    else:
        storm_factors.append(RiskFactor(
            name="Convective Atmospheric Stability",
            observed_value="Stable barometric pressure trend",
            threshold_impact="Low convective probability"
        ))

    storm_level = "Critical" if storm_score >= 75 else "High" if storm_score >= 50 else "Moderate" if storm_score >= 25 else "Low"
    categories.append(RiskCategoryScore(
        category="Storm Risk",
        score=storm_score,
        level=storm_level,
        color="#EF4444",
        summary=f"{storm_level} severe storm potential ({storm_score}/100).",
        contributing_factors=storm_factors
    ))

    # -------------------------------------------------------------
    # 6. Travel Weather Risk (0 - 100)
    # -------------------------------------------------------------
    travel_score = min(100, int((rain_score * 0.55) + (vis_score * 0.35) + (wind_score * 0.10)))
    travel_level = "Critical" if travel_score >= 75 else "High" if travel_score >= 50 else "Moderate" if travel_score >= 25 else "Low"
    categories.append(RiskCategoryScore(
        category="Travel Weather Risk",
        score=travel_score,
        level=travel_level,
        color="#06B6D4",
        summary=f"{travel_level} commute and vehicular travel impediment ({travel_score}/100).",
        contributing_factors=[
            RiskFactor(name="Road Friction (Wetness)", observed_value=f"Rain Risk: {rain_score}", threshold_impact="Traction impact"),
            RiskFactor(name="Driver Visual Range", observed_value=f"{vis_km} km", threshold_impact="Reaction distance")
        ]
    ))

    # -------------------------------------------------------------
    # 7. Outdoor Activity Risk (0 - 100)
    # -------------------------------------------------------------
    outdoor_score = min(100, max(rain_score, heat_score, storm_score))
    outdoor_level = "Critical" if outdoor_score >= 75 else "High" if outdoor_score >= 50 else "Moderate" if outdoor_score >= 25 else "Low"
    categories.append(RiskCategoryScore(
        category="Outdoor Activity Risk",
        score=outdoor_score,
        level=outdoor_level,
        color="#EC4899",
        summary=f"{outdoor_level} suitability for construction, sports, and fieldwork ({outdoor_score}/100).",
        contributing_factors=[
            RiskFactor(name="Thermal / Precipitation Peak", observed_value=f"Peak factor: {max(rain_score, heat_score, storm_score)}/100", threshold_impact="Outdoor endurance limitation")
        ]
    ))

    # -------------------------------------------------------------
    # Compound Weather Hazards (Section 25)
    # -------------------------------------------------------------
    # 1. Heavy rain + strong wind
    if rain_score >= 50 and wind_score >= 40:
        compound_hazards.append(CompoundRiskAlert(
            hazard_title="Compound Hazard: Wind-Driven Rain & Tree Fall Risk",
            severity="High" if (rain_score >= 70 or wind_score >= 60) else "Moderate",
            primary_hazard=f"Heavy Rain ({rain_vol} mm expected, {max_pop}% pop)",
            secondary_hazard=f"High Winds ({w_speed} km/h sustained, gusts up to {w_gust} km/h)",
            rationale="Combination of soil softening from rain and high wind momentum drastically raises branch snap, hoarding collapse, and structural hazard risks.",
            recommended_precautions=[
                "Secure lightweight outdoor equipment and temporary roofing.",
                "Avoid parking vehicles under large tree canopies or vulnerable hoardings.",
                "Exercise extreme caution on exposed elevated roadways and bridges."
            ]
        ))

    # 2. High temperature + high humidity (Severe heat index)
    if cur.temp >= 32 and cur.humidity >= 65:
        compound_hazards.append(CompoundRiskAlert(
            hazard_title="Compound Hazard: High Heat + High Humidity (Thermal Stress)",
            severity="Extreme" if hi >= 42 else "High",
            primary_hazard=f"Elevated Temperature ({cur.temp}°C)",
            secondary_hazard=f"High Humidity ({cur.humidity}%)",
            rationale=f"Atmospheric moisture inhibits natural sweat evaporation cooling. Apparent heat index is {hi}°C, elevating risk of heat exhaustion and heat stroke.",
            recommended_precautions=[
                "Ensure frequent hydration with electrolytes; avoid prolonged direct sun exposure.",
                "Schedule strenuous outdoor labor during early morning or post-sunset windows.",
                "Provide shaded rest areas for construction, delivery, and agricultural workers."
            ]
        ))

    # 3. Rain + poor visibility
    if (rain_score >= 40 and vis_m < 3000) or ("Rain" in cur.condition.main and vis_m < 2000):
        compound_hazards.append(CompoundRiskAlert(
            hazard_title="Compound Hazard: Wet Pavement + Impaired Visual Range",
            severity="High",
            primary_hazard="Active / Forecast Precipitation",
            secondary_hazard=f"Reduced Visibility ({vis_km} km)",
            rationale="Water spray from vehicles coupled with atmospheric mist doubles driver reaction distance and multiplies hydroplaning probability.",
            recommended_precautions=[
                "Reduce highway travel speed by 25-30% and engage low-beam headlights.",
                "Increase vehicle following distance to at least 4 seconds.",
                "Motorcyclists and cyclists should avoid waterlogged lane edges."
            ]
        ))

    # Overall prototype risk score
    overall = int(sum(c.score for c in categories) / len(categories))
    overall_level = "Critical" if overall >= 70 else "High" if overall >= 45 else "Moderate" if overall >= 25 else "Low"

    return AiRiskAssessment(
        overall_score=overall,
        overall_level=overall_level,
        categories=categories,
        compound_hazards=compound_hazards,
        calculation_basis="Mathematical synthesis of real-time precipitation, wind, heat index, and optical range.",
        is_official_warning=False,
        disclaimer="AI-derived prototype risk score. Not an official meteorological warning."
    )
