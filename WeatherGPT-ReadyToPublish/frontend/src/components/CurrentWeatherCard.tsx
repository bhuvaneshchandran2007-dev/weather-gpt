import React from 'react';
import {
  Thermometer, Droplets, Wind, Gauge, Eye, Cloud,
  Sun, Compass, ShieldAlert, RefreshCw, AlertOctagon, CheckCircle2
} from 'lucide-react';
import { useWeather } from '../context/WeatherContext';
import { useLanguage } from '../context/LanguageContext';

export const CurrentWeatherCard: React.FC = () => {
  const { weather, isLoading, error, refreshWeather } = useWeather();
  const { t } = useLanguage();

  if (error || (!weather && !isLoading)) {
    const diag = error?.diagnostic;
    return (
      <div className="glass-card rounded-2xl p-6 border-red-500/30 bg-red-950/20 text-slate-100 shadow-2xl relative overflow-hidden">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-red-500/20 text-red-400 rounded-xl border border-red-500/30">
            <AlertOctagon className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-red-500/20 text-red-300 border border-red-500/40 tracking-wide uppercase">
                {t('data_unavailable')}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mt-2">
              Unable to Retrieve Real Weather Observation
            </h3>
            <p className="text-sm text-red-200/80 mt-1">
              {diag?.diagnostic_reason || error?.message || "No connection to meteorological data service."}
            </p>

            {diag?.troubleshooting_steps && (
              <div className="mt-4 p-3.5 bg-slate-900/80 rounded-xl border border-white/10">
                <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Troubleshooting Steps:
                </p>
                <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
                  {diag.troubleshooting_steps.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-5 flex items-center gap-3">
              <button
                type="button"
                onClick={() => refreshWeather()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition-all shadow-lg shadow-red-600/20"
              >
                <RefreshCw className="w-4 h-4" />
                Retry Connection
              </button>
              <span className="text-xs text-slate-500 font-mono">
                Code: {diag?.error_code || 'HTTP_503'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading || !weather) {
    return (
      <div className="glass-card rounded-2xl p-6 animate-pulse space-y-4">
        <div className="h-6 bg-slate-800 rounded w-1/3"></div>
        <div className="h-16 bg-slate-800 rounded w-1/2"></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
          <div className="h-14 bg-slate-800 rounded"></div>
          <div className="h-14 bg-slate-800 rounded"></div>
          <div className="h-14 bg-slate-800 rounded"></div>
          <div className="h-14 bg-slate-800 rounded"></div>
        </div>
      </div>
    );
  }

  const cur = weather.current;
  const loc = weather.location;

  return (
    <div className="glass-card glass-card-hover rounded-2xl p-6 text-slate-100 shadow-xl relative overflow-hidden">
      
      {/* Real Data & Freshness Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-4 mb-5">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{t('real_data_badge')}</span>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Source: <strong className="text-slate-200">{weather.data_source}</strong>
          </span>
        </div>
        <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
          <span>Updated: <strong className="text-slate-200">{weather.last_updated}</strong></span>
          <span className="text-slate-600">•</span>
          <span>{weather.freshness_seconds < 60 ? 'Just now' : `${Math.floor(weather.freshness_seconds / 60)}m ago`}</span>
        </div>
      </div>

      {/* Main Temperature and Location Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {loc.name}
            </h2>
            <span className="text-sm text-slate-400 font-medium">
              {loc.state ? `${loc.state}, ` : ''}{loc.country}
            </span>
          </div>
          <p className="text-xs font-mono text-slate-500 mt-0.5">
            Coordinates: {weather.coordinates.lat.toFixed(4)}°N, {weather.coordinates.lon.toFixed(4)}°E
          </p>

          <div className="mt-4 flex items-center gap-4">
            <div className="text-5xl sm:text-6xl font-black tracking-tight text-white font-['JetBrains_Mono']">
              {cur.temp.toFixed(0)}°<span className="text-3xl font-light text-cyan-400">C</span>
            </div>
            <div>
              <div className="text-base font-semibold text-slate-200">
                {cur.condition.description}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {t('feels_like')} <strong className="text-slate-200">{cur.feels_like}°C</strong> • High {cur.temp_max}°C / Low {cur.temp_min}°C
              </div>
            </div>
          </div>
        </div>

        {/* Condition Icon */}
        <div className="flex items-center justify-center md:justify-end">
          <div className="relative p-4 rounded-2xl bg-gradient-to-b from-cyan-500/10 to-blue-600/5 border border-cyan-500/20">
            <img
              src={`https://openweathermap.org/img/wn/${cur.condition.icon}@4x.png`}
              alt={cur.condition.description}
              className="w-24 h-24 sm:w-28 sm:h-28 object-contain drop-shadow-[0_10px_20px_rgba(14,165,233,0.3)]"
            />
          </div>
        </div>
      </div>

      {/* Observation Telemetry Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-5 border-t border-white/10">
        
        {/* Humidity */}
        <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Droplets className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t('humidity')}</span>
          </div>
          <p className="text-lg font-bold text-white mt-1 font-['JetBrains_Mono']">
            {cur.humidity}%
          </p>
        </div>

        {/* Wind */}
        <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Wind className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t('wind')}</span>
          </div>
          <p className="text-lg font-bold text-white mt-1 font-['JetBrains_Mono']">
            {cur.wind_speed} <span className="text-xs font-normal text-slate-400">km/h</span>
          </p>
          {cur.wind_gust && (
            <p className="text-[10px] text-slate-400">Gusts: {cur.wind_gust} km/h</p>
          )}
        </div>

        {/* Pressure */}
        <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Gauge className="w-3.5 h-3.5 text-amber-400" />
            <span>{t('pressure')}</span>
          </div>
          <p className="text-lg font-bold text-white mt-1 font-['JetBrains_Mono']">
            {cur.pressure} <span className="text-xs font-normal text-slate-400">hPa</span>
          </p>
        </div>

        {/* Visibility */}
        <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Eye className="w-3.5 h-3.5 text-purple-400" />
            <span>{t('visibility')}</span>
          </div>
          <p className="text-lg font-bold text-white mt-1 font-['JetBrains_Mono']">
            {(cur.visibility / 1000).toFixed(1)} <span className="text-xs font-normal text-slate-400">km</span>
          </p>
        </div>

        {/* Clouds */}
        <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Cloud className="w-3.5 h-3.5 text-blue-400" />
            <span>Cloud Cover</span>
          </div>
          <p className="text-lg font-bold text-white mt-1 font-['JetBrains_Mono']">
            {cur.clouds}%
          </p>
        </div>

        {/* Air Quality (if available) */}
        <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <ShieldAlert className="w-3.5 h-3.5 text-teal-400" />
            <span>Air Quality</span>
          </div>
          <p className="text-lg font-bold text-white mt-1 font-['JetBrains_Mono']">
            {weather.air_quality ? weather.air_quality.aqi_label : 'Good'}
          </p>
          {weather.air_quality?.pm2_5 && (
            <p className="text-[10px] text-slate-400">PM2.5: {weather.air_quality.pm2_5.toFixed(1)} µg/m³</p>
          )}
        </div>

      </div>
    </div>
  );
};
