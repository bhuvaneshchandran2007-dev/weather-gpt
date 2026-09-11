import React from 'react';
import {
  Briefcase, CheckCircle, Clock, AlertCircle,
  ExternalLink, ShieldCheck, Sun, ChevronRight
} from 'lucide-react';
import { useWeather, PROFESSIONS } from '../context/WeatherContext';
import { useLanguage } from '../context/LanguageContext';

export const ProfessionAdvisoryCard: React.FC = () => {
  const { professionAdvisory, currentProfession, setProfession, isLoading } = useWeather();
  const { t } = useLanguage();

  if (isLoading || !professionAdvisory) {
    return null;
  }

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'Critical': return 'bg-red-500/20 text-red-300 border-red-500/40';
      case 'High': return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
      case 'Moderate': return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default: return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6 text-slate-100 shadow-xl border border-white/10">
      
      {/* Header with Profession Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/30">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white tracking-tight">
              {t('profession_advisory_title')}
            </h3>
            <p className="text-xs text-slate-400">
              Personalized decision support tailored to your domain operations
            </p>
          </div>
        </div>

        {/* Profile Switcher */}
        <div className="flex items-center gap-2">
          <select
            value={currentProfession}
            onChange={(e) => setProfession(e.target.value)}
            className="px-3 py-1.5 bg-slate-900 border border-white/10 rounded-xl text-xs font-semibold text-cyan-300 hover:border-cyan-500/40 focus:outline-none cursor-pointer"
          >
            {PROFESSIONS.map(p => (
              <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">
                {p.name}
              </option>
            ))}
          </select>
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getRiskBadge(professionAdvisory.risk_level)}`}>
            {professionAdvisory.risk_level} Risk
          </span>
        </div>
      </div>

      {/* Summary */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-white/5 mb-5">
        <p className="text-sm font-semibold text-slate-200 leading-relaxed">
          {professionAdvisory.summary}
        </p>
      </div>

      {/* Impact Points & Recommended Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        
        {/* Impacts */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Operational Impacts</span>
          </h4>
          <div className="space-y-1.5">
            {professionAdvisory.impact_analysis.map((imp, idx) => (
              <div key={idx} className="p-2.5 rounded-lg bg-slate-900/60 border border-white/5 text-xs text-slate-300">
                • {imp}
              </div>
            ))}
          </div>
        </div>

        {/* Action Checklist */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Recommended Action Steps</span>
          </h4>
          <div className="space-y-1.5">
            {professionAdvisory.action_recommendations.map((act, idx) => (
              <div key={idx} className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-xs text-emerald-200/90 font-medium">
                ✓ {act}
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Operational Windows */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-white/10 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>
            <strong>Optimal Window:</strong> {professionAdvisory.best_time_window || 'Continuous operations suitable'}
          </span>
        </div>
        {professionAdvisory.avoidance_window && (
          <div className="flex items-center gap-2 text-amber-300">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Avoidance Window:</strong> {professionAdvisory.avoidance_window}
            </span>
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <p className="text-[11px] text-slate-500 italic mt-3 pt-3 border-t border-white/5">
        {professionAdvisory.disclaimer}
      </p>

    </div>
  );
};
