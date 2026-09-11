import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { LanguageProvider } from './context/LanguageContext';
import { WeatherProvider } from './context/WeatherContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LanguageProvider>
      <WeatherProvider>
        <App />
      </WeatherProvider>
    </LanguageProvider>
  </React.StrictMode>
);
