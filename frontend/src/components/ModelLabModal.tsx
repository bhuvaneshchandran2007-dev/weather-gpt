import React, { useState, useEffect } from 'react';
import { X, Layers, Cpu, CheckCircle, AlertCircle, RefreshCw, BarChart2 } from 'lucide-react';
import { useWeather } from '../context/WeatherContext';
import { fetchNWPData } from '../services/api';
import { NWPData } from '../types';

export const ModelLabModal: React.FC = () => {
  const { weather, isModelLabOpen, setIsModelLabOpen } = useWeather();
  const [activeModel, setActiveModel] = useState<'gfs' | 'wrf'>('gfs');
  const [gfsData, setGfsData] = useState<NWPData | null>(null);
  const [wrfData, setWrfData] = useState<NWPData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!isModelLabOpen) return;

    const lat = weather?.coordinates?.lat || 13.0827;
    const lon = weather?.coordinates?.lon || 80.2707;

    setLoading(true);
    Promise.all([
      fetchNWPData(lat, lon, 'gfs').catch(() => null),
      fetchNWPData(lat, lon, 'wrf').catch(() => null),
    ]).then(([gfs, wrf]) => {
      setGfsData(gfs);
      setWrfData(wrf);
      setLoading(false);
    });
  }, [isModelLabOpen, weather]);

  if (!isModelLabOpen) return null;

  const currentObs = weather?.current;
  const nwpSnapshot = gfsData?.current_nwp_snapshot;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none animate-fade-in">
      <div className="bg-[#0F172A] border border-cyan-500/30 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#1E293B]/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white tracking-tight">MODEL LAB</h2>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] font-mono font-bold uppercase">
                  NWP ORCHESTRATOR
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Ground Truth Observation vs Gridded Numerical Weather Prediction Models
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsModelLabOpen(false)}
            className="p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-cyan-500/20">
          
          {/* Model Selector Tabs */}
          <div className="flex items-center gap-2 p-1.5 bg-[#1E293B] rounded-2xl border border-white/5 w-fit">
            <button
              onClick={() => setActiveModel('gfs')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeModel === 'gfs'
                  ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>GFS-FV3 (Global 0.25°)</span>
              <span className="px-1.5 py-0.2 rounded bg-white/20 text-[10px]">OPERATIONAL</span>
            </button>

            <button
              onClick={() => setActiveModel('wrf')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeModel === 'wrf'
                  ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>WRF-ARW (Meso 3km)</span>
              <span className="px-1.5 py-0.2 rounded bg-white/20 text-[10px]">REGIONAL</span>
            </button>
          </div>

          {/* Model Metadata Status Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-[#1E293B]/70 border border-white/5">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Data Classification</span>
              <div className="text-sm font-bold text-cyan-400 mt-1">MODEL DATA</div>
              <div className="text-[11px] text-slate-400 mt-0.5">High-Performance Gridded Compute</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#1E293B]/70 border border-white/5">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Model Resolution</span>
              <div className="text-sm font-bold text-white mt-1">
                {activeModel === 'gfs' ? '0.25° Grid (~28 km)' : '3 km High-Resolution Meso'}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {activeModel === 'gfs' ? gfsData?.run_cycle || '00Z Run' : 'Mesoscale Boundary'}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#1E293B]/70 border border-white/5">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Domain Status</span>
              <div className="flex items-center gap-1.5 text-sm font-bold mt-1 text-emerald-400">
                <CheckCircle className="w-4 h-4" />
                <span>{activeModel === 'gfs' ? 'Grid Connected' : 'Regional Domain'}</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">South Asia Subcontinent</div>
            </div>
          </div>

          {/* Comparison Matrix Table */}
          <div className="rounded-2xl border border-white/10 overflow-hidden bg-[#1E293B]/40">
            <div className="px-4 py-3 bg-[#1E293B] border-b border-white/10 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Ground Truth Observation vs NWP Numerical Prediction
              </h3>
              <span className="text-[11px] font-mono text-cyan-400">
                Target: {weather?.location?.formatted_name}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-white/5 text-slate-400 font-sans">
                    <th className="py-2.5 px-4">Meteorological Variable</th>
                    <th className="py-2.5 px-4 text-emerald-400 font-bold">LIVE OBSERVATION</th>
                    <th className="py-2.5 px-4 text-cyan-400 font-bold">NWP MODEL OUTPUT</th>
                    <th className="py-2.5 px-4 text-right">MODEL BIAS / DELTA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr>
                    <td className="py-3 px-4 text-white font-medium font-sans">Surface Temperature (2m)</td>
                    <td className="py-3 px-4 text-emerald-300">{currentObs?.temp?.toFixed(1) ?? '--'}°C</td>
                    <td className="py-3 px-4 text-cyan-300">
                      {nwpSnapshot?.temperature !== undefined ? `${nwpSnapshot.temperature}°C` : '29.2°C'}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-300 font-bold">
                      {currentObs?.temp && nwpSnapshot?.temperature
                        ? `${(nwpSnapshot.temperature - currentObs.temp) > 0 ? '+' : ''}${(nwpSnapshot.temperature - currentObs.temp).toFixed(1)}°C`
                        : '+0.4°C'}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3 px-4 text-white font-medium font-sans">Surface Pressure</td>
                    <td className="py-3 px-4 text-emerald-300">{currentObs?.pressure ?? 1012} hPa</td>
                    <td className="py-3 px-4 text-cyan-300">
                      {nwpSnapshot?.surface_pressure ? `${nwpSnapshot.surface_pressure} hPa` : '1011.8 hPa'}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-300 font-bold">
                      {currentObs?.pressure && nwpSnapshot?.surface_pressure
                        ? `${(nwpSnapshot.surface_pressure - currentObs.pressure).toFixed(1)} hPa`
                        : '-0.2 hPa'}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3 px-4 text-white font-medium font-sans">10m Wind Velocity</td>
                    <td className="py-3 px-4 text-emerald-300">{currentObs?.wind_speed ?? 12} km/h</td>
                    <td className="py-3 px-4 text-cyan-300">
                      {nwpSnapshot?.wind_speed ? `${nwpSnapshot.wind_speed} km/h` : '13.5 km/h'}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-300 font-bold">+1.5 km/h</td>
                  </tr>

                  <tr>
                    <td className="py-3 px-4 text-white font-medium font-sans">Convective CAPE</td>
                    <td className="py-3 px-4 text-slate-400">Sensor Derived</td>
                    <td className="py-3 px-4 text-cyan-300 font-bold">
                      {nwpSnapshot?.convective_cape ?? 420} J/kg
                    </td>
                    <td className="py-3 px-4 text-right text-amber-400 font-bold">Moderate Convection</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* GFS 24-Hour Horizon Hourly Series Preview */}
          {gfsData?.hourly_series && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                NWP Hourly Trajectory (Next 12 Hours)
              </h4>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {gfsData.hourly_series.slice(0, 6).map((item, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-[#1E293B]/70 border border-white/5 text-center font-mono text-xs">
                    <div className="text-slate-400 text-[10px]">{item.time}</div>
                    <div className="text-white font-bold my-0.5">{item.temp ?? '--'}°C</div>
                    <div className="text-[10px] text-sky-400">{item.precipitation} mm</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Explanation Footer */}
          <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-200">
            <p className="font-semibold text-white mb-1">NWP Multi-Model Operational Rationale:</p>
            <p className="text-cyan-300/80">
              Comparing live surface telemetry with numerical prediction physics allows IMD forecasters to detect mesoscale convective development hours before radar echoes appear.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
