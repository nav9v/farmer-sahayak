"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, Volume2, Play, Pause, AudioLines } from "lucide-react";
import { useStore } from "@/store/useStore";
import { speakNative } from "@/lib/audio";
import { getLanguageByCode } from "@/lib/languages";
import FarmingBackground from "@/components/FarmingBackground";

// Farming tips in multiple languages
const farmingTips = {
  'en-IN': [
    { title: "Soil Testing", content: "Test your soil before planting. This helps determine pH levels and nutrient content, ensuring you use the right fertilizers for better crop yield." },
    { title: "Crop Rotation", content: "Practice crop rotation to maintain soil health. Rotating different crops prevents soil depletion and reduces pest and disease buildup." },
    { title: "Water Management", content: "Use drip irrigation to save water. Drip systems deliver water directly to plant roots, reducing waste and improving water efficiency by up to 60%." },
    { title: "Organic Fertilizers", content: "Use compost and green manure. Organic fertilizers improve soil structure, increase water retention, and provide slow-release nutrients." },
    { title: "Pest Control", content: "Try integrated pest management. Combine biological, cultural, and chemical methods to control pests while minimizing environmental impact." },
    { title: "Seed Selection", content: "Choose certified seeds for better yield. Quality seeds are disease-free, have higher germination rates, and produce uniform crops." },
    { title: "Weather Monitoring", content: "Check weather forecasts regularly. Planning farm activities according to weather helps optimize planting, irrigation, and harvesting times." },
    { title: "Mulching Benefits", content: "Apply mulch to conserve moisture. Mulching reduces evaporation, controls weeds, and maintains consistent soil temperature." }
  ],
  'hi-IN': [
    { title: "मिट्टी परीक्षण", content: "बुवाई से पहले अपनी मिट्टी की जांच करें। यह pH स्तर और पोषक तत्वों की मात्रा निर्धारित करने में मदद करता है, जिससे बेहतर फसल के लिए सही उर्वरक का उपयोग सुनिश्चित होता है।" },
    { title: "फसल चक्र", content: "मिट्टी के स्वास्थ्य को बनाए रखने के लिए फसल चक्र का अभ्यास करें। विभिन्न फसलों को घुमाने से मिट्टी की कमी रोकी जा सकती है और कीट और रोग का निर्माण कम होता है।" },
    { title: "जल प्रबंधन", content: "पानी बचाने के लिए ड्रिप सिंचाई का उपयोग करें। ड्रिप सिस्टम सीधे पौधे की जड़ों तक पानी पहुंचाता है, बर्बादी को कम करता है और 60% तक पानी की दक्षता में सुधार करता है।" },
    { title: "जैविक उर्वरक", content: "खाद और हरी खाद का उपयोग करें। जैविक उर्वरक मिट्टी की संरचना में सुधार करते हैं, पानी की अवधारण बढ़ाते हैं और धीमी गति से पोषक तत्व प्रदान करते हैं।" },
    { title: "कीट नियंत्रण", content: "एकीकृत कीट प्रबंधन का प्रयास करें। पर्यावरणीय प्रभाव को कम करते हुए कीटों को नियंत्रित करने के लिए जैविक, सांस्कृतिक और रासायनिक तरीकों को मिलाएं।" },
    { title: "बीज चयन", content: "बेहतर उपज के लिए प्रमाणित बीज चुनें। गुणवत्ता वाले बीज रोग मुक्त होते हैं, उच्च अंकुरण दर रखते हैं और समान फसलें पैदा करते हैं।" },
    { title: "मौसम की निगरानी", content: "नियमित रूप से मौसम के पूर्वानुमान की जांच करें। मौसम के अनुसार खेती की गतिविधियों की योजना बनाने से बुवाई, सिंचाई और कटाई के समय को अनुकूलित करने में मदद मिलती है।" },
    { title: "मल्चिंग के फायदे", content: "नमी बचाने के लिए मल्च लगाएं। मल्चिंग वाष्पीकरण को कम करता है, खरपतवार को नियंत्रित करता है और मिट्टी का तापमान सुसंगत बनाए रखता है।" }
  ],
  'bn-IN': [
    { title: "মাটি পরীক্ষা", content: "রোপণের আগে আপনার মাটি পরীক্ষা করুন। এটি pH মাত্রা এবং পুষ্টি উপাদান নির্ধারণে সাহায্য করে, যা ভাল ফসলের জন্য সঠিক সার ব্যবহার নিশ্চিত করে।" },
    { title: "ফসল চক্র", content: "মাটির স্বাস্থ্য বজায় রাখতে ফসল ঘূর্ণন অনুশীলন করুন। বিভিন্ন ফসল ঘোরানো মাটির ক্ষয় রোধ করে এবং কীটপতঙ্গ ও রোগের বিকাশ হ্রাস করে।" },
    { title: "জল ব্যবস্থাপনা", content: "জল সংরক্ষণের জন্য ড্রিপ সেচ ব্যবহার করুন। ড্রিপ সিস্টেম সরাসরি গাছের শিকড়ে জল সরবরাহ করে, অপচয় হ্রাস করে এবং 60% পর্যন্ত জল দক্ষতা উন্নত করে।" },
    { title: "জৈব সার", content: "কম্পোস্ট এবং সবুজ সার ব্যবহার করুন। জৈব সার মাটির গঠন উন্নত করে, জল ধারণ ক্ষমতা বৃদ্ধি করে এবং ধীরে ধীরে পুষ্টি সরবরাহ করে।" },
    { title: "কীটপতঙ্গ নিয়ন্ত্রণ", content: "সমন্বিত কীটপতঙ্গ ব্যবস্থাপনা চেষ্টা করুন। পরিবেশগত প্রভাব কমিয়ে কীটপতঙ্গ নিয়ন্ত্রণের জন্য জৈবিক, সাংস্কৃতিক এবং রাসায়নিক পদ্ধতি একত্রিত করুন।" },
    { title: "বীজ নির্বাচন", content: "ভাল ফলনের জন্য প্রত্যয়িত বীজ চয়ন করুন। গুণমানের বীজ রোগমুক্ত, উচ্চ অঙ্কুরোদগম হার থাকে এবং অভিন্ন ফসল উত্পাদন করে।" },
    { title: "আবহাওয়া পর্যবেক্ষণ", content: "নিয়মিত আবহাওয়ার পূর্বাভাস পরীক্ষা করুন। আবহাওয়া অনুযায়ী কৃষি কার্যক্রম পরিকল্পনা করা রোপণ, সেচ এবং ফসল কাটার সময় অনুকূল করতে সাহায্য করে।" },
    { title: "মালচিং সুবিধা", content: "আর্দ্রতা সংরক্ষণের জন্য মালচ প্রয়োগ করুন। মালচিং বাষ্পীভবন হ্রাস করে, আগাছা নিয়ন্ত্রণ করে এবং মাটির তাপমাত্রা সামঞ্জস্যপূর্ণ রাখে।" }
  ]
};

