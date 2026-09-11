import React from 'react';
import {
  LayoutDashboard, MessageSquare, CloudRain,
  Map, Sliders, AlertTriangle
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export type TabType = 'dashboard' | 'chat' | 'timeline' | 'map' | 'simulator' | 'alerts';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab }) => {
  const { t } = useLanguage();

  const tabs: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: t('nav_dashboard'), icon: LayoutDashboard },
    { id: 'chat', label: t('nav_ai_chat'), icon: MessageSquare },
    { id: 'timeline', label: t('nav_rain_timeline'), icon: CloudRain },
    { id: 'map', label: t('nav_map'), icon: Map },
    { id: 'simulator', label: t('nav_simulator'), icon: Sliders },
    { id: 'alerts', label: t('nav_alerts'), icon: AlertTriangle },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#090d16]/95 backdrop-blur-xl border-t border-white/10 md:hidden pb-safe">
      <div className="grid grid-cols-6 h-16 items-center px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
                isActive ? 'text-cyan-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={`p-1 rounded-lg ${isActive ? 'bg-cyan-500/10' : ''}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[9px] mt-0.5 tracking-tight truncate max-w-[54px]">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
