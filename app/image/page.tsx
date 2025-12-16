"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { Camera, ArrowLeft, X, Loader2, AlertCircle, CheckCircle, Info, Volume2, Leaf, History, Clock, Trash2 } from "lucide-react";
import { useStore } from "@/store/useStore";
import { analyzePlantImage, analyzeCropHealth } from "@/actions/analyze-image";
import { translateText } from "@/actions/translate-text";
import { savePlantAnalysis, getPlantAnalysisHistory, deleteSinglePlantAnalysis } from "@/actions/plant-history";
import { speakNative } from "@/lib/audio";
import Image from "next/image";
import { compressImage, validateImageFile, extractBase64 } from "@/lib/image-compression";
import { uploadImageToBlob } from "@/lib/blob-storage";

interface AnalysisResult {
  plantName?: string;
  plantDescription?: string;
  plantProbability?: number;
  disease: string;
  probability: number;
  treatment?: string;
  symptoms?: string;
  prevention?: string;
  isHealthy: boolean;
}

interface HistoryItem {
  id: string;
  imageUrl: string;
  plantName?: string;
  plantDescription?: string;
  plantProbability?: number;
  disease: string;
  probability: number;
  symptoms?: string;
  treatment?: string;
  prevention?: string;
  isHealthy: boolean;
  timestamp: Date;
}

