import re
import unicodedata
from typing import Dict, Any, List, Optional, Tuple
from ..models.weather import NormalizedWeatherReport
from ..models.chat import ChatRequest, ChatResponse, WeatherCardSnippet
from ..services.weather_service import weather_service, WeatherUnavailableException
from ..services.profession_engine import generate_profession_advisory
from ..services.risk_engine import compute_ai_risks

LANGUAGE_DEFINITIONS = {
    "en": {"name": "English", "native": "English"},
    "ta": {"name": "Tamil", "native": "தமிழ்"},
    "hi": {"name": "Hindi", "native": "हिन्दी"},
    "te": {"name": "Telugu", "native": "తెలుగు"},
    "kn": {"name": "Kannada", "native": "ಕನ್ನಡ"},
    "ml": {"name": "Malayalam", "native": "മലയാളം"},
    "bn": {"name": "Bengali", "native": "বাংলা"},
    "mr": {"name": "Marathi", "native": "मराठी"},
    "gu": {"name": "Gujarati", "native": "ગુજરાતી"},
    "pa": {"name": "Punjabi", "native": "ਪੰਜਾਬੀ"},
    "or": {"name": "Odia", "native": "ଓଡ଼ିଆ"},
    "as": {"name": "Assamese", "native": "অসমীয়া"},
    "ur": {"name": "Urdu", "native": "اردو"}
}

INDIC_CITY_MAP = {
    # Tamil
    "சென்னை": "Chennai", "மதுரை": "Madurai", "கோவை": "Coimbatore", "கோயம்புத்தூர்": "Coimbatore",
    "திருச்சி": "Tiruchirappalli", "சேலம்": "Salem", "நெல்லை": "Tirunelveli", "தஞ்சாவூர்": "Thanjavur",
    "வேலூர்": "Vellore", "ஈரோடு": "Erode", "தூத்துக்குடி": "Thoothukudi", "கன்னியாகுமரி": "Kanyakumari",
    "ஊட்டி": "Ooty", "கொடைக்கானல்": "Kodaikanal", "திருப்பூர்": "Tiruppur", "திண்டுக்கல்": "Dindigul",
    # Hindi
    "दिल्ली": "Delhi", "नई दिल्ली": "New Delhi", "मुंबई": "Mumbai", "बेंगलुरु": "Bengaluru",
    "कोलकाता": "Kolkata", "चेन्नई": "Chennai", "जयपुर": "Jaipur", "लखनऊ": "Lucknow",
    "वाराणसी": "Varanasi", "पटना": "Patna", "भोपाल": "Bhopal", "शिमला": "Shimla",
    "अहमदाबाद": "Ahmedabad", "पुणे": "Pune", "हैदराबाद": "Hyderabad", "चंडीगढ़": "Chandigarh",
    "आगरा": "Agra", "कानपुर": "Kanpur", "इंदौर": "Indore", "नागपुर": "Nagpur",
    # Telugu
    "హైదరాబాద్": "Hyderabad", "విశాఖపట్నం": "Visakhapatnam", "విజయవాడ": "Vijayawada", "తిరుపతి": "Tirupati",
    # Malayalam
    "തിരുവനന്തപുരം": "Thiruvananthapuram", "കൊച്ചി": "Kochi", "കോഴിക്കോട്": "Kozhikode", "തൃശ്ശൂർ": "Thrissur",
    # Kannada
    "ಬೆಂಗಳೂರು": "Bengaluru", "ಮೈಸೂರು": "Mysuru", "ಮಂಗಳೂರು": "Mangalore", "ಹುಬ್ಬಳ್ಳಿ": "Hubli",
    # Bengali
    "কলকাতা": "Kolkata", "হাওড়া": "Howrah", "শিলিগুড়ি": "Siliguri", "দার্জিলিং": "Darjeeling",
}

TANGLISH_WORDS = {"innaiku", "naalaikku", "mazhai", "varuma", "epdi", "irukka", "veiyil", "kaathu", "peyyum", "vanthu", "illai", "solunga", "enna", "irukkuma", "adikkuma", "paaru", "theriyuma"}
HINGLISH_WORDS = {"aaj", "kal", "baarish", "hogi", "mausam", "kaisa", "garmi", "thand", "hawa", "bataye", "hoga", "hona", "chahiye", "batao", "dikhao", "chalega"}
TENGLISH_WORDS = {"repu", "eroju", "varsham", "padutunda", "ela", "undi", "paduthada", "chudandi", "cheppandi"}
MANGLISH_WORDS = {"innu", "nale", "mazha", "peyyumo", "undavumo", "enganeya", "nokku", "parayu"}