export default function LearnPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const currentLanguage = useStore((state) => state.currentLanguage);
  const language = getLanguageByCode(currentLanguage);
  const [selectedTip, setSelectedTip] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);

  useEffect(() => {
    if (currentLanguage) {
      i18n.changeLanguage(currentLanguage);
    }
  }, [currentLanguage, i18n]);

  const tips = farmingTips[currentLanguage as keyof typeof farmingTips] || farmingTips['en-IN'];

  const handlePlayTip = (index: number) => {
    if (isPlaying && selectedTip === index) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    setSelectedTip(index);
    setIsPlaying(true);
    const tip = tips[index];
    const textToSpeak = `${tip.title}. ${tip.content}`;
    
    speakNative(textToSpeak, language?.browserCode || "en-IN");
    
    // Reset playing state when speech ends
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.onend = () => setIsPlaying(false);
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
    
    // Stop any playing speech
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    
    setIsExiting(true);
    setTimeout(() => {
      router.push("/");
    }, 300);
  };

  return (
    <div className={`fixed inset-0 flex flex-col bg-linear-to-br from-amber-50 via-yellow-50 to-orange-50 transition-transform duration-300 ${isExiting ? 'translate-x-full' : 'translate-x-0'}`}>
      <FarmingBackground />
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        <header className="px-2 pt-2 sm:px-3 sm:pt-3">
          <div className="bg-cream-50/70 backdrop-blur-2xl rounded-2xl sm:rounded-3xl border border-yellow-100/50 px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 shadow-xl">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={handleBackClick}
                className="relative p-2 hover:bg-yellow-100 rounded-full transition-colors overflow-hidden"
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
                      animation: 'ripple 0.6s ease-out',
                    }}
                  />
                ))}
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-amber-700 relative z-10" />
              </button>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-linear-to-br from-amber-500 to-orange-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                <BookOpen className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-800">{t('learn')}</h2>
                <p className="text-xs text-gray-600 hidden sm:block">{t('farmingTips')}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Tips List */}
        <div className="flex-1 p-3 sm:p-4 overflow-y-auto">
          <div className="space-y-3 sm:space-y-4 max-w-4xl mx-auto">
            {tips.map((tip, index) => {
              const isActive = isPlaying && selectedTip === index;
              return (
                <div
                  key={index}
                  className={`group relative rounded-2xl sm:rounded-3xl overflow-hidden transition-all duration-500 ease-out ${
                    isActive 
                      ? 'bg-linear-to-br from-orange-500 to-amber-500 shadow-xl shadow-orange-200' 
                      : 'bg-white/80 hover:bg-white shadow-sm hover:shadow-md'
                  }`}
                >
                  <div className="p-4 sm:p-6 md:p-8">
                    <div className="flex items-start justify-between gap-3 sm:gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 sm:gap-4 mb-2 sm:mb-3">
                          <div className={`mt-1 p-2 rounded-xl transition-all duration-300 ${
                            isActive ? 'bg-white/20 text-white backdrop-blur-sm' : 'bg-orange-100 text-orange-600'
                          }`}>
                            {isActive ? <AudioLines className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" /> : <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />}
                          </div>
                          <h3 className={`flex-1 text-base sm:text-lg md:text-xl font-bold leading-tight transition-colors duration-300 ${
                            isActive ? 'text-white' : 'text-gray-800'
                          }`}>{tip.title}</h3>
                        </div>
                        <p className={`text-sm sm:text-base leading-relaxed pl-11 sm:pl-14 transition-colors duration-300 ${
                          isActive ? 'text-orange-50' : 'text-gray-600'
                        }`}>{tip.content}</p>
                      </div>
                      
                      <button
                        onClick={() => handlePlayTip(index)}
                        className={`shrink-0 p-3 sm:p-4 rounded-full transition-all duration-300 shadow-lg ${
                          isActive
                            ? 'bg-white text-orange-600'
                            : 'bg-orange-50 text-orange-500 hover:bg-orange-100'
                        }`}
                        aria-label={isActive ? 'Pause' : 'Play'}
                      >
                        {isActive ? (
                          <Pause className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
                        ) : (
                          <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current translate-x-0.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
