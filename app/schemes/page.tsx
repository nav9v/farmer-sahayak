"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Building2,
  Loader2,
  ExternalLink,
  CheckCircle,
  Users,
  Wallet,
  Shield,
  RefreshCw,
  ChevronRight,
  Sparkles,
  Info
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { getGovernmentSchemes } from "@/actions/crop-insights";
import FarmingBackground from "@/components/FarmingBackground";
import AudioButton from "@/components/ui/AudioButton";

interface Scheme {
  name: string;
  description: string;
  eligibility: string;
  benefits: string;
  link?: string;
}

export default function SchemesPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const currentLanguage = useStore((state) => state.currentLanguage);
  
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);

  useEffect(() => {
    if (currentLanguage) {
      i18n.changeLanguage(currentLanguage);
    }
  }, [currentLanguage, i18n]);

  useEffect(() => {
    loadSchemes();
  }, [currentLanguage]);

  const loadSchemes = async () => {
    setLoading(true);
    try {
      const data = await getGovernmentSchemes(currentLanguage);
      setSchemes(data.schemes);
    } catch (error) {
      console.error("Error loading schemes:", error);
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

  const getSchemeIcon = (name: string) => {
    if (name.toLowerCase().includes('kisan')) return <Wallet className="w-6 h-6" />;
    if (name.toLowerCase().includes('bima') || name.toLowerCase().includes('insurance')) return <Shield className="w-6 h-6" />;
    if (name.toLowerCase().includes('credit') || name.toLowerCase().includes('kcc')) return <Building2 className="w-6 h-6" />;
    return <Users className="w-6 h-6" />;
  };

  const getSchemelinear = (idx: number) => {
    const linears = [
      "from-emerald-500 to-teal-600",
      "from-blue-500 to-indigo-600",
      "from-purple-500 to-violet-600",
      "from-orange-500 to-amber-600",
      "from-pink-500 to-rose-600",
    ];
    return linears[idx % linears.length];
  };

  const getSchemeCardBg = (idx: number) => {
    const backgrounds = [
      "rgba(16, 185, 129, 0.1)",
      "rgba(59, 130, 246, 0.1)",
      "rgba(139, 92, 246, 0.1)",
      "rgba(249, 115, 22, 0.1)",
      "rgba(236, 72, 153, 0.1)",
    ];
    return backgrounds[idx % backgrounds.length];
  };

  return (
    <div className={`fixed inset-0 flex flex-col bg-linear-to-br from-amber-50 via-orange-50 to-yellow-50 transition-transform duration-300 ${isExiting ? 'translate-x-full' : 'translate-x-0'}`}>
      <FarmingBackground />
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Header */}
        <header className="px-2 pt-2 sm:px-3 sm:pt-3">
          <div className="bg-white/70 backdrop-blur-2xl rounded-2xl sm:rounded-3xl border border-amber-100/50 px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 shadow-xl">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={handleBackClick}
                className="relative p-2 hover:bg-amber-100 rounded-full transition-colors overflow-hidden"
                aria-label="Back to home"
              >
                {ripples.map((ripple) => (
                  <span
                    key={ripple.id}
                    className="absolute rounded-full bg-amber-400/40 animate-ripple pointer-events-none"
                    style={{
                      left: ripple.x,
                      top: ripple.y,
                      width: '20px',
                      height: '20px',
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                ))}
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-amber-700 relative z-10" />
              </button>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-linear-to-br from-amber-500 to-orange-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                <Building2 className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-800">{t('govSchemes')}</h2>
                <p className="text-xs text-gray-600 hidden sm:block">{t('govSchemesDesc')}</p>
              </div>
              <button
                onClick={loadSchemes}
                className="p-2 hover:bg-amber-100 rounded-full transition-colors"
                disabled={loading}
              >
                <RefreshCw className={`w-5 h-5 text-amber-600 ${loading ? 'animate-spin' : ''}`} />
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
                  <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-amber-600" />
                  <p className="text-gray-600">{t('loadingSchemes')}...</p>
                </div>
              </div>
            ) : schemes.length > 0 ? (
              <>
                {/* Info Banner */}
                <div className="bg-linear-to-r from-amber-100 to-orange-100 rounded-2xl p-4 border border-amber-200/50 flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-amber-800 mb-1">{t('schemesInfo')}</h4>
                    <p className="text-sm text-amber-700">{t('schemesInfoDesc')}</p>
                  </div>
                </div>

                {/* Schemes List */}
                <div className="space-y-4">
                  {schemes.map((scheme, idx) => (
                    <div 
                      key={idx}
                      className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/40 overflow-hidden hover:shadow-lg transition-all"
                      style={{ background: getSchemeCardBg(idx) }}
                    >
                      <div 
                        className="p-5 cursor-pointer"
                        onClick={() => setSelectedScheme(selectedScheme?.name === scheme.name ? null : scheme)}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-xl bg-linear-to-br ${getSchemelinear(idx)} text-white shrink-0`}>
                            {getSchemeIcon(scheme.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-bold text-gray-800">{scheme.name}</h3>
                              <AudioButton 
                                text={`${scheme.name}. ${scheme.description}. ${t('eligibility')}: ${scheme.eligibility}. ${t('benefits')}: ${scheme.benefits}`} 
                              />
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2">{scheme.description}</p>
                          </div>
                          <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${selectedScheme?.name === scheme.name ? 'rotate-90' : ''}`} />
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {selectedScheme?.name === scheme.name && (
                        <div className="px-5 pb-5 pt-0 space-y-4 border-t border-gray-100">
                          <div className="pt-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Users className="w-4 h-4 text-gray-500" />
                              <h4 className="font-semibold text-gray-700">{t('eligibility')}</h4>
                            </div>
                            <p className="text-sm text-gray-600 pl-6">{scheme.eligibility}</p>
                          </div>

                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle className="w-4 h-4 text-emerald-500" />
                              <h4 className="font-semibold text-gray-700">{t('benefits')}</h4>
                            </div>
                            <p className="text-sm text-gray-600 pl-6">{scheme.benefits}</p>
                          </div>

                          {scheme.link && (
                            <a
                              href={scheme.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`flex items-center justify-center gap-2 w-full py-3 bg-linear-to-r ${getSchemelinear(idx)} text-white rounded-xl font-semibold hover:opacity-90 transition-all`}
                            >
                              {t('applyNow')}
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Help Section */}
                <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-5 border border-white/40">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">{t('needHelp')}</h4>
                      <p className="text-sm text-gray-600 mb-3">{t('needHelpDesc')}</p>
                      <button
                        onClick={() => router.push('/chat')}
                        className="px-4 py-2 bg-linear-to-r from-amber-500 to-orange-600 text-white rounded-lg text-sm font-medium hover:from-amber-600 hover:to-orange-700 transition-all"
                      >
                        {t('askAboutSchemes')}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">{t('noSchemesFound')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
