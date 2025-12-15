"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Cloud, Droplets, Wind, MapPin, Volume2, Loader2, RefreshCw, Thermometer } from "lucide-react";
import { useStore } from "@/store/useStore";
import { getWeather } from "@/actions/weather";
import { speakNative } from "@/lib/audio";
import { getLanguageByCode } from "@/lib/languages";

export default function WeatherCard() {
  const { t, i18n } = useTranslation();
  const lat = useStore((state) => state.lat);
  const lon = useStore((state) => state.lon);
  const currentLanguage = useStore((state) => state.currentLanguage);
  const setLocation = useStore((state) => state.setLocation);
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const language = getLanguageByCode(currentLanguage);

  useEffect(() => {
    if (currentLanguage) {
      i18n.changeLanguage(currentLanguage);
    }
  }, [currentLanguage, i18n]);

  useEffect(() => {
    if (lat && lon) {
      fetchWeather();
    } else {
      requestLocation();
    }
  }, [lat, lon]);

  const requestLocation = () => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation(position.coords.latitude.toString(), position.coords.longitude.toString());
        },
        () => setLoading(false)
      );
    } else {
      setLoading(false);
    }
  };

  const fetchWeather = async () => {
    if (!lat || !lon) return;
    setLoading(true);
    const result = await getWeather(lat, lon, currentLanguage.split("-")[0]);
    if (result.success && result.data) {
      setWeather(result.data);
    }
    setLoading(false);
  };

  const handleSpeak = () => {
    if (!weather) return;
    const text = `${t('weather')}: ${weather.description}, ${weather.temperature} डिग्री, नमी ${weather.humidity} प्रतिशत`;
    speakNative(text, language?.browserCode || "en-IN");
  };

  if (loading) {
    return (
      <div className="bg-white/30 backdrop-blur-2xl rounded-3xl shadow-lg border border-white/40 p-8 h-48 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(96, 165, 250, 0.4) 0%, rgba(59, 130, 246, 0.4) 100%)' }}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-3 text-blue-700" />
          <p className="text-lg font-medium text-gray-800">{t('loadingWeather')}</p>
        </div>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="bg-white/30 backdrop-blur-2xl rounded-3xl shadow-lg border border-white/40 p-8 h-48 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.4) 0%, rgba(249, 115, 22, 0.4) 100%)' }}>
        <div className="flex items-center gap-4">
          <MapPin className="w-12 h-12 text-orange-700" />
          <div>
            <p className="text-2xl font-bold mb-1 text-gray-900">{t('locationNeeded')}</p>
          </div>
        </div>
        <button
          onClick={requestLocation}
          className="bg-white/60 text-orange-700 px-8 py-4 rounded-2xl font-bold hover:bg-white/80 hover:shadow-lg transition-all border border-white/40"
        >
          {t('enableLocation')}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white/30 backdrop-blur-2xl rounded-3xl shadow-lg border border-white/40 p-8 h-48 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(96, 165, 250, 0.4) 0%, rgba(59, 130, 246, 0.4) 50%, rgba(99, 102, 241, 0.4) 100%)' }}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <Cloud className="w-32 h-32 absolute -top-8 -right-8 text-blue-700" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex items-center justify-between">
        {/* Left: Location and Temperature */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-5 h-5 text-blue-700" />
            <p className="text-xl font-semibold text-gray-900">{weather.location}</p>
          </div>
          
          <div className="flex items-baseline gap-3 mb-4">
            <div className="text-6xl font-bold text-gray-900">{weather.temperature}°C</div>
            <div className="text-lg text-gray-800 capitalize">{weather.description}</div>
          </div>
          
          {/* Weather Details */}
          <div className="flex gap-8">
            <div className="flex items-center gap-2">
              <Droplets className="w-5 h-5 text-blue-600" />
              <span className="text-lg font-medium text-gray-800">{weather.humidity}%</span>
            </div>
            <div className="flex items-center gap-2">
              <Wind className="w-5 h-5 text-blue-600" />
              <span className="text-lg font-medium text-gray-800">{weather.windSpeed} m/s</span>
            </div>
          </div>
        </div>

        {/* Right: Weather Icon and Controls */}
        <div className="flex flex-col items-end gap-4">
          <div className="text-7xl">
            {weather.description.includes('rain') ? '🌧️' : 
             weather.description.includes('cloud') ? '☁️' : 
             weather.description.includes('clear') ? '☀️' : '🌤️'}
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleSpeak}
              className="p-3 bg-white/40 hover:bg-white/60 rounded-2xl transition-all backdrop-blur-sm border border-white/40 text-blue-700"
              title={t('listen')}
            >
              <Volume2 className="w-5 h-5" />
            </button>
            <button
              onClick={fetchWeather}
              className="p-3 bg-white/40 hover:bg-white/60 rounded-2xl transition-all backdrop-blur-sm border border-white/40 text-blue-700"
              title={t('refresh')}
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
