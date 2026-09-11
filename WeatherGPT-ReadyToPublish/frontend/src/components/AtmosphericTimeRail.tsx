import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Clock, CloudRain, Sun, Wind, ChevronRight } from 'lucide-react';
import { useWeather } from '../context/WeatherContext';
import { TimeRailStep } from '../types';

const TIME_STEPS: { id: TimeRailStep; label: string; offsetHours: number }[] = [
  { id: 'PAST', label: 'Past 1h', offsetHours: -1 },
  { id: 'NOW', label: 'NOW', offsetHours: 0 },
  { id: '+15m', label: '+15m', offsetHours: 0.25 },
  { id: '+30m', label: '+30m', offsetHours: 0.5 },
  { id: '+45m', label: '+45m', offsetHours: 0.75 },
  { id: '+1h', label: '+1 Hour', offsetHours: 1 },
  { id: '+3h', label: '+3 Hours', offsetHours: 3 },
  { id: '+6h', label: '+6 Hours', offsetHours: 6 },
  { id: '+12h', label: '+12 Hours', offsetHours: 12 },
  { id: '+24h', label: '+24 Hours', offsetHours: 24 },
];

export const AtmosphericTimeRail: React.FC = () => {
  const { weather, timeRailStep, setTimeRailStep } = useWeather();
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Auto-play timeline simulation
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setTimeRailStep((prev: TimeRailStep) => {
        const idx = TIME_STEPS.findIndex((s) => s.id === prev);
        const nextIdx = (idx + 1) % TIME_STEPS.length;
        return TIME_STEPS[nextIdx].id;
      });
    }, 1800);

    return () => clearInterval(interval);
  }, [isPlaying, setTimeRailStep]);

  // Derive contextual weather prediction for current step
  const currentStepData = TIME_STEPS.find((s) => s.id === timeRailStep) || TIME_STEPS[1];
  const hourlyItems = weather?.hourly || [];
  const rainTimelineItems = weather?.rain_intelligence?.timeline || [];

  const getStepMetrics = (offset: number) => {
    if (offset <= 0) {
      return {
        temp: weather?.current?.temp ?? 28,
        pop: weather?.rain_intelligence?.max_pop_pct ?? 10,
        rainMm: weather?.rain_intelligence?.total_rain_expected_mm ?? 0,
        wind: weather?.current?.wind_speed ?? 12,
      };
    }
    const targetHourIdx = Math.min(hourlyItems.length - 1, Math.max(0, Math.floor(offset / 3)));
    const targetItem = hourlyItems[targetHourIdx];
    return {
      temp: targetItem ? targetItem.temp : (weather?.current?.temp ?? 28),
      pop: targetItem ? Math.round(targetItem.pop * 100) : 15,
      rainMm: targetItem ? targetItem.rain_volume_mm : 0,
      wind: targetItem ? targetItem.wind_speed : 12,
    };
  };

  const activeMetrics = getStepMetrics(currentStepData.offsetHours);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 px-3 sm:px-6 pb-3 pt-2 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/90 to-transparent pointer-events-auto select-none">
      <div className="max-w-6xl mx-auto rounded-2xl bg-[#0F172A]/95 border border-white/10 shadow-2xl backdrop-blur-2xl p-2 sm:p-3">
        
        {/* Top Control Bar */}
        <div className="flex items-center justify-between gap-2 mb-2 px-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all shadow-md ${
                isPlaying
                  ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20'
                  : 'bg-cyan-500 hover:bg-cyan-600 text-white shadow-cyan-500/20'
              }`}
              title={isPlaying ? "Pause Forecast Simulation" : "Auto-Advance Time Horizon"}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? 'PAUSE TIMELINE' : 'SIMULATE FORWARD'}</span>
            </button>

            <button
              onClick={() => {
                setIsPlaying(false);
                setTimeRailStep('NOW');
              }}
              className="p-1.5 rounded-lg bg-[#1E293B] text-slate-300 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
              title="Reset to Present Observation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Active Time Step Summary Badge */}
          <div className="flex items-center gap-3 text-xs">
            <div className="hidden sm:flex items-center gap-1 text-slate-300">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-semibold text-cyan-300">{currentStepData.label}</span>
            </div>

            <div className="flex items-center gap-2 bg-[#1E293B]/80 px-2.5 py-1 rounded-lg border border-white/5 font-mono text-xs">
              <span className="text-white font-bold">{activeMetrics.temp.toFixed(1)}°C</span>
              <span className="text-slate-500">|</span>
              <div className="flex items-center gap-1 text-sky-400">
                <CloudRain className="w-3 h-3" />
                <span>{activeMetrics.pop}%</span>
              </div>
              <span className="text-slate-500">|</span>
              <div className="flex items-center gap-1 text-slate-300">
                <Wind className="w-3 h-3 text-cyan-400" />
                <span>{activeMetrics.wind} km/h</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Time Step Buttons Rail */}
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-cyan-500/20">
          {TIME_STEPS.map((step) => {
            const isSelected = timeRailStep === step.id;
            const metrics = getStepMetrics(step.offsetHours);

            return (
              <button
                key={step.id}
                onClick={() => {
                  setIsPlaying(false);
                  setTimeRailStep(step.id);
                }}
                className={`flex-1 min-w-[72px] sm:min-w-[85px] py-1.5 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-b from-cyan-500/30 to-[#1E293B] border-cyan-400 ring-2 ring-cyan-400/40 text-white shadow-lg shadow-cyan-500/20'
                    : 'bg-[#1E293B]/60 border-white/5 text-slate-400 hover:text-slate-200 hover:bg-[#1E293B] hover:border-white/10'
                }`}
              >
                <div className="text-[11px] font-bold tracking-tight mb-0.5">
                  {step.label}
                </div>

                <div className="flex items-center justify-center gap-1 text-[10px] font-mono">
                  <span className={isSelected ? 'text-white font-bold' : 'text-slate-300'}>
                    {metrics.temp.toFixed(0)}°
                  </span>
                  {metrics.pop > 20 && (
                    <span className="text-sky-400 font-semibold">
                      {metrics.pop}%
                    </span>
                  )}
                </div>

                {/* Rain probability bar indicator */}
                <div className="mt-1 w-full bg-slate-700/50 rounded-full h-1 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      metrics.pop > 60
                        ? 'bg-orange-500'
                        : metrics.pop > 30
                        ? 'bg-sky-400'
                        : 'bg-slate-500'
                    }`}
                    style={{ width: `${Math.max(8, metrics.pop)}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
};
