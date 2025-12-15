"use server";

interface SarvamTTSRequest {
  text: string;
  language: string;
}

interface SarvamTTSResponse {
  success: boolean;
  data?: {
    audioBase64: string;
  };
  error?: string;
}

// Map BCP-47 codes to Sarvam language codes
const LANGUAGE_MAP: Record<string, string> = {
  "en-IN": "en-IN",
  "hi-IN": "hi-IN",
  "bn-IN": "bn-IN",
  "gu-IN": "gu-IN",
  "kn-IN": "kn-IN",
  "ml-IN": "ml-IN",
  "mr-IN": "mr-IN",
  "od-IN": "od-IN",
  "pa-IN": "pa-IN",
  "ta-IN": "ta-IN",
  "te-IN": "te-IN",
};

export async function generateSarvamTTS(
  request: SarvamTTSRequest
): Promise<SarvamTTSResponse> {
  try {
    const apiKey = process.env.SARVAM_API_KEY;
    if (!apiKey) {
      throw new Error("Sarvam API key not configured");
    }

    const languageCode = LANGUAGE_MAP[request.language] || "en-IN";

    // Call Sarvam TTS API (bulbul:v2 model)
    const response = await fetch("https://api.sarvam.ai/text-to-speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": apiKey,
      },
      body: JSON.stringify({
        text: request.text,
        target_language_code: languageCode,
        speaker: "anushka", // bulbul:v2 compatible speakers: anushka, abhilash, manisha, vidya, arya, karun, hitesh
        pitch: 0,
        pace: 1.0,
        loudness: 1.5,
        speech_sample_rate: 22050,
        enable_preprocessing: true,
        model: "bulbul:v2",
        output_audio_codec: "mp3",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Sarvam TTS API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // Sarvam TTS returns base64 audio in 'audios' array
    if (!data.audios || data.audios.length === 0) {
      throw new Error("No audio generated from Sarvam TTS");
    }

    return {
      success: true,
      data: {
        audioBase64: data.audios[0],
      },
    };
  } catch (error) {
    console.error("Sarvam TTS error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate speech",
    };
  }
}
