export interface Coordinates {
  lat: float;
  lon: float;
}

export type float = number;

export interface LocationInfo {
  name: string;
  country?: string;
  state?: string;
  lat: number;
  lon: number;
  formatted_name: string;
}

export interface WeatherCondition {
  id: number;
  main: string;
  description: string;
  icon: string;
}

export interface CurrentWeather {
  temp: number;
  feels_like: number;
  temp_min: number;
  temp_max: number;
  pressure: number;
  humidity: number;
  wind_speed: number;
  wind_deg: number;
  wind_gust?: number | null;
  clouds: number;
  visibility: number;
  uv_index?: number | null;
  condition: WeatherCondition;
  sunrise?: number | null;
  sunset?: number | null;
  dt: number;
  dt_iso: string;
  is_day: boolean;
}

export interface HourlyForecastItem {
  dt: number;
  dt_iso: string;
  time_label: string;
  temp: number;
  feels_like: number;
  humidity: number;
  wind_speed: number;
  wind_deg: number;
  wind_gust?: number | null;
  clouds: number;
  pop: number; // 0.0 - 1.0
  rain_volume_mm: number;
  condition: WeatherCondition;
}

export interface DailyForecastItem {
  date: string;
  day_name: string;
  temp_min: number;
  temp_max: number;
  humidity: number;
  wind_speed: number;
  pop_max: number;
  rain_total_mm: number;
  condition: WeatherCondition;
  summary: string;
}

export interface RainTimelineItem {
  time_label: string;
  dt: number;
  pop_pct: number;
  rain_mm: number;
  intensity: 'None' | 'Trace' | 'Light' | 'Moderate' | 'Heavy' | 'Torrential';
  condition: string;
  icon: string;
  is_rain_likely: boolean;
}

export interface RainIntelligence {
  has_rain_forecast: boolean;
  next_rain_start?: string | null;
  next_rain_peak?: string | null;
  next_rain_end?: string | null;
  rain_duration_hours?: number | null;
  max_pop_pct: number;
  total_rain_expected_mm: number;
  rain_likelihood: 'None' | 'Low' | 'Moderate' | 'High' | 'Very High';
  rain_window?: string | null;
  dry_window?: string | null;
  safest_travel_window?: string | null;
  precision_note: string;
  timeline: RainTimelineItem[];
}

export interface AirQuality {
  aqi: number;
  aqi_label: string;
  pm2_5?: number | null;
  pm10?: number | null;
  o3?: number | null;
  no2?: number | null;
  so2?: number | null;
  co?: number | null;
  available: boolean;
}

export interface OfficialAlert {
  sender_name: string;
  event: string;
  start?: number | null;
  end?: number | null;
  description: string;
  severity: string;
  source: string;
  is_official: boolean;
}

export interface NormalizedWeatherReport {
  location: LocationInfo;
  coordinates: Coordinates;
  timezone_offset_seconds: number;
  current: CurrentWeather;
  hourly: HourlyForecastItem[];
  daily: DailyForecastItem[];
  rain_intelligence: RainIntelligence;
  air_quality?: AirQuality | null;
  official_alerts: OfficialAlert[];
  data_source: string;
  last_updated: string;
  freshness_seconds: number;
  is_real_data: boolean;
  notice?: string | null;
}

export interface WeatherUnavailableResponse {
  status: 'unavailable';
  error_code: string;
  message: string;
  diagnostic_reason: string;
  troubleshooting_steps: string[];
  is_real_data: false;
}

export interface RiskFactor {
  name: string;
  observed_value: string;
  threshold_impact: string;
}

export interface RiskCategoryScore {
  category: string;
  score: number;
  level: 'Minimal' | 'Low' | 'Moderate' | 'High' | 'Critical';
  color: string;
  summary: string;
  contributing_factors: RiskFactor[];
}

export interface CompoundRiskAlert {
  hazard_title: string;
  severity: 'Moderate' | 'High' | 'Extreme';
  primary_hazard: string;
  secondary_hazard: string;
  rationale: string;
  recommended_precautions: string[];
}

export interface AiRiskAssessment {
  overall_score: number;
  overall_level: 'Minimal' | 'Low' | 'Moderate' | 'High' | 'Critical';
  categories: RiskCategoryScore[];
  compound_hazards: CompoundRiskAlert[];
  calculation_basis: string;
  is_official_warning: boolean;
  disclaimer: string;
}

export interface ProfessionAdvisory {
  profession_id: string;
  profession_name: string;
  icon: string;
  risk_level: 'Low' | 'Moderate' | 'High' | 'Critical';
  summary: string;
  impact_analysis: string[];
  action_recommendations: string[];
  best_time_window?: string | null;
  avoidance_window?: string | null;
  telemetry_summary: Record<string, any>;
  disclaimer: string;
}

