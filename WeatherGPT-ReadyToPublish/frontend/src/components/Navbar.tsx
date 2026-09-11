import React, { useState, useEffect, useRef } from 'react';
import {
  CloudSun, Search, MapPin, Mic, Globe, Briefcase,
  Activity, ShieldCheck, AlertTriangle, RefreshCw, Terminal, User
} from 'lucide-react';
import { useWeather, PROFESSIONS } from '../context/WeatherContext';
import { useLanguage } from '../context/LanguageContext';
import { fetchLocationSuggestions } from '../services/api';
import { LocationInfo } from '../types';
import { UserProfileModal } from './UserProfileModal';

interface NavbarProps {
  onOpenHealth: () => void;
  onOpenVoiceChat: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenHealth, onOpenVoiceChat }) => {
  const { weather, isLoading, refreshWeather, selectLocation, detectUserLocation, currentProfession, setProfession } = useWeather();
  const { currentLanguage, setLanguage, t, languages } = useLanguage();

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LocationInfo[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await fetchLocationSuggestions(query);
        setSuggestions(results);
        setShowSuggestions(true);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside to dismiss suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (loc: LocationInfo) => {
    selectLocation(loc);
    setQuery('');
    setShowSuggestions(false);
  };

  const activeProfObj = PROFESSIONS.find(p => p.id === currentProfession) || PROFESSIONS[0];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#090d16]/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Brand Logo & MoES / IMD Tag */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20 text-white font-bold">
              <CloudSun className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-white">WEATHER<span className="text-cyan-400">GPT</span></span>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  SIH 26068
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block font-semibold tracking-wider uppercase">
                ATMOSPHERIC INTELLIGENCE • MoES / IMD
              </p>
            </div>
          </div>

          {/* Autocomplete Search Bar */}
          <div ref={searchRef} className="relative flex-1 max-w-md mx-2">
            <div className="relative flex items-center">
              <Search className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => query.length >= 2 && setShowSuggestions(true)}
                placeholder={t('search_placeholder')}
                className="w-full pl-9 pr-20 py-2 bg-slate-900/80 border border-white/10 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
              />
              <div className="absolute right-1.5 flex items-center gap-1">
                <button
                  type="button"
                  onClick={detectUserLocation}
                  title="Use Current Location (GPS)"
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  <MapPin className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={onOpenVoiceChat}
                  title="Voice Input (Multilingual)"
                  className="p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition-all"
                >
                  <Mic className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 mt-1.5 bg-slate-900/95 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 divide-y divide-white/5">
                {suggestions.map((loc, idx) => (
                  <button
                    key={`${loc.lat}-${loc.lon}-${idx}`}
                    type="button"
                    onClick={() => handleSelect(loc)}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-cyan-500/10 hover:text-cyan-300 flex items-center justify-between text-slate-300 transition-colors"
                  >
                    <span className="font-medium">{loc.formatted_name}</span>
                    <span className="text-xs text-slate-500">{loc.lat.toFixed(2)}°, {loc.lon.toFixed(2)}°</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Settings: Profession, Language, Health Status */}
          <div className="flex items-center gap-2">
            
            {/* Profession Profile Selector */}
            <div className="relative hidden lg:block">
              <select
                value={currentProfession}
                onChange={(e) => setProfession(e.target.value)}
                className="appearance-none pl-8 pr-7 py-1.5 bg-slate-900/90 border border-white/10 rounded-xl text-xs font-semibold text-slate-200 hover:border-cyan-500/40 focus:outline-none cursor-pointer"
              >
                {PROFESSIONS.map(p => (
                  <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">
                    {p.name}
                  </option>
                ))}
              </select>
              <Briefcase className="absolute left-2.5 top-2 w-3.5 h-3.5 text-cyan-400 pointer-events-none" />
            </div>

            {/* Multilingual Selector (14 Languages) */}
            <div className="relative">
              <select
                value={currentLanguage}
                onChange={(e) => setLanguage(e.target.value)}
                className="appearance-none pl-8 pr-6 py-1.5 bg-slate-900/90 border border-white/10 rounded-xl text-xs font-semibold text-cyan-300 hover:border-cyan-500/40 focus:outline-none cursor-pointer"
                title="Select Language (14 Indian Languages)"
              >
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code} className="bg-slate-900 text-slate-200">
                    {lang.nativeName} ({lang.name})
                  </option>
                ))}
              </select>
              <Globe className="absolute left-2.5 top-2 w-3.5 h-3.5 text-cyan-400 pointer-events-none" />
            </div>

            {/* Data Health Button */}
            <button
              type="button"
              onClick={onOpenHealth}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-white/10 bg-slate-900/80 hover:bg-slate-800 text-xs text-slate-300 font-medium transition-all"
              title="System Data Health Diagnostics"
            >
              <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span className="hidden sm:inline">Data Health</span>
            </button>

            {/* Interactive API Docs Link */}
            <a
              href="/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-white/10 bg-slate-900/80 hover:bg-slate-800 text-xs text-slate-300 font-medium transition-all"
              title="OpenAPI Swagger Documentation (/docs)"
            >
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">API Docs</span>
            </a>

            {/* User Profile & Saved Locations Modal Trigger */}
            <button
              type="button"
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-xs text-cyan-300 font-medium transition-all shadow-sm shadow-cyan-500/10"
              title="My Profile & Saved Locations"
            >
              <User className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Profile / Sign In</span>
            </button>

            {/* Refresh Live Weather */}
            <button
              type="button"
              onClick={() => refreshWeather()}
              disabled={isLoading}
              className={`p-2 rounded-xl border border-white/10 bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white transition-all ${isLoading ? 'opacity-50' : ''}`}
              title="Refresh Real Weather Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>

        </div>
      </div>

      {/* User Profile & Saved Locations Modal */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </header>
  );
};
