# WeatherGPT

> **"Understand the weather. Predict the impact. Know what to do."**

**SIH Problem Statement 26068**:  
*WeatherGPT: Conversational AI for Weather Forecasting, Alerts, and Climate Information*  
- **Organization**: Ministry of Earth Sciences (MoES)  
- **Department**: India Meteorological Department (IMD)  
- **Category**: Software  
- **Theme**: Disaster Management  

---

## 🌟 Core Product Principles

1. **Zero Fake Data Guarantee**:
   - **No mock weather values, fake temperatures, fake rainfall, or fake alerts.**
   - All meteorological data is retrieved via the backend proxy from the **OpenWeather API**.
   - If the API key is not configured, invalid, or quota is exceeded, WeatherGPT cleanly displays:  
     `REAL DATA CURRENTLY UNAVAILABLE` with diagnostic reasons and a retry button.
2. **Official Warning Separation**:
   - **Official Warnings**: Verified bulletins from the India Meteorological Department (IMD) / national meteorological feeds.
   - **AI Weather Risk Estimates**: Explainable 0–100 prototype risk scores computed mathematically from real atmospheric parameters.
   - **Unverified Community Reports**: Field observations submitted by citizens during monsoon events.
   - **Simulations**: Hypothetical what-if testing explicitly watermarked `SIMULATION`.
3. **Dedicated Rain Timeline**:
   - Analyzes real hourly/3-hourly precipitation forecasts.
   - Detects expected rain start, peak intensity, duration, and end times.
   - Identifies optimal **Dry Windows** and **Safest Travel Windows**.
   - Transparent precision: States "Hourly forecast indicates rain around 4–7 PM" without falsely claiming minute precision when only hourly data is supplied.
4. **Universal Multilingual Voice Interaction**:
   - Supports 14 Indian languages (English, Tamil, Hindi, Telugu, Kannada, Malayalam, Bengali, Marathi, Gujarati, Punjabi, Odia, Assamese, Urdu).
   - Natural language and mixed-dialect understanding (Tanglish: *"Chennai la innaiku mazhai varuma?"*, Hinglish: *"Kal baarish hogi kya?"*).
   - Real-time language detection with voice input (STT) and voice speech response (TTS) in the matching language.
5. **Profession Intelligence Engine (18+ Profiles)**:
   - Personalized decision support for:
     - Agricultural Farmer (irrigation postponement, spraying suitability, heat stress)
     - Fisherman & Marine Worker (wind gusts, squall alerts, wave data disclaimer)
     - Aviator & Drone Pilot (QNH, cloud cover, visibility, IFR category)
     - Driver & Delivery Worker (wet pavement friction, hydroplaning, braking distances)
     - Construction Site Supervisor (crane wind thresholds > 35 km/h, concrete curing)
     - Student & Campus Commuter (umbrella reminder, travel windows)
     - Solar Energy Plant Operator (cloud cover attenuation proxy, panel wash cycle)
     - Disaster Management Officer (compound runoff hazards, EOC readiness levels)
6. **Compound Weather Hazards**:
   - Automatically identifies co-occurring risks: Heavy Rain + Strong Wind, High Heat + High Humidity (Severe Heat Index), Rain + Poor Visibility.
7. **What-If Weather Simulator**:
   - Stress-test infrastructure by adjusting Δ Temperature, Δ Rainfall, Δ Wind, and Δ Humidity.
   - Compares Real Baseline vs Simulated Scenario.
8. **Data Health & Diagnostic Dashboard**:
   - Real-time telemetry inspector for SIH judges showing API connectivity, latency (ms), HTTP codes, supported vs unavailable endpoints, and browser speech status.

---

## 🏗 System Architecture

