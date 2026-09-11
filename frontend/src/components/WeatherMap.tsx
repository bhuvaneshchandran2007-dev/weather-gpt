import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Layers, Navigation, Clock, MapPin, Eye,
  CloudRain, Wind, Thermometer, Cloud, Info
} from 'lucide-react';
import { useWeather } from '../context/WeatherContext';
import { useLanguage } from '../context/LanguageContext';
import { fetchReverseGeocode } from '../services/api';

export const WeatherMap: React.FC = () => {
  const { weather, selectLocation } = useWeather();
  const { t } = useLanguage();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  const [activeLayer, setActiveLayer] = useState<'precipitation' | 'temp' | 'clouds' | 'wind'>('precipitation');
  const [timelineIndex, setTimelineIndex] = useState<number>(0);

  const timelineSteps = [
    { label: 'NOW', offsetHours: 0 },
    { label: '+1 HOUR', offsetHours: 1 },
    { label: '+2 HOURS', offsetHours: 2 },
    { label: '+3 HOURS', offsetHours: 3 },
    { label: '+6 HOURS', offsetHours: 6 },
    { label: '+12 HOURS', offsetHours: 12 },
    { label: '+24 HOURS', offsetHours: 24 },
  ];

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialLat = weather?.coordinates.lat || 13.0827;
      const initialLon = weather?.coordinates.lon || 80.2707;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLon],
        zoom: 7,
        zoomControl: true,
      });

      // Dark theme base carto tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> | &copy; OpenStreetMap',
        maxZoom: 18,
      }).addTo(map);

      const layerGroup = L.layerGroup().addTo(map);
      layerGroupRef.current = layerGroup;

      // Click to inspect any coordinate
      map.on('click', async (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        try {
          const loc = await fetchReverseGeocode(lat, lng);
          selectLocation(loc);
        } catch (err) {
          selectLocation({
            name: `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`,
            lat,
            lon: lng,
            formatted_name: `Point (${lat.toFixed(4)}°, ${lng.toFixed(4)}°)`
          });
        }
      });

      mapInstanceRef.current = map;
    }

    return () => {
      // Keep instance alive during tab transitions
    };
  }, []);

  // Update dynamic meteorological tile layers (Rain Radar, Wind, Temperature, Clouds)
  useEffect(() => {
    if (!layerGroupRef.current) return;
    layerGroupRef.current.clearLayers();

    const layerFieldMap: Record<string, string> = {
      precipitation: 'precipitationIntensity',
      wind: 'windSpeed',
      temp: 'temperature',
      clouds: 'cloudCover',
    };

    const field = layerFieldMap[activeLayer] || 'precipitationIntensity';
    const tileUrl = `https://api.tomorrow.io/v4/map/tile/{z}/{x}/{y}/${field}/now.png`;

    const weatherTile = L.tileLayer(tileUrl, {
      opacity: 0.72,
      maxZoom: 18,
      zIndex: 10,
    });

    layerGroupRef.current.addLayer(weatherTile);
  }, [activeLayer]);

  // Update center marker when weather location changes
  useEffect(() => {
    if (!mapInstanceRef.current || !weather) return;

    const lat = weather.coordinates.lat;
    const lon = weather.coordinates.lon;

    mapInstanceRef.current.setView([lat, lon], 8);

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lon]);
    } else {
      const customIcon = L.divIcon({
        className: 'custom-weather-pin',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="w-8 h-8 rounded-full bg-cyan-500/80 border-2 border-white shadow-xl flex items-center justify-center text-white text-xs font-bold">
              ${Math.round(weather.current.temp)}°
            </div>
            <div class="absolute -bottom-1 w-2 h-2 bg-cyan-400 rotate-45"></div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      });

      const marker = L.marker([lat, lon], { icon: customIcon }).addTo(mapInstanceRef.current);
      markerRef.current = marker;
    }
  }, [weather]);

  // Selected forecast preview at timeline slider
  const getTimelinePreview = () => {
    if (!weather || !weather.hourly || weather.hourly.length === 0) return null;
    const step = timelineSteps[timelineIndex];
    // Find closest forecast item
    const targetIdx = Math.min(weather.hourly.length - 1, Math.floor(step.offsetHours / 3));
    return weather.hourly[targetIdx];
  };

  const previewItem = getTimelinePreview();

  return (
    <div className="glass-card rounded-2xl p-6 text-slate-100 shadow-xl border border-white/10 space-y-4">
      
      {/* Map Header & Engine Notice */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-extrabold text-white tracking-tight">
              {t('nav_map')}
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Interactive GIS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Click anywhere on the globe to inspect real-time meteorological observations
          </p>
        </div>

        {/* Engine Transparency Pill (Section 11 Compliance) */}
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-white/5">
          <Info className="w-3.5 h-3.5 text-cyan-400" />
          <span>Active Engine: OpenStreetMap / Leaflet GIS</span>
        </div>
      </div>

      {/* Layer Selectors */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-white/5">
          <button
            type="button"
            onClick={() => setActiveLayer('precipitation')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeLayer === 'precipitation' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-300 hover:text-white'
            }`}
          >
            <CloudRain className="w-3.5 h-3.5" />
            <span>Rain Radar</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveLayer('clouds')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeLayer === 'clouds' ? 'bg-blue-500 text-white shadow-md' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Clouds</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveLayer('temp')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeLayer === 'temp' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Thermometer className="w-3.5 h-3.5" />
            <span>Temperature</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveLayer('wind')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeLayer === 'wind' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            <span>Wind Vectors</span>
          </button>
        </div>

        {weather && (
          <span className="text-xs font-mono text-slate-400">
            Center: <strong className="text-slate-200">{weather.location.name}</strong> ({weather.coordinates.lat.toFixed(2)}°, {weather.coordinates.lon.toFixed(2)}°)
          </span>
        )}
      </div>

      {/* Map Container */}
      <div className="relative w-full h-96 rounded-xl overflow-hidden border border-white/10 shadow-inner z-0">
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>

      {/* Weather Map Timeline Slider (Section 12) */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-white/5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>Weather Map Timeline</span>
          </div>
          <span className="text-xs font-mono font-bold text-cyan-300">
            {timelineSteps[timelineIndex].label}
          </span>
        </div>

        {/* Range Slider */}
        <input
          type="range"
          min="0"
          max={timelineSteps.length - 1}
          value={timelineIndex}
          onChange={(e) => setTimelineIndex(parseInt(e.target.value))}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
        />

        {/* Step Labels */}
        <div className="flex justify-between text-[10px] font-mono text-slate-500">
          {timelineSteps.map((step, idx) => (
            <span
              key={step.label}
              className={`cursor-pointer ${timelineIndex === idx ? 'text-cyan-400 font-bold' : 'hover:text-slate-300'}`}
              onClick={() => setTimelineIndex(idx)}
            >
              {step.label}
            </span>
          ))}
        </div>

        {/* Telemetry Preview for Timeline Step */}
        {previewItem && (
          <div className="mt-3 pt-3 border-t border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="text-slate-300">
              <span className="text-slate-400">Time:</span> <strong className="text-white">{previewItem.time_label}</strong>
            </div>
            <div className="text-slate-300">
              <span className="text-slate-400">Temp:</span> <strong className="text-amber-400">{previewItem.temp}°C</strong>
            </div>
            <div className="text-slate-300">
              <span className="text-slate-400">Precip Prob:</span> <strong className="text-cyan-400">{Math.round(previewItem.pop * 100)}%</strong>
            </div>
            <div className="text-slate-300">
              <span className="text-slate-400">Wind:</span> <strong className="text-emerald-400">{previewItem.wind_speed} km/h</strong>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
