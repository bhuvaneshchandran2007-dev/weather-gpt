import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { BottomNav, TabType } from './components/BottomNav';
import { CurrentWeatherCard } from './components/CurrentWeatherCard';
import { RainTimeline } from './components/RainTimeline';
import { HourlyForecastChart } from './components/HourlyForecastChart';
import { DailyForecastList } from './components/DailyForecastList';
import { AiRiskGauge } from './components/AiRiskGauge';
import { ProfessionAdvisoryCard } from './components/ProfessionAdvisory';
import { WeatherMap } from './components/WeatherMap';
import { ChatInterface } from './components/ChatInterface';
import { WhatIfSimulator } from './components/WhatIfSimulator';
import { AlertCenter } from './components/AlertCenter';
import { DataHealthModal } from './components/DataHealthModal';

// Atmospheric 3D Twin & Spatial Interfaces
import { AtmosphericCanvas3D } from './components/AtmosphericCanvas3D';
import { AtmosphereLockScreen } from './components/AtmosphereLockScreen';
import { VoiceOrb } from './components/VoiceOrb';
import { AtmosphericTimeRail } from './components/AtmosphericTimeRail';
import { AtmosphericIntelligenceHUD } from './components/AtmosphericIntelligenceHUD';
import { ModelLabModal } from './components/ModelLabModal';
import { AtmosphereLabModal } from './components/AtmosphereLabModal';
import { ClimateMemoryModal } from './components/ClimateMemoryModal';
import { MissionModeController } from './components/MissionModeController';
import { DataDetailsDrawer } from './components/DataDetailsDrawer';

