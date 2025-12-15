"use client";

import { Languages } from "lucide-react";
import { useStore } from "@/store/useStore";
import { LANGUAGES } from "@/lib/languages";
import { speakNative } from "@/lib/audio";

export default function LanguageSelector() {
  const { setLanguage, setAudioEnabled } = useStore();

  const handleLanguageSelect = (langCode: string) => {
    setLanguage(langCode);
    setAudioEnabled(true); // Enable audio by default
  };

  const handleSpeak = (text: string, browserCode: string, e: React.MouseEvent) => {
    e.stopPropagation();
    speakNative(text, browserCode);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4">
            <Languages className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Farmer Sahayak
          </h1>
          <p className="text-gray-600">
            Select Your Language / अपनी भाषा चुनें
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {LANGUAGES.map((lang) => (
            <div
              key={lang.code}
              className="group relative bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-green-500 hover:bg-green-50 transition-all cursor-pointer"
              onClick={() => handleLanguageSelect(lang.code)}
            >
              <div className="text-center">
                <div className="text-2xl font-semibold text-gray-800 mb-1">
                  {lang.name}
                </div>
                <div className="text-sm text-gray-500">{lang.englishName}</div>
              </div>
              
              {/* Speaker icon */}
              <button
                onClick={(e) => handleSpeak(`${lang.name}. ${lang.englishName}`, lang.browserCode, e)}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-gray-100 opacity-0 group-hover:opacity-100 hover:bg-green-100 transition-all"
                title="Listen"
                type="button"
              >
                <svg
                  className="w-4 h-4 text-gray-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            आपकी भाषा में कृषि सलाह | Agricultural advice in your language
          </p>
        </div>
      </div>
    </div>
  );
}
