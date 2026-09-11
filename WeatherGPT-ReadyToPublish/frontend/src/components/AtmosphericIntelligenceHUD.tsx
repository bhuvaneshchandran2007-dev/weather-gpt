import React, { useState } from 'react';
import {
  Globe, Wind, CloudRain, Thermometer, Eye, ShieldAlert,
  Compass, BarChart3, Sliders, History, Flag, Info,
  ChevronDown, AlertTriangle, CheckCircle2
} from 'lucide-react';
import { useWeather, PROFESSIONS } from '../context/WeatherContext';
import { AtmosphericViewState } from '../types';

export const AtmosphericIntelligenceHUD: React.FC = () => {
  const {
    weather,
    riskAssessment,
    currentProfession,
    setProfession,
    viewState,
    setViewState,
    setIsModelLabOpen,
    setIsAtmosphereLabOpen,
    setIsClimateMemoryOpen,
    setIsMissionModeOpen,
    setIsDataDetailsOpen,
  } = useWeather();

  const [isProfDropdownOpen, setIsProfDropdownOpen] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  const selectedProfObj = PROFESSIONS.find(p => p.id === currentProfession) || PROFESSIONS[1];

  const viewModes: { id: AtmosphericViewState; label: string; icon: any }[] = [
    { id: 'ATMOSPHERE', label: 'Atmosphere', icon: Eye },
    { id: 'ORBIT', label: '3D Orbit', icon: Globe },
    { id: 'WIND', label: 'Wind Vector', icon: Wind },
    { id: 'RAIN', label: 'Precipitation', icon: CloudRain },
    { id: 'THERMAL', label: 'Thermal Grid', icon: Thermometer },
    { id: 'CITY', label: 'City Descent', icon: Compass },
  ];

  const riskScore = riskAssessment?.overall_score ?? 18;
  const riskLevel = riskAssessment?.overall_level ?? 'Low';

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Critical': return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'High': return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
      case 'Moderate': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      default: return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    }
  };

  return (
    <div className="fixed top-20 right-4 z-20 flex flex-col items-end gap-3 pointer-events-auto select-none max-w-sm w-full sm:w-88">
      
      {/* 1. 3D View State Selector Rail */}
      <div className="flex items-center gap-1 p-1 bg-[#0F172A]/90 border border-white/10 rounded-2xl shadow-xl backdrop-blur-2xl overflow-x-auto max-w-full">
        {viewModes.map((mode) => {
          const Icon = mode.icon;
          const isActive = viewState === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => setViewState(mode.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500 to-sky-600 text-white shadow-md shadow-cyan-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
              title={`Switch camera to ${mode.label}`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{mode.label}</span>
            </button>
          );
        })}
      </div>

      {/* 2. Primary Atmospheric Intelligence Glass Box */}
      <div className="w-full bg-[#0F172A]/92 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-2xl p-4 transition-all duration-300">
        
        {/* Header with Live Data Badge & Minimize */}
        <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2.5 mb-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>LIVE WEATHER DATA</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              {weather ? `${weather.freshness_seconds}s ago` : 'Active'}
            </span>
          </div>

          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-xs text-slate-400 hover:text-cyan-400"
          >
            {isMinimized ? 'Expand' : 'Collapse'}
          </button>
        </div>

        {!isMinimized && (
          <div className="space-y-3">
            
            {/* Location & Local Clock */}
            <div>
              <h2 className="text-lg font-black tracking-tight text-white flex items-center justify-between">
                <span>{weather?.location?.formatted_name || 'Chennai, Tamil Nadu'}</span>
                <span className="text-2xl font-mono text-cyan-400 font-bold">
                  {weather?.current?.temp?.toFixed(1) ?? '--'}°C
                </span>
              </h2>
              <div className="flex items-center justify-between text-xs text-slate-400 mt-0.5">
                <span>Feels like {weather?.current?.feels_like?.toFixed(1) ?? '--'}°C</span>
                <span className="capitalize text-slate-300 font-medium">
                  {weather?.current?.condition?.description || 'Atmospheric telemetry'}
                </span>
              </div>
            </div>

            {/* Weather Metrics Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2 rounded-xl bg-[#1E293B]/70 border border-white/5">
                <div className="flex items-center gap-1 text-slate-400 text-[10px] uppercase font-sans">
                  <Wind className="w-3 h-3 text-cyan-400" />
                  <span>Wind Velocity</span>
                </div>
                <div className="mt-1 text-white font-bold">
                  {weather?.current?.wind_speed ?? 12} km/h
                  <span className="text-slate-400 text-[10px] font-normal ml-1 font-sans">
                    ({weather?.current?.wind_deg ?? 80}°)
                  </span>
                </div>
              </div>

              <div className="p-2 rounded-xl bg-[#1E293B]/70 border border-white/5">
                <div className="flex items-center gap-1 text-slate-400 text-[10px] uppercase font-sans">
                  <CloudRain className="w-3 h-3 text-sky-400" />
                  <span>Rain Risk</span>
                </div>
                <div className="mt-1 text-white font-bold">
                  {weather?.rain_intelligence?.max_pop_pct ?? 0}%
                  <span className="text-slate-400 text-[10px] font-normal ml-1 font-sans">
                    {weather?.rain_intelligence?.rain_likelihood ?? 'Low'}
                  </span>
                </div>
              </div>
            </div>

            {/* AI Compound Risk Score Gauge Summary */}
            <div className={`p-2.5 rounded-xl border flex items-center justify-between ${getRiskColor(riskLevel)}`}>
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" />
                <div>
                  <div className="text-[10px] uppercase font-sans font-bold tracking-wider">
                    AI RISK ASSESSMENT
                  </div>
                  <div className="text-xs font-bold">
                    {riskLevel} Risk ({riskScore}/100)
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 uppercase">
                {riskAssessment?.compound_hazards?.length ?? 0} Compound Alerts
              </span>
            </div>

            {/* Profession Lens Selector */}
            <div className="relative">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1 flex items-center justify-between">
                <span>Profession Intelligence</span>
                <span className="text-cyan-400 font-mono">14 PROFILES</span>
              </div>
              <button
                onClick={() => setIsProfDropdownOpen(!isProfDropdownOpen)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[#1E293B] border border-cyan-500/20 text-xs font-semibold text-white hover:border-cyan-400 transition-colors"
              >
                <span>{selectedProfObj.name}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-cyan-400 transition-transform ${isProfDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Profession Dropdown */}
              {isProfDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-[#0F172A] border border-white/10 rounded-xl shadow-2xl p-1 z-30 scrollbar-thin scrollbar-thumb-cyan-500/20">
                  {PROFESSIONS.map((prof) => (
                    <button
                      key={prof.id}
                      onClick={() => {
                        setProfession(prof.id);
                        setIsProfDropdownOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                        currentProfession === prof.id
                          ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <span>{prof.name}</span>
                      {currentProfession === prof.id && <CheckCircle2 className="w-3 h-3 text-cyan-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Navigation / Specialty Engine Buttons */}
            <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-white/5">
              <button
                onClick={() => setIsModelLabOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#1E293B]/80 hover:bg-slate-800 border border-white/5 text-[11px] font-bold text-slate-200 hover:text-cyan-400 transition-all"
              >
                <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
                <span>MODEL LAB</span>
              </button>

              <button
                onClick={() => setIsAtmosphereLabOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#1E293B]/80 hover:bg-slate-800 border border-white/5 text-[11px] font-bold text-slate-200 hover:text-orange-400 transition-all"
              >
                <Sliders className="w-3.5 h-3.5 text-orange-400" />
                <span>ATMOSPHERE LAB</span>
              </button>

              <button
                onClick={() => setIsClimateMemoryOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#1E293B]/80 hover:bg-slate-800 border border-white/5 text-[11px] font-bold text-slate-200 hover:text-sky-400 transition-all"
              >
                <History className="w-3.5 h-3.5 text-sky-400" />
                <span>CLIMATE MEMORY</span>
              </button>

              <button
                onClick={() => setIsMissionModeOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-orange-500/20 to-amber-500/20 hover:from-orange-500/30 hover:to-amber-500/30 border border-orange-500/30 text-[11px] font-bold text-orange-300 transition-all"
              >
                <Flag className="w-3.5 h-3.5 text-orange-400" />
                <span>MISSION MODE</span>
              </button>
            </div>

            {/* Technical Audit Transparency Link */}
            <div className="flex justify-end pt-1">
              <button
                onClick={() => setIsDataDetailsOpen(true)}
                className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-cyan-400 transition-colors"
              >
                <Info className="w-3 h-3" />
                <span>Technical Data Details</span>
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
