import React, { useState, useEffect } from 'react';
import {
  ShieldAlert, AlertTriangle, Users, PlusCircle,
  Clock, MapPin, CheckCircle2, Info
} from 'lucide-react';
import { useWeather } from '../context/WeatherContext';
import { useLanguage } from '../context/LanguageContext';
import { fetchCommunityReports } from '../services/api';
import { CommunityReport } from '../types';
import { CommunityReportModal } from './CommunityReportModal';

export const AlertCenter: React.FC = () => {
  const { weather, riskAssessment } = useWeather();
  const { t } = useLanguage();

  const [activeSubTab, setActiveSubTab] = useState<'official' | 'ai_risk' | 'community'>('official');
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    fetchCommunityReports()
      .then(data => setReports(data))
      .catch(err => console.error(err));
  }, []);

  const handleReportSubmitted = (newRep: CommunityReport) => {
    setReports(prev => [newRep, ...prev]);
    setActiveSubTab('community');
  };

  const officialAlerts = weather?.official_alerts || [];

  return (
    <div className="glass-card rounded-2xl p-6 text-slate-100 shadow-xl border border-white/10 space-y-6">
      
      {/* Title & Classification Notice (Section 23 Compliance) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <h3 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-400" />
            <span>Disaster Warning & Alert Center</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Strict separation of verified meteorological authority warnings from AI prototype risk estimates
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-bold transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{t('submit_report')}</span>
        </button>
      </div>

      {/* Sub-tab Switcher */}
      <div className="flex items-center gap-2 border-b border-white/5 pb-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('official')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'official'
              ? 'bg-red-500 text-white shadow-md shadow-red-500/20'
              : 'text-slate-400 hover:text-white bg-slate-900/60'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Official Warnings ({officialAlerts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('ai_risk')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'ai_risk'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'text-slate-400 hover:text-white bg-slate-900/60'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>AI Risk Estimates ({riskAssessment?.compound_hazards?.length || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('community')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'community'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white bg-slate-900/60'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Field Reports ({reports.length})</span>
        </button>
      </div>

      {/* 1. Official Meteorological Warnings */}
      {activeSubTab === 'official' && (
        <div className="space-y-4">
          <div className="p-3 bg-slate-900/80 rounded-xl border border-white/5 text-xs text-slate-400 flex items-start gap-2">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>
              Official warnings reflect bulletins from the India Meteorological Department (IMD) or national meteorological feeds. AI predictions are never merged with official notices.
            </span>
          </div>

          {officialAlerts.length > 0 ? (
            <div className="space-y-3">
              {officialAlerts.map((alert, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-red-200">{alert.event}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/40 uppercase">
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-slate-200">{alert.description}</p>
                  <div className="text-[11px] text-slate-400 font-mono pt-2 border-t border-red-500/20">
                    Source: <strong className="text-white">{alert.source}</strong> ({alert.sender_name})
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center rounded-xl bg-slate-900/40 border border-white/5 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h4 className="text-sm font-bold text-white">No Active Official Warnings</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                No severe meteorological warnings have been triggered by the connected observation authority for {weather?.location.name || 'this location'}.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 2. AI Risk Estimates */}
      {activeSubTab === 'ai_risk' && (
        <div className="space-y-4">
          <div className="p-3 bg-purple-950/20 border border-purple-500/30 rounded-xl text-xs text-purple-200">
            <strong>Classification: AI WEATHER RISK ESTIMATE</strong> — Computed dynamically from real precipitation, wind, and thermal indices. Not an official bulletin.
          </div>

          {riskAssessment && riskAssessment.compound_hazards.length > 0 ? (
            <div className="space-y-3">
              {riskAssessment.compound_hazards.map((hazard, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-900/80 border border-purple-500/30 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white">{hazard.hazard_title}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 uppercase">
                      {hazard.severity} Risk
                    </span>
                  </div>
                  <p className="text-slate-300">{hazard.rationale}</p>
                  <div className="pt-2 border-t border-white/5 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Precautionary Guidance:</span>
                    <ul className="list-disc list-inside text-slate-300">
                      {hazard.recommended_precautions.map((p, pIdx) => (
                        <li key={pIdx}>{p}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center rounded-xl bg-slate-900/40 border border-white/5 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h4 className="text-sm font-bold text-white">Compound Atmospheric Risks Minimal</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                No compound hazards (e.g. wind-driven rain, severe heat stress) exceed warning thresholds in the current forecast period.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 3. Community Reports */}
      {activeSubTab === 'community' && (
        <div className="space-y-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-200">
            <strong>Notice: UNVERIFIED COMMUNITY REPORT</strong> — Submitted by field users. These reports are unverified and assist situational awareness during local downpours.
          </div>

          {reports.length > 0 ? (
            <div className="space-y-3">
              {reports.map((rep) => (
                <div key={rep.id} className="p-4 rounded-xl bg-slate-900/80 border border-amber-500/20 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{rep.report_type}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                        {rep.verification_label}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400">{rep.created_at}</span>
                  </div>
                  <p className="text-slate-300">{rep.description}</p>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono pt-1 border-t border-white/5">
                    <MapPin className="w-3 h-3 text-cyan-400" />
                    <span>{rep.location_name} ({rep.lat.toFixed(2)}°, {rep.lon.toFixed(2)}°) • Severity: <strong className="text-white">{rep.severity}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center rounded-xl bg-slate-900/40 border border-white/5 space-y-2">
              <Users className="w-10 h-10 text-slate-500 mx-auto" />
              <h4 className="text-sm font-bold text-white">No Field Reports Submitted Yet</h4>
              <p className="text-xs text-slate-400">
                Witnessing waterlogging or fallen branches? Click "Submit Field Report" to inform the community.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      <CommunityReportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onReportSubmitted={handleReportSubmitted}
      />

    </div>
  );
};