export interface WeatherCardSnippet {
  location: string;
  temp: number;
  feels_like: number;
  condition: string;
  icon: string;
  pop_pct: number;
  rain_window?: string | null;
  best_window?: string | null;
  data_source: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  detected_language?: string;
  weather_card?: WeatherCardSnippet | null;
  tools_executed?: string[];
  quick_suggestions?: string[];
  action_view_state?: AtmosphericViewState | null;
}

export interface CommunityReport {
  id: number;
  location_name: string;
  lat: number;
  lon: number;
  report_type: string;
  description: string;
  severity: string;
  created_at: string;
  is_verified: boolean;
  verification_label: string;
}

export interface SystemHealth {
  status: 'OPERATIONAL' | 'ACTION_REQUIRED';
  server_time: string;
  problem_statement: string;
  weather_api: {
    provider: string;
    status: string;
    is_configured: boolean;
    latency_ms: number;
    http_code: number | null;
    last_check: string;
    last_error: string | null;
    supported_endpoints: { name: string; available: boolean }[];
    unavailable_endpoints: { name: string; reason: string }[];
    cached_locations_count: number;
  };
  google_maps: {
    status: string;
    is_configured: boolean;
    engine_in_use: string;
    notice: string;
  };
  conversational_ai: {
    status: string;
    local_meteorological_agent: string;
    gemini_api: string;
    supported_languages_count: number;
    supported_professions_count: number;
    tool_calling_enabled: boolean;
  };
  voice_ai: {
    status: string;
    input_engine: string;
    output_engine: string;
    multilingual_voices_support: boolean;
  };
  database: {
    type: string;
    path: string;
    status: string;
  };
}

export interface SimulationRequest {
  delta_temp: number;
  delta_rain_mm: number;
  delta_wind_kmh: number;
  delta_humidity: number;
}

export interface SimulationMetricDiff {
  metric_name: string;
  real_value: string;
  simulated_value: string;
  delta_text: string;
  impact_level: string;
}

export interface SimulationResult {
  is_simulation: true;
  watermark_label: string;
  location_name: string;
  baseline_temp: number;
  simulated_temp: number;
  baseline_rain_vol: number;
  simulated_rain_vol: number;
  baseline_wind: number;
  simulated_wind: number;
  baseline_heat_index: number;
  simulated_heat_index: number;
  baseline_overall_risk: number;
  simulated_overall_risk: number;
  comparisons: SimulationMetricDiff[];
  simulated_impact_notes: string[];
  disclaimer: string;
}

export type AtmosphericViewState =
  | 'ORBIT'
  | 'REGION'
  | 'CITY'
  | 'DISTRICT'
  | 'STREET'
  | 'WIND'
  | 'RAIN'
  | 'THERMAL'
  | 'PRESSURE'
  | 'ATMOSPHERE'
  | 'RISK'
  | 'NWP'
  | 'CLIMATE';

export type TimeRailStep =
  | 'PAST'
  | 'NOW'
  | '+15m'
  | '+30m'
  | '+45m'
  | '+1h'
  | '+3h'
  | '+6h'
  | '+12h'
  | '+24h';

export type VoiceOrbState =
  | 'IDLE'
  | 'LISTENING'
  | 'UNDERSTANDING'
  | 'ANALYZING'
  | 'RESPONDING';

export interface NWPHourlyItem {
  time: string;
  temp: number | null;
  precipitation: number;
  pressure: number | null;
  wind_speed: number | null;
  cape: number;
}

export interface NWPData {
  status: string;
  model: string;
  run_cycle?: string;
  resolution?: string;
  forecast_horizon?: string;
  variables?: string[];
  current_nwp_snapshot?: {
    temperature: number | null;
    convective_cape: number | null;
    surface_pressure: number | null;
    wind_speed: number | null;
  };
  hourly_series?: NWPHourlyItem[];
  reason?: string;
  supported_domains?: string[];
  data_classification: string;
}

export interface MonthlyTrendItem {
  month: string;
  avg_temp: number;
  precip_mm: number;
  anomaly: string;
}

export interface ClimateTrends {
  status: string;
  data_classification: string;
  observation_period?: string;
  baseline_climatology?: {
    annual_mean_max_temp: number;
    annual_mean_min_temp: number;
    annual_total_precipitation_mm: number;
    decadal_warming_trend: string;
    monsoon_intensity_shift: string;
  };
  monthly_trends?: MonthlyTrendItem[];
  historical_extremes?: {
    event: string;
    value: string;
    recorded_date: string;
  }[];
  reason?: string;
}

export interface HistoricalSnapshot {
  status: string;
  date: string;
  data_classification: string;
  max_temp?: number | null;
  min_temp?: number | null;
  precipitation_mm?: number;
  max_wind_kmh?: number | null;
  reason?: string;
}

export interface TechnicalDetails {
  primary_meteorological_feed: string;
  api_endpoint: string;
  last_ping_latency_ms: number;
  last_http_status: number;
  last_synced_at: string;
  nwp_gridded_models: string[];
  climate_reanalysis_engine: string;
  coordinates_queried?: { lat: number; lon: number } | null;
  transparency_note: string;
}
