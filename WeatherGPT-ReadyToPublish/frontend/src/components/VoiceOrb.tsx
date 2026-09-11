import React, { useState, useEffect, useRef } from 'react';
import { Mic, Volume2, VolumeX, Sparkles, Loader2, Compass } from 'lucide-react';
import { useWeather } from '../context/WeatherContext';
import { useLanguage } from '../context/LanguageContext';
import { sendChatMessage } from '../services/api';
import { voiceManager } from '../services/voice';
import { VoiceOrbState } from '../types';

interface VoiceOrbProps {
  onAiResponseReceived?: (response: any) => void;
  className?: string;
}

export const VoiceOrb: React.FC<VoiceOrbProps> = ({ onAiResponseReceived, className = '' }) => {
  const { weather, voiceState, setVoiceState, setViewState, selectLocation } = useWeather();
  const { currentLanguage, t } = useLanguage();

  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [lastSpeechResponse, setLastSpeechResponse] = useState<string>('');
  const [detectedLangName, setDetectedLangName] = useState<string>('');
  const [showTranscriptBubble, setShowTranscriptBubble] = useState<boolean>(false);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      const langMap: Record<string, string> = {
        en: 'en-IN',
        hi: 'hi-IN',
        ta: 'ta-IN',
        te: 'te-IN',
        bn: 'bn-IN',
        mr: 'mr-IN',
        gu: 'gu-IN',
        kn: 'kn-IN',
        ml: 'ml-IN',
        pa: 'pa-IN',
        or: 'or-IN',
        as: 'as-IN',
        ur: 'ur-IN',
        sa: 'hi-IN',
      };
      recognition.lang = langMap[currentLanguage] || 'en-IN';

      recognition.onstart = () => {
        setVoiceState('LISTENING');
        setShowTranscriptBubble(true);
        setTranscript('');
      };

      recognition.onresult = (event: any) => {
        const current = event.resultIndex;
        const text = event.results[current][0].transcript;
        setTranscript(text);
      };

      recognition.onerror = (event: any) => {
        console.warn('[VoiceOrb] Speech Recognition Error:', event.error);
        if (voiceState === 'LISTENING') {
          setVoiceState('IDLE');
        }
      };

      recognition.onend = () => {
        if (transcript.trim().length > 0) {
          processVoiceQuery(transcript.trim());
        } else {
          setVoiceState('IDLE');
          setTimeout(() => setShowTranscriptBubble(false), 3000);
        }
      };

      recognitionRef.current = recognition;
    }
  }, [currentLanguage]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Web Speech API is not supported in this browser. Please use Google Chrome or Microsoft Edge.");
      return;
    }

    if (voiceState === 'LISTENING') {
      recognitionRef.current.stop();
      setVoiceState('IDLE');
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        recognitionRef.current.stop();
        setTimeout(() => recognitionRef.current.start(), 200);
      }
    }
  };

  const processVoiceQuery = async (queryText: string) => {
    setVoiceState('UNDERSTANDING');
    try {
      setTimeout(() => setVoiceState('ANALYZING'), 350);

      const lat = weather?.coordinates?.lat || 13.0827;
      const lon = weather?.coordinates?.lon || 80.2707;

      const resp = await sendChatMessage({
        query: queryText,
        location: weather?.location?.name || weather?.location?.formatted_name,
        lat,
        lon,
        language: currentLanguage,
      });

      setVoiceState('RESPONDING');
      const spokenText = resp.speech_text || resp.reply || resp.response || "Here is the weather forecast.";
      setLastSpeechResponse(spokenText);
      setDetectedLangName(resp.detected_language || '');
      setShowTranscriptBubble(true);

      // Camera action trigger if conversational agent recommends 3D view
      if (resp.action_view_state) {
        setViewState(resp.action_view_state);
      }

      // Automatically teleport to target location if user asked about any location worldwide
      if (resp.target_lat != null && resp.target_lon != null && selectLocation) {
        selectLocation({
          name: (resp.resolved_location || queryText).split(',')[0].trim(),
          lat: resp.target_lat,
          lon: resp.target_lon,
          formatted_name: resp.resolved_location || 'Selected Location'
        });
      }

      if (onAiResponseReceived) {
        onAiResponseReceived(resp);
      }

      // Speak response aloud in whichever language the user spoke
      if (!isMuted) {
        const langToSpeak = resp.detected_language_code || currentLanguage || 'en';
        voiceManager.speak(spokenText, langToSpeak, () => {
          setVoiceState('IDLE');
          setTimeout(() => setShowTranscriptBubble(false), 6000);
        });
      } else {
        setTimeout(() => {
          setVoiceState('IDLE');
          setTimeout(() => setShowTranscriptBubble(false), 5000);
        }, 3500);
      }
    } catch (err) {
      console.error('[VoiceOrb] ZEUS Processing failed:', err);
      setVoiceState('IDLE');
    }
  };

  const getStateGlow = () => {
    switch (voiceState) {
      case 'LISTENING':
        return 'shadow-[0_0_50px_rgba(6,182,212,0.8)] border-cyan-400 scale-110 ring-4 ring-cyan-400/30';
      case 'UNDERSTANDING':
        return 'shadow-[0_0_60px_rgba(56,189,248,0.9)] border-sky-300 scale-105 animate-pulse';
      case 'ANALYZING':
        return 'shadow-[0_0_70px_rgba(249,115,22,0.85)] border-orange-400 scale-110 ring-4 ring-orange-500/40 animate-pulse';
      case 'RESPONDING':
        return 'shadow-[0_0_80px_rgba(6,182,212,1)] border-teal-300 scale-115 ring-8 ring-cyan-500/20';
      case 'IDLE':
      default:
        return 'shadow-[0_0_35px_rgba(6,182,212,0.4)] border-cyan-500/60 hover:scale-105';
    }
  };

  return (
    <div className={`fixed z-30 flex flex-col items-center select-none ${className}`}>
      {/* Speech Transcript Floating Bubble */}
      {showTranscriptBubble && (
        <div className="mb-3 max-w-xs sm:max-w-md px-4 py-3 rounded-2xl bg-[#0F172A]/95 backdrop-blur-2xl border border-cyan-500/40 text-xs sm:text-sm text-slate-100 shadow-2xl animate-fade-in text-center pointer-events-auto">
          {voiceState === 'LISTENING' && (
            <div className="flex items-center justify-center gap-2 text-cyan-400 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <span>{transcript || t('voice_listening') || 'Listening to your voice (any language)...'}</span>
            </div>
          )}
          {voiceState === 'UNDERSTANDING' && (
            <div className="flex items-center justify-center gap-2 text-sky-400 font-medium">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>ZEUS detecting language & intent...</span>
            </div>
          )}
          {voiceState === 'ANALYZING' && (
            <div className="flex items-center justify-center gap-2 text-orange-400 font-medium">
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>ZEUS analyzing atmospheric models & risk data...</span>
            </div>
          )}
          {voiceState === 'RESPONDING' && (
            <div className="text-left text-slate-200">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-amber-400 font-extrabold text-xs">⚡ ZEUS</span>
                  <span className="text-cyan-400 text-[11px] font-semibold tracking-wider uppercase">Atmospheric Core</span>
                </div>
                {detectedLangName && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-semibold">
                    {detectedLangName}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm font-medium leading-relaxed">{lastSpeechResponse}</p>
            </div>
          )}
        </div>
      )}

      {/* Living Atmospheric 3D Orb */}
      <div className="relative flex items-center justify-center">
        {voiceState === 'LISTENING' && (
          <div className="absolute inset-0 rounded-full border border-cyan-400/50 animate-ping pointer-events-none" />
        )}
        {voiceState === 'RESPONDING' && (
          <div className="absolute -inset-2 rounded-full border-2 border-teal-400/40 animate-pulse pointer-events-none" />
        )}

        <button
          onClick={toggleListening}
          aria-label="Toggle ZEUS Voice AI"
          className={`relative w-16 h-16 sm:w-18 sm:h-18 rounded-full flex items-center justify-center cursor-pointer transition-all duration-500 bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0369A1] border-2 backdrop-blur-2xl ${getStateGlow()}`}
        >
          <div className="absolute inset-1 rounded-full bg-radial from-cyan-400/20 via-sky-600/10 to-transparent pointer-events-none" />

          {voiceState === 'LISTENING' ? (
            <Mic className="w-7 h-7 text-cyan-300 animate-bounce" />
          ) : voiceState === 'ANALYZING' || voiceState === 'UNDERSTANDING' ? (
            <Sparkles className="w-7 h-7 text-orange-400 animate-spin" />
          ) : voiceState === 'RESPONDING' ? (
            <Volume2 className="w-7 h-7 text-teal-300 animate-pulse" />
          ) : (
            <Mic className="w-6 h-6 text-cyan-400 group-hover:scale-110 transition-transform" />
          )}
        </button>

        {/* Audio Mute Quick Toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            voiceManager.stopSpeaking();
            setIsMuted(!isMuted);
          }}
          className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-[#1E293B] border border-cyan-500/40 text-slate-300 hover:text-cyan-400 hover:border-cyan-400 transition-colors shadow-lg"
          title={isMuted ? "Unmute Voice Responses" : "Mute Voice Responses"}
        >
          {isMuted ? <VolumeX className="w-3 h-3 text-orange-400" /> : <Volume2 className="w-3 h-3 text-cyan-400" />}
        </button>
      </div>

      {/* Voice Status Pill */}
      <div className="mt-2 px-3 py-0.5 rounded-full bg-[#0F172A]/90 border border-cyan-500/30 text-[10px] font-bold tracking-wider uppercase text-cyan-400 backdrop-blur-md flex items-center gap-1.5 shadow-lg">
        <span className="text-amber-400 font-extrabold tracking-wider">ZEUS</span>
        <span className="text-slate-500">•</span>
        <span>{voiceState}</span>
      </div>
    </div>
  );
};
