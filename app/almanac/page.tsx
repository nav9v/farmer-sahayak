"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Calendar,
  Loader2,
  Droplets,
  Sun,
  Leaf,
  Bug,
  Scissors,
  ChevronRight,
  Cloud,
  AlertCircle,
  Sprout
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { getCropCalendar } from "@/actions/crop-insights";
import FarmingBackground from "@/components/FarmingBackground";
import AudioButton from "@/components/ui/AudioButton";

interface CropCalendarItem {
  month: string;
  activities: {
    type: "sowing" | "harvesting" | "fertilizing" | "watering" | "pest-control";
    crop: string;
    description: string;
    timing: string;
  }[];
  weatherTip?: string;
}

export default function AlmanacPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const currentLanguage = useStore((state) => state.currentLanguage);
  const lat = useStore((state) => state.lat);
  const lon = useStore((state) => state.lon);
  
  const [calendar, setCalendar] = useState<CropCalendarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMonth, setActiveMonth] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);

  useEffect(() => {
    if (currentLanguage) {
      i18n.changeLanguage(currentLanguage);
    }
  }, [currentLanguage, i18n]);

  useEffect(() => {
    loadCalendar();
  }, [lat, lon, currentLanguage]);

  const loadCalendar = async () => {
    setLoading(true);
    try {
      const data = await getCropCalendar(lat, lon, currentLanguage);
      setCalendar(data);
    } catch (error) {
      console.error("Error loading calendar:", error);
    }
    setLoading(false);
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

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "sowing": return <Sprout className="w-5 h-5" />;
      case "harvesting": return <Scissors className="w-5 h-5" />;
      case "fertilizing": return <Leaf className="w-5 h-5" />;
      case "watering": return <Droplets className="w-5 h-5" />;
      case "pest-control": return <Bug className="w-5 h-5" />;
      default: return <Sun className="w-5 h-5" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "sowing": return { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200" };
      case "harvesting": return { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200" };
      case "fertilizing": return { bg: "bg-green-100", text: "text-green-700", border: "border-green-200" };
      case "watering": return { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200" };
      case "pest-control": return { bg: "bg-red-100", text: "text-red-700", border: "border-red-200" };
      default: return { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-200" };
    }
  };

  const getCurrentSeason = () => {
    const month = new Date().getMonth() + 1;
    if ([6, 7, 8, 9, 10].includes(month)) return { name: t('kharif'), emoji: "🌧️" };
    if ([11, 12, 1, 2, 3].includes(month)) return { name: t('rabi'), emoji: "❄️" };
    return { name: t('zaid'), emoji: "☀️" };
  };

  const season = getCurrentSeason();

  return (
    <div className={`fixed inset-0 flex flex-col bg-linear-to-br from-indigo-50 via-blue-50 to-purple-50 transition-transform duration-300 ${isExiting ? 'translate-x-full' : 'translate-x-0'}`}>
      <FarmingBackground />
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Header */}
        <header className="px-2 pt-2 sm:px-3 sm:pt-3">
          <div className="bg-white/70 backdrop-blur-2xl rounded-2xl sm:rounded-3xl border border-indigo-100/50 px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 shadow-xl">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={handleBackClick}
                className="relative p-2 hover:bg-indigo-100 rounded-full transition-colors overflow-hidden"
                aria-label="Back to home"
              >
                {ripples.map((ripple) => (
                  <span
                    key={ripple.id}
                    className="absolute rounded-full bg-indigo-400/40 animate-ripple pointer-events-none"
                    style={{
                      left: ripple.x,
                      top: ripple.y,
                      width: '20px',
                      height: '20px',
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                ))}
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-700 relative z-10" />
              </button>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-linear-to-br from-indigo-500 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                <Calendar className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-800">{t('almanac')}</h2>
                <p className="text-xs text-gray-600 hidden sm:block">{t('almanacDesc')}</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-100/80 rounded-full">
                <span className="text-lg">{season.emoji}</span>
                <span className="text-sm font-medium text-indigo-700">{season.name}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-3 sm:p-4 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-4">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-indigo-600" />
                  <p className="text-gray-600">{t('loadingCalendar')}...</p>
                </div>
              </div>
            ) : calendar.length > 0 ? (
              <>
                {/* Month Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {calendar.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveMonth(idx)}
                      className={`shrink-0 px-4 py-2 rounded-xl font-medium transition-all ${
                        activeMonth === idx
                          ? 'bg-linear-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                          : 'bg-white/60 text-gray-700 hover:bg-white/80'
                      }`}
                    >
                      {idx === 0 ? `📍 ${item.month}` : item.month}
                    </button>
                  ))}
                </div>

                {/* Weather Tip for Current Month */}
                {calendar[activeMonth]?.weatherTip && activeMonth === 0 && (
                  <div className="bg-linear-to-r from-sky-100 to-blue-100 rounded-2xl p-4 border border-sky-200/50 flex items-start gap-3">
                    <Cloud className="w-5 h-5 text-sky-600 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-sky-800 mb-1">{t('todaysTip')}</h4>
                      <p className="text-sm text-sky-700">{calendar[activeMonth].weatherTip}</p>
                    </div>
                    <AudioButton text={calendar[activeMonth].weatherTip || ""} />
                  </div>
                )}

                {/* Season Info Card */}
                <div className="bg-linear-to-br from-purple-100/80 to-indigo-100/80 rounded-2xl p-5 border border-purple-200/50">
                  <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="text-2xl">{season.emoji}</span>
                    {t('currentSeason')}: {season.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {season.name === t('kharif') && t('kharifDesc')}
                    {season.name === t('rabi') && t('rabiDesc')}
                    {season.name === t('zaid') && t('zaidDesc')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {season.name === t('kharif') && ['🌾 Rice', '🌿 Cotton', '🌽 Maize', '🥜 Groundnut'].map((crop) => (
                      <span key={crop} className="px-3 py-1 bg-white/60 rounded-full text-sm text-gray-700">{crop}</span>
                    ))}
                    {season.name === t('rabi') && ['🌾 Wheat', '🥔 Potato', '🌱 Mustard', '🫘 Chickpea'].map((crop) => (
                      <span key={crop} className="px-3 py-1 bg-white/60 rounded-full text-sm text-gray-700">{crop}</span>
                    ))}
                    {season.name === t('zaid') && ['🍉 Watermelon', '🥒 Cucumber', '🥬 Vegetables'].map((crop) => (
                      <span key={crop} className="px-3 py-1 bg-white/60 rounded-full text-sm text-gray-700">{crop}</span>
                    ))}
                  </div>
                </div>

                {/* Activities */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-800">{t('activities')} - {calendar[activeMonth]?.month}</h3>
                    <AudioButton 
                      text={`${calendar[activeMonth]?.month} ${t('activities')}: ${
                        calendar[activeMonth]?.activities.map(a => `${a.crop}: ${a.description}`).join('. ')
                      }`}
                    />
                  </div>
                  
                  {calendar[activeMonth]?.activities.map((activity, idx) => {
                    const colors = getActivityColor(activity.type);
                    return (
                      <div 
                        key={idx}
                        className={`bg-white/80 backdrop-blur-sm rounded-2xl p-4 border ${colors.border} hover:shadow-md transition-all`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-xl ${colors.bg} ${colors.text}`}>
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-gray-800">{activity.crop}</h4>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                                {t(`activity_${activity.type}`)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Calendar className="w-3 h-3" />
                              <span>{activity.timing}</span>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Quick Tips */}
                <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-5 border border-white/40">
                  <h3 className="font-bold text-gray-800 mb-4">{t('quickTips')}</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-emerald-50 rounded-xl">
                      <Sprout className="w-5 h-5 text-emerald-600 mb-2" />
                      <h4 className="text-sm font-semibold text-gray-800">{t('tip_sowing')}</h4>
                      <p className="text-xs text-gray-600">{t('tip_sowing_desc')}</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-xl">
                      <Droplets className="w-5 h-5 text-blue-600 mb-2" />
                      <h4 className="text-sm font-semibold text-gray-800">{t('tip_watering')}</h4>
                      <p className="text-xs text-gray-600">{t('tip_watering_desc')}</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-xl">
                      <Leaf className="w-5 h-5 text-green-600 mb-2" />
                      <h4 className="text-sm font-semibold text-gray-800">{t('tip_fertilizing')}</h4>
                      <p className="text-xs text-gray-600">{t('tip_fertilizing_desc')}</p>
                    </div>
                    <div className="p-3 bg-red-50 rounded-xl">
                      <Bug className="w-5 h-5 text-red-600 mb-2" />
                      <h4 className="text-sm font-semibold text-gray-800">{t('tip_pest')}</h4>
                      <p className="text-xs text-gray-600">{t('tip_pest_desc')}</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">{t('noCalendarData')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
