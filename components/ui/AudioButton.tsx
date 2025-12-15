"use client";

import { Volume2 } from "lucide-react";
import { speakNative } from "@/lib/audio";
import { useStore } from "@/store/useStore";
import { getLanguageByCode } from "@/lib/languages";

interface AudioButtonProps {
  text: string;
  className?: string;
}

export default function AudioButton({ text, className = "" }: AudioButtonProps) {
  const { currentLanguage, audioEnabled } = useStore();
  const language = getLanguageByCode(currentLanguage);

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (audioEnabled && text) {
      speakNative(text, language?.browserCode || "en-IN");
    }
  };

  if (!audioEnabled) return null;

  return (
    <button
      onClick={handleSpeak}
      className={`inline-flex items-center justify-center p-1.5 rounded-full bg-white/40 backdrop-blur-xl border border-white/60 hover:bg-white/60 text-green-600 transition-all hover:scale-110 active:scale-95 ${className}`}
      title="Listen"
      type="button"
      aria-label="Listen to this text"
    >
      <Volume2 className="w-3.5 h-3.5" />
    </button>
  );
}
