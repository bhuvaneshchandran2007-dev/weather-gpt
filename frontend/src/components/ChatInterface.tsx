import React, { useState, useEffect, useRef } from 'react';
import {
  Send, Mic, MicOff, Volume2, VolumeX, Sparkles,
  Bot, User, CornerDownLeft, RefreshCw, AlertCircle
} from 'lucide-react';
import { useWeather } from '../context/WeatherContext';
import { useLanguage } from '../context/LanguageContext';
import { sendChatMessage } from '../services/api';
import { voiceManager } from '../services/voice';
import { ChatMessage } from '../types';

export const ChatInterface: React.FC = () => {
  const { weather, currentProfession, selectLocation } = useWeather();
  const { currentLanguage, t } = useLanguage();

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      role: 'assistant',
      content: "⚡ Hello! I am **ZEUS**, your Atmospheric Intelligence Core developed for the Ministry of Earth Sciences (MoES) and India Meteorological Department (IMD).\n\nYou can ask me for the weather, rain timelines, wind telemetry, and profession advisories for **ANY location across the world** in **whichever language you speak**:\n• *\"What is the weather in Tokyo right now?\"*\n• *\"சென்னையில் இன்று மழை வருமா?\"* (Tamil)\n• *\"Madurai la innaiku mazhai varuma?\"* (Tanglish)\n• *\"दिल्ली में आज मौसम कैसा है?\"* (Hindi)\n• *\"Forecast for London tomorrow\"*",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      detected_language: 'English',
      quick_suggestions: [
        'Will it rain today?',
        'Rain timeline for Chennai',
        'Should I irrigate my field?',
        'Is it safe for fishing?'
      ]
    }
  ]);

  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, interimTranscript]);

  // Handle voice recording
  const toggleListening = () => {
    if (isListening) {
      voiceManager.stopListening();
      setIsListening(false);
      setInterimTranscript('');
      return;
    }

    voiceManager.startListening(
      currentLanguage,
      (interim) => setInterimTranscript(interim),
      (final) => {
        setIsListening(false);
        setInterimTranscript('');
        handleSend(final);
      },
      (err) => {
        setIsListening(false);
        setInterimTranscript('');
        alert(err);
      },
      () => {
        setIsListening(false);
        setInterimTranscript('');
      }
    );
    setIsListening(true);
  };

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || input).trim();
    if (!textToSend || isSending) return;

    setInput('');
    setInterimTranscript('');

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setIsSending(true);

    try {
      const resp = await sendChatMessage({
        query: textToSend,
        location: weather?.location.name,
        lat: weather?.coordinates.lat,
        lon: weather?.coordinates.lon,
        language: currentLanguage,
        profession: currentProfession
      });

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: resp.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        detected_language: resp.detected_language,
        weather_card: resp.weather_card,
        tools_executed: resp.tools_executed,
        quick_suggestions: resp.quick_suggestions
      };

      setMessages(prev => [...prev, aiMsg]);

      // Automatically teleport to target location if user asked about another city
      if (resp.target_lat != null && resp.target_lon != null && selectLocation) {
        selectLocation({
          name: (resp.resolved_location || textToSend).split(',')[0].trim(),
          lat: resp.target_lat,
          lon: resp.target_lon,
          formatted_name: resp.resolved_location || 'Selected Location'
        });
      }

      // Automatically speak the response in whichever language was detected
      if (resp.speech_text) {
        voiceManager.speak(resp.speech_text, resp.detected_language_code, () => {
          setSpeakingId(null);
        });
        setSpeakingId(aiMsg.id);
      }

    } catch (err: any) {
      const errMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `**REAL DATA CURRENTLY UNAVAILABLE**\n\n${err.message || "Failed to contact weather intelligence service."}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const handleToggleSpeak = (msgId: string, text: string, langCode: string = 'en') => {
    if (speakingId === msgId) {
      voiceManager.stopSpeaking();
      setSpeakingId(null);
    } else {
      voiceManager.speak(text, langCode, () => setSpeakingId(null));
      setSpeakingId(msgId);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-6 text-slate-100 shadow-2xl border border-cyan-500/20 flex flex-col h-[650px]">
      
      {/* Chat Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
              WeatherGPT Conversational Agent
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            </h3>
            <p className="text-xs text-slate-400">
              Agentic reasoning over real meteorological tool APIs in 14 Indian languages
            </p>
          </div>
        </div>

        {weather && (
          <div className="hidden sm:block text-xs font-mono text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-white/5">
            Context: <strong className="text-slate-200">{weather.location.name}</strong> ({weather.current.temp}°C)
          </div>
        )}
      </div>

      {/* Message History */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shrink-0 mt-1">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div className={`max-w-[85%] rounded-2xl p-4 space-y-3 shadow-lg ${
              msg.role === 'user'
                ? 'bg-gradient-to-tr from-cyan-600 to-blue-600 text-white rounded-tr-none'
                : 'bg-slate-900/90 border border-white/10 text-slate-200 rounded-tl-none'
            }`}>
              
              {/* Language Tag & Speaker Button for Assistant */}
              {msg.role === 'assistant' && (
                <div className="flex items-center justify-between border-b border-white/5 pb-2 text-[11px] font-mono text-slate-400">
                  <span className="text-cyan-400 font-semibold">
                    Detected: {msg.detected_language || 'English'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleToggleSpeak(msg.id, msg.content, msg.detected_language?.slice(0, 2))}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition-colors"
                    title="Speak text aloud"
                  >
                    {speakingId === msg.id ? (
                      <VolumeX className="w-4 h-4 text-cyan-400 animate-pulse" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              )}

              {/* Message Content with Markdown rendering */}
              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                {msg.content}
              </div>

              {/* Inline Weather Card Snippet if provided */}
              {msg.weather_card && (
                <div className="p-3 bg-slate-950/70 rounded-xl border border-cyan-500/30 text-xs space-y-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{msg.weather_card.location}</span>
                    <span className="text-cyan-300 font-mono font-bold text-base">{msg.weather_card.temp}°C</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-300 font-mono text-[11px]">
                    <p>• Condition: {msg.weather_card.condition}</p>
                    <p>• Rain Prob: {msg.weather_card.pop_pct}%</p>
                    {msg.weather_card.rain_window && (
                      <p className="col-span-2 text-cyan-400">• Expected Rain: {msg.weather_card.rain_window}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Quick Suggestions */}
              {msg.quick_suggestions && msg.quick_suggestions.length > 0 && (
                <div className="pt-2 flex flex-wrap gap-1.5">
                  {msg.quick_suggestions.map((chip, cIdx) => (
                    <button
                      key={cIdx}
                      type="button"
                      onClick={() => handleSend(chip)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-white/5 text-[11px] font-medium transition-all"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              )}

              <div className="text-[10px] text-right text-slate-400 font-mono">
                {msg.timestamp}
              </div>
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-300 shrink-0 mt-1">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {/* Interim Voice Recording Display */}
        {isListening && interimTranscript && (
          <div className="flex gap-3 justify-end">
            <div className="max-w-[85%] rounded-2xl p-3 bg-cyan-950/40 border border-cyan-500/40 text-cyan-200 text-sm italic animate-pulse">
              "{interimTranscript}..."
            </div>
          </div>
        )}

        {isSending && (
          <div className="flex gap-3 justify-start items-center text-xs text-cyan-400 font-mono p-2">
            <Bot className="w-4 h-4 animate-bounce" />
            <span>Reasoning over meteorological tool APIs...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form & Voice Pulse Button */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative flex items-center gap-2"
        >
          {/* Voice Microphone Button */}
          <button
            type="button"
            onClick={toggleListening}
            className={`p-3 rounded-xl border transition-all ${
              isListening
                ? 'bg-red-500 text-white border-red-400 animate-pulse shadow-lg shadow-red-500/30'
                : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
            }`}
            title={isListening ? 'Stop Listening' : 'Speak (Tamil, Hindi, English, etc.)'}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything (e.g., 'Will it rain at 4 PM?', 'சென்னையில் மழை எப்போது வரும்?')..."
            className="flex-1 px-4 py-3 bg-slate-900/90 border border-white/10 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all font-sans"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!input.trim() || isSending}
            className={`p-3 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white font-bold shadow-lg shadow-cyan-500/20 hover:opacity-90 transition-all ${
              !input.trim() || isSending ? 'opacity-40 cursor-not-allowed' : ''
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>

        {isListening && (
          <p className="text-[11px] text-cyan-400 font-mono mt-1.5 text-center animate-pulse">
            Listening... Speak in any supported language (English, Tamil, Hindi, Telugu, etc.)
          </p>
        )}
      </div>

    </div>
  );
};
