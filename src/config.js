export const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "YOUR_GEMINI_API_KEY";

/** The one and only model used for chat/audio/translation */
export const MODEL = 'gemini-3.5-flash';

/** The TTS-specific model endpoint */
export const TTS_MODEL = 'gemini-3.5-flash';

export const USE_BEARER_AUTH = false;

export function geminiHeaders() {
  if (USE_BEARER_AUTH) {
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GEMINI_API_KEY}` };
  }
  return { 'Content-Type': 'application/json' };
}

export function geminiUrl(model) {
  const base = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  return USE_BEARER_AUTH ? base : `${base}?key=${GEMINI_API_KEY}`;
}
