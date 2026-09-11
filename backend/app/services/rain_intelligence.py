from typing import List, Optional
from datetime import datetime
from ..models.weather import HourlyForecastItem, RainTimelineItem, RainIntelligence

def categorize_rain_intensity(pop: float, rain_mm: float, condition_main: str) -> str:
    """Categorize rainfall intensity based on meteorological precipitation rates."""
    if pop < 0.20 and rain_mm == 0:
        return "None"
    if rain_mm >= 15.0 or "Thunderstorm" in condition_main:
        return "Torrential"
    elif rain_mm >= 7.6:
        return "Heavy"
    elif rain_mm >= 2.5:
        return "Moderate"
    elif rain_mm > 0 or pop >= 0.40:
        return "Light"
    elif pop >= 0.20:
        return "Trace"
    return "None"

def compute_rain_intelligence(hourly_items: List[HourlyForecastItem]) -> RainIntelligence:
    """
    Intelligent Rain Analysis Engine.
    Analyzes real forecast timestamps to detect rain start, peak, duration, dry windows, and travel windows.
    """
    if not hourly_items:
        return RainIntelligence(
            has_rain_forecast=False,
            rain_likelihood="None",
            precision_note="No hourly forecast data available from connected source.",
            timeline=[]
        )

    timeline: List[RainTimelineItem] = []
    rain_forecast_found = False
    max_pop = 0.0
    total_rain_expected = 0.0

    # Look ahead across the next 24-36 hours (up to 12 forecast intervals of 3h)
    inspection_items = hourly_items[:12]

    first_rain_item: Optional[HourlyForecastItem] = None
    peak_rain_item: Optional[HourlyForecastItem] = None
    end_rain_item: Optional[HourlyForecastItem] = None

    highest_intensity_val = 0.0
    rain_intervals_count = 0

    dry_start: Optional[str] = None
    dry_end: Optional[str] = None
    current_dry_streak: List[HourlyForecastItem] = []
    longest_dry_streak: List[HourlyForecastItem] = []

    for item in inspection_items:
        pop_pct = int(item.pop * 100)
        rain_mm = item.rain_volume_mm
        total_rain_expected += rain_mm
        if item.pop > max_pop:
            max_pop = item.pop

        intensity = categorize_rain_intensity(item.pop, rain_mm, item.condition.main)
        is_likely = (item.pop >= 0.45) or (rain_mm > 0.5) or ("Rain" in item.condition.main)

        if is_likely:
            rain_forecast_found = True
            rain_intervals_count += 1
            if first_rain_item is None:
                first_rain_item = item

            intensity_score = rain_mm + (item.pop * 3)
            if intensity_score > highest_intensity_val:
                highest_intensity_val = intensity_score
                peak_rain_item = item

            # Reset dry streak
            if len(current_dry_streak) > len(longest_dry_streak):
                longest_dry_streak = list(current_dry_streak)
            current_dry_streak = []
        else:
            current_dry_streak.append(item)
            if first_rain_item is not None and end_rain_item is None:
                end_rain_item = item

        timeline.append(RainTimelineItem(
            time_label=item.time_label,
            dt=item.dt,
            pop_pct=pop_pct,
            rain_mm=rain_mm,
            intensity=intensity,
            condition=item.condition.description,
            icon=item.condition.icon,
            is_rain_likely=is_likely
        ))

    if len(current_dry_streak) > len(longest_dry_streak):
        longest_dry_streak = list(current_dry_streak)

    # Determine likelihood category
    if max_pop >= 0.70:
        likelihood = "Very High"
    elif max_pop >= 0.50:
        likelihood = "High"
    elif max_pop >= 0.30:
        likelihood = "Moderate"
    elif max_pop >= 0.15:
        likelihood = "Low"
    else:
        likelihood = "None"

    # Formulate windows
    rain_window = None
    next_start = None
    next_peak = None
    next_end = None
    est_duration_hours = None

    if first_rain_item:
        next_start = first_rain_item.time_label
        next_peak = peak_rain_item.time_label if peak_rain_item else next_start
        est_duration_hours = rain_intervals_count * 3.0  # OpenWeather standard step is 3 hours
        if end_rain_item:
            next_end = end_rain_item.time_label
            rain_window = f"{next_start} – {next_end}"
        else:
            rain_window = f"Starting around {next_start} (extended period)"

    dry_window = None
    safest_travel = None
    if longest_dry_streak:
        w_start = longest_dry_streak[0].time_label
        w_end = longest_dry_streak[-1].time_label
        dry_window = f"{w_start} to {w_end}"
        safest_travel = f"Best travel/commute window: {w_start} to {w_end} (minimal precipitation risk)"
    else:
        dry_window = "No significant dry window within the next 24 hours"
        safest_travel = "Caution: Rain or showers anticipated throughout upcoming travel periods."

    # Precision disclaimer in accordance with Section 4
    precision_note = (
        "Hourly forecast indicates rain trends. "
        "Estimated windows are based on 3-hour meteorological model steps; "
        "local atmospheric variability may cause slight time shifts."
    )

    return RainIntelligence(
        has_rain_forecast=rain_forecast_found,
        next_rain_start=next_start,
        next_rain_peak=next_peak,
        next_rain_end=next_end,
        rain_duration_hours=est_duration_hours,
        max_pop_pct=int(max_pop * 100),
        total_rain_expected_mm=round(total_rain_expected, 1),
        rain_likelihood=likelihood,
        rain_window=rain_window,
        dry_window=dry_window,
        safest_travel_window=safest_travel,
        precision_note=precision_note,
        timeline=timeline
    )
