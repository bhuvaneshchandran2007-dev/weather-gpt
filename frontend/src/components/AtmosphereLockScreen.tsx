import React, { useState, useEffect } from 'react';
import { Compass, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { useWeather } from '../context/WeatherContext';

interface AtmosphereLockScreenProps {
  onUnlock: () => void;
}

export const AtmosphereLockScreen: React.FC<AtmosphereLockScreenProps> = ({ onUnlock }) => {
  const { weather } = useWeather();
  const [bootPhase, setBootPhase] = useState<number>(0);

  useEffect(() => {
    // Stage 0: 0ms -> Cyan point
    // Stage 1: 800ms -> Shockwave & Telemetry Connect
    // Stage 2: 1800ms -> Grid Resolution & Mesoscale Synced
    // Stage 3: 2800ms -> Atmosphere Locked
    const t1 = setTimeout(() => setBootPhase(1), 700);
    const t2 = setTimeout(() => setBootPhase(2), 1700);
    const t3 = setTimeout(() => setBootPhase(3), 2700);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0F172A] text-slate-100 overflow-hidden select-none transition-opacity duration-700">
      
      {/* Background Cosmic Particle Grid */}
      <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#06B6D4_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      {/* Atmospheric Energy Rings */}
      <div className="relative flex items-center justify-center">
        {/* Pulsing Aura */}
        <div className={`absolute w-72 h-72 rounded-full border border-cyan-500/30 transition-all duration-1000 ${
          bootPhase >= 1 ? 'scale-125 opacity-100 animate-ping' : 'scale-50 opacity-0'
        }`} />
        <div className={`absolute w-96 h-96 rounded-full border border-sky-400/20 transition-all duration-1000 ${
          bootPhase >= 2 ? 'scale-110 opacity-75 animate-pulse' : 'scale-75 opacity-0'
        }`} />

        {/* Central Core */}
        <div className={`relative w-28 h-28 rounded-full flex items-center justify-center bg-gradient-to-tr from-[#0F172A] via-[#1E293B] to-[#0369A1] border-2 border-cyan-400 shadow-[0_0_80px_rgba(6,182,212,0.8)] transition-transform duration-700 ${
          bootPhase === 3 ? 'scale-110 ring-8 ring-cyan-500/30' : 'scale-100'
        }`}>
          <Compass className={`w-12 h-12 text-cyan-300 transition-all duration-1000 ${
            bootPhase >= 1 ? 'rotate-180 scale-110' : ''
          }`} />
        </div>
      </div>

      {/* Title & Branding */}
      <div className="mt-10 text-center max-w-md px-6 z-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold tracking-widest uppercase mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>SIH PROBLEM STATEMENT 26068</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white mb-1">
          WEATHER<span className="text-cyan-400">GPT</span>
        </h1>
        <p className="text-xs sm:text-sm font-semibold tracking-widest text-slate-400 uppercase">
          ATMOSPHERIC INTELLIGENCE
        </p>

        {/* Boot Telemetry Log Sequence */}
        <div className="mt-8 font-mono text-xs text-left bg-[#1E293B]/80 border border-white/10 rounded-xl p-3 shadow-xl space-y-1.5 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-cyan-300">
            <span className="text-slate-500">[0.00s]</span>
            <span>Initializing 3D Digital Twin Engine...</span>
          </div>

          {bootPhase >= 1 && (
            <div className="flex items-center gap-2 text-sky-300 animate-fade-in">
              <span className="text-slate-500">[0.70s]</span>
              <span>Connecting to Real Meteorological Telemetry...</span>
            </div>
          )}

          {bootPhase >= 2 && (
            <div className="flex items-center gap-2 text-emerald-300 animate-fade-in">
              <span className="text-slate-500">[1.70s]</span>
              <span>Target: {weather?.location?.formatted_name || 'India Domain (13.08°N, 80.27°E)'}</span>
            </div>
          )}

          {bootPhase >= 3 && (
            <div className="flex items-center gap-2 text-teal-300 font-bold animate-fade-in">
              <span className="text-slate-500">[2.70s]</span>
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              <span>ATMOSPHERE LOCKED — READY FOR INTERACTION</span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onUnlock}
            className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-sm tracking-wider uppercase shadow-xl shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <span>ENTER THE ATMOSPHERE</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <p className="mt-4 text-[11px] text-slate-500 font-medium">
          Ministry of Earth Sciences (MoES) • India Meteorological Department (IMD)
        </p>
      </div>

    </div>
  );
};
