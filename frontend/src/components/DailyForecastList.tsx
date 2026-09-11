import React from 'react';
import { Calendar, Droplets, Wind, ChevronRight } from 'lucide-react';
import { useWeather } from '../context/WeatherContext';
import { useLanguage } from '../context/LanguageContext';

export const DailyForecastList: React.FC = () => {
  const { weather, isLoading } = useWeather();
  const { t } = useLanguage();

  if (isLoading || !weather || !weather.daily || weather.daily.length === 0) {
    return null;
  }

  return (
    <div className="glass-card rounded-2xl p-6 text-slate-100 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-extrabold text-white tracking-tight">
            {t('five_day_forecast')}
          </h3>
          <p className="text-xs text-slate-400">
            Synoptic 5-day daily outlook synthesized from meteorological model runs
          </p>
        </div>
        <span className="text-xs font-mono text-slate-500">
          5-Day Model Range
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        {weather.daily.map((day, idx) => (
          <div
            key={day.date}
            className="p-3.5 rounded-xl bg-slate-900/70 border border-white/5 hover:border-cyan-500/30 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white">
                  {idx === 0 ? 'Today' : day.day_name.slice(0, 3)}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {day.date.slice(5)}
                </span>
              </div>

              <div className="my-2 flex items-center justify-center">
                <img
                  src={`https://openweathermap.org/img/wn/${day.condition.icon}@2x.png`}
                  alt={day.condition.description}
                  className="w-12 h-12 object-contain"
                />
              </div>

              <div className="text-center font-semibold text-xs text-slate-300 truncate">
                {day.condition.description}
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-white/5 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">High / Low:</span>
                <span className="font-mono font-bold text-white">
                  {day.temp_max.toFixed(0)}° / <span className="text-cyan-400">{day.temp_min.toFixed(0)}°</span>
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1 text-slate-400">
                  <Droplets className="w-3 h-3 text-cyan-400" /> Rain:
                </span>
                <span className="font-mono text-cyan-300 font-semibold">
                  {Math.round(day.pop_max * 100)}%
                </span>
              </div>

              {day.rain_total_mm > 0 && (
                <div className="text-[10px] text-right font-mono text-blue-400">
                  ~{day.rain_total_mm} mm
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
