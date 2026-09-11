import {
  NormalizedWeatherReport, LocationInfo, AiRiskAssessment,
  ProfessionAdvisory, CommunityReport, SystemHealth,
  SimulationRequest, SimulationResult, NWPData, ClimateTrends,
  HistoricalSnapshot, TechnicalDetails
} from '../types';

const BASE_URL = '/api';

export async function fetchFullWeather(lat?: number, lon?: number, city?: string): Promise<NormalizedWeatherReport> {
  const params = new URLSearchParams();
  if (lat !== undefined && lon !== undefined) {
    params.append('lat', lat.toString());
    params.append('lon', lon.toString());
  }
  if (city) {
    params.append('city', city);
  }

  const res = await fetch(`${BASE_URL}/weather/full?${params.toString()}`);
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    const message = errData.diagnostic_reason || errData.message || `Server responded with status ${res.status}`;
    const err: any = new Error(message);
    err.status = res.status;
    err.diagnostic = errData;
    throw err;
  }
  return res.json();
}

export async function fetchLocationSuggestions(query: string): Promise<LocationInfo[]> {
  if (!query || query.trim().length < 2) return [];
  const res = await fetch(`${BASE_URL}/weather/location?q=${encodeURIComponent(query.trim())}`);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchReverseGeocode(lat: number, lon: number): Promise<LocationInfo> {
  const res = await fetch(`${BASE_URL}/weather/reverse-location?lat=${lat}&lon=${lon}`);
  if (!res.ok) throw new Error('Reverse geocoding failed');
  return res.json();
}

export async function fetchAiRisk(lat: number, lon: number): Promise<AiRiskAssessment> {
  const res = await fetch(`${BASE_URL}/risk/analyze?lat=${lat}&lon=${lon}`, { method: 'POST' });
  if (!res.ok) throw new Error('Risk assessment failed');
  return res.json();
}

export async function fetchProfessionAdvisory(profession: string, lat: number, lon: number): Promise<ProfessionAdvisory> {
  const res = await fetch(`${BASE_URL}/advisory/profession?profession=${encodeURIComponent(profession)}&lat=${lat}&lon=${lon}`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Profession advisory failed');
  return res.json();
}

export async function sendChatMessage(body: {
  query: string;
  location?: string;
  lat?: number;
  lon?: number;
  language?: string;
  profession?: string;
}) {
  const res = await fetch(`${BASE_URL}/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.diagnostic_reason || errData.message || 'Chat request failed');
  }
  return res.json();
}

export async function runSimulation(lat: number, lon: number, params: SimulationRequest): Promise<SimulationResult> {
  const res = await fetch(`${BASE_URL}/simulation/run?lat=${lat}&lon=${lon}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  if (!res.ok) throw new Error('Simulation failed');
  return res.json();
}

export async function fetchCommunityReports(): Promise<CommunityReport[]> {
  const res = await fetch(`${BASE_URL}/community/reports`);
  if (!res.ok) return [];
  return res.json();
}

export async function submitCommunityReport(data: {
  location_name: string;
  lat: number;
  lon: number;
  report_type: string;
  description: string;
  severity: string;
}): Promise<CommunityReport> {
  const res = await fetch(`${BASE_URL}/community/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to submit report');
  return res.json();
}

export async function fetchDataHealth(): Promise<SystemHealth> {
  const res = await fetch(`${BASE_URL}/data-health`);
  if (!res.ok) throw new Error('Data health check failed');
  return res.json();
}

export async function fetchNWPData(lat: number, lon: number, model: string = 'gfs'): Promise<NWPData> {
  const res = await fetch(`${BASE_URL}/nwp/data?model=${encodeURIComponent(model)}&lat=${lat}&lon=${lon}`);
  if (!res.ok) throw new Error('Failed to fetch NWP model data');
  return res.json();
}

export async function fetchClimateTrends(lat: number, lon: number, years: number = 10): Promise<ClimateTrends> {
  const res = await fetch(`${BASE_URL}/climate/trends?lat=${lat}&lon=${lon}&years=${years}`);
  if (!res.ok) throw new Error('Failed to fetch climate trends');
  return res.json();
}

export async function fetchHistoricalSnapshot(lat: number, lon: number, date: string): Promise<HistoricalSnapshot> {
  const res = await fetch(`${BASE_URL}/climate/historical?lat=${lat}&lon=${lon}&date=${encodeURIComponent(date)}`);
  if (!res.ok) throw new Error('Failed to fetch historical snapshot');
  return res.json();
}

export async function fetchTechnicalDetails(lat?: number, lon?: number): Promise<TechnicalDetails> {
  const params = new URLSearchParams();
  if (lat !== undefined && lon !== undefined) {
    params.append('lat', lat.toString());
    params.append('lon', lon.toString());
  }
  const res = await fetch(`${BASE_URL}/technical/details?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch technical details');
  return res.json();
}
