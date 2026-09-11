import React, { useState } from 'react';
import {
  ShieldAlert, AlertTriangle, Info, ChevronDown,
  ChevronUp, Flame, Wind, Droplets, Eye, Zap, Car, Activity
} from 'lucide-react';
import { useWeather } from '../context/WeatherContext';
import { useLanguage } from '../context/LanguageContext';

export const AiRiskGauge: React.FC = () => {
  const { riskAssessment, isLoading } = useWeather();
  const { t } = useLanguage();
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  if (isLoading || !riskAssessment) {
    return null;
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Rain Risk': return Droplets;
      case 'Wind Risk': return Wind;
      case 'Heat Risk': return Flame;
      case 'Visibility Risk': return Eye;
      case 'Storm Risk': return Zap;
      case 'Travel Weather Risk': return Car;
      default: return Activity;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Critical': return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'High': return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
      case 'Moderate': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'Low': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      default: return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
    }
  };

  const toggleExpand = (cat: string) => {
    setExpandedCategory(expandedCategory === cat ? null : cat);
  };

  return (
    <div className="glass-card rounded-2xl p-6 text-slate-100 shadow-xl border border-white/10">
      
      {/* Title & Official Warning Separation Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-extrabold text-white tracking-tight">
              {t('ai_risk_title')}
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Prototype Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time algorithmic risk quantification across 7 hazard vectors
          </p>
        </div>

        {/* Overall Score */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Overall Risk</span>
            <div className="text-xl font-extrabold text-white font-['JetBrains_Mono']">
              {riskAssessment.overall_score}<span className="text-xs text-slate-400 font-normal">/100</span>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getLevelColor(riskAssessment.overall_level)}`}>
            {riskAssessment.overall_level}
          </span>
        </div>
      </div>

      {/* Mandatory Disclaimer Callout */}
      <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-5 flex items-start gap-2.5 text-xs text-amber-200/90">
        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <span>
          <strong>Transparency Notice:</strong> {riskAssessment.disclaimer} Official bulletins are issued separately by the India Meteorological Department (IMD).
        </span>
      </div>

      {/* Compound Hazard Alerts (Section 25) */}
      {riskAssessment.compound_hazards && riskAssessment.compound_hazards.length > 0 && (
        <div className="mb-6 space-y-3">
          <h4 className="text-xs font-bold text-red-300 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span>Active Compound Weather Hazards Detected</span>
          </h4>
          {riskAssessment.compound_hazards.map((hazard, hIdx) => (
            <div
              key={hIdx}
              className="p-4 rounded-xl bg-red-950/30 border border-red-500/30 shadow-lg text-xs space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-red-200">{hazard.hazard_title}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/40 uppercase">
                  {hazard.severity} Severity
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300 font-mono text-[11px]">
                <p>• Primary: <strong className="text-white">{hazard.primary_hazard}</strong></p>
                <p>• Secondary: <strong className="text-white">{hazard.secondary_hazard}</strong></p>
              </div>
              <p className="text-slate-300 font-sans italic">{hazard.rationale}</p>
              <div className="pt-2 border-t border-red-500/20">
                <span className="font-semibold text-slate-300 uppercase text-[10px] tracking-wider">Recommended Actions:</span>
                <ul className="mt-1 space-y-1 list-disc list-inside text-slate-300">
                  {hazard.recommended_precautions.map((p, pIdx) => (
                    <li key={pIdx}>{p}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 7 Hazard Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {riskAssessment.categories.map((cat) => {
          const Icon = getCategoryIcon(cat.category);
          const isExpanded = expandedCategory === cat.category;

          return (
            <div
              key={cat.category}
              className="p-3.5 rounded-xl bg-slate-900/80 border border-white/5 hover:border-white/20 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-slate-800 text-cyan-400">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-white">{cat.category}</h5>
                    <p className="text-[11px] text-slate-400">{cat.summary}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-['JetBrains_Mono'] font-bold text-sm text-white">
                    {cat.score}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getLevelColor(cat.level)}`}>
                    {cat.level}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleExpand(cat.category)}
                    className="p-1 rounded text-slate-400 hover:text-white"
                    title="View contributing factors"
                  >
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${cat.score}%`, backgroundColor: cat.color }}
                ></div>
              </div>

              {/* Expandable Factor Breakdown (Section 24 Explainability) */}
              {isExpanded && cat.contributing_factors.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-white/10 text-xs space-y-1.5">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Contributing Observed Factors:
                  </span>
                  {cat.contributing_factors.map((fac, fIdx) => (
                    <div key={fIdx} className="flex items-center justify-between text-[11px] text-slate-300 font-mono">
                      <span>• {fac.name}: <strong className="text-white">{fac.observed_value}</strong></span>
                      <span className="text-cyan-400 text-[10px]">{fac.threshold_impact}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};
