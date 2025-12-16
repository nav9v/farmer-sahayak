"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    BarChart3,
    Loader2,
    TrendingUp,
    TrendingDown,
    Minus,
    CheckCircle,
    XCircle,
    Leaf,
    MessageCircle,
    Clock,
    PieChart,
    RefreshCw
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { getFarmInsights } from "@/actions/crop-insights";
import FarmingBackground from "@/components/FarmingBackground";
import AudioButton from "@/components/ui/AudioButton";

interface FarmInsightsData {
    totalScans: number;
    healthyPlants: number;
    diseasedPlants: number;
    commonDiseases: { name: string; count: number }[];
    recentScans: {
        id: string;
        plantName: string;
        disease: string;
        isHealthy: boolean;
        timestamp: Date;
    }[];
    chatTopics: { topic: string; count: number }[];
    healthTrend: "improving" | "declining" | "stable";
}

export default function InsightsPage() {
    const { t, i18n } = useTranslation();
    const router = useRouter();
    const currentLanguage = useStore((state) => state.currentLanguage);
    const sessionId = useStore((state) => state.sessionId);

    const [insights, setInsights] = useState<FarmInsightsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isExiting, setIsExiting] = useState(false);
    const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);

    useEffect(() => {
        if (currentLanguage) {
            i18n.changeLanguage(currentLanguage);
        }
    }, [currentLanguage, i18n]);

    useEffect(() => {
        loadInsights();
    }, [sessionId]);

    const loadInsights = async () => {
        setLoading(true);
        try {
            const data = await getFarmInsights(sessionId);
            setInsights(data);
        } catch (error) {
            console.error("Error loading insights:", error);
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

    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case "improving": return <TrendingUp className="w-5 h-5 text-emerald-600" />;
            case "declining": return <TrendingDown className="w-5 h-5 text-red-600" />;
            default: return <Minus className="w-5 h-5 text-amber-600" />;
        }
    };

    const getTrendColor = (trend: string) => {
        switch (trend) {
            case "improving": return "text-emerald-600 bg-emerald-100";
            case "declining": return "text-red-600 bg-red-100";
            default: return "text-amber-600 bg-amber-100";
        }
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString(currentLanguage, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getHealthPercentage = () => {
        if (!insights || insights.totalScans === 0) return 0;
        return Math.round((insights.healthyPlants / insights.totalScans) * 100);
    };

    return (
        <div className={`fixed inset-0 flex flex-col bg-linear-to-br from-rose-50 via-pink-50 to-fuchsia-50 transition-transform duration-300 ${isExiting ? 'translate-x-full' : 'translate-x-0'}`}>
            <FarmingBackground />
            <div className="flex-1 flex flex-col overflow-hidden relative z-10">
                {/* Header */}
                <header className="px-2 pt-2 sm:px-3 sm:pt-3">
                    <div className="bg-white/70 backdrop-blur-2xl rounded-2xl sm:rounded-3xl border border-rose-100/50 px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 shadow-xl">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <button
                                onClick={handleBackClick}
                                className="relative p-2 hover:bg-rose-100 rounded-full transition-colors overflow-hidden"
                                aria-label="Back to home"
                            >
                                {ripples.map((ripple) => (
                                    <span
                                        key={ripple.id}
                                        className="absolute rounded-full bg-rose-400/40 animate-ripple pointer-events-none"
                                        style={{
                                            left: ripple.x,
                                            top: ripple.y,
                                            width: '20px',
                                            height: '20px',
                                            transform: 'translate(-50%, -50%)',
                                        }}
                                    />
                                ))}
                                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-rose-700 relative z-10" />
                            </button>
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-linear-to-br from-rose-500 to-pink-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                                <BarChart3 className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-800">{t('farmInsights')}</h2>
                                <p className="text-xs text-gray-600 hidden sm:block">{t('farmInsightsDesc')}</p>
                            </div>
                            <button
                                onClick={loadInsights}
                                className="p-2 hover:bg-rose-100 rounded-full transition-colors"
                                disabled={loading}
                            >
                                <RefreshCw className={`w-5 h-5 text-rose-600 ${loading ? 'animate-spin' : ''}`} />
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
                                    <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-rose-600" />
                                    <p className="text-gray-600">{t('loadingInsights')}...</p>
                                </div>
                            </div>
                        ) : insights && insights.totalScans > 0 ? (
                            <>
                                {/* Summary Stats */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/40">
                                        <div className="flex items-center gap-2 mb-2">
                                            <PieChart className="w-5 h-5 text-rose-500" />
                                            <span className="text-xs text-gray-500">{t('totalScans')}</span>
                                        </div>
                                        <p className="text-3xl font-bold text-gray-800">{insights.totalScans}</p>
                                    </div>

                                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/40">
                                        <div className="flex items-center gap-2 mb-2">
                                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                                            <span className="text-xs text-gray-500">{t('healthy')}</span>
                                        </div>
                                        <p className="text-3xl font-bold text-emerald-600">{insights.healthyPlants}</p>
                                    </div>

                                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/40">
                                        <div className="flex items-center gap-2 mb-2">
                                            <XCircle className="w-5 h-5 text-red-500" />
                                            <span className="text-xs text-gray-500">{t('diseased')}</span>
                                        </div>
                                        <p className="text-3xl font-bold text-red-600">{insights.diseasedPlants}</p>
                                    </div>

                                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/40">
                                        <div className="flex items-center gap-2 mb-2">
                                            {getTrendIcon(insights.healthTrend)}
                                            <span className="text-xs text-gray-500">{t('trend')}</span>
                                        </div>
                                        <p className={`text-sm font-bold capitalize ${getTrendColor(insights.healthTrend).split(' ')[0]}`}>
                                            {t(`trend_${insights.healthTrend}`)}
                                        </p>
                                    </div>
                                </div>

                                {/* Health Score Ring */}
                                <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-white/40">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-bold text-gray-800 mb-1">{t('overallHealth')}</h3>
                                            <p className="text-sm text-gray-500">{t('basedOnScans', { count: insights.totalScans })}</p>
                                        </div>
                                        <AudioButton
                                            text={`${t('overallHealth')}: ${getHealthPercentage()}%. ${insights.healthyPlants} ${t('healthy')}, ${insights.diseasedPlants} ${t('diseased')}.`}
                                        />
                                    </div>

                                    <div className="flex items-center justify-center py-8">
                                        <div className="relative w-40 h-40">
                                            {/* Background ring */}
                                            <svg className="w-full h-full transform -rotate-90">
                                                <circle
                                                    cx="80"
                                                    cy="80"
                                                    r="70"
                                                    stroke="currentColor"
                                                    strokeWidth="12"
                                                    fill="none"
                                                    className="text-gray-200"
                                                />
                                                <circle
                                                    cx="80"
                                                    cy="80"
                                                    r="70"
                                                    stroke="url(#healthlinear)"
                                                    strokeWidth="12"
                                                    fill="none"
                                                    strokeLinecap="round"
                                                    strokeDasharray={`${2 * Math.PI * 70 * getHealthPercentage() / 100} ${2 * Math.PI * 70}`}
                                                    className="transition-all duration-1000"
                                                />
                                                <defs>
                                                    <linearGradient id="healthlinear" x1="0%" y1="0%" x2="100%" y2="0%">
                                                        <stop offset="0%" stopColor="#10b981" />
                                                        <stop offset="100%" stopColor="#34d399" />
                                                    </linearGradient>
                                                </defs>
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className="text-4xl font-bold text-gray-800">{getHealthPercentage()}%</span>
                                                <span className="text-sm text-gray-500">{t('healthScore')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Common Diseases */}
                                {insights.commonDiseases.length > 0 && (
                                    <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-5 border border-white/40">
                                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                            <Leaf className="w-5 h-5 text-rose-600" />
                                            {t('commonDiseases')}
                                        </h3>
                                        <div className="space-y-3">
                                            {insights.commonDiseases.map((disease, idx) => (
                                                <div key={idx} className="flex items-center gap-3">
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-sm font-medium text-gray-700">{disease.name}</span>
                                                            <span className="text-xs text-gray-500">{disease.count} {t('times')}</span>
                                                        </div>
                                                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-linear-to-r from-rose-400 to-pink-500 rounded-full transition-all duration-500"
                                                                style={{ width: `${insights.diseasedPlants > 0 ? (disease.count / insights.diseasedPlants) * 100 : 0}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Chat Topics */}
                                {insights.chatTopics.length > 0 && (
                                    <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-5 border border-white/40">
                                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                            <MessageCircle className="w-5 h-5 text-rose-600" />
                                            {t('yourInterests')}
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {insights.chatTopics.map((topic, idx) => (
                                                <div
                                                    key={idx}
                                                    className="px-4 py-2 bg-linear-to-r from-rose-100 to-pink-100 rounded-full flex items-center gap-2"
                                                >
                                                    <span className="text-sm font-medium text-gray-700">{topic.topic}</span>
                                                    <span className="text-xs text-white bg-rose-500 px-2 py-0.5 rounded-full">{topic.count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Recent Activity */}
                                {insights.recentScans.length > 0 && (
                                    <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-5 border border-white/40">
                                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                            <Clock className="w-5 h-5 text-rose-600" />
                                            {t('recentActivity')}
                                        </h3>
                                        <div className="space-y-3">
                                            {insights.recentScans.map((scan, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-center gap-3 p-3 bg-gray-50/80 rounded-xl"
                                                >
                                                    {scan.isHealthy ? (
                                                        <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                                                    ) : (
                                                        <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-800 truncate">{scan.plantName}</p>
                                                        <p className="text-xs text-gray-500 truncate">
                                                            {scan.isHealthy ? t('healthyPlant') : scan.disease}
                                                        </p>
                                                    </div>
                                                    <span className="text-xs text-gray-400">{formatDate(scan.timestamp)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-12">
                                <div className="w-24 h-24 mx-auto mb-6 bg-linear-to-br from-rose-100 to-pink-100 rounded-full flex items-center justify-center">
                                    <BarChart3 className="w-12 h-12 text-rose-400" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">{t('noInsightsYet')}</h3>
                                <p className="text-gray-500 mb-6 max-w-sm mx-auto">{t('noInsightsDesc')}</p>
                                <button
                                    onClick={() => router.push('/image')}
                                    className="px-6 py-3 bg-linear-to-r from-rose-500 to-pink-600 text-white rounded-xl font-semibold hover:from-rose-600 hover:to-pink-700 transition-all"
                                >
                                    {t('startScanning')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