STOP_WORDS = {
    "what", "is", "the", "weather", "forecast", "in", "at", "for", "of", "to", "tomorrow", "today", "tonight",
    "now", "will", "it", "rain", "rainy", "hot", "cold", "temp", "temperature", "humidity", "wind", "speed",
    "how", "tell", "me", "show", "give", "any", "like", "current", "condition", "status", "report", "ai",
    "zeus", "please", "can", "you", "kaisa", "hai", "aaj", "kal", "innaiku", "naalaikku", "varuma", "mazhai",
    "right", "currently", "state", "place", "city", "town", "here", "there", "about", "day", "week"
}

def detect_language(text: str, user_override: Optional[str] = None) -> Tuple[str, str]:
    """Detect language from text (script or transliterated colloquial)."""
    for char in text:
        cp = ord(char)
        if 0x0B80 <= cp <= 0x0BFF:
            return "ta", "தமிழ் (Tamil)"
        elif 0x0900 <= cp <= 0x097F:
            if any(w in text for w in ["आहे", "कसा", "पाऊस", "झाला", "नाही"]):
                return "mr", "मराठी (Marathi)"
            return "hi", "हिन्दी (Hindi)"
        elif 0x0C00 <= cp <= 0x0C7F:
            return "te", "తెలుగు (Telugu)"
        elif 0x0C80 <= cp <= 0x0CFF:
            return "kn", "ಕನ್ನಡ (Kannada)"
        elif 0x0D00 <= cp <= 0x0D7F:
            return "ml", "മലയാളം (Malayalam)"
        elif 0x0980 <= cp <= 0x09FF:
            return "bn", "বাংলা (Bengali)"
        elif 0x0A80 <= cp <= 0x0AFF:
            return "gu", "ગુજરાતી (Gujarati)"
        elif 0x0A00 <= cp <= 0x0A7F:
            return "pa", "ਪੰਜਾਬੀ (Punjabi)"
        elif 0x0B00 <= cp <= 0x0B7F:
            return "or", "ଓଡ଼ିଆ (Odia)"
        elif 0x0600 <= cp <= 0x06FF:
            return "ur", "اردو (Urdu)"

    lowered = text.lower()
    words = set(re.findall(r"\b[a-z]+\b", lowered))
    if words.intersection(TANGLISH_WORDS):
        return "ta", "தமிழ் (Tanglish)"
    if words.intersection(HINGLISH_WORDS):
        return "hi", "हिन्दी (Hinglish)"
    if words.intersection(TENGLISH_WORDS):
        return "te", "తెలుగు (Tenglish)"
    if words.intersection(MANGLISH_WORDS):
        return "ml", "മലയാളം (Manglish)"

    if user_override and user_override in LANGUAGE_DEFINITIONS:
        return user_override, LANGUAGE_DEFINITIONS[user_override]["name"]

    return "en", "English"

def extract_target_location(text: str, current_location: Optional[str] = None) -> Optional[str]:
    """Dynamically identify any location query across the world and Indian scripts."""
    # 1. Direct Indian Script lookup
    for script_city, latin_city in INDIC_CITY_MAP.items():
        if script_city in text:
            return latin_city

    # 2. Check suffix patterns in Indian languages
    m_ta = re.search(r"([\u0B80-\u0BFF]+)(?:இல்|ல்|க்கு)\b", text)
    if m_ta and m_ta.group(1) in INDIC_CITY_MAP:
        return INDIC_CITY_MAP[m_ta.group(1)]

    # 3. Tanglish / Hinglish / Tenglish suffixes: e.g. "Madurai la", "Delhi mein", "Goa lo"
    m_colloq = re.search(r"\b([A-Za-z]+)(?:[-_\s]+)?(?:la|le|ku|mein|me|lo|ki|il)\b", text, re.IGNORECASE)
    if m_colloq and m_colloq.group(1).lower() not in STOP_WORDS:
        return m_colloq.group(1).title()

    # 4. English preposition patterns: in/at/for/around/near <City>
    patterns = [
        r"\b(?:in|at|for|around|near|of)\s+([A-Za-z]+)\b",
        r"\b([A-Za-z]+)\s+(?:weather|forecast|temperature|temp|climate|rain|radar)\b",
        r"\b(?:weather|forecast|temperature|temp|rain)\s+(?:in|for|at|of)?\s*([A-Za-z]+)\b",
    ]
    for pat in patterns:
        for m in re.finditer(pat, text, re.IGNORECASE):
            word = m.group(1).strip()
            if word.lower() not in STOP_WORDS and len(word) >= 3:
                return word.title()

    # 5. Fallback: scan words for geographical candidate
    candidates = [w.title() for w in re.findall(r"\b[A-Za-z]{3,}\b", text) if w.lower() not in STOP_WORDS]
    if candidates:
        return candidates[0]

    return current_location

