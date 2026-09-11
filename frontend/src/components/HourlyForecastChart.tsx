import React from 'react';
import {
  ResponsiveContainer, ComposedChart, Line, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from 'recharts';
import { useWeather } from '../context/WeatherContext';
import { useLanguage } from '../context/LanguageContext';

export const HourlyForecastChart: React.FC = () => {
  const { weather, isLoading } = useWeather();
  const { t } = useLanguage();

  if (isLoading || !weather || !weather.hourly || weather.hourly.length === 0) {
    return null;
  }

  // Map first 16 intervals (~48 hours)
  const chartData = weather.hourly.slice(0, 16).map(item => ({
    time: item.time_label,
    temp: item.temp,
    pop: Math.round(item.pop * 100),
    rain: item.rain_volume_mm,
    humidity: item.humidity,
    wind: item.wind_speed,
    condition: item.condition.description
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 border border-white/10 rounded-xl p-3 shadow-2xl text-xs font-mono space-y-1">
          <p className="font-bold text-white font-sans text-sm mb-1">{label} Forecast</p>
          <p className="text-amber-400">Temperature: <strong className="text-white">{data.temp}°C</strong></p>
          <p className="text-cyan-400">Precipitation Chance: <strong className="text-white">{data.pop}%</strong></p>
          {data.rain > 0 && (
            <p className="text-blue-400">Rainfall: <strong className="text-white">{data.rain} mm</strong></p>
          )}
          <p className="text-slate-400">Wind: {data.wind} km/h • Humidity: {data.humidity}%</p>
          <p className="text-slate-300 font-sans italic mt-1">{data.condition}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-card rounded-2xl p-6 text-slate-100 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-extrabold text-white tracking-tight">
            {t('hourly_forecast')}
          </h3>
          <p className="text-xs text-slate-400">
            Temperature trends and precipitation probability over the next 48 hours
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span className="text-slate-300">Temp (°C)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
            <span className="text-slate-300">Rain Prob (%)</span>
          </div>
        </div>
      </div>

      <div className="w-full h-64 mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="time"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
            />
            {/* Left Axis: Temperature */}
            <YAxis
              yAxisId="left"
              stroke="#fbbf24"
              fontSize={11}
              domain={['dataMin - 2', 'dataMax + 2']}
              tickFormatter={(v) => `${Math.round(v)}°`}
            />
            {/* Right Axis: Rain Probability */}
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#38bdf8"
              fontSize={11}
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Precipitation Bar */}
            <Bar
              yAxisId="right"
              dataKey="pop"
              fill="#0284c7"
              radius={[4, 4, 0, 0]}
              opacity={0.65}
              maxBarSize={28}
            />

            {/* Temperature Smooth Line */}
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="temp"
              stroke="#fbbf24"
              strokeWidth={3}
              dot={{ fill: '#fbbf24', r: 3 }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
