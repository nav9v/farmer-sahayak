"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { User, Trash2, PlusCircle, Volume2, VolumeX, Menu, X, Globe, RefreshCw, Sun, Moon } from "lucide-react";
import { useStore } from "@/store/useStore";
import { getLanguageByCode } from "@/lib/languages";
import AudioButton from "./ui/AudioButton";

export default function ProfileHeader() {
  const { t, i18n } = useTranslation();
  const sessionId = useStore((state) => state.sessionId);
  const currentLanguage = useStore((state) => state.currentLanguage);
  const audioEnabled = useStore((state) => state.audioEnabled);
  const setSessionId = useStore((state) => state.setSessionId);
  const setLanguage = useStore((state) => state.setLanguage);
  const setAudioEnabled = useStore((state) => state.setAudioEnabled);
  const [menuOpen, setMenuOpen] = useState(false);
  const language = getLanguageByCode(currentLanguage);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    if (currentLanguage) {
      i18n.changeLanguage(currentLanguage);
    }
  }, [currentLanguage, i18n]);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting(t('goodMorning'));
    } else if (hour >= 12 && hour < 17) {
      setGreeting(t('goodAfternoon'));
    } else if (hour >= 17 && hour < 21) {
      setGreeting(t('goodEvening'));
    } else {
      setGreeting(t('goodNight'));
    }
  }, [t]);

  const generateNewUUID = () => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  const handleNewSession = () => {
    if (confirm(t('newSessionConfirm'))) {
      const newId = generateNewUUID();
      setSessionId(newId);
      localStorage.removeItem("farmer-chat-messages");
      window.location.href = "/";
    }
  };

  const handleDeleteData = () => {
    if (confirm(t('deleteAllConfirm'))) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleChangeLanguage = () => {
    if (confirm(t('changeLanguageConfirm'))) {
      setLanguage("");
      window.location.href = "/";
    }
  };

  return (
    <header className="sticky top-0 z-50 px-3 pt-3">
      <div className="container mx-auto max-w-7xl">
        <div className="bg-white/30 backdrop-blur-2xl shadow-lg rounded-3xl border border-white/40 px-4 md:px-6 py-3 md:py-4" style={{ background: 'linear-gradient(135deg, rgba(167, 243, 208, 0.4) 0%, rgba(134, 239, 172, 0.4) 100%)' }}>
          <div className="flex items-center justify-between">
            
            {/* Logo & Greeting */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-white/40 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/60">
                {new Date().getHours() >= 6 && new Date().getHours() < 18 ? (
                  <Sun className="w-5 h-5 md:w-6 md:h-6 text-yellow-600 drop-shadow-[0_0_12px_rgba(202,138,4,0.8)] fill-yellow-400" />
                ) : (
                  <Moon className="w-5 h-5 md:w-6 md:h-6 text-blue-400 drop-shadow-[0_0_12px_rgba(96,165,250,0.8)] fill-blue-200" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <h1 className="text-base md:text-xl font-bold text-gray-900 leading-tight">{greeting}</h1>
                <AudioButton text={greeting} />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 md:gap-3">
            
            {/* Language Badge */}
            <div className="hidden md:flex items-center gap-2 bg-white/50 backdrop-blur-sm border border-white/60 rounded-full px-4 py-2 shadow-sm">
              <Globe className="w-4 h-4 text-green-700" />
              <span className="text-sm font-semibold text-gray-800">{language?.name || "English"}</span>
            </div>
            
            {/* Audio Toggle - Always Visible & Big */}
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className={`p-2 md:p-3 rounded-full transition-all shadow-md ${
                audioEnabled 
                  ? "bg-green-500 text-white shadow-green-200" 
                  : "bg-gray-100 text-gray-400"
              }`}
              title={audioEnabled ? t('audioOn') : t('audioOff')}
            >
              {audioEnabled ? <Volume2 className="w-5 h-5 md:w-6 md:h-6" /> : <VolumeX className="w-5 h-5 md:w-6 md:h-6" />}
            </button>

            {/* Desktop: Quick Actions */}
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={handleNewSession}
                className="flex items-center gap-2 bg-green-50/80 backdrop-blur-sm text-green-700 px-4 py-2 rounded-full hover:bg-green-100 transition-all border border-green-200/50 font-semibold shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span>{t('newSession')}</span>
                <AudioButton text={t('newSession')} className="ml-1" />
              </button>

              <button
                onClick={handleChangeLanguage}
                className="flex items-center gap-2 bg-blue-50/80 backdrop-blur-sm text-blue-700 px-4 py-2 rounded-full hover:bg-blue-100 transition-all border border-blue-200/50 font-semibold shadow-sm"
              >
                <Globe className="w-4 h-4" />
                <span>{t('changeLanguage')}</span>
                <AudioButton text={t('changeLanguage')} className="ml-1" />
              </button>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-full hover:bg-gray-100/80 text-gray-700 transition-all md:hidden shadow-sm"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

        {/* Mobile Menu - Clean & Spacious */}
        {menuOpen && (
          <div className="mt-3 md:hidden bg-white/30 backdrop-blur-2xl rounded-2xl shadow-lg border border-white/40 overflow-hidden animate-in slide-in-from-top-2 duration-200" style={{ background: 'linear-gradient(135deg, rgba(167, 243, 208, 0.4) 0%, rgba(134, 239, 172, 0.4) 100%)' }}>
            <div className="p-4 space-y-3">
              
              {/* Language Change Button with Current Language */}
              {/* Change Language */}
              <button
                onClick={() => { handleChangeLanguage(); setMenuOpen(false); }}
                className="w-full flex items-center justify-between bg-white/50 backdrop-blur-sm p-4 rounded-xl hover:bg-white/70 transition-all border border-white/60"
              >
                <span className="text-sm font-semibold text-gray-900">{t('changeLanguage')}</span>
                <div className="flex items-center gap-2 bg-white/60 px-3 py-1.5 rounded-full border border-white/60">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-xs font-bold text-gray-900">{language?.name || "English"}</span>
                </div>
              </button>
              
              {/* User Info Card with New Session & Delete */}
              <div className="flex gap-2">
                <div className="flex-1 bg-white/50 backdrop-blur-sm rounded-xl p-4 flex items-center gap-3 border border-white/60">
                  <div className="w-10 h-10 bg-white/70 rounded-full flex items-center justify-center text-blue-700 shadow-sm">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900">{t('guestId')}</p>
                    <p className="text-xs font-mono text-gray-700">{sessionId.slice(0, 8)}...</p>
                  </div>
                  <button
                    onClick={() => { handleDeleteData(); setMenuOpen(false); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                    <span className="text-xs font-semibold text-red-600">{t('deleteData')}</span>
                  </button>
                </div>
                
                <button
                  onClick={() => { handleNewSession(); setMenuOpen(false); }}
                  className="flex flex-col items-center justify-center gap-1 bg-white/50 backdrop-blur-sm px-4 py-3 rounded-xl hover:bg-white/70 transition-all border border-white/60"
                >
                  <RefreshCw className="w-6 h-6 text-green-700" />
                  <span className="text-xs font-semibold text-gray-900">{t('newSession')}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