def extract_intent(text: str) -> str:
    lowered = text.lower()
    rain_terms = [
        "rain", "mazhai", "baarish", "varsham", "mazha", "shower", "downpour",
        "மழை", "बारिश", "बरसात", "వర్షం", "మళై", "বৃষ্টি", "વરસાદ", "ਮੀਂਹ", "ବର୍ଷା"
    ]
    timeline_terms = [
        "timeline", "what time", "when will", "start", "duration", "how long will", "end",
        "eppo", "kab", "eppudu", "eppol", "எப்போது", "कब", "ఎప్పుడు"
    ]

    if any(k in lowered or k in text for k in timeline_terms):
        return "rain_timeline"
    elif any(k in lowered or k in text for k in rain_terms):
        return "rain_forecast"
    elif any(k in lowered for k in ["wind", "gust", "kaathu", "hawa", "বাতাস", "గాలి"]):
        return "wind"
    elif any(k in lowered for k in ["model", "nwp", "gfs", "wrf", "numerical"]):
        return "nwp"
    elif any(k in lowered for k in ["history", "climate", "last year", "trend", "record"]):
        return "climate"
    elif any(k in lowered for k in ["orbit", "globe", "planet", "earth", "world"]):
        return "orbit"
    elif any(k in lowered or k in text for k in ["irrigate", "crop", "spray", "harvest", "field", "farm", "kisan", "vyavasayam", "விவசாயம்", "खेती"]):
        return "agriculture"
    elif any(k in lowered or k in text for k in ["fish", "boat", "marine", "sea", "sail", "kadal", "மீன்பிடி", "मछली"]):
        return "marine"
    elif any(k in lowered or k in text for k in ["drive", "road", "travel", "commute", "highway", "traffic", "car", "bike", "பயணம்", "यात्रा"]):
        return "travel"
    elif any(k in lowered or k in text for k in ["temp", "temperature", "hot", "cold", "heat", "garmi", "veiyil", "வெப்பநிலை", "तापमान"]):
        return "temperature"

    return "general_weather"

