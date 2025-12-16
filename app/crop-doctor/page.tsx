"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Stethoscope, 
  AlertTriangle, 
  Shield, 
  CheckCircle, 
  Loader2,
  Thermometer,
  Droplets,
  Wind,
  RefreshCw,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Activity
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { getCropHealthPrediction, getAICropAdvice } from "@/actions/crop-insights";
import { getPlantAnalysisHistory } from "@/actions/plant-history";
import { getWeather } from "@/actions/weather";
import FarmingBackground from "@/components/FarmingBackground";
import AudioButton from "@/components/ui/AudioButton";

interface CropHealthPrediction {
  riskLevel: "low" | "medium" | "high";
  riskScore: number;
  predictions: string[];
  recommendations: string[];
  weatherAlert?: string;
}

export default function CropDoctorPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const currentLanguage = useStore((state) => state.currentLanguage);
  const sessionId = useStore((state) => state.sessionId);
  const lat = useStore((state) => state.lat);
  const lon = useStore((state) => state.lon);
  
  const [prediction, setPrediction] = useState<CropHealthPrediction | null>(null);
  const [aiAdvice, setAiAdvice] = useState<string>("");
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);

  useEffect(() => {
    if (currentLanguage) {
      i18n.changeLanguage(currentLanguage);
    }
  }, [currentLanguage, i18n]);

  useEffect(() => {
    loadData();
  }, [sessionId, lat, lon, currentLanguage]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load prediction
      const predictionResult = await getCropHealthPrediction(
        sessionId,
        lat,
        lon,
        currentLanguage
      );
      setPrediction(predictionResult);

      // Load weather
      if (lat && lon) {
        const weatherResult = await getWeather(lat, lon, currentLanguage.split("-")[0]);
        if (weatherResult.success) {
          setWeather(weatherResult.data);
        }
      }
    } catch (error) {
      console.error("Error loading crop doctor data:", error);
    }
    setLoading(false);
  };

  const generateAIAdvice = async () => {
    if (!prediction) return;
    
    setLoadingAdvice(true);
    try {
      const history = await getPlantAnalysisHistory(sessionId);
      const recentDiseases = history
        .filter((h) => !h.isHealthy)
        .map((h) => h.disease)
        .slice(0, 5);
      
      const plantTypes = [...new Set(history.map((h) => h.plantName).filter(Boolean))] as string[];

      const advice = await getAICropAdvice(
        {
          recentDiseases,
          weather: weather ? {
            temperature: weather.temperature,
            humidity: weather.humidity,
            description: weather.description,
          } : undefined,
          plantTypes,
        },
        currentLanguage
      );
      setAiAdvice(advice);
    } catch (error) {
      console.error("Error generating AI advice:", error);
    }
    setLoadingAdvice(false);
  };

  const handleBackClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newRipple = { x, y, id: Date.now() };
    setRipples([...ripples, newRipple]);
    
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 600);
    
    setIsExiting(true);
    setTimeout(() => {
      router.push("/");
    }, 300);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "high": return "from-red-500 to-rose-600";
      case "medium": return "from-amber-500 to-orange-600";
      default: return "from-emerald-500 to-green-600";
    }
  };

  const getRiskBgColor = (level: string) => {
    switch (level) {
      case "high": return "rgba(239, 68, 68, 0.15)";
      case "medium": return "rgba(251, 191, 36, 0.15)";
      default: return "rgba(34, 197, 94, 0.15)";
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case "high": return <AlertTriangle className="w-8 h-8 text-red-600" />;
      case "medium": return <Activity className="w-8 h-8 text-amber-600" />;
      default: return <Shield className="w-8 h-8 text-emerald-600" />;
    }
  };

  return (
    <div className={`fixed inset-0 flex flex-col bg-linear-to-br from-teal-50 via-cyan-50 to-emerald-50 transition-transform duration-300 ${isExiting ? 'translate-x-full' : 'translate-x-0'}`}>
      <FarmingBackground />
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Header */}
        <header className="px-2 pt-2 sm:px-3 sm:pt-3">
          <div className="bg-white/70 backdrop-blur-2xl rounded-2xl sm:rounded-3xl border border-teal-100/50 px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 shadow-xl">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={handleBackClick}
                className="relative p-2 hover:bg-teal-100 rounded-full transition-colors overflow-hidden"
                aria-label="Back to home"
              >
                {ripples.map((ripple) => (
                  <span
                    key={ripple.id}
                    className="absolute rounded-full bg-teal-400/40 animate-ripple pointer-events-none"
                    style={{
                      left: ripple.x,
                      top: ripple.y,
                      width: '20px',
                      height: '20px',
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                ))}
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-teal-700 relative z-10" />
              </button>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-linear-to-br from-teal-500 to-emerald-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                <Stethoscope className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-800">{t('cropDoctor')}</h2>
                <p className="text-xs text-gray-600 hidden sm:block">{t('cropDoctorDesc')}</p>
              </div>
              <button
                onClick={loadData}
                className="p-2 hover:bg-teal-100 rounded-full transition-colors"
                disabled={loading}
              >
                <RefreshCw className={`w-5 h-5 text-teal-600 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-3 sm:p-4 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-4">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-teal-600" />
                  <p className="text-gray-600">{t('analyzing')}...</p>
                </div>
              </div>
            ) : prediction ? (
              <>
                {/* Risk Score Card */}
                <div 
                  className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/50 p-6 overflow-hidden relative"
                  style={{ background: getRiskBgColor(prediction.riskLevel) }}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                    {getRiskIcon(prediction.riskLevel)}
                  </div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {getRiskIcon(prediction.riskLevel)}
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">{t('riskLevel')}</h3>
                        <p className={`text-sm font-semibold capitalize ${
                          prediction.riskLevel === 'high' ? 'text-red-600' :
                          prediction.riskLevel === 'medium' ? 'text-amber-600' : 'text-emerald-600'
                        }`}>
                          {t(`risk_${prediction.riskLevel}`)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-4xl font-bold bg-linear-to-r ${getRiskColor(prediction.riskLevel)} bg-clip-text text-transparent`}>
                        {prediction.riskScore}%
                      </div>
                      <p className="text-xs text-gray-500">{t('riskScore')}</p>
                    </div>
                  </div>

                  {/* Risk Bar */}
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-linear-to-r ${getRiskColor(prediction.riskLevel)} transition-all duration-1000`}
                      style={{ width: `${prediction.riskScore}%` }}
                    />
                  </div>
                </div>

                {/* Weather Alert */}
                {prediction.weatherAlert && (
                  <div className="bg-linear-to-r from-amber-100 to-orange-100 rounded-2xl p-4 border border-amber-200/50 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-amber-800 mb-1">{t('weatherAlert')}</h4>
                      <p className="text-sm text-amber-700">{prediction.weatherAlert}</p>
                    </div>
                    <AudioButton text={prediction.weatherAlert} />
                  </div>
                )}

                {/* Current Weather */}
                {weather && (
                  <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-4 border border-white/40">
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <span className="text-2xl">
                        {weather.description?.includes('rain') ? '🌧️' : 
                         weather.description?.includes('cloud') ? '☁️' : 
                         weather.description?.includes('clear') ? '☀️' : '🌤️'}
                      </span>
                      {t('currentWeather')}
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <Thermometer className="w-5 h-5 text-red-500" />
                        <div>
                          <p className="text-lg font-bold text-gray-800">{weather.temperature}°C</p>
                          <p className="text-xs text-gray-500">{t('temperature')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Droplets className="w-5 h-5 text-blue-500" />
                        <div>
                          <p className="text-lg font-bold text-gray-800">{weather.humidity}%</p>
                          <p className="text-xs text-gray-500">{t('humidity')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Wind className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="text-lg font-bold text-gray-800">{weather.windSpeed} m/s</p>
                          <p className="text-xs text-gray-500">{t('wind')}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Predictions */}
                <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-5 border border-white/40">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-gray-800 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-teal-600" />
                      {t('potentialRisks')}
                    </h4>
                    <AudioButton 
                      text={`${t('potentialRisks')}: ${prediction.predictions.join(', ')}`} 
                    />
                  </div>
                  <div className="space-y-2">
                    {prediction.predictions.map((pred, idx) => (
                      <div 
                        key={idx}
                        className="flex items-center gap-3 p-3 bg-gray-50/80 rounded-xl"
                      >
                        <div className="w-2 h-2 rounded-full bg-linear-to-r from-teal-500 to-emerald-500" />
                        <span className="text-gray-700">{pred}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-5 border border-white/40">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-gray-800 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                      {t('recommendations')}
                    </h4>
                    <AudioButton 
                      text={`${t('recommendations')}: ${prediction.recommendations.join('. ')}`} 
                    />
                  </div>
                  <div className="space-y-2">
                    {prediction.recommendations.map((rec, idx) => (
                      <div 
                        key={idx}
                        className="flex items-start gap-3 p-3 bg-emerald-50/80 rounded-xl"
                      >
                        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-emerald-600">{idx + 1}</span>
                        </div>
                        <span className="text-gray-700">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Advice Section */}
                <div className="bg-linear-to-br from-purple-50 to-indigo-50 rounded-2xl p-5 border border-purple-100/50">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-gray-800 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                      {t('aiAdvice')}
                    </h4>
                    {aiAdvice && (
                      <AudioButton text={aiAdvice} />
                    )}
                  </div>
                  
                  {aiAdvice ? (
                    <div className="prose prose-sm max-w-none">
                      <p className="text-gray-700 whitespace-pre-line">{aiAdvice}</p>
                    </div>
                  ) : (
                    <button
                      onClick={generateAIAdvice}
                      disabled={loadingAdvice}
                      className="w-full py-4 bg-linear-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-purple-600 hover:to-indigo-700 transition-all disabled:opacity-50"
                    >
                      {loadingAdvice ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          {t('generating')}...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          {t('getPersonalizedAdvice')}
                        </>
                      )}
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <Stethoscope className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">{t('noDataAvailable')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
