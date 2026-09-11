import React, { useState, useEffect } from 'react';
import {
  X, User, MapPin, Plus, Trash2, LogIn, LogOut,
  ShieldCheck, Smartphone, Check, Globe, RefreshCw, Compass
} from 'lucide-react';
import { useWeather, PROFESSIONS } from '../context/WeatherContext';
import { useLanguage } from '../context/LanguageContext';
import { LocationInfo } from '../types';

interface SavedLocationItem {
  id: string;
  label: string;
  name: string;
  lat: number;
  lon: number;
}

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { weather, selectLocation, detectUserLocation, currentProfession, setProfession } = useWeather();
  const { t } = useLanguage();

  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem('weathergpt_user_name') || 'Citizen User';
  });
  const [userIdentifier, setUserIdentifier] = useState<string>(() => {
    return localStorage.getItem('weathergpt_user_id') || 'citizen@imd.gov.in';
  });
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('weathergpt_is_logged_in') === 'true';
  });
  const [autoGps, setAutoGps] = useState<boolean>(() => {
    return localStorage.getItem('weathergpt_auto_gps') !== 'false';
  });

  const [savedLocations, setSavedLocations] = useState<SavedLocationItem[]>(() => {
    const cached = localStorage.getItem('weathergpt_saved_locations');
    if (cached) {
      try { return JSON.parse(cached); } catch (e) { }
    }
    return [
      { id: 'loc-1', label: 'Home Base', name: 'Chennai, Tamil Nadu', lat: 13.0827, lon: 80.2707 },
      { id: 'loc-2', label: 'Agricultural Farm', name: 'Thanjavur, Tamil Nadu', lat: 10.7870, lon: 79.1378 },
      { id: 'loc-3', label: 'Fleet Hub / Port', name: 'Ennore Port, Chennai', lat: 13.2354, lon: 80.3236 }
    ];
  });

  const [newLabel, setNewLabel] = useState('');
  const [isAddingCurrent, setIsAddingCurrent] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('weathergpt_saved_locations', JSON.stringify(savedLocations));
  }, [savedLocations]);

  useEffect(() => {
    localStorage.setItem('weathergpt_user_name', userName);
    localStorage.setItem('weathergpt_user_id', userIdentifier);
    localStorage.setItem('weathergpt_is_logged_in', isLoggedIn ? 'true' : 'false');
    localStorage.setItem('weathergpt_auto_gps', autoGps ? 'true' : 'false');
  }, [userName, userIdentifier, isLoggedIn, autoGps]);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userIdentifier.trim()) return;
    setIsLoggedIn(true);
    if (!userName.trim()) {
      setUserName(userIdentifier.split('@')[0] || 'MoES Officer');
    }
    // If auto GPS is enabled, detect location
    if (autoGps) {
      detectUserLocation();
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  const handleSaveCurrentLocation = () => {
    if (!weather) return;
    const label = newLabel.trim() || `Station ${savedLocations.length + 1}`;
    const newLoc: SavedLocationItem = {
      id: `loc-${Date.now()}`,
      label,
      name: weather.location.formatted_name || weather.location.name,
      lat: weather.coordinates.lat,
      lon: weather.coordinates.lon
    };
    setSavedLocations(prev => [...prev, newLoc]);
    setNewLabel('');
    setIsAddingCurrent(false);
  };

  const handleRemoveLocation = (id: string) => {
    setSavedLocations(prev => prev.filter(l => l.id !== id));
  };

  const handleTeleportToLocation = (loc: SavedLocationItem) => {
    selectLocation({
      name: loc.name,
      lat: loc.lat,
      lon: loc.lon,
      formatted_name: `${loc.label} (${loc.name})`
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl rounded-2xl bg-[#0B132B] border border-white/10 shadow-2xl p-6 text-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white font-bold shadow-lg shadow-cyan-500/20">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">Citizen & Operator Identity</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {isLoggedIn ? 'SESSION ACTIVE' : 'GUEST MODE'}
                </span>
              </div>
              <p className="text-xs text-slate-400">Personalized weather intelligence across every device & location</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1 space-y-6 pt-4 pr-1">

          {/* 1. User Sign In / Profile Status */}
          <div className="p-4 rounded-xl bg-[#0F172A]/80 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  {isLoggedIn ? 'Authenticated Profile' : 'Sign In Anywhere You Use WeatherGPT'}
                </span>
              </div>
              {isLoggedIn && (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              )}
            </div>

            {isLoggedIn ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/60 border border-white/5">
                  <div>
                    <p className="text-sm font-bold text-white">{userName}</p>
                    <p className="text-xs text-cyan-400">{userIdentifier}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 capitalize">
                      {currentProfession.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Auto-GPS Switch */}
                <label className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/40 border border-white/5 cursor-pointer hover:bg-slate-900/70 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-cyan-400" />
                    <div>
                      <p className="text-xs font-semibold text-slate-200">Follow My Location (GPS Auto-Track)</p>
                      <p className="text-[11px] text-slate-400">Automatically switch weather to wherever I open the app</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoGps}
                    onChange={(e) => setAutoGps(e.target.checked)}
                    className="w-4 h-4 text-cyan-500 rounded border-slate-700 bg-slate-800 focus:ring-cyan-400"
                  />
                </label>
              </div>
            ) : (
              <form onSubmit={handleLogin} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Mobile Number, Email, or MoES Officer ID
                  </label>
                  <input
                    type="text"
                    value={userIdentifier}
                    onChange={(e) => setUserIdentifier(e.target.value)}
                    placeholder="+91 98765 43210 or officer@imd.gov.in"
                    className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">Display Name</label>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">Primary Role</label>
                    <select
                      value={currentProfession}
                      onChange={(e) => setProfession(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                    >
                      {PROFESSIONS.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white text-xs font-bold transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In & Sync My Locations</span>
                </button>
              </form>
            )}
          </div>

          {/* 2. Saved Locations (Home, Farm, Hub, Work) */}
          <div className="p-4 rounded-xl bg-[#0F172A]/80 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Saved Locations ({savedLocations.length})
                </span>
              </div>
              <button
                onClick={() => setIsAddingCurrent(!isAddingCurrent)}
                className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save Current Location</span>
              </button>
            </div>

            {/* Form to save current active location */}
            {isAddingCurrent && weather && (
              <div className="p-3 mb-3 rounded-lg bg-cyan-950/40 border border-cyan-500/30 space-y-2">
                <p className="text-xs text-cyan-300">
                  Save current coordinate: <span className="font-bold text-white">{weather.location.name}</span> ({weather.coordinates.lat.toFixed(2)}°, {weather.coordinates.lon.toFixed(2)}°)
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="Custom Label (e.g. My Farm, Home, Office)"
                    className="flex-1 px-3 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    onClick={handleSaveCurrentLocation}
                    className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-xs font-bold"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}

            {/* Saved Locations List */}
            <div className="space-y-2">
              {savedLocations.map((loc) => {
                const isActive = weather &&
                  Math.abs(weather.coordinates.lat - loc.lat) < 0.05 &&
                  Math.abs(weather.coordinates.lon - loc.lon) < 0.05;

                return (
                  <div
                    key={loc.id}
                    className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                      isActive
                        ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
                        : 'bg-slate-900/50 border-white/5 hover:bg-slate-900 text-slate-300'
                    }`}
                  >
                    <div
                      className="flex-1 cursor-pointer flex items-center gap-2"
                      onClick={() => handleTeleportToLocation(loc)}
                    >
                      <MapPin className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{loc.label}</span>
                          {isActive && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-400/20 text-cyan-300 font-semibold">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400">{loc.name} ({loc.lat.toFixed(2)}°, {loc.lon.toFixed(2)}°)</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleTeleportToLocation(loc)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-cyan-500 hover:text-white text-[11px] font-semibold text-slate-300 transition-colors"
                      >
                        Switch
                      </button>
                      <button
                        onClick={() => handleRemoveLocation(loc.id)}
                        className="p-1 rounded-lg hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-colors"
                        title="Delete Location"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Multi-Device & Everywhere Usage Guide */}
          <div className="p-3.5 rounded-xl bg-slate-900/40 border border-white/5 flex items-start gap-3 text-xs text-slate-400">
            <Smartphone className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-slate-200">How WeatherGPT Works Everywhere You Go</p>
              <p className="text-[11px] leading-relaxed">
                WeatherGPT connects to global meteorological satellite & station grids. Whether you are traveling across Indian states or abroad, clicking the <strong className="text-cyan-300">MapPin GPS</strong> icon automatically teleports the 3D Atmosphere to your current position.
              </p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
