export interface Language {
  code: string; // BCP-47 code (e.g., "en-IN")
  name: string; // Native name
  englishName: string;
  sarvamCode: string; // Code used for Sarvam API
  browserCode: string; // Code for browser speechSynthesis
}

export const LANGUAGES: Language[] = [
  {
    code: "en-IN",
    name: "English",
    englishName: "English",
    sarvamCode: "en-IN",
    browserCode: "en-IN",
  },
  {
    code: "hi-IN",
    name: "हिन्दी",
    englishName: "Hindi",
    sarvamCode: "hi-IN",
    browserCode: "hi-IN",
  },
  {
    code: "bn-IN",
    name: "বাংলা",
    englishName: "Bengali",
    sarvamCode: "bn-IN",
    browserCode: "bn-IN",
  },
  {
    code: "gu-IN",
    name: "ગુજરાતી",
    englishName: "Gujarati",
    sarvamCode: "gu-IN",
    browserCode: "gu-IN",
  },
  {
    code: "kn-IN",
    name: "ಕನ್ನಡ",
    englishName: "Kannada",
    sarvamCode: "kn-IN",
    browserCode: "kn-IN",
  },
  {
    code: "ml-IN",
    name: "മലയാളം",
    englishName: "Malayalam",
    sarvamCode: "ml-IN",
    browserCode: "ml-IN",
  },
  {
    code: "mr-IN",
    name: "मराठी",
    englishName: "Marathi",
    sarvamCode: "mr-IN",
    browserCode: "mr-IN",
  },
  {
    code: "od-IN",
    name: "ଓଡ଼ିଆ",
    englishName: "Odia",
    sarvamCode: "od-IN",
    browserCode: "or-IN", // Note: Browser uses "or-IN" for Odia
  },
  {
    code: "pa-IN",
    name: "ਪੰਜਾਬੀ",
    englishName: "Punjabi",
    sarvamCode: "pa-IN",
    browserCode: "pa-IN",
  },
  {
    code: "ta-IN",
    name: "தமிழ்",
    englishName: "Tamil",
    sarvamCode: "ta-IN",
    browserCode: "ta-IN",
  },
  {
    code: "te-IN",
    name: "తెలుగు",
    englishName: "Telugu",
    sarvamCode: "te-IN",
    browserCode: "te-IN",
  },
];

export const getLanguageByCode = (code: string): Language | undefined => {
  return LANGUAGES.find((lang) => lang.code === code);
};

export const DEFAULT_LANGUAGE = LANGUAGES[0]; // English
