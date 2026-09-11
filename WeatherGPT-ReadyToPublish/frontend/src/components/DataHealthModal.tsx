import React, { useState, useEffect } from 'react';
import {
  X, Activity, CheckCircle2, XCircle, AlertCircle,
  Clock, Database, Map, Mic, RefreshCw, Server
} from 'lucide-react';
import { fetchDataHealth } from '../services/api';
import { SystemHealth } from '../types';
import { voiceManager } from '../services/voice';

interface DataHealthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DataHealthModal: React.FC<DataHealthModalProps> = ({ isOpen, onClose }) => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadHealth = async () => {
    setIsLoading(true);
    try {
      const data = await fetchDataHealth();
      setHealth(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadHealth();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const sttSupported = voiceManager.isSpeechRecognitionSupported();
  const ttsSupported = voiceManager.isSpeechSynthesisSupported();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="glass-card rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-white/10 text-slate-100 space-y-5 max-h-[90vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-white tracking-tight flex items-center gap-2">
                System Data Health & API Telemetry
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  SIH 26068
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Live inspection dashboard for Ministry of Earth Sciences (MoES) evaluation
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading || !health ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-cyan-400" />
            <p className="text-xs">Querying system connectors and measuring API latency...</p>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            
            {/* 1. OpenWeather Telemetry */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-cyan-400" />
                  <span className="font-bold text-sm text-white">Weather API Connection (OpenWeather)</span>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                  health.weather_api.is_configured
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-red-500/10 text-red-400 border-red-500/30'
                }`}>
                  {health.weather_api.status}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px] text-slate-300">
                <div className="p-2 bg-slate-950/60 rounded-lg">
                  <span className="text-slate-500 block text-[10px]">PING LATENCY</span>
                  <strong className="text-cyan-300">{health.weather_api.latency_ms} ms</strong>
                </div>
                <div className="p-2 bg-slate-950/60 rounded-lg">
                  <span className="text-slate-500 block text-[10px]">HTTP STATUS</span>
                  <strong className={health.weather_api.http_code === 200 ? 'text-emerald-400' : 'text-amber-400'}>
                    {health.weather_api.http_code || 'None'}
                  </strong>
                </div>
                <div className="p-2 bg-slate-950/60 rounded-lg">
                  <span className="text-slate-500 block text-[10px]">CACHE ENTRIES</span>
                  <strong className="text-white">{health.weather_api.cached_locations_count}</strong>
                </div>
                <div className="p-2 bg-slate-950/60 rounded-lg">
                  <span className="text-slate-500 block text-[10px]">LAST CHECK</span>
                  <span className="text-[10px] text-slate-300">{health.weather_api.last_check}</span>
                </div>
              </div>

              {/* Supported endpoints checklist */}
              <div className="space-y-1.5 pt-2 border-t border-white/5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Connected Forecast Endpoints:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {health.weather_api.supported_endpoints.map((ep, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-slate-300 text-[11px]">
                      {ep.available ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      )}
                      <span>{ep.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transparent unavailable features */}
              {health.weather_api.unavailable_endpoints.length > 0 && (
                <div className="p-2.5 bg-slate-950/80 rounded-lg border border-white/5 text-[11px] text-slate-400 space-y-1">
                  <span className="text-[10px] font-bold text-slate-300 uppercase">
                    Unconnected Features (Gracefully Handled):
                  </span>
                  {health.weather_api.unavailable_endpoints.map((un, idx) => (
                    <p key={idx} className="italic text-[10px]">
                      • {un.name}: {un.reason}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* 2. GIS Map Engine */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Map className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-sm text-white">GIS Mapping Engine</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  {health.google_maps.engine_in_use}
                </span>
              </div>
              <p className="text-slate-400 text-[11px]">
                {health.google_maps.notice}
              </p>
            </div>

            {/* 3. Conversational AI Agent */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-400" />
                  <span className="font-bold text-sm text-white">Conversational AI Engine</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {health.conversational_ai.local_meteorological_agent}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 font-mono text-[11px] text-slate-300">
                <div className="p-2 bg-slate-950/60 rounded-lg">
                  <span className="text-slate-500 block text-[10px]">LANGUAGES</span>
                  <strong className="text-cyan-300">{health.conversational_ai.supported_languages_count} + Tanglish/Hinglish</strong>
                </div>
                <div className="p-2 bg-slate-950/60 rounded-lg">
                  <span className="text-slate-500 block text-[10px]">PROFESSIONS</span>
                  <strong className="text-cyan-300">{health.conversational_ai.supported_professions_count} Profiles</strong>
                </div>
                <div className="p-2 bg-slate-950/60 rounded-lg">
                  <span className="text-slate-500 block text-[10px]">TOOL CALLING</span>
                  <strong className="text-emerald-400">Grounded Real APIs</strong>
                </div>
              </div>
            </div>

            {/* 4. Voice Hardware & Browser Capabilities */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-sm text-white">Voice AI Capabilities (Client Hardware)</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  ACTIVE
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center gap-2 text-slate-300">
                  {sttSupported ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 text-red-400" />}
                  <span>Speech-to-Text: {sttSupported ? 'Web Speech API Available' : 'Unsupported Browser'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  {ttsSupported ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 text-red-400" />}
                  <span>Text-to-Speech: {ttsSupported ? 'SpeechSynthesis Ready' : 'Unsupported'}</span>
                </div>
              </div>
            </div>

            {/* 5. Database */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-400" />
                <span className="font-bold text-sm text-white">Crowd Reports Database</span>
              </div>
              <div className="flex items-center gap-2 font-mono text-[11px] text-slate-300">
                <span>{health.database.type}</span>
                <span className="text-emerald-400 font-bold">• {health.database.status}</span>
              </div>
            </div>

          </div>
        )}

        <div className="flex justify-between items-center pt-3 border-t border-white/10 text-xs">
          <span className="text-slate-500 font-mono">
            {health?.problem_statement}
          </span>
          <button
            type="button"
            onClick={loadHealth}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Re-check Connectivity</span>
          </button>
        </div>

      </div>
    </div>
  );
};
