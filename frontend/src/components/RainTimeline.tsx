import React from 'react';
import {
  CloudRain, Clock, Sun, Navigation,
  AlertCircle, ShieldCheck, Sparkles, Umbrella
} from 'lucide-react';
import { useWeather } from '../context/WeatherContext';
import { useLanguage } from '../context/LanguageContext';

export const RainTimeline: React.FC = () => {
  const { weather, isLoading } = useWeather();
  const { t } = useLanguage();

  if (isLoading || !weather) {
    return null;
  }

  const rain = weather.rain_intelligence;
  const timeline = rain.timeline || [];

  const getIntensityBadge = (intensity: string) => {
    switch (intensity) {
      case 'Torrential':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'Heavy':
        return 'bg-red-500/20 text-red-300 border-red-500/40';
      case 'Moderate':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'Light':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'Trace':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6 text-slate-100 shadow-xl border border-cyan-500/20 relative overflow-hidden">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <CloudRain className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
              {t('rain_timeline_title')}
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase">
                Dynamic
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Hour-by-hour precipitation likelihood and optimal movement windows
            </p>
          </div>
        </div>

        {/* Rain Likelihood Pill */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Likelihood:</span>
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
            rain.rain_likelihood === 'High' || rain.rain_likelihood === 'Very High'
              ? 'bg-red-500/20 text-red-300 border-red-500/40'
              : rain.rain_likelihood === 'Moderate'
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
          }`}>
            {rain.rain_likelihood} ({rain.max_pop_pct}%)
          </span>
        </div>
      </div>

      {/* Primary Key Windows */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        
        {/* Rain Window */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-white/5 flex items-start gap-3">
          <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
            <Umbrella className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider">
              {t('rain_window')}
            </span>
            <p className="text-sm font-bold text-white mt-0.5">
              {rain.rain_window || 'No significant rain expected'}
            </p>
            {rain.total_rain_expected_mm > 0 && (
              <p className="text-xs text-cyan-400 mt-1 font-mono">
                Accumulation: ~{rain.total_rain_expected_mm} mm
              </p>
            )}
          </div>
        </div>

        {/* Dry Window */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-white/5 flex items-start gap-3">
          <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
            <Sun className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider">
              {t('dry_window')}
            </span>
            <p className="text-sm font-bold text-white mt-0.5">
              {rain.dry_window || 'Dry throughout the day'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Favorable for drying & outdoor tasks
            </p>
          </div>
        </div>

        {/* Best Travel Window */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-white/5 flex items-start gap-3">
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider">
              {t('safest_travel')}
            </span>
            <p className="text-sm font-bold text-white mt-0.5">
              {rain.safest_travel_window || 'All upcoming hours clear'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Minimal slick pavement hazard
            </p>
          </div>
        </div>

      </div>

      {/* Dynamic Hour-by-Hour Timeline Visualization */}
      <div className="mt-4">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center justify-between">
          <span>Hourly Precipitation Progression</span>
          <span className="text-[11px] font-normal text-slate-500">Real Forecast Telemetry</span>
        </h4>

        {/* Timeline Scroll Container */}
        <div className="overflow-x-auto pb-3 pt-1">
          <div className="flex items-center gap-2 min-w-max">
            {timeline.map((item, idx) => (
              <div
                key={idx}
                className={`flex flex-col items-center p-3 rounded-xl border transition-all ${
                  item.is_rain_likely
                    ? 'bg-blue-950/40 border-cyan-500/40 shadow-lg shadow-cyan-500/10'
                    : 'bg-slate-900/60 border-white/5 hover:border-white/20'
                }`}
                style={{ width: '92px' }}
              >
                <span className="text-xs font-bold text-slate-200">
                  {item.time_label}
                </span>

                <img
                  src={`https://openweathermap.org/img/wn/${item.icon}.png`}
                  alt={item.condition}
                  className="w-10 h-10 my-1 object-contain"
                />

                {/* Pop indicator bar */}
                <div className="w-full bg-slate-800 rounded-full h-1.5 my-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      item.pop_pct >= 60 ? 'bg-cyan-400' : item.pop_pct >= 30 ? 'bg-blue-500' : 'bg-slate-600'
                    }`}
                    style={{ width: `${item.pop_pct}%` }}
                  ></div>
                </div>

                <span className="text-xs font-bold text-cyan-300 font-['JetBrains_Mono']">
                  {item.pop_pct}%
                </span>

                <span className={`mt-1.5 px-2 py-0.5 rounded text-[10px] font-semibold border ${getIntensityBadge(item.intensity)}`}>
                  {item.intensity}
                </span>

                {item.rain_mm > 0 && (
                  <span className="text-[10px] font-mono text-slate-400 mt-1">
                    {item.rain_mm} mm
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Model Step & Precision Disclaimer (Section 4 Compliance) */}
      <div className="mt-4 pt-3 border-t border-white/5 flex items-start gap-2 text-[11px] text-slate-400">
        <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <span>
          <strong>Scientific Precision Note:</strong> {rain.precision_note}
        </span>
      </div>

    </div>
  );
};
