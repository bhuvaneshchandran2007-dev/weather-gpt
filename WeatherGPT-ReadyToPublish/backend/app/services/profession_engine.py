from typing import Dict, Any, Optional
from ..models.weather import NormalizedWeatherReport
from ..models.profession import ProfessionAdvisory
from .risk_engine import compute_heat_index

def generate_profession_advisory(profession_id: str, weather: NormalizedWeatherReport) -> ProfessionAdvisory:
    """
    Profession Intelligence Engine.
    Converts real meteorological telemetry into tailored decision-making recommendations
    across 18+ industry and lifestyle profiles.
    """
    cur = weather.current
    rain_intel = weather.rain_intelligence
    hourly = weather.hourly
    pid = (profession_id or "general_public").lower().strip()

    pop_max = rain_intel.max_pop_pct
    rain_vol = rain_intel.total_rain_expected_mm
    wind_spd = cur.wind_speed
    wind_gust = cur.wind_gust or wind_spd
    temp = cur.temp
    humidity = cur.humidity
    vis_km = round(cur.visibility / 1000.0, 1)
    hi = compute_heat_index(temp, humidity)

    dry_window = rain_intel.dry_window or "Continuous dry conditions"
    rain_window = rain_intel.rain_window or "No immediate rain window"

    # Default fallback
    advisory = ProfessionAdvisory(
        profession_id="general_public",
        profession_name="General Public",
        icon="Users",
        risk_level="Low",
        summary="Standard outdoor conditions based on current forecast.",
        impact_analysis=["Normal atmospheric conditions."],
        action_recommendations=["Carry on with normal daily routines."],
        best_time_window=dry_window,
        avoidance_window=rain_window if pop_max >= 50 else None,
        telemetry_summary={"temp": f"{temp}°C", "rain_prob": f"{pop_max}%", "wind": f"{wind_spd} km/h"},
        disclaimer="AI-derived decision support based on real-time meteorological observations."
    )

    if pid in ("farmer", "agriculture"):
        # Farmer mode logic
        risk = "Low"
        impacts = []
        actions = []

        if pop_max >= 55 or rain_vol >= 5.0:
            risk = "High" if rain_vol >= 15.0 else "Moderate"
            impacts.append(f"High precipitation likelihood ({pop_max}% chance, ~{rain_vol} mm forecast). Natural soil moisture replenishment expected.")
            actions.append("Postpone scheduled irrigation cycles to prevent soil waterlogging and conserve pump energy.")
            actions.append("Halt foliar pesticide and fertilizer spraying; rain within 6 hours risks wash-off and chemical wastage.")
        else:
            impacts.append(f"Low rainfall probability ({pop_max}%). Evaporative soil moisture loss expected.")
            actions.append("Proceed with regular field irrigation according to crop stage.")
            if wind_spd < 15:
                actions.append(f"Ideal conditions for chemical or fertilizer spraying (low wind speed: {wind_spd} km/h).")

        if wind_spd >= 25:
            impacts.append(f"Brisk winds ({wind_spd} km/h, gusts {wind_gust} km/h) can cause spray drift and mechanical crop lodging.")
            actions.append("Avoid high-pressure foliar spraying until wind drops below 15 km/h.")

        if hi >= 38:
            impacts.append(f"High heat index ({hi}°C) accelerates soil moisture loss and causes heat stress in outdoor farm labor and livestock.")
            actions.append("Provide shaded shelters and clean water for farm animals; shift heavy manual field work to early morning hours.")

        advisory = ProfessionAdvisory(
            profession_id="farmer",
            profession_name="Agricultural Producer & Farmer",
            icon="Wheat",
            risk_level=risk,
            summary="Agricultural operations guidance derived from precipitation likelihood, wind speed, and thermal index.",
            impact_analysis=impacts,
            action_recommendations=actions,
            best_time_window=dry_window,
            avoidance_window=rain_window if pop_max >= 45 else None,
            telemetry_summary={"soil_wetting_risk": f"{rain_vol} mm rain", "spraying_suitability": "Poor" if (wind_spd > 18 or pop_max > 50) else "Optimal"},
            disclaimer="Agrometeorological recommendation based on real API forecast. Always corroborate with local Krishi Vigyan Kendra advisories."
        )

    elif pid in ("fisherman", "marine"):
        # Fisherman / Marine mode logic
        risk = "Low"
        impacts = []
        actions = []

        impacts.append(f"Surface wind speed: {wind_spd} km/h with gusts up to {wind_gust} km/h. Sea visibility: {vis_km} km.")
        # Explicit mandatory disclaimer: DO NOT INVENT WAVE DATA
        impacts.append("Marine wave height and sea-state data are unavailable from the connected weather source.")

        if wind_spd >= 40 or wind_gust >= 50 or "Thunderstorm" in cur.condition.main:
            risk = "Critical"
            impacts.append("Dangerous squall/gust conditions detected. High surface chop and sudden wind shifts likely.")
            actions.append("Coastal and deep-sea vessels are advised NOT to venture into open waters.")
            actions.append("Secure small craft, catamarans, and mechanized boats firmly to harbor moorings.")
        elif wind_spd >= 25 or pop_max >= 60:
            risk = "Moderate"
            impacts.append("Moderate choppy surface conditions and intermittent squally showers anticipated.")
            actions.append("Small motorized boats should exercise caution and maintain close communication with coastal stations.")
        else:
            actions.append("Normal near-shore and coastal operations favorable based on current wind telemetry.")

        advisory = ProfessionAdvisory(
            profession_id="fisherman",
            profession_name="Fisherman & Marine Operator",
            icon="Anchor",
            risk_level=risk,
            summary="Coastal marine safety guidance synthesized from wind speed, gust turbulence, and storm proximity.",
            impact_analysis=impacts,
            action_recommendations=actions,
            best_time_window=dry_window,
            avoidance_window=rain_window if (pop_max >= 50 or wind_spd >= 30) else None,
            telemetry_summary={"wind_speed": f"{wind_spd} km/h", "gusts": f"{wind_gust} km/h", "wave_data": "Unavailable from source"},
            disclaimer="Marine weather guidance derived strictly from available atmospheric data. Check official IMD / INCOIS coastal bulletins for mandatory maritime warnings."
        )

    elif pid in ("pilot", "aviation"):
        # Pilot / Aviation mode
        risk = "Low"
        impacts = []
        actions = []

        impacts.append(f"Visibility: {vis_km} km. Wind: {wind_spd} km/h at {cur.wind_deg}°, Gusts: {wind_gust} km/h. Cloud cover: {cur.clouds}%.")
        if cur.visibility < 3000:
            risk = "High"
            impacts.append("Reduced optical visibility may necessitate Instrument Flight Rules (IFR).")
        if "Thunderstorm" in cur.condition.main:
            risk = "Critical"
            impacts.append("Active convective activity with severe updraft/downdraft turbulence and icing hazards aloft.")
            actions.append("Convective storm avoidance protocols recommended for approach and departure paths.")

        actions.append("Verify crosswind limits against aircraft operating manual.")
        actions.append("Monitor barometric altimeter setting (QNH: %d hPa)." % cur.pressure)

        advisory = ProfessionAdvisory(
            profession_id="pilot",
            profession_name="Aviator & Drone Pilot",
            icon="Plane",
            risk_level=risk,
            summary="Aeronautical atmospheric summary derived from surface visibility, wind vectors, and convective cloud cover.",
            impact_analysis=impacts,
            action_recommendations=actions,
            best_time_window=dry_window,
            avoidance_window=rain_window if "Thunderstorm" in cur.condition.main else None,
            telemetry_summary={"QNH_pressure": f"{cur.pressure} hPa", "cloud_cover": f"{cur.clouds}%", "flight_category": "VFR" if (vis_km > 5 and cur.clouds < 60) else "Marginal / IFR"},
            disclaimer="This is an AI weather interpretation and not an aviation operational clearance. METAR/TAF reports from aerodrome meteorological offices remain official authority."
        )

    elif pid in ("driver", "delivery"):
        # Driver & Delivery worker mode
        risk = "Low"
        impacts = []
        actions = []

        if pop_max >= 50 or "Rain" in cur.condition.main:
            risk = "High" if rain_vol >= 10.0 else "Moderate"
            impacts.append(f"Wet asphalt and reduced pavement friction expected (Rain prob: {pop_max}%).")
            impacts.append("Braking distances increase by approximately 2x on wet roads; hydroplaning risk on standing water.")
            actions.append("Maintain 4-second following distance and reduce cruising speed by 15-20 km/h.")
            actions.append("Inspect tire tread and wiper blade condition before departure.")
            if pid == "delivery":
                actions.append("Ensure waterproof cargo tarpaulins/bag liners are sealed to protect customer packages.")

        if vis_km < 3.0:
            risk = "High"
            impacts.append(f"Sub-optimal optical visibility ({vis_km} km) due to atmospheric mist/spray.")
            actions.append("Engage low-beam headlights and avoid sudden lane transitions.")

        if hi >= 36 and pid == "delivery":
            impacts.append(f"Severe heat index ({hi}°C) for two-wheeler delivery riders.")
            actions.append("Carry minimum 2 liters of water and take scheduled 10-minute shade breaks every 90 minutes.")

        advisory = ProfessionAdvisory(
            profession_id=pid,
            profession_name="Driver & Fleet Operator" if pid == "driver" else "Delivery Partner & Courier",
            icon="Car" if pid == "driver" else "Package",
            risk_level=risk,
            summary="Road transit risk assessment addressing road traction, visibility, and weather-related dispatch delays.",
            impact_analysis=impacts if impacts else ["Road conditions generally clear and favorable for transit."],
            action_recommendations=actions if actions else ["Proceed with standard defensive driving protocols."],
            best_time_window=rain_intel.safest_travel_window or dry_window,
            avoidance_window=rain_window if pop_max >= 50 else None,
            telemetry_summary={"pavement_condition": "Wet / Hydroplaning Risk" if pop_max >= 50 else "Dry", "visibility": f"{vis_km} km"},
            disclaimer="Advisory derived from atmospheric precipitation and optical range. Does not claim real-time road construction or traffic congestion data."
        )

    elif pid in ("construction", "outdoor_worker"):
        # Construction worker mode
        risk = "Low"
        impacts = []
        actions = []

        if pop_max >= 50 or rain_vol >= 3.0:
            risk = "High"
            impacts.append(f"Precipitation anticipated (~{rain_vol} mm). Fresh concrete pouring and excavation vulnerable to water wash.")
            actions.append("Cover un-cured slab pours with plastic sheeting; pause exterior painting and plastering.")
            actions.append("Pump out surface trenches to prevent foundation wall slippage.")

        if wind_gust >= 35 or wind_spd >= 30:
            risk = "Critical" if wind_gust >= 45 else "High"
            impacts.append(f"Elevated wind gusts ({wind_gust} km/h) exceed safe crane and suspended scaffolding limits.")
            actions.append("Halt tower crane operations and tie down loose corrugated sheets and plywood.")

        if hi >= 38:
            risk = max(risk, "Moderate")
            impacts.append(f"Thermal index ({hi}°C) creates severe heat exhaustion and dehydration risk for manual labor.")
            actions.append("Mandate 15-minute hydration breaks every hour and position portable shaded rest sheds.")

        advisory = ProfessionAdvisory(
            profession_id=pid,
            profession_name="Construction Engineer & Site Supervisor" if pid == "construction" else "Outdoor Worker",
            icon="HardHat",
            risk_level=risk,
            summary="On-site safety protocols regarding structural lifting limits, concrete curing windows, and thermal stress.",
            impact_analysis=impacts if impacts else ["Favorable meteorological window for continuous outdoor site activities."],
            action_recommendations=actions if actions else ["Standard PPE and site safety compliance."],
            best_time_window=dry_window,
            avoidance_window=rain_window if pop_max >= 45 else None,
            telemetry_summary={"crane_wind_safety": "Unsafe" if wind_gust >= 35 else "Safe", "concrete_pour_window": dry_window},
            disclaimer="Safety guidelines calculated from wind gusts, thermal index, and precipitation. Structural safety assessments remain engineer responsibility."
        )

    elif pid in ("event_organizer", "wedding", "concert"):
        # Outdoor Event Organizer
        risk = "Low"
        impacts = []
        actions = []

        if pop_max >= 40:
            risk = "High" if pop_max >= 70 else "Moderate"
            impacts.append(f"Significant rain likelihood ({pop_max}% chance) during forecast span. Rain window: {rain_window}.")
            actions.append("Deploy waterproof canopy covers over sound equipment, stage wiring, and guest seating.")
            actions.append("Prepare indoor contingency venue or arrange commercial-grade marquee tents.")

        if wind_gust >= 30:
            impacts.append(f"Wind gusts ({wind_gust} km/h) can destabilize temporary LED walls, banners, and lightweight tents.")
            actions.append("Ballast tent legs with sandbags/water barrels and anchor audio trussing.")

        advisory = ProfessionAdvisory(
            profession_id="event_organizer",
            profession_name="Outdoor Event & Function Organizer",
            icon="Calendar",
            risk_level=risk,
            summary="Event feasibility scoring based on precipitation risk windows, ambient comfort, and structural wind resistance.",
            impact_analysis=impacts if impacts else ["Ideal weather expected for outdoor events and social gatherings."],
            action_recommendations=actions if actions else ["Maintain routine event schedule and setup."],
            best_time_window=dry_window,
            avoidance_window=rain_window if pop_max >= 40 else None,
            telemetry_summary={"event_weather_score": f"{max(0, 100 - int(pop_max*0.7 + wind_spd*0.5))}/100", "sound_stage_risk": "Rain / Wind Warning" if (pop_max > 50 or wind_gust > 30) else "Clear"},
            disclaimer="Event planning recommendation generated from numerical weather model output."
        )

    elif pid in ("student", "college"):
        # Student mode
        risk = "Low"
        impacts = []
        actions = []

        if pop_max >= 40 or "Rain" in cur.condition.main:
            risk = "Moderate"
            impacts.append(f"Rain likely during commute periods ({pop_max}% chance around {rain_window}).")
            actions.append("Pack an umbrella or raincoat in your college bag.")
            actions.append("Wrap textbooks and electronic devices in water-resistant sleeves.")
        else:
            impacts.append("Dry commute conditions anticipated.")
            actions.append("Standard college travel schedule suitable.")

        if hi >= 36:
            actions.append("Carry a refillable water bottle to stay hydrated during afternoon campus walks.")

        advisory = ProfessionAdvisory(
            profession_id="student",
            profession_name="Student & Campus Commuter",
            icon="GraduationCap",
            risk_level=risk,
            summary="Daily commute and campus travel checklist tailored to rain windows and temperature comfort.",
            impact_analysis=impacts,
            action_recommendations=actions,
            best_time_window=rain_intel.safest_travel_window or dry_window,
            avoidance_window=rain_window if pop_max >= 45 else None,
            telemetry_summary={"umbrella_needed": "Yes" if pop_max >= 40 else "No", "outdoor_sports_suitability": "Good" if pop_max < 30 else "Poor (Wet Ground)"},
            disclaimer="Commute decision support generated from OpenWeather forecast."
        )

    elif pid in ("solar_operator", "energy"):
        # Solar Energy Operator
        risk = "Low"
        impacts = []
        actions = []

        c_cover = cur.clouds
        loss_pct = int(c_cover * 0.7)
        impacts.append(f"Cloud cover is currently {c_cover}%. Estimated solar PV output attenuation: ~{loss_pct}%.")
        if pop_max >= 50:
            impacts.append("Upcoming rainfall will assist natural dust and soiling removal from module surfaces.")
            actions.append("Delay manual photovoltaic panel washing cycles to save treated wash water.")
        else:
            actions.append("Dry conditions: schedule soiling inspection and inverter terminal thermal checks.")

        advisory = ProfessionAdvisory(
            profession_id="solar_operator",
            profession_name="Solar Energy Plant Operator",
            icon="Sun",
            risk_level="Moderate" if c_cover > 70 else "Low",
            summary="Solar yield estimation proxy derived from cloud coverage fraction and precipitation wash windows.",
            impact_analysis=impacts,
            action_recommendations=actions,
            best_time_window=dry_window,
            avoidance_window=None,
            telemetry_summary={"cloud_cover": f"{c_cover}%", "estimated_pv_yield_ratio": f"{max(15, 100 - loss_pct)}%"},
            disclaimer="Irradiance attenuation estimated from cloud cover percentage; on-site pyranometers provide official generation metrics."
        )

    elif pid in ("disaster_officer", "emergency"):
        # Disaster Management Officer (MoES / IMD focus)
        risk = "Low"
        impacts = []
        actions = []

        if pop_max >= 65 or rain_vol >= 20.0:
            risk = "Critical" if rain_vol >= 40.0 else "High"
            impacts.append(f"Heavy rainfall forecast (~{rain_vol} mm accumulated over upcoming cycles). High surface runoff load on urban storm drains.")
            actions.append("Activate Emergency Operations Center (EOC) Watch status.")
            actions.append("Pre-position dewatering suction pumps at historically vulnerable underpasses and low-lying arterial roads.")
            actions.append("Alert state disaster response teams (SDRF / Civil Defense) for localized waterlogging intervention.")
        elif pop_max >= 40:
            risk = "Moderate"
            impacts.append(f"Moderate precipitation potential ({pop_max}% pop). Saturated soil risk in low gradient catchments.")
            actions.append("Maintain situational awareness and monitor localized rain gauge feeds.")
        else:
            impacts.append("No critical meteorological hazards detected across the active forecast horizon.")
            actions.append("Routine readiness posture and equipment maintenance.")

        if wind_gust >= 45:
            risk = "Critical"
            impacts.append(f"Gale-force gusts ({wind_gust} km/h) threaten overhead electrical distribution cables and signage.")
            actions.append("Coordinate with electricity board quick-response repair units.")

        advisory = ProfessionAdvisory(
            profession_id="disaster_officer",
            profession_name="Disaster Management Officer (IMD / MoES)",
            icon="ShieldAlert",
            risk_level=risk,
            summary="Incident monitoring and emergency readiness matrix for heavy precipitation, convective storms, and gale risks.",
            impact_analysis=impacts,
            action_recommendations=actions,
            best_time_window=dry_window,
            avoidance_window=rain_window if pop_max >= 50 else None,
            telemetry_summary={"eoc_readiness_level": "Level 2 (Alert)" if risk == "High" else "Level 3 (Action)" if risk == "Critical" else "Level 1 (Routine Monitoring)"},
            disclaimer="Decision support synthesized from real weather model outputs. Official emergency bulletins must be routed through State Disaster Management Authority (SDMA)."
        )

    return advisory