import { useLanguage } from './context/LanguageContext';
import { useWeather } from './context/WeatherContext';
import {
  LayoutDashboard, MessageSquare, CloudRain,
  Map, Sliders, AlertTriangle, Eye, EyeOff
} from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isHealthOpen, setIsHealthOpen] = useState<boolean>(false);
  const [isAtmosphereUnlocked, setIsAtmosphereUnlocked] = useState<boolean>(() => {
    return sessionStorage.getItem('weathergpt_unlocked') === 'true';
  });
  const [isHudVisible, setIsHudVisible] = useState<boolean>(true);

  const { t } = useLanguage();
  const { weather, error } = useWeather();

  const handleUnlockAtmosphere = () => {
    sessionStorage.setItem('weathergpt_unlocked', 'true');
    setIsAtmosphereUnlocked(true);
  };

  const getAtmosphericBackdrop = () => {
    if (!weather?.current) return 'from-[#0F172A]/90 via-[#0F172A]/60 to-transparent';
    const condition = (weather.current.condition.main || '').toLowerCase();
    const isDay = weather.current.is_day;
    
    if (condition.includes('thunder')) return 'from-[#090814]/90 via-[#120e24]/60 to-[#050711]/40';
    if (condition.includes('rain') || condition.includes('drizzle')) return 'from-[#0a1524]/90 via-[#0c1b2f]/60 to-[#07101b]/40';
    if (condition.includes('snow')) return 'from-[#0f2238]/90 via-[#172e48]/60 to-[#0c1a2c]/40';
    if (condition.includes('fog') || condition.includes('mist') || condition.includes('haze')) return 'from-[#1e293b]/90 via-[#273549]/60 to-[#141d2b]/40';
    
    if (isDay) {
      if (condition.includes('clear')) return 'from-[#0c2a47]/90 via-[#0e3358]/50 to-[#081b30]/30';
      return 'from-[#14233c]/90 via-[#1b2f4f]/60 to-[#0e1828]/40';
    } else {
      return 'from-[#030712]/95 via-[#080e1e]/60 to-[#02050d]/40';
    }
  };

  return (
    <div className={`relative min-h-screen flex flex-col bg-gradient-to-b ${getAtmosphericBackdrop()} transition-colors duration-1000 text-slate-100 overflow-x-hidden font-sans`}>
      
      {/* 1. Living 3D Atmospheric Digital Twin (WebGL Canvas) */}
      <AtmosphericCanvas3D />

      {/* 2. Signature 01: Atmosphere Lock Screen Boot Sequence */}
      {!isAtmosphereUnlocked && (
        <AtmosphereLockScreen onUnlock={handleUnlockAtmosphere} />
      )}

      {/* 3. Top Navbar */}
      <Navbar
        onOpenHealth={() => setIsHealthOpen(true)}
        onOpenVoiceChat={() => setActiveTab('chat')}
      />

      {/* 4. Spatial Intelligence HUD (Top-Right Floating 3D Controls) */}
      {isHudVisible && <AtmosphericIntelligenceHUD />}

      {/* 5. Floating Multilingual Voice Orb (Bottom-Left) */}
      <VoiceOrb
        className="bottom-24 left-4 sm:left-8"
        onAiResponseReceived={(resp) => {
          // If the AI suggests switching tabs or viewports
          if (resp.action_view_state) {
            // view state is auto handled in VoiceOrb
          }
        }}
      />

      {/* 6. Persistent Forecast Time Rail (Bottom Full-Width Scrubber) */}
      <AtmosphericTimeRail />

      {/* 7. HUD Visibility Quick Toggle (Floating Icon) */}
      <button
        onClick={() => setIsHudVisible(!isHudVisible)}
        className="fixed bottom-24 right-4 z-20 p-2.5 rounded-full bg-[#0F172A]/90 border border-white/10 text-slate-400 hover:text-cyan-400 backdrop-blur-xl shadow-xl transition-all"
        title={isHudVisible ? "Hide Spatial HUD" : "Show Spatial HUD"}
      >
        {isHudVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>

      {/* 8. Main Analytical & Decision Support Workspace */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-36 space-y-6 pointer-events-auto">
        
        {/* Navigation Tabs Bar */}
        <div className="flex items-center justify-between gap-2">
          <div className="hidden md:flex items-center gap-1.5 p-1.5 bg-[#0F172A]/90 rounded-2xl border border-white/10 backdrop-blur-2xl w-fit shadow-xl">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-gradient-to-r from-cyan-500 to-sky-600 text-white shadow-lg shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>{t('nav_dashboard')}</span>
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'chat'
                  ? 'bg-gradient-to-r from-cyan-500 to-sky-600 text-white shadow-lg shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>{t('nav_ai_chat')}</span>
            </button>

            <button
              onClick={() => setActiveTab('timeline')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'timeline'
                  ? 'bg-gradient-to-r from-cyan-500 to-sky-600 text-white shadow-lg shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <CloudRain className="w-4 h-4" />
              <span>{t('nav_rain_timeline')}</span>
            </button>

            <button
              onClick={() => setActiveTab('map')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'map'
                  ? 'bg-gradient-to-r from-cyan-500 to-sky-600 text-white shadow-lg shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Map className="w-4 h-4" />
              <span>{t('nav_map')}</span>
            </button>

            <button
              onClick={() => setActiveTab('simulator')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'simulator'
                  ? 'bg-gradient-to-r from-cyan-500 to-sky-600 text-white shadow-lg shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>{t('nav_simulator')}</span>
            </button>

            <button
              onClick={() => setActiveTab('alerts')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'alerts'
                  ? 'bg-gradient-to-r from-cyan-500 to-sky-600 text-white shadow-lg shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>{t('nav_alerts')}</span>
            </button>
          </div>

          {/* Error Banner if Telemetry is Unavailable */}
          {error && (
            <div className="px-4 py-2 rounded-2xl bg-orange-500/20 border border-orange-500/40 text-orange-300 text-xs font-mono flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              <span>REAL DATA CURRENTLY UNAVAILABLE — CHECK API KEY</span>
            </div>
          )}
        </div>

        {/* Tab 1: Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <CurrentWeatherCard />
            <RainTimeline />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ProfessionAdvisoryCard />
              <AiRiskGauge />
            </div>
            <HourlyForecastChart />
            <DailyForecastList />
          </div>
        )}

        {/* Tab 2: AI WeatherGPT Chat */}
        {activeTab === 'chat' && (
          <div className="space-y-6">
            <ChatInterface />
          </div>
        )}

        {/* Tab 3: Dedicated Rain Timeline */}
        {activeTab === 'timeline' && (
          <div className="space-y-6">
            <RainTimeline />
            <HourlyForecastChart />
          </div>
        )}

        {/* Tab 4: Interactive GIS Map */}
        {activeTab === 'map' && (
          <div className="space-y-6">
            <WeatherMap />
          </div>
        )}

        {/* Tab 5: What-If Reality Simulator */}
        {activeTab === 'simulator' && (
          <div className="space-y-6">
            <WhatIfSimulator />
          </div>
        )}

        {/* Tab 6: Official IMD Alerts & Community Ground Truth */}
        {activeTab === 'alerts' && (
          <div className="space-y-6">
            <AlertCenter />
          </div>
        )}

      </main>

      {/* 9. Mobile Bottom Navigation Bar */}
      <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} />

      {/* 10. Modals & Overlay Drawers */}
      <ModelLabModal />
      <AtmosphereLabModal />
      <ClimateMemoryModal />
      <MissionModeController />
      <DataDetailsDrawer />

      {/* Data Health Telemetry Modal */}
      <DataHealthModal isOpen={isHealthOpen} onClose={() => setIsHealthOpen(false)} />

    </div>
  );
};
