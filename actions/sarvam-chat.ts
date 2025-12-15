"use server";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface SarvamChatRequest {
  messages: ChatMessage[];
  language: string;
  context?: {
    weather?: string;
    plantHealth?: string;
  };
}

interface SarvamChatResponse {
  success: boolean;
  data?: {
    content: string;
    model: string;
  };
  error?: string;
}

// Comprehensive multilingual query classification patterns for intelligent routing
const QUERY_PATTERNS = {
  dateTime: [
    // English
    /what is today|what is the date|current date|today's date|what day|which date/i,
    /today|tomorrow|yesterday|this week|this month|this year/i,
    /time|date|day|month|year/i,
    // Hindi
    /आज की तारीख|आज क्या तारीख|आज का दिन|तारीख क्या|कौन सा दिन/i,
    /आज|कल|परसों|इस सप्ताह|इस महीने|इस साल/i,
    /समय|तारीख|दिन|महीना|साल/i,
    // Tamil
    /இன்றைய தேதி|என்ன தேதி|எந்த நாள்|இன்று/i,
    /நேரம்|தேதி|நாள்|மாதம்|வருடம்/i,
    // Kannada
    /ಇಂದಿನ ದಿನಾಂಕ|ಇಂದು ಯಾವ ದಿನ|ಇಂದು/i,
    /ಸಮಯ|ದಿನಾಂಕ|ದಿನ|ತಿಂಗಳು|ವರ್ಷ/i,
    // Marathi
    /आजची तारीख|आज कोणता दिवस|आज/i,
    /वेळ|तारीख|दिवस|महिना|वर्ष/i,
  ],
  factual: [
    // English
    /what is|tell me about|explain|define|information|history|meaning|describe/i,
    /who invented|when was|where is|which crop|how many types/i,
    /facts about|details of|overview of/i,
    // Hindi
    /क्या है|बताओ|समझाओ|परिभाषा|जानकारी|इतिहास|अर्थ/i,
    /कौन|कब|कहाँ|कितने प्रकार/i,
    // Tamil
    /என்ன|சொல்லுங்கள்|விளக்கம்|வரையறை|தகவல்|வரலாறு/i,
    /எங்கே|எப்போது|யார்|எத்தனை வகை/i,
    // Kannada
    /ಏನು|ತಿಳಿಸಿ|ವಿವರಿಸಿ|ವ್ಯಾಖ್ಯೆ|ಮಾಹಿತಿ|ಇತಿಹಾಸ/i,
    /ಯಾರು|ಯಾವಾಗ|ಎಲ್ಲಿ|ಎಷ್ಟು ವಿಧ/i,
    // Marathi
    /काय आहे|सांगा|समजावून सांगा|माहिती|इतिहास/i,
    // Telugu
    /ఏమిటి|చెప్పండి|వివరించండి|సమాచారం|చరిత్ర/i,
    // Bengali
    /কি|বলো|ব্যাখ্যা|তথ্য|ইতিহাস/i,
    // Gujarati
    /શું છે|કહો|સમજાવો|માહિતી|ઇતિહાસ/i,
  ],
  calculation: [
    // English
    /calculate|compute|estimate|budget|cost|price|profit|loss|margin|expense/i,
    /how much|quantity|measurement|area|yield per|fertilizer amount|seed rate/i,
    /per acre|per hectare|how many bags|total cost/i,
    // Hindi
    /गणना|हिसाब|अनुमान|बजट|लागत|मूल्य|लाभ|हानि|खर्च/i,
    /कितना|मात्रा|माप|क्षेत्रफल|उपज|खाद की मात्रा/i,
    /प्रति एकड़|प्रति हेक्टेयर|कितने बोरे/i,
    // Tamil
    /கணக்கிடு|மதிப்பீடு|பட்ஜெட்|விலை|லாபம்|நஷ்டம்|செலவு/i,
    /எவ்வளவு|அளவு|பரப்பளவு|விளைச்சல்|உரம்/i,
    /ஏக்கருக்கு|ஹெக்டேருக்கு|எத்தனை பைகள்/i,
    // Kannada
    /ಲೆಕ್ಕ|ಅಂದಾಜು|ಬಜೆಟ್|ಬೆಲೆ|ಲಾಭ|ನಷ್ಟ|ವೆಚ್ಚ/i,
    /ಎಷ್ಟು|ಪ್ರಮಾಣ|ಅಳತೆ|ವಿಸ್ತೀರ್ಣ|ಇಳುವರಿ/i,
    /ಎಕರೆಗೆ|ಹೆಕ್ಟೇರಿಗೆ|ಎಷ್ಟು ಚೀಲಗಳು/i,
    // Marathi
    /मोजणी|अंदाज|खर्च|किंमत|नफा|तोटा/i,
    /किती|प्रमाण|क्षेत्र|उत्पन्न/i,
  ],
  reasoning: [
    // English
    /why|reason|cause|effect|because|due to|consequence|result|impact/i,
    /should i|better|worse|compare|difference|versus|vs|between|choice/i,
    /best|optimal|recommend|suggest|advice|guidance|opinion|which one/i,
    /pros and cons|advantages|disadvantages|benefits|drawbacks/i,
    // Hindi
    /क्यों|कारण|प्रभाव|परिणाम|वजह से/i,
    /क्या मुझे चाहिए|बेहतर|खराब|तुलना|अंतर|बनाम/i,
    /सबसे अच्छा|सिफारिश|सलाह|राय|कौन सा/i,
    /फायदे|नुकसान|लाभ/i,
    // Tamil
    /ஏன்|காரணம்|விளைவு|பாதிப்பு|முடிவு/i,
    /நான் செய்ய வேண்டுமா|சிறந்த|மோசமான|ஒப்பிடு|வித்தியாசம்/i,
    /பரிந்துரை|ஆலோசனை|கருத்து|எது/i,
    /நன்மை|தீமை|பலன்கள்/i,
    // Kannada
    /ಯಾಕೆ|ಕಾರಣ|ಪರಿಣಾಮ|ಫಲಿತಾಂಶ/i,
    /ನಾನು ಮಾಡಬೇಕೆ|ಉತ್ತಮ|ಕೆಟ್ಟ|ಹೋಲಿಕೆ|ವ್ಯತ್ಯಾಸ/i,
    /ಸೂಕ್ತ|ಶಿಫಾರಸು|ಸಲಹೆ|ಅಭಿಪ್ರಾಯ/i,
    /ಅನುಕೂಲ|ಅನನುಕೂಲ/i,
  ],
  disease: [
    // English
    /disease|infection|pest|fungus|bacteria|virus|pathogen|parasite|insect/i,
    /sick|dying|yellow|brown|spots|wilting|rot|blight|mildew|damage/i,
    /cure|treatment|remedy|medicine|spray|pesticide|fungicide|control/i,
    /leaf curl|powdery mildew|rust|wilt|borer|aphid|whitefly/i,
    // Hindi
    /बीमारी|रोग|संक्रमण|कीट|फफूंद|जीवाणु|वायरस/i,
    /बीमार|मर रहा|पीला|धब्बे|मुरझाना|सड़न/i,
    /इलाज|उपचार|दवा|स्प्रे|कीटनाशक|फफूंदनाशक/i,
    /पत्ती रोग|सफेद चूर्ण|रतुआ|मुरझा रोग/i,
    // Tamil
    /நோய்|தொற்று|பூச்சி|பூஞ்சை|பாக்டீரியா|வைரஸ்/i,
    /நோய்வாய்ப்பட்ட|இறந்து|மஞ்சள்|புள்ளிகள்|வாடுதல்|அழுகல்/i,
    /சிகிச்சை|மருந்து|தெளிப்பு|பூச்சிக்கொல்லி|பூஞ்சைக்கொல்லி/i,
    /இலை சுருள்|வெள்ளை பொடி|துரு|வாடல்/i,
    // Kannada
    /ರೋಗ|ಸೋಂಕು|ಕೀಟ|ಶಿಲೀಂಧ್ರ|ಬ್ಯಾಕ್ಟೀರಿಯಾ|ವೈರಸ್/i,
    /ಅನಾರೋಗ್ಯ|ಸಾಯುತ್ತಿದೆ|ಹಳದಿ|ಕಲೆಗಳು|ಬಾಡುವಿಕೆ|ಕೊಳೆತ/i,
    /ಚಿಕಿತ್ಸೆ|ಔಷಧ|ಸಿಂಪಡಿಸು|ಕೀಟನಾಶಕ|ಶಿಲೀಂಧ್ರನಾಶಕ/i,
    /ಎಲೆ ಸುರುಳಿ|ಬಿಳಿ ಪುಡಿ|ತುಕ್ಕು|ಬಾಡುವಿಕೆ/i,
    // Marathi
    /रोग|संसर्ग|किडा|बुरशी|जीवाणू|विषाणू/i,
    /आजारी|मेलेले|पिवळे|डाग|कोमेजणे|कुजणे/i,
    /उपचार|औषध|फवारणी|कीटकनाशक/i,
  ],
  seasonal: [
    // English
    /season|monsoon|winter|summer|rain|drought|flood|weather|climate/i,
    /when to plant|when to harvest|best time|sowing time|planting season/i,
    /kharif|rabi|zaid|cropping season/i,
    // Hindi
    /मौसम|बारिश|सर्दी|गर्मी|सूखा|बाढ़|जलवायु/i,
    /कब लगाएं|कब काटें|सबसे अच्छा समय|बुवाई का समय/i,
    /खरीफ|रबी|जायद|फसल का मौसम/i,
    // Tamil
    /பருவம்|மழை|குளிர்|வெயில்|வறட்சி|வெள்ளம்|காலநிலை/i,
    /எப்போது நடவு|எப்போது அறுவடை|சிறந்த நேரம்|விதைப்பு காலம்/i,
    /கரீஃப்|ரபி|சைத்|பருவம்/i,
    // Kannada
    /ಋತು|ಮಳೆ|ಚಳಿಗಾಲ|ಬೇಸಿಗೆ|ಬರ|ಪ್ರವಾಹ|ಹವಾಮಾನ/i,
    /ಯಾವಾಗ ನೆಡಬೇಕು|ಯಾವಾಗ ಕೊಯ್ಲು|ಉತ್ತಮ ಸಮಯ/i,
    /ಖರೀಫ್|ರಬಿ|ಜಾಯ್ದ್|ಬೆಳೆ ಋತು/i,
    // Marathi
    /हंगाम|पाऊस|हिवाळा|उन्हाळा|दुष्काळ|पूर|हवामान/i,
    /कधी लावावे|कधी कापावे|चांगला वेळ|पेरणी/i,
  ],
  emergency: [
    // English
    /urgent|emergency|dying|critical|immediately|quickly|asap|help|sos|fast/i,
    /right now|very urgent|desperate|crisis/i,
    // Hindi
    /तुरंत|आपातकाल|मर रहा|तत्काल|जल्दी|मदद|एस ओ एस/i,
    /अभी|बहुत जरूरी|संकट/i,
    // Tamil
    /உடனடியாக|அவசரம்|இறந்து கொண்டிருக்கிறது|விரைவாக|உதவி/i,
    /இப்போதே|மிக அவசரம்|நெருக்கடி/i,
    // Kannada
    /ತುರತು|ತುರ್ತು|ಸಾಯುತ್ತಿದೆ|ತಕ್ಷಣ|ಬೇಗನೆ|ಸಹಾಯ/i,
    /ಈಗಲೇ|ತುಂಬಾ ತುರ್ತು|ಸಂಕಷ್ಟ/i,
    // Marathi
    /तात्काळ|आणीबाणी|मेलेले|लगेच|जलद|मदत/i,
    // Telugu
    /తక్షణం|అత్యవసరం|చనిపోతున్న|త్వరగా|సహాయం/i,
  ],
  market: [
    // English
    /price|market|sell|buy|mandi|rate|selling|purchase|trading|dealer/i,
    /market price|wholesale|retail|profit margin|commission/i,
    // Hindi
    /मूल्य|बाज़ार|बेचना|खरीदना|मंडी|दर|विक्रय|खरीद|व्यापार/i,
    /बाजार मूल्य|थोक|खुदरा|लाभ मार्जिन/i,
    // Tamil
    /விலை|சந்தை|விற்க|வாங்க|மண்டி|விலை நிர்ணயம்|வியாபாரம்/i,
    /சந்தை விலை|மொத்த|சில்லறை/i,
    // Kannada
    /ಬೆಲೆ|ಮಾರುಕಟ್ಟೆ|ಮಾರಾಟ|ಖರೀದಿ|ಮಂಡಿ|ದರ|ವ್ಯಾಪಾರ/i,
    /ಮಾರುಕಟ್ಟೆ ಬೆಲೆ|ಸಗಟು|ಚಿಲ್ಲರೆ/i,
    // Marathi
    /किंमत|बाजार|विकणे|खरेदी|मंडई|दर|व्यापार/i,
  ],
  scheme: [
    // English
    /government scheme|subsidy|loan|insurance|yojana|pradhan mantri/i,
    /pm kisan|fasal bima|kcc|kisan credit card|mudra|nabard/i,
    /agricultural loan|crop insurance|minimum support price|msp/i,
    // Hindi
    /सरकारी योजना|सब्सिडी|ऋण|बीमा|योजना|प्रधानमंत्री/i,
    /पीएम किसान|फसल बीमा|केसीसी|किसान क्रेडिट कार्ड/i,
    /कृषि ऋण|फसल बीमा|न्यूनतम समर्थन मूल्य|एमएसपी/i,
    // Tamil
    /அரசு திட்டம்|மானியம்|கடன்|காப்பீடு|யோஜனா/i,
    /பிஎம் கிசான்|பயிர் காப்பீடு|கேசிசி|விவசாய கடன்/i,
    // Kannada
    /ಸರ್ಕಾರಿ ಯೋಜನೆ|ಸಬ್ಸಿಡಿ|ಸಾಲ|ವಿಮೆ|ಯೋಜನ/i,
    /ಪಿಎಂ ಕಿಸಾನ್|ಬೆಳೆ ವಿಮೆ|ಕೆಸಿಸಿ|ಕೃಷಿ ಸಾಲ/i,
    // Marathi
    /सरकारी योजना|अनुदान|कर्ज|विमा|योजना/i,
    /पीएम किसान|पीक विमा|केसीसी|शेती कर्ज/i,
  ],
  irrigation: [
    // English
    /irrigation|water|drip|sprinkler|pump|well|borewell|canal/i,
    /watering|moisture|water requirement|irrigation schedule/i,
    // Hindi
    /सिंचाई|पानी|ड्रिप|स्प्रिंकलर|पंप|कुआं|बोरवेल|नहर/i,
    /पानी देना|नमी|पानी की आवश्यकता|सिंचाई कार्यक्रम/i,
    // Tamil
    /நீர்ப்பாசனம்|தண்ணீர்|சொட்டு|தெளிப்பான்|பம்ப்|கிணறு|கால்வாய்/i,
    /நீர்|ஈரப்பதம்|நீர் தேவை/i,
    // Kannada
    /ನೀರಾವರಿ|ನೀರು|ಡ್ರಿಪ್|ಸ್ಪ್ರಿಂಕ್ಲರ್|ಪಂಪ್|ಬಾವಿ|ಕಾಲುವೆ/i,
    /ನೀರು ಹಾಕುವುದು|ತೇವ|ನೀರಿನ ಅವಶ್ಯಕತೆ/i,
  ],
  soil: [
    // English
    /soil|fertility|nutrients|nitrogen|phosphorus|potassium|npk/i,
    /soil testing|ph level|organic matter|compost|manure/i,
    // Hindi
    /मिट्टी|उर्वरता|पोषक तत्व|नाइट्रोजन|फास्फोरस|पोटैशियम|एनपीके/i,
    /मिट्टी परीक्षण|पीएच स्तर|जैविक खाद|कम्पोस्ट|गोबर/i,
    // Tamil
    /மண்|வளம்|ஊட்டச்சத்து|நைட்ரஜன்|பாஸ்பரஸ்|பொட்டாசியம்/i,
    /மண் சோதனை|பிஎச்|இயற்கை உரம்|தொழு உரம்/i,
    // Kannada
    /ಮಣ್ಣು|ಫಲವತ್ತತೆ|ಪೋಷಕಾಂಶ|ನೈಟ್ರೋಜನ್|ಫಾಸ್ಫರಸ್|ಪೊಟ್ಯಾಸಿಯಮ್/i,
    /ಮಣ್ಣು ಪರೀಕ್ಷೆ|ಪಿಎಚ್|ಸಾವಯವ ಗೊಬ್ಬರ/i,
  ],
};