class WeatherAiAgent:
    """ZEUS: Interactive Multilingual Atmospheric Intelligence Core."""

    def __init__(self):
        self.name = "ZEUS"
        self.title = "Atmospheric Intelligence Core (MoES / IMD)"

    def handle_chat(self, req: ChatRequest) -> ChatResponse:
        lang_code, lang_name = detect_language(req.query, req.language)
        intent = extract_intent(req.query)
        detected_loc = extract_target_location(req.query, req.location) or "Chennai"

        tools_called = ["extract_intent", "detect_language"]

        # Default action view state
        action_view = "CITY"
        if intent in ("rain_timeline", "rain_forecast"):
            action_view = "RAIN"
        elif intent == "wind":
            action_view = "WIND"
        elif intent == "orbit":
            action_view = "ORBIT"
        elif intent == "nwp":
            action_view = "NWP"
        elif intent == "climate":
            action_view = "CLIMATE"

        target_lat = req.lat
        target_lon = req.lon
        resolved_loc_name = detected_loc

        # Check if user specifically requested another location or lat/lon missing
        should_geocode = (target_lat is None or target_lon is None) or (
            req.location and detected_loc.lower() not in req.location.lower()
        )

        geo_hit = False
        if should_geocode:
            tools_called.append("geocode_location")
            geo = weather_service.geocode(detected_loc)
            if geo:
                target_lat = geo[0].lat
                target_lon = geo[0].lon
                resolved_loc_name = geo[0].formatted_name
                geo_hit = True
            else:
                target_lat = target_lat or 13.0827
                target_lon = target_lon or 80.2707
                resolved_loc_name = detected_loc

        try:
            tools_called.append("get_weather_data")
            weather_data = weather_service.get_weather_data(target_lat, target_lon)
            if geo_hit:
                weather_data.location.name = detected_loc
                weather_data.location.formatted_name = resolved_loc_name
        except WeatherUnavailableException as e:
            return ChatResponse(
                reply=f"⚡ **ZEUS Core Notice**: LIVE WEATHER DATA UNAVAILABLE for {detected_loc}.\n\nDiagnostic: {e.diagnostic_reason}",
                detected_language=lang_name,
                detected_language_code=lang_code,
                detected_intent=intent,
                resolved_location=resolved_loc_name,
                weather_card=None,
                tools_executed=tools_called,
                quick_suggestions=["Configure API Key", "Retry Connection"],
                speech_text=f"I am ZEUS. Real weather data is currently unavailable for {detected_loc}.",
                data_freshness_note="DATA CONNECTION LOST",
                action_view_state=action_view
            )

        cur = weather_data.current
        rain_intel = weather_data.rain_intelligence

        card = WeatherCardSnippet(
            location=weather_data.location.formatted_name,
            temp=cur.temp,
            feels_like=cur.feels_like,
            condition=cur.condition.description,
            icon=cur.condition.icon,
            pop_pct=rain_intel.max_pop_pct,
            rain_window=rain_intel.rain_window,
            best_window=rain_intel.dry_window,
            data_source="LIVE WEATHER DATA",
            updated_at=weather_data.last_updated
        )

        prof_advisory = None
        if intent in ("agriculture", "marine", "travel") or (req.profession and req.profession != "general_public"):
            target_prof = intent if intent in ("agriculture", "marine", "travel") else req.profession
            prof_advisory = generate_profession_advisory(target_prof, weather_data)
            tools_called.append("generate_profession_advisory")

        ai_risks = None
        if intent == "risk_assessment" or rain_intel.max_pop_pct >= 50:
            ai_risks = compute_ai_risks(weather_data)
            tools_called.append("calculate_weather_risk")

        reply, speech = self._synthesize_multilingual_zeus_response(
            lang_code=lang_code,
            intent=intent,
            weather=weather_data,
            prof_advisory=prof_advisory,
            ai_risks=ai_risks
        )

        suggestions = [
            f"Rain forecast for {weather_data.location.name}",
            f"Hourly timeline in {weather_data.location.name}",
            f"3D Wind Vector Simulation",
            f"Compare with NWP Model"
        ]

        return ChatResponse(
            reply=reply,
            detected_language=lang_name,
            detected_language_code=lang_code,
            detected_intent=intent,
            resolved_location=weather_data.location.formatted_name,
            weather_card=card,
            tools_executed=tools_called,
            quick_suggestions=suggestions,
            speech_text=speech,
            data_freshness_note=f"LIVE WEATHER DATA • Telemetry active",
            action_view_state=action_view,
            target_lat=target_lat,
            target_lon=target_lon
        )

    def _synthesize_multilingual_zeus_response(
        self,
        lang_code: str,
        intent: str,
        weather: NormalizedWeatherReport,
        prof_advisory: Optional[Any],
        ai_risks: Optional[Any]
    ) -> Tuple[str, str]:
        cur = weather.current
        rain = weather.rain_intelligence
        loc = weather.location.name
        pop = rain.max_pop_pct
        rain_win = rain.rain_window or "no precipitation expected"
        dry_win = rain.dry_window or "throughout the day"

        # 1. TAMIL (தமிழ்) & TANGLISH
        if lang_code == "ta":
            if pop >= 45:
                reply = (
                    f"⚡ **ZEUS வளிமண்டல அறிக்கை — {loc}**\n\n"
                    f"வணக்கம்! நான் **ZEUS**. **{loc}**-ல் தற்போதைய நிலை: **{cur.condition.description}** ({cur.temp}°C, உணரப்படுவது {cur.feels_like}°C).\n\n"
                    f"🌧 **மழை முன்னறிவிப்பு:** **{pop}% மழை வாய்ப்பு** உள்ளது.\n"
                    f"• எதிர்பார்க்கப்படும் மழை நேரம்: **{rain_win}**\n"
                    f"• எதிர்பார்க்கப்படும் அளவு: ~{rain.total_rain_expected_mm} மி.மீ.\n"
                    f"• பாதுகாப்பான உலர்ந்த நேரம்: **{dry_win}**\n"
                    f"• காற்றின் வேகம்: மணிக்கு {cur.wind_speed} கி.மீ. ({cur.wind_deg}°)"
                )
                speech = f"வணக்கம், நான் ZEUS. {loc}-ல் {pop} சதவீதம் மழை வாய்ப்பு உள்ளது. மழை எதிர்பார்க்கப்படும் நேரம் {rain_win}."
            else:
                reply = (
                    f"⚡ **ZEUS வளிமண்டல அறிக்கை — {loc}**\n\n"
                    f"வணக்கம்! நான் **ZEUS**. **{loc}**-ல் இன்று வானிலை நிலைத்தன்மையுடன் உள்ளது.\n\n"
                    f"• தற்போதைய வெப்பநிலை: **{cur.temp}°C** (உணரப்படுவது: {cur.feels_like}°C)\n"
                    f"• நிலை: **{cur.condition.description}**\n"
                    f"• மழை வாய்ப்பு: மிகக் குறைவு ({pop}% மட்டுமே)\n"
                    f"• ஈரப்பதம்: {cur.humidity}% | காற்றின் வேகம்: மணிக்கு {cur.wind_speed} கி.மீ.\n"
                    f"• சிறந்த வெளி வேலை நேரம்: **{dry_win}**"
                )
                speech = f"வணக்கம், நான் ZEUS. {loc}-ல் வெப்பநிலை {cur.temp} டிகிரி செல்சியஸ். இன்று மழைக்கான வாய்ப்பு குறைவு."
            return reply, speech

        # 2. HINDI (हिन्दी) & HINGLISH
        elif lang_code == "hi":
            if pop >= 45:
                reply = (
                    f"⚡ **ZEUS वायुमंडलीय रिपोर्ट — {loc}**\n\n"
                    f"नमस्ते! मैं **ZEUS** हूँ। **{loc}** में वर्तमान मौसम **{cur.condition.description}** है ({cur.temp}°C, महसूस: {cur.feels_like}°C)।\n\n"
                    f"🌧 **बारिश का पूर्वानुमान:** **{pop}% संभावना** है।\n"
                    f"• संभावित बारिश का समय: **{rain_win}**\n"
                    f"• अनुमानित बारिश: ~{rain.total_rain_expected_mm} मिमी\n"
                    f"• सुरक्षित सूखी खिड़की: **{dry_win}**\n"
                    f"• हवा की गति: {cur.wind_speed} किमी/घंटा।"
                )
                speech = f"नमस्ते, मैं ZEUS हूँ। {loc} में {pop} प्रतिशत बारिश की संभावना है। संभावित समय {rain_win} है।"
            else:
                reply = (
                    f"⚡ **ZEUS वायुमंडलीय रिपोर्ट — {loc}**\n\n"
                    f"नमस्ते! मैं **ZEUS** हूँ। **{loc}** में आज मौसम सामान्य और अनुकूल है।\n\n"
                    f"• वर्तमान तापमान: **{cur.temp}°C** (महसूस: {cur.feels_like}°C)\n"
                    f"• स्थिति: **{cur.condition.description}**\n"
                    f"• बारिश की संभावना: नगण्य ({pop}%)\n"
                    f"• नमी: {cur.humidity}% | हवा: {cur.wind_speed} किमी/घंटा\n"
                    f"• सबसे अनुकूल बाहरी समय: **{dry_win}**"
                )
                speech = f"नमस्ते, मैं ZEUS हूँ। {loc} में वर्तमान तापमान {cur.temp} डिग्री है और आज बारिश की संभावना कम है।"
            return reply, speech

        # 3. TELUGU (తెలుగు)
        elif lang_code == "te":
            reply = (
                f"⚡ **ZEUS వాతావరణ నివేదిక — {loc}**\n\n"
                f"నమస్కారం! నేను **ZEUS** ని. **{loc}** లో ప్రస్తుత ఉష్ణోగ్రత **{cur.temp}°C** ({cur.condition.description}).\n\n"
                f"🌧 వర్ష సూచన: **{pop}% సంభావ్యత** (సమయం: {rain_win}).\n"
                f"• గాలి వేగం: గంటకు {cur.wind_speed} కి.மீ.\n"
                f"• సురక్షిత సమయం: **{dry_win}**"
            )
            speech = f"నమస్కారం, నేను ZEUS ని. {loc} లో ఉష్ణోగ్రత {cur.temp} డిగ్రీలు, వర్షం అవకాశం {pop} శాతం."
            return reply, speech

        # 4. KANNADA (ಕನ್ನಡ)
        elif lang_code == "kn":
            reply = (
                f"⚡ **ZEUS ವಾತಾವರಣ ವರದಿ — {loc}**\n\n"
                f"ನಮಸ್ಕಾರ! ನಾನು **ZEUS**. **{loc}** ನಲ್ಲಿ ಪ್ರಸ್ತುತ ತಾಪಮಾನ **{cur.temp}°C** ({cur.condition.description}).\n\n"
                f"🌧 ಮಳೆ ಸಂಭವನೀಯತೆ: **{pop}%** (ಸಮಯ: {rain_win}).\n"
                f"• ಗಾಳಿಯ ವೇಗ: {cur.wind_speed} km/h.\n"
                f"• ಸೂಕ್ತ ಸಮಯ: **{dry_win}**"
            )
            speech = f"ನಮಸ್ಕಾರ, ನಾನು ZEUS. {loc} ನಲ್ಲಿ ತಾಪಮಾನ {cur.temp} ಡಿಗ್ರಿ ಸೆಲ್ಸಿಯಸ್."
            return reply, speech

        # 5. MALAYALAM (മലയാളം)
        elif lang_code == "ml":
            reply = (
                f"⚡ **ZEUS അന്തരീക്ഷ വിവരണം — {loc}**\n\n"
                f"നമസ്കാരം! ഞാൻ **ZEUS**. **{loc}**-ൽ നിലവിലെ താപനില **{cur.temp}°C** ({cur.condition.description}).\n\n"
                f"🌧 മഴ സാധ്യത: **{pop}%** (സമയം: {rain_win}).\n"
                f"• കാറ്റിന്റെ വേഗത: {cur.wind_speed} km/h.\n"
                f"• അനുകൂല സമയം: **{dry_win}**"
            )
            speech = f"നമസ്കാരം, ഞാൻ ZEUS. {loc}-ൽ താപനില {cur.temp} ഡിഗ്രി, മഴ സാധ്യത {pop} ശതമാനം."
            return reply, speech

        # 6. BENGALI (বাংলা)
        elif lang_code == "bn":
            reply = (
                f"⚡ **ZEUS বায়ুমণ্ডলীয় প্রতিবেদন — {loc}**\n\n"
                f"নমস্কার! আমি **ZEUS**। **{loc}**-এ বর্তমান তাপমাত্রা **{cur.temp}°C** ({cur.condition.description})।\n\n"
                f"🌧 বৃষ্টির সম্ভাবনা: **{pop}%** (সময়: {rain_win})।\n"
                f"• বাতাসের গতি: {cur.wind_speed} km/h।\n"
                f"• অনুকূল সময়: **{dry_win}**"
            )
            speech = f"নমস্কার, আমি ZEUS। {loc}-এ বর্তমান তাপমাত্রা {cur.temp} ডিগ্রি সেলসিয়াস।"
            return reply, speech

        # 7. MARATHI (मराठी)
        elif lang_code == "mr":
            reply = (
                f"⚡ **ZEUS हवामान अहवाल — {loc}**\n\n"
                f"नमस्कार! मी **ZEUS** आहे. **{loc}** मध्ये सध्याचे तापमान **{cur.temp}°C** ({cur.condition.description}) आहे.\n\n"
                f"🌧 पावसाची शक्यता: **{pop}%** (वेळ: {rain_win}).\n"
                f"• वाऱ्याचा वेग: {cur.wind_speed} km/h.\n"
                f"• अनुकूल वेळ: **{dry_win}**"
            )
            speech = f"नमस्कार, मी ZEUS आहे. {loc} मध्ये तापमान {cur.temp} अंश सेल्सिअस आहे."
            return reply, speech

        # 8. GUJARATI (ગુજરાતી)
        elif lang_code == "gu":
            reply = (
                f"⚡ **ZEUS વાતાવરણ અહેવાલ — {loc}**\n\n"
                f"નમસ્તે! હું **ZEUS** છું. **{loc}** માં વર્તમાન તાપમાન **{cur.temp}°C** ({cur.condition.description}) છે.\n\n"
                f"🌧 વરસાદની શક્યતા: **{pop}%** (સમય: {rain_win}).\n"
                f"• પવનની ગતિ: {cur.wind_speed} km/h.\n"
                f"• અનુકૂળ સમય: **{dry_win}**"
            )
            speech = f"નમસ્તે, હું ZEUS છું. {loc} માં તાપમાન {cur.temp} ડિગ્રી સેલ્સિયસ છે."
            return reply, speech

        # 9. PUNJABI (ਪੰਜਾਬੀ)
        elif lang_code == "pa":
            reply = (
                f"⚡ **ZEUS ਮੌਸਮ ਰਿਪੋਰਟ — {loc}**\n\n"
                f"ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ **ZEUS** ਹਾਂ। **{loc}** ਵਿੱਚ ਮੌਜੂਦਾ ਤਾਪਮਾਨ **{cur.temp}°C** ({cur.condition.description}) ਹੈ।\n\n"
                f"🌧 ਮੀਂਹ ਦੀ ਸੰਭਾਵਨਾ: **{pop}%** (ਸਮਾਂ: {rain_win})।\n"
                f"• ਹਵਾ ਦੀ ਗਤੀ: {cur.wind_speed} km/h।"
            )
            speech = f"ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ, ਮੈਂ ZEUS ਹਾਂ। {loc} ਵਿੱਚ ਤਾਪਮਾਨ {cur.temp} ਡਿਗਰੀ ਹੈ।"
            return reply, speech

        # 10. ODIA (ଓଡ଼ିଆ)
        elif lang_code == "or":
            reply = (
                f"⚡ **ZEUS ପାଣିପାଗ ରିପୋର୍ଟ — {loc}**\n\n"
                f"ନମସ୍କାର! ମୁଁ **ZEUS**। **{loc}** ରେ ବର୍ତ୍ତମାନର ତାପମାତ୍ରା **{cur.temp}°C** ({cur.condition.description})।\n\n"
                f"🌧 ବର୍ଷା ସମ୍ଭାବନା: **{pop}%** (ସମୟ: {rain_win})।\n"
                f"• ପବନ ବେଗ: {cur.wind_speed} km/h।"
            )
            speech = f"ନମସ୍କାର, ମୁଁ ZEUS। {loc} ରେ ତାପମାତ୍ରା {cur.temp} ଡିଗ୍ରୀ।"
            return reply, speech

        # 11. URDU (اردو)
        elif lang_code == "ur":
            reply = (
                f"⚡ **ZEUS موسمیاتی رپورٹ — {loc}**\n\n"
                f"سلام! میں **ZEUS** ہوں۔ **{loc}** میں موجودہ درجہ حرارت **{cur.temp}°C** ({cur.condition.description}) ہے۔\n\n"
                f"🌧 بارش کا امکان: **{pop}%** (وقت: {rain_win})\n"
                f"• ہوا کی رفتار: {cur.wind_speed} km/h"
            )
            speech = f"سلام، میں ZEUS ہوں۔ {loc} میں درجہ حرارت {cur.temp} ڈگری ہے۔"
            return reply, speech

        # 12. ENGLISH (DEFAULT)
        else:
            rain_phrase = f"Precipitation likelihood is {pop}% (window: {rain_win})" if pop >= 45 else f"Precipitation chance is low ({pop}%)"
            reply = (
                f"⚡ **ZEUS Atmospheric Intelligence — {loc}**\n\n"
                f"I am **ZEUS**. In **{loc}**, surface conditions are **{cur.condition.description}** at **{cur.temp}°C** (feels like {cur.feels_like}°C).\n\n"
                f"• **Rainfall Status:** {rain_phrase}\n"
                f"• **Wind Vector:** {cur.wind_speed} km/h from {cur.wind_deg}° (gusts: {cur.wind_gust or cur.wind_speed} km/h)\n"
                f"• **Optimal Activity Window:** {dry_win}\n"
                f"• **Atmospheric Moisture:** {cur.humidity}% | Barometric Pressure: {cur.pressure} hPa"
            )
            if prof_advisory:
                reply += f"\n\n**{prof_advisory.profession_name} Advisory:** {prof_advisory.summary}"

            speech = f"I am ZEUS. In {loc}, the weather is {cur.condition.description} at {cur.temp} degrees. {rain_phrase}."
            return reply, speech

ai_agent = WeatherAiAgent()
