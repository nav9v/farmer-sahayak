"use client";

import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useStore } from "@/store/useStore";
import { useRouter } from "next/navigation";
import WeatherCard from "./cards/WeatherCard";
import { 
  Mic, 
  MessageCircle, 
  Camera, 
  BookOpen, 
  Stethoscope, 
  Calendar, 
  BarChart3, 
  Building2 
} from "lucide-react";
import ProfileHeader from "./ProfileHeader";
import AudioButton from "./ui/AudioButton";

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const currentLanguage = useStore((state) => state.currentLanguage);
  const router = useRouter();

  useEffect(() => {
    if (currentLanguage) {
      i18n.changeLanguage(currentLanguage);
    }
  }, [currentLanguage, i18n]);

  const navigateTo = (path: string) => {
    router.push(path);
  };

  return (
    <div className="min-h-screen bg-green-100">
      <ProfileHeader />
      
      {/* Main Grid */}
      <div className="container mx-auto px-3 md:px-4 py-4 md:py-6 max-w-6xl pb-24 md:pb-32">
        {/* Weather Card - Full Width Rectangle */}
        <div className="mb-4 md:mb-6">
          <WeatherCard />
        </div>

        {/* Action Cards - 4 Square Tiles in 2x2 Grid */}
        <div className="grid grid-cols-2 gap-4 md:gap-6">
          
          {/* Voice Input Card */}
          <button
            onClick={() => navigateTo("/voice")}
            className="group bg-white/20 backdrop-blur-2xl rounded-3xl md:rounded-4xl shadow-lg hover:shadow-2xl border border-white/40 p-6 md:p-8 h-48 md:h-64 transition-all duration-300 text-gray-800 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.4) 0%, rgba(192, 132, 252, 0.4) 50%, rgba(216, 180, 254, 0.4) 100%)' }}
          >
            <div className="absolute top-3 right-3 z-20">
              <AudioButton text={`${t('speak')}. ${t('askByVoice')}`} className="bg-white/40 hover:bg-white/60 text-gray-800" />
            </div>
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10 h-full flex flex-col items-center justify-center">
              <div className="w-16 h-16 md:w-24 md:h-24 bg-white/40 backdrop-blur-xl rounded-full flex items-center justify-center mb-3 md:mb-4 transition-transform border border-white/60">
                <Mic className="w-8 h-8 md:w-12 md:h-12 text-purple-700" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-2 text-gray-900">{t('speak')}</h3>
              <p className="text-xs md:text-sm text-gray-800 text-center px-2">{t('askByVoice')}</p>
            </div>
          </button>

          {/* Chat Card */}
          <button
            onClick={() => navigateTo("/chat")}
            className="group bg-white/20 backdrop-blur-2xl rounded-3xl md:rounded-4xl shadow-lg hover:shadow-2xl border border-white/40 p-6 md:p-8 h-48 md:h-64 transition-all duration-300 text-gray-800 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.4) 0%, rgba(74, 222, 128, 0.4) 50%, rgba(134, 239, 172, 0.4) 100%)' }}
          >
            <div className="absolute top-3 right-3 z-20">
              <AudioButton text={`${t('chat')}. ${t('typeToAsk')}`} className="bg-white/40 hover:bg-white/60 text-gray-800" />
            </div>
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10 h-full flex flex-col items-center justify-center">
              <div className="w-16 h-16 md:w-24 md:h-24 bg-white/40 backdrop-blur-xl rounded-full flex items-center justify-center mb-3 md:mb-4 transition-transform border border-white/60">
                <MessageCircle className="w-8 h-8 md:w-12 md:h-12 text-green-700" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-2 text-gray-900">{t('chat')}</h3>
              <p className="text-xs md:text-sm text-gray-800 text-center px-2">{t('typeToAsk')}</p>
            </div>
          </button>

          {/* Image Upload Card */}
          <button
            onClick={() => navigateTo("/image")}
            className="group bg-white/20 backdrop-blur-2xl rounded-3xl md:rounded-4xl shadow-lg hover:shadow-2xl border border-white/40 p-6 md:p-8 h-48 md:h-64 transition-all duration-300 text-gray-800 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.4) 0%, rgba(251, 146, 60, 0.4) 50%, rgba(251, 191, 36, 0.4) 100%)' }}
          >
            <div className="absolute top-3 right-3 z-20">
              <AudioButton text={`${t('uploadPhoto')}. ${t('checkCropDisease')}`} className="bg-white/40 hover:bg-white/60 text-gray-800" />
            </div>
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10 h-full flex flex-col items-center justify-center">
              <div className="w-16 h-16 md:w-24 md:h-24 bg-white/40 backdrop-blur-xl rounded-full flex items-center justify-center mb-3 md:mb-4 transition-transform border border-white/60">
                <Camera className="w-8 h-8 md:w-12 md:h-12 text-orange-700" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-2 text-gray-900">{t('uploadPhoto')}</h3>
              <p className="text-xs md:text-sm text-gray-800 text-center px-2">{t('checkCropDisease')}</p>
            </div>
          </button>

          {/* Learn Card */}
          <button
            onClick={() => navigateTo("/learn")}
            className="group bg-white/20 backdrop-blur-2xl rounded-3xl md:rounded-4xl shadow-lg hover:shadow-2xl border border-white/40 p-6 md:p-8 h-48 md:h-64 transition-all duration-300 text-gray-800 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(254, 215, 170, 0.5) 0%, rgba(253, 186, 116, 0.5) 50%, rgba(251, 146, 60, 0.5) 100%)' }}
          >
            <div className="absolute top-3 right-3 z-20">
              <AudioButton text={`${t('learn')}. ${t('listenAndLearn')}`} className="bg-white/40 hover:bg-white/60 text-gray-800" />
            </div>
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10 h-full flex flex-col items-center justify-center">
              <div className="w-16 h-16 md:w-24 md:h-24 bg-white/40 backdrop-blur-xl rounded-full flex items-center justify-center mb-3 md:mb-4 transition-transform border border-white/60">
                <BookOpen className="w-8 h-8 md:w-12 md:h-12 text-orange-700" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-2 text-gray-900">{t('learn')}</h3>
              <p className="text-xs md:text-sm text-gray-800 text-center px-2">{t('listenAndLearn')}</p>
            </div>
          </button>

          {/* Crop Doctor Card - NEW */}
          <button
            onClick={() => navigateTo("/crop-doctor")}
            className="group bg-white/20 backdrop-blur-2xl rounded-3xl md:rounded-4xl shadow-lg hover:shadow-2xl border border-white/40 p-6 md:p-8 h-48 md:h-64 transition-all duration-300 text-gray-800 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.4) 0%, rgba(45, 212, 191, 0.4) 50%, rgba(94, 234, 212, 0.4) 100%)' }}
          >
            <div className="absolute top-3 right-3 z-20">
              <AudioButton text={`${t('cropDoctor')}. ${t('cropDoctorDesc')}`} className="bg-white/40 hover:bg-white/60 text-gray-800" />
            </div>
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10 h-full flex flex-col items-center justify-center">
              <div className="w-16 h-16 md:w-24 md:h-24 bg-white/40 backdrop-blur-xl rounded-full flex items-center justify-center mb-3 md:mb-4 transition-transform border border-white/60">
                <Stethoscope className="w-8 h-8 md:w-12 md:h-12 text-teal-700" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-2 text-gray-900">{t('cropDoctor')}</h3>
              <p className="text-xs md:text-sm text-gray-800 text-center px-2">{t('cropDoctorDesc')}</p>
            </div>
          </button>

          {/* Almanac Card - NEW */}
          <button
            onClick={() => navigateTo("/almanac")}
            className="group bg-white/20 backdrop-blur-2xl rounded-3xl md:rounded-4xl shadow-lg hover:shadow-2xl border border-white/40 p-6 md:p-8 h-48 md:h-64 transition-all duration-300 text-gray-800 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.4) 0%, rgba(129, 140, 248, 0.4) 50%, rgba(165, 180, 252, 0.4) 100%)' }}
          >
            <div className="absolute top-3 right-3 z-20">
              <AudioButton text={`${t('almanac')}. ${t('almanacDesc')}`} className="bg-white/40 hover:bg-white/60 text-gray-800" />
            </div>
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10 h-full flex flex-col items-center justify-center">
              <div className="w-16 h-16 md:w-24 md:h-24 bg-white/40 backdrop-blur-xl rounded-full flex items-center justify-center mb-3 md:mb-4 transition-transform border border-white/60">
                <Calendar className="w-8 h-8 md:w-12 md:h-12 text-indigo-700" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-2 text-gray-900">{t('almanac')}</h3>
              <p className="text-xs md:text-sm text-gray-800 text-center px-2">{t('almanacDesc')}</p>
            </div>
          </button>

          {/* Farm Insights Card - NEW */}
          <button
            onClick={() => navigateTo("/insights")}
            className="group bg-white/20 backdrop-blur-2xl rounded-3xl md:rounded-4xl shadow-lg hover:shadow-2xl border border-white/40 p-6 md:p-8 h-48 md:h-64 transition-all duration-300 text-gray-800 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.4) 0%, rgba(251, 113, 133, 0.4) 50%, rgba(253, 164, 175, 0.4) 100%)' }}
          >
            <div className="absolute top-3 right-3 z-20">
              <AudioButton text={`${t('farmInsights')}. ${t('farmInsightsDesc')}`} className="bg-white/40 hover:bg-white/60 text-gray-800" />
            </div>
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10 h-full flex flex-col items-center justify-center">
              <div className="w-16 h-16 md:w-24 md:h-24 bg-white/40 backdrop-blur-xl rounded-full flex items-center justify-center mb-3 md:mb-4 transition-transform border border-white/60">
                <BarChart3 className="w-8 h-8 md:w-12 md:h-12 text-rose-700" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-2 text-gray-900">{t('farmInsights')}</h3>
              <p className="text-xs md:text-sm text-gray-800 text-center px-2">{t('farmInsightsDesc')}</p>
            </div>
          </button>

          {/* Government Schemes Card - NEW */}
          <button
            onClick={() => navigateTo("/schemes")}
            className="group bg-white/20 backdrop-blur-2xl rounded-3xl md:rounded-4xl shadow-lg hover:shadow-2xl border border-white/40 p-6 md:p-8 h-48 md:h-64 transition-all duration-300 text-gray-800 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.4) 0%, rgba(251, 191, 36, 0.4) 50%, rgba(253, 224, 71, 0.4) 100%)' }}
          >
            <div className="absolute top-3 right-3 z-20">
              <AudioButton text={`${t('govSchemes')}. ${t('govSchemesDesc')}`} className="bg-white/40 hover:bg-white/60 text-gray-800" />
            </div>
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10 h-full flex flex-col items-center justify-center">
              <div className="w-16 h-16 md:w-24 md:h-24 bg-white/40 backdrop-blur-xl rounded-full flex items-center justify-center mb-3 md:mb-4 transition-transform border border-white/60">
                <Building2 className="w-8 h-8 md:w-12 md:h-12 text-amber-700" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-2 text-gray-900">{t('govSchemes')}</h3>
              <p className="text-xs md:text-sm text-gray-800 text-center px-2">{t('govSchemesDesc')}</p>
            </div>
          </button>

        </div>
        
        {/* Website Info Section - Static */}
        <div className="mt-8 mb-4">
          <div className="bg-white/30 backdrop-blur-2xl rounded-3xl shadow-lg border border-white/40 p-5 md:p-6" style={{ background: 'linear-gradient(135deg, rgba(134, 239, 172, 0.35) 0%, rgba(167, 243, 208, 0.35) 100%)' }}>
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="shrink-0">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-white/40 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/60">
                  <span className="text-2xl md:text-3xl">🌾</span>
                </div>
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/60">
                    <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
                    <h3 className="text-base md:text-lg font-bold text-gray-900">{t('appName')}</h3>
                  </div>
                  <AudioButton text={`${t('appName')}. ${t('websiteInfo')}`} />
                </div>
                <p className="text-xs md:text-sm text-gray-800 leading-relaxed">{t('websiteInfo')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Grass Animation at Bottom */}
      <div className="fixed bottom-0 left-0 right-0 w-full h-20 md:h-28 pointer-events-none z-40">
        <img 
          src="/grass.gif" 
          alt="Grass" 
          className="w-full h-full object-cover object-bottom"
        />
      </div>
    </div>
  );
}