function classifyQuery(userQuery: string): {
  needsThinking: boolean;
  needsWikiGrounding: boolean;
  reasoningEffort: "low" | "medium" | "high";
  temperature: number;
  topP: number;
  maxTokens: number;
} {
  const query = userQuery.toLowerCase();

  // Date/Time queries - need thinking mode for accurate current information
  if (QUERY_PATTERNS.dateTime.some(pattern => pattern.test(query))) {
    return {
      needsThinking: true,
      needsWikiGrounding: false,
      reasoningEffort: "medium",
      temperature: 0.2, // Focused and accurate
      topP: 0.7,
      maxTokens: 1700,   // Ensure complete response
    };
  }

  // Emergency queries - fastest response, focused, actionable
  if (QUERY_PATTERNS.emergency.some(pattern => pattern.test(query))) {
    return {
      needsThinking: true,
      needsWikiGrounding: false,
      reasoningEffort: "high",
      temperature: 0.2, // Most focused
      topP: 0.7,        // Narrow token selection
      maxTokens: 1700,   // Concise but complete
    };
  }

  // Disease diagnosis - comprehensive, accurate, step-by-step
  if (QUERY_PATTERNS.disease.some(pattern => pattern.test(query))) {
    return {
      needsThinking: true,
      needsWikiGrounding: true, // Use wiki for verified treatments
      reasoningEffort: "high",
      temperature: 0.3,
      topP: 0.8,
      maxTokens: 2000,  // Detailed diagnosis and treatment
    };
  }

  // Calculation queries - precise, mathematical
  if (QUERY_PATTERNS.calculation.some(pattern => pattern.test(query))) {
    return {
      needsThinking: true,
      needsWikiGrounding: false,
      reasoningEffort: "high",
      temperature: 0.1, // Maximum precision
      topP: 0.6,
      maxTokens: 2000,
    };
  }

  // Government schemes - factual with wiki support
  if (QUERY_PATTERNS.scheme.some(pattern => pattern.test(query))) {
    return {
      needsThinking: false,
      needsWikiGrounding: true, // Fetch accurate scheme details
      reasoningEffort: "low",
      temperature: 0.2,
      topP: 0.8,
      maxTokens: 1900,   // Detailed scheme information
    };
  }

  // Market/pricing - factual but current context matters
  if (QUERY_PATTERNS.market.some(pattern => pattern.test(query))) {
    return {
      needsThinking: true,
      needsWikiGrounding: false,
      reasoningEffort: "medium",
      temperature: 0.4,
      topP: 0.8,
      maxTokens: 700,
    };
  }

  // Reasoning queries - balanced thinking and exploration
  if (QUERY_PATTERNS.reasoning.some(pattern => pattern.test(query))) {
    return {
      needsThinking: true,
      needsWikiGrounding: false,
      reasoningEffort: "medium",
      temperature: 0.5,
      topP: 0.9,
      maxTokens: 1800,
    };
  }

  // Factual queries - accuracy via wiki and thinking mode
  if (QUERY_PATTERNS.factual.some(pattern => pattern.test(query))) {
    return {
      needsThinking: true,
      needsWikiGrounding: true,
      reasoningEffort: "medium",
      temperature: 0.3,
      topP: 0.85,
      maxTokens: 1800,  // Increased for complete responses
    };
  }

  // Seasonal/timing queries - moderate reasoning
  if (QUERY_PATTERNS.seasonal.some(pattern => pattern.test(query))) {
    return {
      needsThinking: true,
      needsWikiGrounding: false,
      reasoningEffort: "medium",
      temperature: 0.4,
      topP: 0.85,
      maxTokens: 1750,
    };
  }

  // Irrigation queries - practical water management
  if (QUERY_PATTERNS.irrigation.some(pattern => pattern.test(query))) {
    return {
      needsThinking: true,
      needsWikiGrounding: false,
      reasoningEffort: "medium",
      temperature: 0.4,
      topP: 0.85,
      maxTokens: 1750,
    };
  }

  // Soil and fertility queries - technical but practical
  if (QUERY_PATTERNS.soil.some(pattern => pattern.test(query))) {
    return {
      needsThinking: true,
      needsWikiGrounding: true, // Use wiki for NPK ratios, soil science
      reasoningEffort: "medium",
      temperature: 0.35,
      topP: 0.8,
      maxTokens: 1800,
    };
  }

  // Default: conversational mode - natural, helpful
  return {
    needsThinking: false,
    needsWikiGrounding: false,
    reasoningEffort: "low",
    temperature: 0.6,
    topP: 0.9,
    maxTokens: 1000,  // Increased for complete responses
  };
}

