import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  NormalizedWeatherReport, LocationInfo, AiRiskAssessment,
  ProfessionAdvisory, WeatherUnavailableResponse, AtmosphericViewState,
  TimeRailStep, VoiceOrbState
} from '../types';
import { fetchFullWeather, fetchAiRisk, fetchProfessionAdvisory } from '../services/api';

export const PROFESSIONS = [
  { id: 'general_public', name: 'General Public', icon: 'Users' },
  { id: 'farmer', name: 'Agricultural Farmer', icon: 'Wheat' },
  { id: 'fisherman', name: 'Fisherman & Marine Operator', icon: 'Anchor' },
  { id: 'driver', name: 'Driver & Fleet Operator', icon: 'Car' },
  { id: 'delivery', name: 'Delivery Partner', icon: 'Package' },
  { id: 'construction', name: 'Construction Engineer', icon: 'HardHat' },
  { id: 'pilot', name: 'Aviation & Drone Pilot', icon: 'Plane' },
  { id: 'student', name: 'Student & Campus Commuter', icon: 'GraduationCap' },
  { id: 'event_organizer', name: 'Outdoor Event Planner', icon: 'Calendar' },
  { id: 'solar_operator', name: 'Solar Energy Plant Operator', icon: 'Sun' },
  { id: 'disaster_officer', name: 'Disaster Management (IMD/MoES)', icon: 'ShieldAlert' },
  { id: 'runner', name: 'Runner / Athlete', icon: 'Activity' },
  { id: 'cyclist', name: 'Cyclist', icon: 'Bike' },
  { id: 'tourism', name: 'Tourism & Traveler', icon: 'Compass' },
];

interface WeatherContextType {
  weather: NormalizedWeatherReport | null;
  riskAssessment: AiRiskAssessment | null;
  professionAdvisory: ProfessionAdvisory | null;
  currentProfession: string;
  setProfession: (id: string) => void;
  isLoading: boolean;
  error: { message: string; diagnostic?: WeatherUnavailableResponse } | null;
  refreshWeather: (lat?: number, lon?: number, city?: string) => Promise<void>;
  selectLocation: (loc: LocationInfo) => void;
  detectUserLocation: () => void;
  viewState: AtmosphericViewState;
  setViewState: React.Dispatch<React.SetStateAction<AtmosphericViewState>>;
  timeRailStep: TimeRailStep;
  setTimeRailStep: React.Dispatch<React.SetStateAction<TimeRailStep>>;
  voiceState: VoiceOrbState;
  setVoiceState: React.Dispatch<React.SetStateAction<VoiceOrbState>>;
  isModelLabOpen: boolean;
  setIsModelLabOpen: (open: boolean) => void;
  isAtmosphereLabOpen: boolean;
  setIsAtmosphereLabOpen: (open: boolean) => void;
  isClimateMemoryOpen: boolean;
  setIsClimateMemoryOpen: (open: boolean) => void;
  isMissionModeOpen: boolean;
  setIsMissionModeOpen: (open: boolean) => void;
  isDataDetailsOpen: boolean;
  setIsDataDetailsOpen: (open: boolean) => void;
}

const WeatherContext = createContext<WeatherContextType | undefined>(undefined);

export const WeatherProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [weather, setWeather] = useState<NormalizedWeatherReport | null>(null);
  const [riskAssessment, setRiskAssessment] = useState<AiRiskAssessment | null>(null);
  const [professionAdvisory, setProfessionAdvisory] = useState<ProfessionAdvisory | null>(null);
  const [currentProfession, setCurrentProfession] = useState<string>(() => {
    return localStorage.getItem('weathergpt_profession') || 'farmer';
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<{ message: string; diagnostic?: WeatherUnavailableResponse } | null>(null);
  const [viewState, setViewState] = useState<AtmosphericViewState>('ATMOSPHERE');
  const [timeRailStep, setTimeRailStep] = useState<TimeRailStep>('NOW');
  const [voiceState, setVoiceState] = useState<VoiceOrbState>('IDLE');
  const [isModelLabOpen, setIsModelLabOpen] = useState<boolean>(false);
  const [isAtmosphereLabOpen, setIsAtmosphereLabOpen] = useState<boolean>(false);
  const [isClimateMemoryOpen, setIsClimateMemoryOpen] = useState<boolean>(false);
  const [isMissionModeOpen, setIsMissionModeOpen] = useState<boolean>(false);
  const [isDataDetailsOpen, setIsDataDetailsOpen] = useState<boolean>(false);

  const loadData = useCallback(async (lat?: number, lon?: number, city?: string, prof: string = currentProfession) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchFullWeather(lat, lon, city);
      setWeather(data);

      // Concurrently fetch AI risk and profession advisory
      const [risk, adv] = await Promise.all([
        fetchAiRisk(data.coordinates.lat, data.coordinates.lon).catch(() => null),
        fetchProfessionAdvisory(prof, data.coordinates.lat, data.coordinates.lon).catch(() => null)
      ]);

      setRiskAssessment(risk);
      setProfessionAdvisory(adv);
    } catch (err: any) {
      console.error("[WeatherContext] Fetch error:", err);
      setError({
        message: err.message || "Unable to retrieve real weather data.",
        diagnostic: err.diagnostic
      });
      setWeather(null);
    } finally {
      setIsLoading(false);
    }
  }, [currentProfession]);

  useEffect(() => {
    // Initial load: Chennai
    loadData(13.0827, 80.2707, undefined, currentProfession);
  }, []);

  const refreshWeather = async (lat?: number, lon?: number, city?: string) => {
    await loadData(lat, lon, city, currentProfession);
  };

  const setProfession = async (id: string) => {
    setCurrentProfession(id);
    localStorage.setItem('weathergpt_profession', id);
    if (weather) {
      try {
        const adv = await fetchProfessionAdvisory(id, weather.coordinates.lat, weather.coordinates.lon);
        setProfessionAdvisory(adv);
      } catch (e) {
        console.error("Failed to update profession advisory", e);
      }
    }
  };

  const selectLocation = (loc: LocationInfo) => {
    loadData(loc.lat, loc.lon, undefined, currentProfession);
  };

  const detectUserLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        loadData(pos.coords.latitude, pos.coords.longitude, undefined, currentProfession);
      },
      (err) => {
        console.warn("Geolocation denied or error:", err);
        setIsLoading(false);
        alert("Location access denied or timed out. Defaulting to Chennai.");
      },
      { timeout: 8000 }
    );
  };

  return (
    <WeatherContext.Provider value={{
      weather,
      riskAssessment,
      professionAdvisory,
      currentProfession,
      setProfession,
      isLoading,
      error,
      refreshWeather,
      selectLocation,
      detectUserLocation,
      viewState,
      setViewState,
      timeRailStep,
      setTimeRailStep,
      voiceState,
      setVoiceState,
      isModelLabOpen,
      setIsModelLabOpen,
      isAtmosphereLabOpen,
      setIsAtmosphereLabOpen,
      isClimateMemoryOpen,
      setIsClimateMemoryOpen,
      isMissionModeOpen,
      setIsMissionModeOpen,
      isDataDetailsOpen,
      setIsDataDetailsOpen
    }}>
      {children}
    </WeatherContext.Provider>
  );
};

export const useWeather = () => {
  const context = useContext(WeatherContext);
  if (!context) throw new Error('useWeather must be used within WeatherProvider');
  return context;
};
