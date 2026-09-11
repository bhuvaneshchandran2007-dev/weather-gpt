import React, { useState, useEffect } from 'react';
import {
  X, Flag, ChevronRight, ChevronLeft, Play, Pause,
  Sparkles, CheckCircle2, ShieldAlert, Cpu, Eye, Compass
} from 'lucide-react';
import { useWeather } from '../context/WeatherContext';
import { AtmosphericViewState } from '../types';

interface MissionStep {
  title: string;
  category: string;
  description: string;
  keyFeature: string;
  recommendedView: AtmosphericViewState;
  action?: 'open_model_lab' | 'open_atmosphere_lab' | 'open_climate' | 'open_technical' | 'none';
}

const MISSION_STEPS: MissionStep[] = [
  {
    title: 'Real-Time Ground Truth & Zero Fake Data',
    category: 'INTEGRITY',
    description: 'WeatherGPT connects exclusively to authentic meteorological feeds. If telemetry is lost, the platform displays DATA UNAVAILABLE rather than hallucinating.',
    keyFeature: 'Zero Synthetic Weather • Real Latency Telemetry',
    recommendedView: 'ATMOSPHERE',
    action: 'none',
  },
  {
    title: '3D Living Atmospheric Digital Twin',
    category: '3D VISUALIZATION',
    description: 'Full-screen WebGL atmosphere driven by live wind vectors, cloud cover percentage, and rain probabilities.',
    keyFeature: 'Three.js Procedural Clouds • Real-Time Dynamic Wind Field',
    recommendedView: 'ORBIT',
    action: 'none',
  },
  {
    title: 'Rain Timeline & Safest Travel Windows',
    category: 'DISASTER RESILIENCE',
    description: 'Dynamic rain timelines calculate exact onset, peak precipitation volume, dry windows, and safe commuting windows.',
    keyFeature: 'Precise Rain Timing • Probability of Precipitation (POP %)',
    recommendedView: 'RAIN',
    action: 'none',
  },
  {
    title: 'Multilingual Voice AI & Natural Dialects',
    category: 'CONVERSATIONAL AI',
    description: 'Voice Orb with 5 visual states supporting 14 Indian languages plus colloquial Tanglish and Hinglish with zero robotic cadence.',
    keyFeature: 'Web Speech API • Gemini Meteorological Agent',
    recommendedView: 'ATMOSPHERE',
    action: 'none',
  },
  {
    title: 'Explainable AI Compound Risk Engine',
    category: 'DECISION SUPPORT',
    description: 'Computes a transparent 0-100 hazard risk index combining heat index, localized wind gusts, flood thresholds, and compound disasters.',
    keyFeature: 'Compound Hazard Alerts • Explainable Factors',
    recommendedView: 'RISK',
    action: 'none',
  },
  {
    title: '14+ Profession Intelligence Lenses',
    category: 'SPECIALIZED ADVISORY',
    description: 'Tailored decision rules for Farmers (irrigation, spraying), Fishermen (wave heights), Aviation (cloud ceiling), Construction, and Drivers.',
    keyFeature: 'Rule-Based Domain Logic • Actionable Directives',
    recommendedView: 'CITY',
    action: 'none',
  },
  {
    title: 'Numerical Weather Prediction (NWP) Lab',
    category: 'METEOROLOGY',
    description: 'Orchestrates multi-model forecasting comparing NOAA GFS-FV3 0.25° gridded physics against WRF-ARW 3km mesoscale boundaries.',
    keyFeature: 'Model Cycles (00Z/12Z) • Convective CAPE • Model Bias Analysis',
    recommendedView: 'NWP',
    action: 'open_model_lab',
  },
  {
    title: 'Reality Lab What-If Atmospheric Simulator',
    category: 'SCENARIO LAB',
    description: 'Interactive testbench to stress-test hypothetical climate shifts (+3°C warming, +20mm downpour) watermarked with SIMULATION labels.',
    keyFeature: 'What-If Sliders • Heat Index Recalculation',
    recommendedView: 'THERMAL',
    action: 'open_atmosphere_lab',
  },
  {
    title: 'Climate Time Machine & Weather Memory',
    category: 'CLIMATE SCIENCE',
    description: 'Decadal warming trends (+0.28°C/decade) and archive reanalysis to travel back to any historical date.',
    keyFeature: 'ERA5 Reanalysis • 10-Year Decadal Normals',
    recommendedView: 'CLIMATE',
    action: 'open_climate',
  },
  {
    title: 'Crowdsourced Ground Truth Field Reports',
    category: 'COMMUNITY GIS',
    description: 'Citizens and local authorities submit hyperlocal flood, tree fall, and hail observations marked as UNVERIFIED COMMUNITY REPORT until verified.',
    keyFeature: 'Hyperlocal Ground Truth • SQLite Storage',
    recommendedView: 'DISTRICT',
    action: 'none',
  },
  {
    title: 'Official IMD Warnings & Compound Alerts',
    category: 'NATIONAL SAFETY',
    description: 'Seamless integration with official alerts, rendering color-coded warning envelopes (Red/Orange/Yellow) with immediate safety advice.',
    keyFeature: 'IMD / MoES Official Bulletins • Priority Broadcast',
    recommendedView: 'ATMOSPHERE',
    action: 'none',
  },
  {
    title: 'Technical Data Transparency Panel',
    category: 'SYSTEM AUDIT',
    description: 'Full transparency into underlying APIs, ping latency in milliseconds, coordinate geocoding, and data freshness for auditors.',
    keyFeature: 'Zero Hallucination Proof • API Health Telemetry',
    recommendedView: 'ATMOSPHERE',
    action: 'open_technical',
  },
  {
    title: 'Low-Bandwidth & Resilient Architecture',
    category: 'FIELD RESILIENCE',
    description: 'Designed for coastal fishermen, remote agricultural farmers, and emergency field operators with aggressive TTL caching and offline resilience.',
    keyFeature: 'In-Memory Caching • Graceful Degradation',
    recommendedView: 'WIND',
    action: 'none',
  },
  {
    title: 'MoES / IMD Operational Conclusion',
    category: 'SIH 26068 CONCLUSION',
    description: 'WeatherGPT transforms atmospheric science from passive forecasts into active, multilingual, conversational intelligence for India.',
    keyFeature: 'Understand the weather. Predict the impact. Know what to do.',
    recommendedView: 'ORBIT',
    action: 'none',
  },
];