const LANGUAGE_NAMES: Record<string, string> = {
  "en-IN": "English",
  "hi-IN": "Hindi",
  "bn-IN": "Bengali",
  "gu-IN": "Gujarati",
  "kn-IN": "Kannada",
  "ml-IN": "Malayalam",
  "mr-IN": "Marathi",
  "od-IN": "Odia",
  "pa-IN": "Punjabi",
  "ta-IN": "Tamil",
  "te-IN": "Telugu",
};

export async function getSarvamChatCompletion(
  request: SarvamChatRequest
): Promise<SarvamChatResponse> {
  try {
    const apiKey = process.env.SARVAM_API_KEY;
    if (!apiKey) {
      throw new Error("Sarvam API key not configured");
    }

    const languageName = LANGUAGE_NAMES[request.language] || "English";

    // Get last user message for query classification
    const lastUserMessage = [...request.messages].reverse().find(m => m.role === "user");
    const userQuery = lastUserMessage?.content || "";

    // Classify query to determine optimal model settings
    const queryConfig = classifyQuery(userQuery);

    // Build context string with current date
    const currentDate = new Date();
    const dateString = currentDate.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      weekday: 'long'
    });
    
    let contextInfo = `\n\nIMPORTANT CONTEXT:\n- Current Date & Day: ${dateString}`;
    
    if (request.context?.weather) {
      contextInfo += `\n- Current Weather Information: ${request.context.weather}`;
    }
    if (request.context?.plantHealth) {
      contextInfo += `\n- Plant Health Analysis: ${request.context.plantHealth}`;
    }

    // Build enhanced system prompt based on query type
    let systemPrompt = `You are "Farmer Sahayak" (Farmer's Helper), an expert Indian agricultural advisor with deep knowledge of:
- Crop cultivation, pest management, and disease control
- Weather patterns and seasonal farming practices
- Soil health, irrigation, and fertilization techniques
- Market trends and pricing for agricultural products
- Government schemes and subsidies for farmers
- Traditional and modern farming methods suitable for India

Your role:
1. Provide practical, actionable advice that farmers can implement immediately
2. Recommend affordable, locally available solutions
3. Consider regional climate, soil types, and water availability
4. Prioritize sustainable and organic methods when possible
5. Always respond in ${languageName} language
6. Keep answers clear, concise, and easy to understand for farmers with varying education levels${contextInfo}`;

    // Add specialized instructions based on query type
    if (queryConfig.needsThinking) {
      systemPrompt += `\n\nFor this query, think step-by-step and provide detailed reasoning to ensure accuracy.`;
    }

    // Prepare messages array
    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...request.messages,
    ];

    // Build optimized API request with all parameters
    const requestBody: any = {
      model: "sarvam-m",
      messages: messages,
      temperature: queryConfig.temperature,
      max_tokens: queryConfig.maxTokens,
      top_p: queryConfig.topP,
      frequency_penalty: 0.4,  // Reduce repetition for varied responses
      presence_penalty: 0.3,   // Encourage exploring new topics/angles
    };

    // Add reasoning effort if thinking mode is needed
    // This enables hybrid thinking mode for complex queries
    if (queryConfig.needsThinking) {
      requestBody.reasoning_effort = queryConfig.reasoningEffort;
    }

    // Add wiki grounding for factual queries
    // Uses RAG to fetch relevant Wikipedia content for accuracy
    if (queryConfig.needsWikiGrounding) {
      requestBody.wiki_grounding = true;
    }

    // Call Sarvam API
    const response = await fetch(
      "https://api.sarvam.ai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-subscription-key": apiKey,
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Sarvam API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (!data.choices || data.choices.length === 0) {
      throw new Error("No response from Sarvam API");
    }

    return {
      success: true,
      data: {
        content: data.choices[0].message.content,
        model: data.model,
      },
    };
  } catch (error) {
    console.error("Sarvam chat error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get chat response",
    };
  }
}
