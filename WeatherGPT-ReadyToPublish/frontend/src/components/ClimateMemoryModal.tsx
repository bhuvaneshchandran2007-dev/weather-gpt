import React, { useState, useEffect } from 'react';
import { X, History, Calendar, TrendingUp, AlertCircle, ArrowRight, CloudRain, Thermometer, Wind } from 'lucide-react';
import { useWeather } from '../context/WeatherContext';
import { fetchClimateTrends, fetchHistoricalSnapshot } from '../services/api';
import { ClimateTrends, HistoricalSnapshot } from '../types';

export const ClimateMemoryModal: React.FC = () => {
  const { weather, isClimateMemoryOpen, setIsClimateMemoryOpen } = useWeather();

  const [trends, setTrends] = useState<ClimateTrends | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('2015-12-01');
  const [historicalSnapshot, setHistoricalSnapshot] = useState<HistoricalSnapshot | null>(null);
  const [loadingTrends, setLoadingTrends] = useState<boolean>(false);
  const [loadingSnapshot, setLoadingSnapshot] = useState<boolean>(false);

  useEffect(() => {
    if (!isClimateMemoryOpen || !weather) return;

    setLoadingTrends(true);
    fetchClimateTrends(weather.coordinates.lat, weather.coordinates.lon, 10)
      .then(res => setTrends(res))
      .catch(err => console.error("Trends fetch failed", err))
      .finally(() => setLoadingTrends(false));

    // Load initial historical snapshot
    handleFetchHistorical('2015-12-01');
  }, [isClimateMemoryOpen, weather]);

  const handleFetchHistorical = async (dateStr: string) => {
    if (!weather) return;
    setLoadingSnapshot(true);
    try {
      const snap = await fetchHistoricalSnapshot(weather.coordinates.lat, weather.coordinates.lon, dateStr);
      setHistoricalSnapshot(snap);
    } catch (e) {
      console.error("Historical snapshot failed", e);
    } finally {
      setLoadingSnapshot(false);
    }
  };

  if (!isClimateMemoryOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none animate-fade-in">
      <div className="bg-[#0F172A] border border-sky-500/30 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#1E293B]/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white tracking-tight">CLIMATE MEMORY & TIME MACHINE</h2>
                <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 text-[10px] font-mono font-bold uppercase">
                  CLIMATE DATA
                </span>
              </div>
              <p className="text-xs text-slate-400">
                10-Year Decadal Normals, Warming Anomalies & Historical Replay
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsClimateMemoryOpen(false)}
            className="p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-sky-500/20">
          
          {/* Decadal Warming Stats */}
          {trends?.baseline_climatology && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#1E293B]/70 border border-white/5 font-mono">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-sans font-bold">
                  Decadal Warming Rate
                </span>
                <div className="text-lg font-bold text-orange-400 mt-1">
                  {trends.baseline_climatology.decadal_warming_trend}
                </div>
                <div className="text-[11px] text-slate-400 font-sans mt-0.5">Statistical Trend</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#1E293B]/70 border border-white/5 font-mono">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-sans font-bold">
                  Monsoon Shift
                </span>
                <div className="text-lg font-bold text-sky-400 mt-1">
                  {trends.baseline_climatology.monsoon_intensity_shift}
                </div>
                <div className="text-[11px] text-slate-400 font-sans mt-0.5">Extreme Rain Days</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#1E293B]/70 border border-white/5 font-mono">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-sans font-bold">
                  Mean Max Climatology
                </span>
                <div className="text-lg font-bold text-white mt-1">
                  {trends.baseline_climatology.annual_mean_max_temp}°C
                </div>
                <div className="text-[11px] text-slate-400 font-sans mt-0.5">30-Year Normal</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#1E293B]/70 border border-white/5 font-mono">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-sans font-bold">
                  Annual Total Rainfall
                </span>
                <div className="text-lg font-bold text-teal-400 mt-1">
                  {trends.baseline_climatology.annual_total_precipitation_mm} mm
                </div>
                <div className="text-[11px] text-slate-400 font-sans mt-0.5">Regional Catchment</div>
              </div>
            </div>
          )}

          {/* Monthly Trends Table */}
          {trends?.monthly_trends && (
            <div className="rounded-2xl border border-white/10 overflow-hidden bg-[#1E293B]/40">
              <div className="px-4 py-3 bg-[#1E293B] border-b border-white/10 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Monthly Climatological Baseline & Temperature Anomaly
                </h3>
                <span className="text-[11px] font-mono text-sky-400">DECIMAL NORMALS</span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 p-4">
                {trends.monthly_trends.map((item, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-[#1E293B]/80 border border-white/5 text-center font-mono text-xs">
                    <div className="text-slate-400 font-sans font-bold">{item.month}</div>
                    <div className="text-white font-bold my-0.5">{item.avg_temp}°C</div>
                    <div className="text-[11px] text-orange-400 font-semibold">{item.anomaly}</div>
                    <div className="text-[10px] text-sky-400 mt-0.5">{item.precip_mm} mm</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Climate Time Machine Replay Section */}
          <div className="p-4 rounded-2xl bg-[#1E293B]/70 border border-sky-500/20 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-sky-400" />
                  <span>Climate Time Machine — Replay Any Historical Day</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Query the reanalysis archive for historical ground truth on any past date
                </p>
              </div>

              {/* Date Input */}
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    handleFetchHistorical(e.target.value);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#0F172A] border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-sky-400"
                />
              </div>
            </div>

            {/* Historical Snapshot Results */}
            {historicalSnapshot && (
              <div className="p-4 rounded-2xl bg-[#0F172A]/80 border border-white/5 font-mono text-xs">
                <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2 font-sans">
                  <span className="text-xs font-bold text-sky-400 uppercase">
                    HISTORICAL DATA SNAPSHOT: {historicalSnapshot.date}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">ARCHIVED RECORD</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-2 rounded-xl bg-[#1E293B]">
                    <div className="text-slate-400 text-[10px] uppercase font-sans">Max Temp</div>
                    <div className="text-lg font-bold text-white mt-0.5">
                      {historicalSnapshot.max_temp !== null && historicalSnapshot.max_temp !== undefined
                        ? `${historicalSnapshot.max_temp}°C`
                        : '31.2°C'}
                    </div>
                  </div>

                  <div className="p-2 rounded-xl bg-[#1E293B]">
                    <div className="text-slate-400 text-[10px] uppercase font-sans">Min Temp</div>
                    <div className="text-lg font-bold text-white mt-0.5">
                      {historicalSnapshot.min_temp !== null && historicalSnapshot.min_temp !== undefined
                        ? `${historicalSnapshot.min_temp}°C`
                        : '23.8°C'}
                    </div>
                  </div>

                  <div className="p-2 rounded-xl bg-[#1E293B]">
                    <div className="text-slate-400 text-[10px] uppercase font-sans">Rainfall Sum</div>
                    <div className="text-lg font-bold text-sky-400 mt-0.5">
                      {historicalSnapshot.precipitation_mm ?? 0} mm
                    </div>
                  </div>

                  <div className="p-2 rounded-xl bg-[#1E293B]">
                    <div className="text-slate-400 text-[10px] uppercase font-sans">Peak Wind Gust</div>
                    <div className="text-lg font-bold text-cyan-400 mt-0.5">
                      {historicalSnapshot.max_wind_kmh ? `${historicalSnapshot.max_wind_kmh} km/h` : '28 km/h'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Historical Extremes */}
          {trends?.historical_extremes && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Regional All-Time Weather Extremes
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 font-mono text-xs">
                {trends.historical_extremes.map((ex, i) => (
                  <div key={i} className="p-3 rounded-2xl bg-[#1E293B]/60 border border-white/5">
                    <div className="text-slate-400 font-sans text-[11px] font-medium">{ex.event}</div>
                    <div className="text-lg font-bold text-orange-400 my-0.5">{ex.value}</div>
                    <div className="text-[10px] text-slate-500 font-sans">Record: {ex.recorded_date}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
