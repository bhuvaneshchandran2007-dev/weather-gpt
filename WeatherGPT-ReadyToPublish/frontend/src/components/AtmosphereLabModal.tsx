import React, { useState, useEffect } from 'react';
import { X, Sliders, AlertTriangle, RotateCcw, ArrowRight, ShieldAlert, Sparkles, Check } from 'lucide-react';
import { useWeather } from '../context/WeatherContext';
import { runSimulation } from '../services/api';
import { SimulationResult, SimulationRequest } from '../types';

export const AtmosphereLabModal: React.FC = () => {
  const { weather, isAtmosphereLabOpen, setIsAtmosphereLabOpen } = useWeather();

  const [deltaTemp, setDeltaTemp] = useState<number>(3.0);
  const [deltaRain, setDeltaRain] = useState<number>(15.0);
  const [deltaWind, setDeltaWind] = useState<number>(10.0);
  const [deltaHumidity, setDeltaHumidity] = useState<number>(5.0);

  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSimulate = async () => {
    if (!weather) return;
    setLoading(true);
    try {
      const res = await runSimulation(weather.coordinates.lat, weather.coordinates.lon, {
        delta_temp: deltaTemp,
        delta_rain_mm: deltaRain,
        delta_wind_kmh: deltaWind,
        delta_humidity: deltaHumidity,
      });
      setSimResult(res);
    } catch (e) {
      console.error("Simulation run error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAtmosphereLabOpen && weather) {
      handleSimulate();
    }
  }, [isAtmosphereLabOpen, deltaTemp, deltaRain, deltaWind, deltaHumidity]);

  if (!isAtmosphereLabOpen) return null;

  const resetDeltas = () => {
    setDeltaTemp(0);
    setDeltaRain(0);
    setDeltaWind(0);
    setDeltaHumidity(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none animate-fade-in">
      <div className="bg-[#0F172A] border border-orange-500/40 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Top Watermark Banner */}
        <div className="bg-orange-500/20 border-b border-orange-500/30 px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-orange-300 font-mono text-xs font-bold uppercase tracking-wider">
            <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
            <span>SIMULATION — HYPOTHETICAL SCENARIO LAB</span>
          </div>
          <span className="text-[10px] text-orange-400 font-mono">NON-OFFICIAL TESTBENCH</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#1E293B]/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">ATMOSPHERE LAB</h2>
              <p className="text-xs text-slate-400">
                What-If Scenario Simulator: Stress-Test Atmospheric Shifts & Compound Hazard Impacts
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAtmosphereLabOpen(false)}
            className="p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-orange-500/20">
          
          {/* Interactive Sliders Grid */}
          <div className="p-4 rounded-2xl bg-[#1E293B]/70 border border-white/5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                <span>Atmospheric Perturbation Parameters</span>
              </h3>
              <button
                onClick={resetDeltas}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-cyan-400 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset to Ground Truth</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Temp slider */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">Temperature Delta</span>
                  <span className="font-mono font-bold text-orange-400">
                    {deltaTemp > 0 ? `+${deltaTemp}` : deltaTemp}°C
                  </span>
                </div>
                <input
                  type="range"
                  min="-10"
                  max="10"
                  step="0.5"
                  value={deltaTemp}
                  onChange={(e) => setDeltaTemp(parseFloat(e.target.value))}
                  className="w-full accent-orange-500 cursor-pointer"
                />
              </div>

              {/* Rain slider */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">Rainfall Volume Delta</span>
                  <span className="font-mono font-bold text-sky-400">
                    {deltaRain > 0 ? `+${deltaRain}` : deltaRain} mm
                  </span>
                </div>
                <input
                  type="range"
                  min="-40"
                  max="60"
                  step="1"
                  value={deltaRain}
                  onChange={(e) => setDeltaRain(parseFloat(e.target.value))}
                  className="w-full accent-sky-500 cursor-pointer"
                />
              </div>

              {/* Wind slider */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">Wind Gust Velocity Delta</span>
                  <span className="font-mono font-bold text-cyan-400">
                    {deltaWind > 0 ? `+${deltaWind}` : deltaWind} km/h
                  </span>
                </div>
                <input
                  type="range"
                  min="-30"
                  max="50"
                  step="1"
                  value={deltaWind}
                  onChange={(e) => setDeltaWind(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              {/* Humidity slider */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">Relative Humidity Delta</span>
                  <span className="font-mono font-bold text-teal-400">
                    {deltaHumidity > 0 ? `+${deltaHumidity}` : deltaHumidity}%
                  </span>
                </div>
                <input
                  type="range"
                  min="-30"
                  max="30"
                  step="1"
                  value={deltaHumidity}
                  onChange={(e) => setDeltaHumidity(parseFloat(e.target.value))}
                  className="w-full accent-teal-500 cursor-pointer"
                />
              </div>

            </div>
          </div>

          {/* Results: Real Baseline vs Simulated Impact */}
          {simResult && (
            <div className="space-y-4">
              
              {/* Score Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-[#1E293B]/80 border border-emerald-500/20 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-emerald-400 uppercase font-mono font-bold tracking-wider">
                      Ground Truth Baseline
                    </span>
                    <div className="text-2xl font-mono font-bold text-white mt-1">
                      {simResult.baseline_temp.toFixed(1)}°C
                    </div>
                    <div className="text-xs text-slate-400">
                      Heat Index: {simResult.baseline_heat_index.toFixed(1)}°C • Risk: {simResult.baseline_overall_risk}/100
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold">
                    LIVE
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#1E293B]/80 border border-orange-500/30 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-orange-400 uppercase font-mono font-bold tracking-wider">
                      Simulated Scenario
                    </span>
                    <div className="text-2xl font-mono font-bold text-orange-300 mt-1">
                      {simResult.simulated_temp.toFixed(1)}°C
                    </div>
                    <div className="text-xs text-slate-400">
                      Heat Index: {simResult.simulated_heat_index.toFixed(1)}°C • Risk: {simResult.simulated_overall_risk}/100
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-orange-500/20 text-orange-300 text-xs font-bold">
                    SIMULATED
                  </span>
                </div>
              </div>

              {/* Impact Notes */}
              {simResult.simulated_impact_notes && (
                <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-orange-300 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Projected Sectoral Vulnerabilities</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300 font-sans">
                    {simResult.simulated_impact_notes.map((note, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-orange-400 font-bold">•</span>
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
