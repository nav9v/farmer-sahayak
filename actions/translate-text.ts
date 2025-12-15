"use server";

export async function translateText(
  text: string,
  targetLanguage: string
): Promise<string> {
  try {
    // If target is English, return as-is
    if (targetLanguage === "en-IN" || targetLanguage === "en") {
      return text;
    }

    const apiKey = process.env.SARVAM_API_KEY;
    if (!apiKey) {
      console.warn("Sarvam API key not configured, returning original text");
      return text;
    }

    // Map language codes to Sarvam Mayura translation codes
    const langMap: Record<string, string> = {
      "hi-IN": "hi-IN",
      "bn-IN": "bn-IN",
      "gu-IN": "gu-IN",
      "kn-IN": "kn-IN",
      "ml-IN": "ml-IN",
      "mr-IN": "mr-IN",
      "or-IN": "od-IN", // Odia code in Mayura
      "pa-IN": "pa-IN",
      "ta-IN": "ta-IN",
      "te-IN": "te-IN",
    };

    const sarvamLang = langMap[targetLanguage] || "en-IN";

    const response = await fetch("https://api.sarvam.ai/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": apiKey, // Correct header name
      },
      body: JSON.stringify({
        input: text,
        source_language_code: "en-IN",
        target_language_code: sarvamLang,
        mode: "formal", // Options: formal, modern-colloquial, classic-colloquial, code-mixed
        enable_preprocessing: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Translation failed:", response.status, errorText);
      return text; // Fallback to original text
    }

    const data = await response.json();
    return data.translated_text || text;
  } catch (error) {
    console.error("Translation error:", error);
    return text; // Fallback to original text
  }
}
