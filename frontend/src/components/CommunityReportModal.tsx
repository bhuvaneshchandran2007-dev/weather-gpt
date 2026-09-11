import React, { useState } from 'react';
import { X, AlertTriangle, Send, MapPin } from 'lucide-react';
import { useWeather } from '../context/WeatherContext';
import { submitCommunityReport } from '../services/api';
import { CommunityReport } from '../types';

interface CommunityReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReportSubmitted: (newReport: CommunityReport) => void;
}

export const CommunityReportModal: React.FC<CommunityReportModalProps> = ({
  isOpen, onClose, onReportSubmitted
}) => {
  const { weather } = useWeather();

  const [reportType, setReportType] = useState('Waterlogged Road');
  const [severity, setSeverity] = useState('Moderate');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const locName = weather?.location.name || 'Chennai';
  const lat = weather?.coordinates.lat || 13.0827;
  const lon = weather?.coordinates.lon || 80.2707;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const rep = await submitCommunityReport({
        location_name: locName,
        lat,
        lon,
        report_type: reportType,
        description: description.trim(),
        severity
      });
      onReportSubmitted(rep);
      setDescription('');
      onClose();
    } catch (err: any) {
      alert("Failed to submit report: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="glass-card rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-amber-500/30 text-slate-100 space-y-4">
        
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Submit Field Weather Report</h3>
              <p className="text-[11px] text-amber-300">
                Will be displayed as UNVERIFIED COMMUNITY REPORT
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

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          <div>
            <label className="text-slate-400 font-semibold block mb-1">Target Location</label>
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-900 rounded-xl border border-white/10 text-slate-200">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <span>{locName} ({lat.toFixed(2)}°, {lon.toFixed(2)}°)</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 font-semibold block mb-1">Hazard Phenomenon</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 rounded-xl border border-white/10 text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="Waterlogged Road">Waterlogged Road</option>
                <option value="Heavy Downpour">Heavy Downpour</option>
                <option value="Strong Wind / Squall">Strong Wind / Squall</option>
                <option value="Fallen Tree / Branch">Fallen Tree / Branch</option>
                <option value="Hailstorm">Hailstorm</option>
                <option value="Dense Fog / Zero Visibility">Dense Fog / Zero Visibility</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 font-semibold block mb-1">Observed Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 rounded-xl border border-white/10 text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="Moderate">Moderate Impact</option>
                <option value="Severe">Severe Hazard</option>
                <option value="Critical">Critical Road Blockage</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-slate-400 font-semibold block mb-1">Field Observation Details</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe exact street/landmark condition, depth of water, or fallen infrastructure..."
              className="w-full px-3 py-2 bg-slate-900 rounded-xl border border-white/10 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          <div className="p-3 bg-slate-900/80 rounded-xl border border-white/5 text-[11px] text-slate-400">
            <strong>Important:</strong> Crowdsourced observations provide valuable local context during monsoon operations but are marked as unverified until corroboration.
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !description.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Posting...' : 'Submit Report'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
