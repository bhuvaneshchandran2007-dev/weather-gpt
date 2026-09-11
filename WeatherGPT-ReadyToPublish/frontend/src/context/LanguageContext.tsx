import React, { createContext, useContext, useState, useEffect } from 'react';

export interface LanguageInfo {
  code: string;
  name: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
];

export const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    app_title: 'WeatherGPT',
    tagline: 'Understand the weather. Predict the impact. Know what to do.',
    moes_badge: 'MoES / IMD • SIH Problem Statement 26068',
    nav_dashboard: 'Dashboard',
    nav_ai_chat: 'AI WeatherGPT',
    nav_rain_timeline: 'Rain Timeline',
    nav_map: 'Interactive GIS Map',
    nav_simulator: 'What-If Simulator',
    nav_alerts: 'Disaster & Alerts',
    nav_health: 'Data Health',
    search_placeholder: 'Ask WeatherGPT anything (e.g., "Will it rain in Chennai today?")...',
    real_data_badge: 'REAL DATA CONNECTED',
    data_unavailable: 'REAL DATA CURRENTLY UNAVAILABLE',
    feels_like: 'Feels like',
    humidity: 'Humidity',
    wind: 'Wind',
    pressure: 'Pressure',
    visibility: 'Visibility',
    rain_probability: 'Precipitation Prob',
    rain_timeline_title: 'RAIN TIMELINE & DRY WINDOWS',
    rain_window: 'Expected Rain Window',
    dry_window: 'Optimal Dry Window',
    safest_travel: 'Best Travel Window',
    hourly_forecast: 'Hourly Forecast (48h)',
    five_day_forecast: '5-Day Forecast',
    ai_risk_title: 'AI WEATHER RISK ENGINE',
    profession_advisory_title: 'PROFESSION DECISION SUPPORT',
    change_profession: 'Select Profession Profile',
    listen: 'Listening...',
    speak_query: 'Speak your weather question',
    official_warning_label: 'OFFICIAL METEOROLOGICAL WARNING',
    ai_risk_label: 'AI-DERIVED PROTOTYPE RISK SCORE',
    community_report_label: 'UNVERIFIED COMMUNITY REPORT',
    simulation_label: 'SIMULATION — HYPOTHETICAL SCENARIO',
    submit_report: 'Submit Field Report',
    disclaimer_notice: 'Real-time numerical weather prediction data provided by OpenWeather proxy. Official warnings verified with IMD guidelines.'
  },
  ta: {
    app_title: 'வெதர்ஜிபிடி (WeatherGPT)',
    tagline: 'வானிலையை உணருங்கள். தாக்கத்தை கணிக்கவும். என்ன செய்ய வேண்டும் என்று தெரிந்து கொள்ளுங்கள்.',
    moes_badge: 'பூமி அறிவியல் அமைச்சகம் (MoES) / IMD • SIH 26068',
    nav_dashboard: 'முகப்பு பலகை',
    nav_ai_chat: 'AI வானிலை உரையாடல்',
    nav_rain_timeline: 'மழை காலவரிசை (Rain Timeline)',
    nav_map: 'GIS வரைபடம்',
    nav_simulator: 'என்ன நடந்தால்? (Simulator)',
    nav_alerts: 'பேரிடர் எச்சரிக்கைகள்',
    nav_health: 'தரவு நிலை (Data Health)',
    search_placeholder: 'சென்னையில் இன்று மழை பெய்யுமா? குரல் அல்லது தட்டச்சு மூலம் கேளுங்கள்...',
    real_data_badge: 'உண்மையான வானிலை தரவு',
    data_unavailable: 'உண்மையான தரவு தற்போது கிடைக்கவில்லை',
    feels_like: 'உணரப்படும் வெப்பநிலை',
    humidity: 'காற்றின் ஈரப்பதம்',
    wind: 'காற்றின் வேகம்',
    pressure: 'வளிமண்டல அழுத்தம்',
    visibility: 'பார்வைத் தூரம்',
    rain_probability: 'மழைக்கான வாய்ப்பு',
    rain_timeline_title: 'மழை காலவரிசை & உகந்த பயண நேரம்',
    rain_window: 'மழை எதிர்பார்க்கப்படும் நேரம்',
    dry_window: 'உலர்ந்த வெளி வேலை நேரம்',
    safest_travel: 'பாதுகாப்பான பயண நேரம்',
    hourly_forecast: 'மணிநேர முன்னறிவிப்பு',
    five_day_forecast: '5-நாள் வானிலை முன்னறிவிப்பு',
    ai_risk_title: 'AI வானிலை இடர் கணக்கீடு (0-100)',
    profession_advisory_title: 'தொழில் சார்ந்த வழிகாட்டுதல்',
    change_profession: 'தொழிலை தேர்வு செய்க',
    listen: 'கேட்கிறது...',
    speak_query: 'உங்கள் வானிலை கேள்வியை பேசுங்கள்',
    official_warning_label: 'அதிகாரப்பூர்வ வானிலை எச்சரிக்கை',
    ai_risk_label: 'AI கணக்கிட்ட மாதிரி இடர் மதிப்பு',
    community_report_label: 'உறுதிப்படுத்தப்படாத கள அறிக்கை',
    simulation_label: 'மாதிரி ஒப்பீடு (Simulation)',
    submit_report: 'கள அறிக்கை சமர்ப்பிக்கவும்',
    disclaimer_notice: 'உண்மையான வானிலை தரவு OpenWeather மூலம் பெறப்படுகிறது.'
  },
  hi: {
    app_title: 'वेदरजीपीटी (WeatherGPT)',
    tagline: 'मौसम को समझें। प्रभाव का पूर्वानुमान लगाएं। सही कदम उठाएं।',
    moes_badge: 'पृथ्वी विज्ञान मंत्रालय (MoES) / IMD • SIH 26068',
    nav_dashboard: 'डैशबोर्ड',
    nav_ai_chat: 'AI मौसम चैट',
    nav_rain_timeline: 'बारिश टाइमलाइन',
    nav_map: 'GIS वेदर मैप',
    nav_simulator: 'व्हाट-इफ सिम्युलेटर',
    nav_alerts: 'आपदा एवं चेतावनियां',
    nav_health: 'डेटा हेल्थ',
    search_placeholder: 'क्या आज दिल्ली में बारिश होगी? बोलकर या लिखकर पूछें...',
    real_data_badge: 'सटीक वास्तविक डेटा कनेक्टेड',
    data_unavailable: 'वास्तविक डेटा वर्तमान में अनुपलब्ध है',
    feels_like: 'महसूस होता है',
    humidity: 'हवा में नमी',
    wind: 'हवा की रफ्तार',
    pressure: 'वायुमंडलीय दबाव',
    visibility: 'दृश्यता (Visibility)',
    rain_probability: 'बारिश की संभावना',
    rain_timeline_title: 'बारिश टाइमलाइन और सुरक्षित समय विंडो',
    rain_window: 'संभावित बारिश का समय',
    dry_window: 'अनुकूल सूखा समय',
    safest_travel: 'सुरक्षित यात्रा विंडो',
    hourly_forecast: 'प्रति घंटा पूर्वानुमान',
    five_day_forecast: '5-दिवसीय पूर्वानुमान',
    ai_risk_title: 'AI मौसम जोखिम इंजन (0-100)',
    profession_advisory_title: 'व्यवसाय विशिष्ट सलाह',
    change_profession: 'व्यवसाय चुनें',
    listen: 'सुन रहा है...',
    speak_query: 'अपना सवाल बोलें',
    official_warning_label: 'आधिकारिक मौसम विज्ञान चेतावनी',
    ai_risk_label: 'AI-व्युत्पन्न प्रोटोटाइप जोखिम स्कोर',
    community_report_label: 'असत्यापित सामुदायिक रिपोर्ट',
    simulation_label: 'काल्पनिक सिमुलेशन',
    submit_report: 'फील्ड रिपोर्ट सबमिट करें',
    disclaimer_notice: 'वास्तविक डेटा OpenWeather बैकएंड प्रॉक्सी द्वारा संचालित।'
  },
  te: {
    app_title: 'వెదర్‌జిపిటి (WeatherGPT)',
    tagline: 'వాతావరణాన్ని అర్థం చేసుకోండి. ప్రభావాన్ని అంచనా వేయండి. ఏం చేయాలో తెలుసుకోండి.',
    moes_badge: 'భూ విజ్ఞాన మంత్రిత్వ శాఖ (MoES) / IMD • SIH 26068',
    nav_dashboard: 'డాష్‌బోర్డ్',
    nav_ai_chat: 'AI వాతావరణ చాట్',
    nav_rain_timeline: 'వర్షం టైమ్‌లైన్',
    nav_map: 'GIS మ్యాప్',
    nav_simulator: 'సిమ్యులేటర్',
    nav_alerts: 'హెచ్చరికలు',
    nav_health: 'డేటా ఆరోగ్యం',
    search_placeholder: 'ఈ రోజు హైదరాబాద్ లో వర్షం పడుతుందా?...',
    real_data_badge: 'నిజమైన డేటా కనెక్ట్ చేయబడింది',
    data_unavailable: 'నిజమైన డేటా ప్రస్తుతం అందుబాటులో లేదు',
    feels_like: 'అనిపించే ఉష్ణోగ్రత',
    humidity: 'తేమ',
    wind: 'గాలి వేగం',
    pressure: 'పీడనం',
    visibility: 'దృశ్యమానత',
    rain_probability: 'వర్షం అవకాశం',
    rain_timeline_title: 'వర్షం కాలక్రమం & ప్రయాణ సమయం',
    rain_window: 'వర్షం కురిసే సమయం',
    dry_window: 'పొడి వాతావరణ సమయం',
    safest_travel: 'సురక్షిత ప్రయాణ సమయం',
    hourly_forecast: 'గంటవారీ సూచన',
    five_day_forecast: '5 రోజుల సూచన',
    ai_risk_title: 'AI ప్రమాద సూచిక',
    profession_advisory_title: 'వృత్తి సలహా',
    change_profession: 'వృత్తిని ఎంచుకోండి',
    listen: 'వింటోంది...',
    speak_query: 'ప్రశ్న మాట్లాడండి',
    official_warning_label: 'అధికారిక హెచ్చరిక',
    ai_risk_label: 'AI రిస్క్ స్కోర్',
    community_report_label: 'ధృవీకరించబడని నివేదిక',
    simulation_label: 'సిమ్యులేషన్',
    submit_report: 'నివేదికను సమర్పించండి',
    disclaimer_notice: 'రియల్ టైమ్ డేటా OpenWeather ద్వారా అందించబడింది.'
  },
  bn: {
    app_title: 'ওয়েদারজিপিটি (WeatherGPT)',
    tagline: 'আবহাওয়া বুঝুন। প্রভাব অনুমান করুন। সঠিক সিদ্ধান্ত নিন।',
    moes_badge: 'ভারত আবহাওয়া বিজ্ঞান বিভাগ (IMD) / MoES • SIH 26068',
    nav_dashboard: 'ড্যাশবোর্ড',
    nav_ai_chat: 'AI আবহাওয়া চ্যাট',
    nav_rain_timeline: 'বৃষ্টির সময়রেখা',
    nav_map: 'আবহাওয়া মানচিত্র',
    nav_simulator: 'সিমুলেটর',
    nav_alerts: 'সতর্কবার্তা',
    nav_health: 'ডেটা স্বাস্থ্য',
    search_placeholder: 'কলকাতায় আজ কি বৃষ্টি হবে?...',
    real_data_badge: 'আসল ডেটা সংযুক্ত',
    data_unavailable: 'আসল ডেটা বর্তমানে অনুপলব্ধ',
    feels_like: 'অনুভূত তাপমাত্রা',
    humidity: 'আর্দ্রতা',
    wind: 'বাতাসের গতি',
    pressure: 'বায়ুচাপ',
    visibility: 'দৃশ্যমানতা',
    rain_probability: 'বৃষ্টির সম্ভাবনা',
    rain_timeline_title: 'বৃষ্টির সময়রেখা ও নিরাপদ ভ্রমণের সময়',
    rain_window: 'সম্ভাব্য বৃষ্টির সময়',
    dry_window: 'অনুকূল শুষ্ক সময়',
    safest_travel: 'নিরাপদ ভ্রমণ সময়',
    hourly_forecast: 'ঘন্টায় পূর্বাভাস',
    five_day_forecast: '৫ দিনের পূর্বাভাস',
    ai_risk_title: 'AI আবহাওয়া ঝুঁকি স্কোর',
    profession_advisory_title: 'পেশা ভিত্তিক পরামর্শ',
    change_profession: 'পেশা নির্বাচন করুন',
    listen: 'শুনছে...',
    speak_query: 'প্রশ্ন বলুন',
    official_warning_label: 'সরকারি সতর্কতা',
    ai_risk_label: 'AI ঝুঁকি স্কোর',
    community_report_label: 'যাচাইবিহীন প্রতিবেদন',
    simulation_label: 'সিমুলেশন',
    submit_report: 'প্রতিবেদন জমা দিন',
    disclaimer_notice: 'OpenWeather থেকে সরাসরি প্রাপ্ত আবহাওয়া তথ্য।'
  }
};

interface LanguageContextType {
  currentLanguage: string;
  setLanguage: (code: string) => void;
  t: (key: string) => string;
  languages: LanguageInfo[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<string>(() => {
    return localStorage.getItem('weathergpt_lang') || 'en';
  });

  const setLanguage = (code: string) => {
    setCurrentLanguage(code);
    localStorage.setItem('weathergpt_lang', code);
  };

  const t = (key: string): string => {
    const langDict = TRANSLATIONS[currentLanguage] || TRANSLATIONS['en'];
    return langDict[key] || TRANSLATIONS['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ currentLanguage, setLanguage, t, languages: SUPPORTED_LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