export default function ImagePage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const currentLanguage = useStore((state) => state.currentLanguage);
  const sessionId = useStore((state) => state.sessionId);
  const [preview, setPreview] = useState<string | null>(null);
  const [base64Data, setBase64Data] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExiting, setIsExiting] = useState(false);
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);

  useEffect(() => {
    if (currentLanguage) {
      i18n.changeLanguage(currentLanguage);
    }
  }, [currentLanguage, i18n]);

  useEffect(() => {
    // Load history on mount
    const loadHistory = async () => {
      if (sessionId) {
        const data = await getPlantAnalysisHistory(sessionId);
        setHistory(data);
      }
    };
    loadHistory();
  }, [sessionId]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateImageFile(file, 10);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Compress image for mobile compatibility (max 800KB, 1920px)
      const compressedDataUrl = await compressImage(file, 0.8, 1920);
      setPreview(compressedDataUrl);
      setBase64Data(extractBase64(compressedDataUrl));
    } catch (err) {
      console.error('Image compression error:', err);
      setError('Failed to process image. Please try another image.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setPreview(null);
    setBase64Data(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!base64Data) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // Try Plant.id first
      const plantResult = await analyzePlantImage(base64Data);
      
      let analysisData: AnalysisResult | null = null;
      if (plantResult.success && plantResult.data) {
        analysisData = plantResult.data;
      } else {
        // Show specific error from Plant.id if it's an API key or configuration issue
        if (plantResult.error && (plantResult.error.includes("API key") || plantResult.error.includes("not configured"))) {
          setError(plantResult.error);
          return;
        }
        
        // Fallback to Crop.health
        const cropResult = await analyzeCropHealth(base64Data);
        
        if (cropResult.success && cropResult.data) {
          analysisData = cropResult.data;
        } else {
          // Show specific error message from the API
          const errorMsg = cropResult.error || plantResult.error || "Failed to analyze image. Please try again.";
          setError(errorMsg);
          return;
        }
      }

      // Translate results if language is not English
      if (analysisData && currentLanguage && currentLanguage !== "en-IN") {
        try {
          // Use individual promises with fallback to prevent complete failure
          const translationResults = await Promise.allSettled([
            analysisData.plantName ? translateText(analysisData.plantName, currentLanguage) : Promise.resolve(""),
            analysisData.plantDescription ? translateText(analysisData.plantDescription, currentLanguage) : Promise.resolve(""),
            translateText(analysisData.disease, currentLanguage),
            analysisData.treatment ? translateText(analysisData.treatment, currentLanguage) : Promise.resolve(""),
            analysisData.symptoms ? translateText(analysisData.symptoms, currentLanguage) : Promise.resolve(""),
            analysisData.prevention ? translateText(analysisData.prevention, currentLanguage) : Promise.resolve(""),
          ]);

          // Extract translated values or fallback to original
          const [
            translatedPlantName,
            translatedPlantDesc,
            translatedDisease,
            translatedTreatment,
            translatedSymptoms,
            translatedPrevention,
          ] = translationResults.map((result, index) => {
            if (result.status === "fulfilled" && result.value) {
              return result.value;
            }
            // Fallback to original value if translation failed
            if (analysisData) {
              const originalValues = [
                analysisData.plantName,
                analysisData.plantDescription,
                analysisData.disease,
                analysisData.treatment,
                analysisData.symptoms,
                analysisData.prevention,
              ];
              return originalValues[index] || "";
            }
            return "";
          });

          analysisData = {
            ...analysisData,
            plantName: translatedPlantName || analysisData.plantName,
            plantDescription: translatedPlantDesc || analysisData.plantDescription,
            disease: translatedDisease || analysisData.disease,
            treatment: translatedTreatment || analysisData.treatment,
            symptoms: translatedSymptoms || analysisData.symptoms,
            prevention: translatedPrevention || analysisData.prevention,
          };
        } catch (translationError) {
          console.error("Translation error:", translationError);
          // Continue with original English text if translation fails
        }
      }

      setResult(analysisData);

      // Upload image to Blob storage and save to history
      if (analysisData && preview && sessionId && base64Data) {
        // Upload to Vercel Blob
        const uploadResult = await uploadImageToBlob(base64Data, `plant-${sessionId}-${Date.now()}.jpg`);
        const imageUrl = uploadResult.success && uploadResult.url ? uploadResult.url : preview;
        
        await savePlantAnalysis({
          sessionId,
          imageUrl: imageUrl, // Use Blob URL if upload succeeded, fallback to base64
          plantName: analysisData.plantName,
          plantDescription: analysisData.plantDescription,
          plantProbability: analysisData.plantProbability,
          disease: analysisData.disease,
          probability: analysisData.probability,
          symptoms: analysisData.symptoms,
          treatment: analysisData.treatment,
          prevention: analysisData.prevention,
          isHealthy: analysisData.isHealthy,
        });

        // Reload history
        const updatedHistory = await getPlantAnalysisHistory(sessionId);
        setHistory(updatedHistory);
      }
    } catch (err) {
      console.error("Image analysis error:", err);
      
      // Provide user-friendly error messages
      let errorMessage = "An unexpected error occurred";
      
      if (err instanceof Error) {
        if (err.message.includes("API key")) {
          errorMessage = err.message;
        } else if (err.message.includes("Network") || err.message.includes("fetch")) {
          errorMessage = "Network error: Please check your internet connection and try again.";
        } else if (err.message.includes("base64") || err.message.includes("image")) {
          errorMessage = "Invalid image format. Please select a valid image file.";
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    handleClear();
    setResult(null);
    setError(null);
  };

  const handleDeleteHistoryItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await deleteSinglePlantAnalysis(id);
    if (success.success && sessionId) {
      const updatedHistory = await getPlantAnalysisHistory(sessionId);
      setHistory(updatedHistory);
    }
  };

  const handleLoadHistoryItem = (item: HistoryItem) => {
    setPreview(item.imageUrl);
    setResult({
      plantName: item.plantName,
      plantDescription: item.plantDescription,
      plantProbability: item.plantProbability,
      disease: item.disease,
      probability: item.probability,
      symptoms: item.symptoms,
      treatment: item.treatment,
      prevention: item.prevention,
      isHealthy: item.isHealthy,
    });
    setShowHistory(false);
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

  return (
    <div className={`fixed inset-0 flex flex-col bg-linear-to-br from-orange-50 via-red-50 to-orange-50 transition-transform duration-300 ${isExiting ? 'translate-x-full' : 'translate-x-0'}`}>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="px-2 pt-2 sm:px-3 sm:pt-3">
          <div className="bg-white/60 backdrop-blur-2xl rounded-2xl sm:rounded-3xl border border-white/40 px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={handleBackClick}
                className="relative p-2 hover:bg-orange-50 rounded-full transition-colors overflow-hidden"
                aria-label="Back to home"
              >
                {ripples.map((ripple) => (
                  <span
                    key={ripple.id}
                    className="absolute rounded-full bg-orange-400/40 animate-ripple pointer-events-none"
                    style={{
                      left: ripple.x,
                      top: ripple.y,
                      width: '20px',
                      height: '20px',
                      transform: 'translate(-50%, -50%)',
                      animation: 'ripple 0.6s ease-out',
                    }}
                  />
                ))}
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-orange-700 relative z-10" />
              </button>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-linear-to-br from-orange-400 to-red-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                <Camera className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-800">{t('uploadPhoto')}</h2>
                <p className="text-xs text-gray-600 hidden sm:block">{t('takePhoto')}</p>
              </div>
              {history.length > 0 && (
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="p-1.5 sm:p-2 hover:bg-orange-50 rounded-full transition-colors"
                  aria-label="Toggle history"
                >
                  <History className="w-5 h-5 sm:w-6 sm:h-6 text-orange-700" />
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 p-3 sm:p-4 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            {/* History Section */}
            {showHistory && history.length > 0 && (
              <div className="mb-4 sm:mb-6 bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4">
                <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                  {t('searchHistory')}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="relative group overflow-hidden rounded-lg sm:rounded-xl border-2 border-gray-200 hover:border-orange-400 transition-all"
                    >
                      <button
                        onClick={() => handleLoadHistoryItem(item)}
                        className="w-full"
                      >
                        <Image
                          src={item.imageUrl}
                          alt={item.plantName || item.disease}
                          width={200}
                          height={150}
                          className="w-full h-24 sm:h-32 object-cover"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black/70 to-transparent flex flex-col justify-end p-1.5 sm:p-2">
                          <p className="text-white text-xs font-semibold truncate leading-tight">
                            {item.plantName || item.disease}
                          </p>
                          <p className={`text-xs ${item.isHealthy ? 'text-green-300' : 'text-orange-300'}`}>
                            {(item.probability * 100).toFixed(0)}% • {new Date(item.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </button>
                      <button
                        onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                        className="absolute top-1 right-1 sm:top-2 sm:right-2 p-1.5 sm:p-2 bg-red-500 hover:bg-red-600 text-white rounded-full md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10 shadow-lg"
                        aria-label="Delete"
                      >
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Image Preview */}
            {preview && !result && !error && (
              <div className="relative bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6">
                {preview.startsWith('data:') ? (
                  // Use native img for base64 data URLs
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-auto rounded-xl max-h-100 object-contain"
                  />
                ) : (
                  // Use Next.js Image for Blob URLs (optimized)
                  <Image
                    src={preview}
                    alt="Preview"
                    width={800}
                    height={600}
                    className="w-full h-auto rounded-xl max-h-100 object-contain"
                    unoptimized={preview.startsWith('blob:')}
                  />
                )}
                <button
                  onClick={handleClear}
                  className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 sm:p-3 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-xl"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            )}

            {/* Upload Area */}
            {!preview && !result && !error && (
              <div
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white/40 backdrop-blur-sm rounded-xl sm:rounded-2xl p-8 sm:p-12 cursor-pointer hover:bg-white/60 transition-all border-2 border-dashed border-orange-300 flex flex-col items-center justify-center min-h-64 sm:min-h-72"
                >
                <Camera className="w-16 h-16 sm:w-20 sm:h-20 mb-3 sm:mb-4 text-orange-600" />
                <p className="text-lg sm:text-xl font-medium text-orange-900">{t('choosePhoto')}</p>
                <p className="text-xs sm:text-sm text-gray-600 mt-2 text-center">{t('uploadPlantImage')}</p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Loading State */}
            {isLoading && (
              <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 text-orange-600 animate-spin mb-3 sm:mb-4" />
                <p className="text-base sm:text-lg font-medium text-gray-800">{t('analyzing')}</p>
                <p className="text-xs sm:text-sm text-gray-600">Using Kindwise AI</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                <div className="flex items-start gap-2 sm:gap-3">
                  <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 shrink-0 mt-0.5 sm:mt-1" />
                  <div className="flex-1">
                    <h3 className="text-base sm:text-lg font-bold text-red-900 mb-2">Analysis Failed</h3>
                    <p className="text-sm sm:text-base text-red-700">{error}</p>
                    <button
                      onClick={handleReset}
                      className="mt-3 sm:mt-4 px-4 py-2 sm:px-6 text-sm sm:text-base bg-red-600 text-white rounded-lg sm:rounded-xl hover:bg-red-700 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Results */}
            {result && preview && (
              <div className="space-y-3 sm:space-y-4">
                {/* Image */}
                <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4">
                  {preview.startsWith('data:') ? (
                    // Use native img for base64 data URLs
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={preview}
                      alt="Analyzed plant"
                      className="w-full h-auto rounded-xl max-h-100 object-contain"
                    />
                  ) : (
                    // Use Next.js Image for Blob URLs (optimized)
                    <Image
                      src={preview}
                      alt="Analyzed plant"
                      width={800}
                      height={600}
                      className="w-full h-auto rounded-xl max-h-100 object-contain"
                      unoptimized={preview.startsWith('blob:')}
                    />
                  )}
                </div>
                {/* Plant Identification */}
                {result.plantName && (
                  <div className="bg-linear-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <Leaf className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h3 className="text-lg sm:text-xl font-bold text-green-900 mb-1">
                              {result.plantName}
                            </h3>
                            <p className="text-sm text-green-700 mb-3">
                              Confidence: {((result.plantProbability || 0) * 100).toFixed(1)}%
                            </p>
                          </div>
                          <button
                            onClick={() => speakNative(`${result.plantName}. ${result.plantDescription || ''}`, currentLanguage || 'en-IN')}
                            className="p-1.5 sm:p-2 bg-green-600 hover:bg-green-700 text-white rounded-full transition-colors shrink-0"
                            aria-label="Speak plant info"
                          >
                            <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                        </div>
                        {result.plantDescription && (
                          <p className="text-gray-700 leading-relaxed mt-2">
                            {result.plantDescription}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Health Status */}
                <div className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 ${
                  result.isHealthy 
                    ? 'bg-green-50 border-2 border-green-200' 
                    : 'bg-orange-50 border-2 border-orange-200'
                }`}>
                  <div className="flex items-start gap-2 sm:gap-3">
                    {result.isHealthy ? (
                      <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600 shrink-0" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h3 className={`text-lg sm:text-xl font-bold mb-1 ${
                            result.isHealthy ? 'text-green-900' : 'text-orange-900'
                          }`}>
                            {result.disease}
                          </h3>
                          <p className={`text-sm ${
                            result.isHealthy ? 'text-green-700' : 'text-orange-700'
                          }`}>
                            Confidence: {(result.probability * 100).toFixed(1)}%
                          </p>
                        </div>
                        <button
                          onClick={() => speakNative(result.disease, currentLanguage || 'en-IN')}
                          className={`p-1.5 sm:p-2 ${
                            result.isHealthy ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'
                          } text-white rounded-full transition-colors shrink-0`}
                          aria-label="Speak health status"
                        >
                          <Volume2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Details */}
                {!result.isHealthy && (
                  <div className="space-y-3 sm:space-y-4">
                    {result.symptoms && (
                      <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6">
                        <div className="flex items-start gap-2 sm:gap-3">
                          <Info className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 shrink-0 mt-0.5 sm:mt-1" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-bold text-gray-900">{t('symptoms') || 'Symptoms'}</h4>
                              <button
                                onClick={() => speakNative(result.symptoms || '', currentLanguage || 'en-IN')}
                                className="p-1.5 sm:p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors"
                                aria-label="Speak symptoms"
                              >
                                <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </button>
                            </div>
                            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">{result.symptoms}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {result.treatment && (
                      <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6">
                        <div className="flex items-start gap-2 sm:gap-3">
                          <Info className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 shrink-0 mt-0.5 sm:mt-1" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-bold text-gray-900">{t('treatment') || 'Treatment'}</h4>
                              <button
                                onClick={() => speakNative(result.treatment || '', currentLanguage || 'en-IN')}
                                className="p-1.5 sm:p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full transition-colors"
                                aria-label="Speak treatment"
                              >
                                <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </button>
                            </div>
                            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">{result.treatment}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {result.prevention && (
                      <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6">
                        <div className="flex items-start gap-2 sm:gap-3">
                          <Info className="w-5 h-5 sm:w-6 sm:h-6 text-teal-600 shrink-0 mt-0.5 sm:mt-1" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-bold text-gray-900">{t('prevention') || 'Prevention'}</h4>
                              <button
                                onClick={() => speakNative(result.prevention || '', currentLanguage || 'en-IN')}
                                className="p-1.5 sm:p-2 bg-teal-600 hover:bg-teal-700 text-white rounded-full transition-colors"
                                aria-label="Speak prevention"
                              >
                                <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </button>
                            </div>
                            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">{result.prevention}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Analyze Another Button */}
                <button
                  onClick={handleReset}
                  className="w-full py-3 sm:py-4 bg-linear-to-r from-orange-600 to-red-600 text-white rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg hover:from-orange-700 hover:to-red-700 transition-all shadow-lg"
                >
                  Analyze Another Image
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer Controls */}
        {!result && (
          <div className="px-2 pb-2 sm:px-3 sm:pb-3">
            <div className="bg-white/60 backdrop-blur-2xl rounded-2xl sm:rounded-3xl border border-white/40 px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4">
              <div className="flex gap-2 sm:gap-3">
                {!preview ? (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="flex-1 flex items-center justify-center gap-2 sm:gap-3 py-3 sm:py-4 md:py-5 bg-orange-600 text-white rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg md:text-xl hover:bg-orange-700 disabled:opacity-50 shadow-lg transition-all"
                  >
                    <Camera className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
                    <span>{t('photo')}</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleClear}
                      disabled={isLoading}
                      className="px-4 sm:px-6 md:px-8 py-3 sm:py-4 md:py-5 bg-red-500 hover:bg-red-600 text-white rounded-xl sm:rounded-2xl transition-all disabled:opacity-50 shadow-lg"
                    >
                      <X className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={isLoading}
                      className="flex-1 flex items-center justify-center gap-2 sm:gap-3 py-3 sm:py-4 md:py-5 bg-linear-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl sm:rounded-2xl transition-all disabled:opacity-50 shadow-lg font-bold text-base sm:text-lg"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 animate-spin" />
                          <span>Analyzing...</span>
                        </>
                      ) : (
                        <>
                          <Camera className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
                          <span>{t('analyzePlant')}</span>
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
