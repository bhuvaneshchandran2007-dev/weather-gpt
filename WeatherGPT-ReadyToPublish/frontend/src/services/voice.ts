// Web Speech API Abstraction Layer for Multilingual Voice AI

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
        confidence: number;
      };
      isFinal: boolean;
    };
    length: number;
  };
}

const LANG_VOICE_MAP: Record<string, string> = {
  'en': 'en-IN',
  'ta': 'ta-IN',
  'hi': 'hi-IN',
  'te': 'te-IN',
  'kn': 'kn-IN',
  'ml': 'ml-IN',
  'bn': 'bn-IN',
  'mr': 'mr-IN',
  'gu': 'gu-IN',
  'pa': 'pa-IN',
  'or': 'or-IN',
  'as': 'as-IN',
  'ur': 'ur-IN'
};

export class VoiceManager {
  private recognition: any = null;
  private isListening: boolean = false;
  private isSpeaking: boolean = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    const windowObj = window as any;
    const SpeechRecognition = windowObj.SpeechRecognition || windowObj.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
    }
  }

  public isSpeechRecognitionSupported(): boolean {
    return this.recognition !== null;
  }

  public isSpeechSynthesisSupported(): boolean {
    return 'speechSynthesis' in window;
  }

  public startListening(
    langCode: string,
    onInterim: (text: string) => void,
    onFinal: (text: string) => void,
    onError: (err: string) => void,
    onEnd: () => void
  ) {
    if (!this.recognition) {
      onError("Voice input is not supported in this browser. Please use keyboard text input.");
      return;
    }

    if (this.isListening) {
      this.stopListening();
    }

    this.stopSpeaking();

    const bcp47 = LANG_VOICE_MAP[langCode] || 'en-IN';
    this.recognition.lang = bcp47;

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript.trim()) {
        onFinal(finalTranscript.trim());
      } else if (interimTranscript.trim()) {
        onInterim(interimTranscript.trim());
      }
    };

    this.recognition.onerror = (event: any) => {
      this.isListening = false;
      onError(event.error === 'not-allowed' ? "Microphone permission denied." : `Voice error: ${event.error}`);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      onEnd();
    };

    try {
      this.recognition.start();
      this.isListening = true;
    } catch (e: any) {
      this.isListening = false;
      onError(e.message || "Failed to start microphone.");
    }
  }

  public stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {}
      this.isListening = false;
    }
  }

  public speak(text: string, langCode: string = 'en', onComplete?: () => void) {
    if (!this.isSpeechSynthesisSupported()) return;

    this.stopSpeaking();

    const cleanText = text
      .replace(/[*#_~`>]/g, '') // remove markdown
      .replace(/\n+/g, ' ')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const targetLang = LANG_VOICE_MAP[langCode] || 'en-IN';
    utterance.lang = targetLang;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Pick best available voice for language
    const voices = window.speechSynthesis.getVoices();
    const matchedVoice = voices.find(v => v.lang.toLowerCase() === targetLang.toLowerCase() || v.lang.startsWith(langCode));
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.onend = () => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      if (onComplete) onComplete();
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      this.currentUtterance = null;
    };

    this.currentUtterance = utterance;
    this.isSpeaking = true;
    window.speechSynthesis.speak(utterance);
  }

  public stopSpeaking() {
    if (this.isSpeechSynthesisSupported()) {
      window.speechSynthesis.cancel();
      this.isSpeaking = false;
      this.currentUtterance = null;
    }
  }

  public getSpeakingState(): boolean {
    return this.isSpeaking;
  }
}

export const voiceManager = new VoiceManager();