export const MissionModeController: React.FC = () => {
  const {
    isMissionModeOpen,
    setIsMissionModeOpen,
    setViewState,
    setIsModelLabOpen,
    setIsAtmosphereLabOpen,
    setIsClimateMemoryOpen,
    setIsDataDetailsOpen,
  } = useWeather();

  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isAutoPlay, setIsAutoPlay] = useState<boolean>(false);

  const step = MISSION_STEPS[currentStepIndex];

  // Execute step transitions
  const applyStep = (index: number) => {
    setCurrentStepIndex(index);
    const s = MISSION_STEPS[index];
    setViewState(s.recommendedView);

    // Close any previous open modals
    setIsModelLabOpen(false);
    setIsAtmosphereLabOpen(false);
    setIsClimateMemoryOpen(false);
    setIsDataDetailsOpen(false);

    // Open target modal if specified
    if (s.action === 'open_model_lab') setIsModelLabOpen(true);
    if (s.action === 'open_atmosphere_lab') setIsAtmosphereLabOpen(true);
    if (s.action === 'open_climate') setIsClimateMemoryOpen(true);
    if (s.action === 'open_technical') setIsDataDetailsOpen(true);
  };

  useEffect(() => {
    if (!isMissionModeOpen) {
      setIsAutoPlay(false);
      return;
    }
    applyStep(currentStepIndex);
  }, [isMissionModeOpen]);

  // Auto-play timer
  useEffect(() => {
    if (!isAutoPlay || !isMissionModeOpen) return;

    const interval = setInterval(() => {
      const nextIdx = (currentStepIndex + 1) % MISSION_STEPS.length;
      applyStep(nextIdx);
    }, 6000);

    return () => clearInterval(interval);
  }, [isAutoPlay, currentStepIndex, isMissionModeOpen]);

  if (!isMissionModeOpen) return null;

  return (
    <div className="fixed top-20 left-4 z-40 max-w-sm sm:max-w-md w-full bg-[#0F172A]/95 border-2 border-orange-500/50 rounded-3xl shadow-[0_0_50px_rgba(249,115,22,0.3)] backdrop-blur-2xl p-4 sm:p-5 select-none animate-fade-in pointer-events-auto">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400">
            <Flag className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-widest text-orange-400 uppercase">
                SIH MISSION MODE
              </span>
              <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-white/10 text-slate-300">
                {currentStepIndex + 1} / 14
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              PROBLEM STATEMENT 26068 • MoES / IMD
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setIsMissionModeOpen(false);
            setIsModelLabOpen(false);
            setIsAtmosphereLabOpen(false);
            setIsClimateMemoryOpen(false);
            setIsDataDetailsOpen(false);
          }}
          className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Step Content */}
      <div className="space-y-2.5">
        <div className="inline-block px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono font-bold tracking-wider">
          {step.category}
        </div>

        <h3 className="text-base font-bold text-white tracking-tight leading-snug">
          {step.title}
        </h3>

        <p className="text-xs text-slate-300 leading-relaxed font-sans">
          {step.description}
        </p>

        <div className="p-2.5 rounded-xl bg-[#1E293B] border border-white/5 font-mono text-[11px] text-cyan-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
          <span>{step.keyFeature}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-gradient-to-r from-orange-500 to-cyan-400 h-full transition-all duration-300"
          style={{ width: `${((currentStepIndex + 1) / MISSION_STEPS.length) * 100}%` }}
        />
      </div>

      {/* Controls Bar */}
      <div className="mt-4 flex items-center justify-between gap-2 pt-2 border-t border-white/5">
        <button
          onClick={() => setIsAutoPlay(!isAutoPlay)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            isAutoPlay
              ? 'bg-orange-500 text-white'
              : 'bg-[#1E293B] text-slate-300 hover:text-white'
          }`}
        >
          {isAutoPlay ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span>{isAutoPlay ? 'PAUSE TOUR' : 'AUTO TOUR'}</span>
        </button>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              const prevIdx = (currentStepIndex - 1 + MISSION_STEPS.length) % MISSION_STEPS.length;
              applyStep(prevIdx);
            }}
            className="p-1.5 rounded-xl bg-[#1E293B] text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              const nextIdx = (currentStepIndex + 1) % MISSION_STEPS.length;
              applyStep(nextIdx);
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-xs shadow-md shadow-cyan-500/20 transition-all"
          >
            <span>NEXT STEP</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

    </div>
  );
};