```
weathergpt/
├── backend/
│   ├── app/
│   │   ├── config.py                 # Backend environment variable settings
│   │   ├── models/
│   │   │   ├── weather.py            # Normalized weather schemas, rain timeline, freshness
│   │   │   ├── profession.py         # 18+ profession intelligence models
│   │   │   ├── risk.py               # 0-100 risk metrics and compound hazard alerts
│   │   │   ├── chat.py               # Conversational request/response schemas
│   │   │   └── community.py          # Crowdsourced unverified reports
│   │   ├── services/
│   │   │   ├── weather_service.py    # OpenWeather REST client + in-memory TTL caching
│   │   │   ├── rain_intelligence.py  # Rain timeline, start/peak/end, dry windows
│   │   │   ├── risk_engine.py        # Algorithmic risk scores (0-100) & compound hazards
│   │   │   ├── profession_engine.py  # 18+ industry decision support profiles
│   │   │   ├── ai_agent.py           # Conversational AI agent with tool execution
│   │   │   ├── simulation_engine.py  # What-If hypothetical simulator
│   │   │   ├── community_service.py  # SQLite community report storage
│   │   │   └── health_service.py     # Live diagnostic status for API, Maps, Voice, AI
│   │   └── main.py                   # FastAPI application & API router
│   ├── run_backend.py                # Standalone startup script
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx            # Header, search, multilingual & profession pickers
│   │   │   ├── BottomNav.tsx         # Mobile bottom navigation bar
│   │   │   ├── CurrentWeatherCard.tsx # Real weather observation & freshness bar
│   │   │   ├── RainTimeline.tsx      # Dynamic hourly rain timeline widget
│   │   │   ├── HourlyForecastChart.tsx# Recharts temperature & rain probability
│   │   │   ├── DailyForecastList.tsx # 5-day daily forecast summaries
│   │   │   ├── AiRiskGauge.tsx       # AI risk scores (0-100) & compound hazards
│   │   │   ├── ProfessionAdvisory.tsx # Domain-tailored decision support
│   │   │   ├── WeatherMap.tsx        # Interactive GIS map with weather layers
│   │   │   ├── ChatInterface.tsx     # Voice & text conversational assistant
│   │   │   ├── WhatIfSimulator.tsx   # What-If scenario tester
│   │   │   ├── AlertCenter.tsx       # Official warnings vs AI risks vs community reports
│   │   │   ├── CommunityReportModal.tsx # Submit unverified field report
│   │   │   └── DataHealthModal.tsx   # SIH developer / judge telemetry page
│   │   ├── context/
│   │   │   ├── WeatherContext.tsx    # Location, profession, and weather telemetry
│   │   │   └── LanguageContext.tsx   # 14 languages & full translation dictionary
│   │   ├── services/
│   │   │   ├── api.ts                # Backend API proxy client
│   │   │   └── voice.ts              # Web Speech API abstraction (STT + TTS)
│   │   ├── types/
│   │   │   └── index.ts              # Strict TypeScript interfaces
│   │   ├── App.tsx                   # Multi-tab responsive layout
│   │   ├── main.tsx
│   │   └── index.css                 # Tailwind CSS & accessible design tokens
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Backend Configuration
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Configure your OpenWeather API key in `backend/.env`:
   ```ini
   OPENWEATHER_API_KEY=your_actual_openweather_api_key_here
   HOST=127.0.0.1
   PORT=8000
   ```
3. Start the FastAPI backend server:
   ```bash
   python run_backend.py
   ```
   *The backend will be live on `http://127.0.0.1:8000` with interactive API docs at `http://127.0.0.1:8000/docs`.*

### 2. Frontend Launch
1. In a separate terminal, navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies (if not already installed):
   ```bash
   npm install
   ```
3. Launch the Vite development server:
   ```bash
   npm run dev
   ```
   *Access the web app at `http://localhost:5173`.*

---

## 🛡 Security & Best Practices
- **Never expose API keys to the browser**: All OpenWeather requests are proxied via FastAPI.
- **Request deduplication & caching**: In-memory TTL cache prevents hammering API rate limits.
- **Input Sanitization**: Pydantic v2 validates all query parameters and JSON payloads.
