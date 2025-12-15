"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/store/useStore";
import LanguageSelector from "@/components/LanguageSelector";
import Dashboard from "@/components/Dashboard";

export default function Home() {
  const currentLanguage = useStore((state) => state.currentLanguage);
  const languageSelected = useStore((state) => state.languageSelected);
  const [mounted, setMounted] = useState(false);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show language selector if no language is selected yet
  if (!languageSelected || !currentLanguage) {
    return <LanguageSelector />;
  }

  // Show dashboard with all features
  return <Dashboard />;
}
