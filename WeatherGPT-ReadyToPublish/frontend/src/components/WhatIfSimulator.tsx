import React, { useState } from 'react';
import {
  Sliders, AlertTriangle, Play, RefreshCw,
  Flame, CloudRain, Wind, Droplets, ArrowRight, ShieldCheck
} from 'lucide-react';
import { useWeather } from '../context/WeatherContext';
import { useLanguage } from '../context/LanguageContext';
import { runSimulation } from '../services/api';
import { SimulationResult } from '../types';

export const WhatIfSimulator: React.FC = () => {
  const { weather, isLoading: weatherLoading } = useWeather();
  const { t } = useLanguage();

  const [deltaTemp, setDeltaTemp] = useState<number>(5);
  const [deltaRain, setDeltaRain] = useState<number>(25);
  const [deltaWind, setDeltaWind] = useState<number>(20);
  const [deltaHumidity, setDeltaHumidity] = useState<number>(15);

  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const handleRunSimulation = async () => {
    if (!weather) return;
    setIsSimulating(true);
    try {
      const res = await runSimulation(weather.coordinates.lat, weather.coordinates.lon, {
        delta_temp: deltaTemp,
        delta_rain_mm: deltaRain,
        delta_wind_kmh: deltaWind,
        delta_humidity: deltaHumidity
      });
      setSimResult(res);
    } catch (err: any) {
      alert("Simulation failed: " + err.message);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleReset = () => {
    setDeltaTemp(0);
    setDeltaRain(0);
    setDeltaWind(0);
    setDeltaHumidity(0);
    setSimResult(null);
  };

  if (weatherLoading || !weather) {
    return null;
  }

  return (
    <div className="glass-card rounded-2xl p-6 text-slate-100 shadow-xl border border-amber-500/20 space-y-6">
      
      {/* Header & Simulation Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-extrabold text-white tracking-tight">
              {t('nav_simulator')}
            </h3>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wide">
              {t('simulation_label')}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Evaluate climate elasticity and infrastructural resilience under hypothetical stressors
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 hover:bg-slate-800 text-xs text-slate-400 hover:text-white transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Sliders</span>
        </button>
      </div>

      {/* Control Sliders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-900/80 border border-white/5">
        
        {/* Delta Temp */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="flex items-center gap-1 text-slate-400">
              <Flame className="w-3.5 h-3.5 text-amber-400" /> Δ Temperature
            </span>
            <span className="font-bold text-amber-300 font-mono">
              {deltaTemp >= 0 ? `+${deltaTemp}` : deltaTemp}°C
            </span>
          </div>
          <input
            type="range"
            min="-10"
            max="15"
            step="1"
            value={deltaTemp}
            onChange={(e) => setDeltaTemp(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>-10°C</span>
            <span>Baseline</span>
            <span>+15°C</span>
          </div>
        </div>

        {/* Delta Rain */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="flex items-center gap-1 text-slate-400">
              <CloudRain className="w-3.5 h-3.5 text-cyan-400" /> Δ Rainfall Surge
            </span>
            <span className="font-bold text-cyan-300 font-mono">
              +{deltaRain} mm
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="80"
            step="5"
            value={deltaRain}
            onChange={(e) => setDeltaRain(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>0 mm</span>
            <span>+40 mm</span>
            <span>+80 mm</span>
          </div>
        </div>

        {/* Delta Wind */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="flex items-center gap-1 text-slate-400">
              <Wind className="w-3.5 h-3.5 text-emerald-400" /> Δ Wind Acceleration
            </span>
            <span className="font-bold text-emerald-300 font-mono">
              +{deltaWind} km/h
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="60"
            step="5"
            value={deltaWind}
            onChange={(e) => setDeltaWind(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>0 km/h</span>
            <span>+30 km/h</span>
            <span>+60 km/h</span>
          </div>
        </div>

        {/* Delta Humidity */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="flex items-center gap-1 text-slate-400">
              <Droplets className="w-3.5 h-3.5 text-blue-400" /> Δ Relative Humidity
            </span>
            <span className="font-bold text-blue-300 font-mono">
              {deltaHumidity >= 0 ? `+${deltaHumidity}` : deltaHumidity}%
            </span>
          </div>
          <input
            type="range"
            min="-30"
            max="40"
            step="5"
            value={deltaHumidity}
            onChange={(e) => setDeltaHumidity(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-400"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>-30%</span>
            <span>0%</span>
            <span>+40%</span>
          </div>
        </div>

      </div>

      {/* Run Action */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleRunSimulation}
          disabled={isSimulating}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 hover:opacity-90 transition-all"
        >
          {isSimulating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
          <span>Run What-If Simulation</span>
        </button>
      </div>

      {/* Side-by-Side Comparison: REAL FORECAST vs SIMULATION (Section 26) */}
      {simResult && (
        <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-4">
          
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                Simulation Comparison Target
              </span>
              <h4 className="text-base font-bold text-white">
                {simResult.location_name}
              </h4>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              SIMULATION WATERMARK ACTIVE
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {simResult.comparisons.map((comp, idx) => (
              <div key={idx} className="p-3 bg-slate-900/80 rounded-xl border border-white/5 space-y-2">
                <span className="text-[11px] font-semibold text-slate-400">
                  {comp.metric_name}
                </span>
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 block">REAL</span>
                    <span className="text-sm font-mono text-slate-300">{comp.real_value}</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                  <div className="text-right">
                    <span className="text-[10px] text-amber-400 block">SIMULATED</span>
                    <span className="text-sm font-mono font-bold text-amber-300">{comp.simulated_value}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center text-[10px] pt-1 border-t border-white/5">
                  <span className="text-slate-400">Shift: {comp.delta_text}</span>
                  <span className={`font-semibold ${
                    comp.impact_level === 'Severe Hazard' ? 'text-red-400' : comp.impact_level === 'Elevated Risk' ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {comp.impact_level}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Simulated Impact Notes */}
          <div className="p-3.5 bg-slate-900/90 rounded-xl border border-white/10 space-y-1.5 text-xs">
            <span className="font-bold text-amber-300 uppercase text-[10px] tracking-wider">
              Projected Resilience & Sector Impacts:
            </span>
            <ul className="space-y-1 text-slate-300 list-disc list-inside">
              {simResult.simulated_impact_notes.map((note, idx) => (
                <li key={idx}>{note}</li>
              ))}
            </ul>
          </div>

          <p className="text-[11px] text-amber-300/70 italic text-center pt-2 border-t border-amber-500/10">
            {simResult.disclaimer}
          </p>

        </div>
      )}

    </div>
  );
};
