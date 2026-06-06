import { useRef, useState } from 'react';
import { GEMINI_API_KEY, TTS_MODEL, USE_BEARER_AUTH } from '../config';

/**
 * Text-to-Speech using Gemini 2.5 Flash Preview TTS.
 * Falls back to browser Web Speech API if Gemini TTS fails.
 */
export function useSpeech({ appLanguage, isCallActiveRef, isMuted, startListening }) {
  const activeAudioRef = useRef(null);
  const [isSpeaking, setIsSpeaking]       = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState(null);

  /** Choose a Gemini voice based on language */
  function getVoice(lang) {
    return lang === 'English' ? 'Aoede' : 'Aoede'; // Use a female voice for Amharic as well (Aoede is female)
  }

  /** Convert base64 PCM/WAV data from Gemini to an AudioBuffer and play it */
  async function playBase64Audio(base64Data, mimeType) {
    return new Promise((resolve, reject) => {
      const binary = atob(base64Data);
      const pcmData = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) pcmData[i] = binary.charCodeAt(i);

      let finalBlob;
      if (mimeType && !mimeType.toLowerCase().includes('pcm')) {
        finalBlob = new Blob([pcmData], { type: mimeType });
      } else {
        // Construct WAV header for 24000Hz 16-bit mono PCM
        const wavHeader = new ArrayBuffer(44);
        const view = new DataView(wavHeader);
        const sampleRate = 24000;
        const numChannels = 1;
        const bitsPerSample = 16;
        const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
        const blockAlign = numChannels * (bitsPerSample / 8);

        view.setUint32(0, 0x52494646, false); // "RIFF"
        view.setUint32(4, 36 + pcmData.length, true); // file length
        view.setUint32(8, 0x57415645, false); // "WAVE"
        view.setUint32(12, 0x666D7420, false); // "fmt "
        view.setUint32(16, 16, true); // fmt chunk size
        view.setUint16(20, 1, true); // format (1 = PCM)
        view.setUint16(22, numChannels, true); // channels
        view.setUint32(24, sampleRate, true); // sample rate
        view.setUint32(28, byteRate, true); // byte rate
        view.setUint16(32, blockAlign, true); // block align
        view.setUint16(34, bitsPerSample, true); // bits per sample
        view.setUint32(36, 0x64617461, false); // "data"
        view.setUint32(40, pcmData.length, true); // data length

        finalBlob = new Blob([wavHeader, pcmData], { type: 'audio/wav' });
      }

      const url = URL.createObjectURL(finalBlob);
      const audio = new Audio(url);
      activeAudioRef.current = audio;

      audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
      audio.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Audio playback error')); };
      audio.play().catch(e => { URL.revokeObjectURL(url); reject(e); });
    });
  }

  /** Fallback: browser Web Speech API */
  function speakWithBrowser(text, lang) {
    return new Promise((resolve) => {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang  = lang === 'English' ? 'en-US' : 'am-ET';
      utter.onend = resolve;
      utter.onerror = resolve; // resolve anyway so we don't hang
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    });
  }

  const stopSpeaking = () => {
    if (activeAudioRef.current) {
      activeAudioRef.current.aborted = true;
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
    }
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setSpeakingMsgId(null);
  };

  const speak = async (text, msgId = null) => {
    if (!text?.trim()) return;
    if (isMuted) {
      setIsSpeaking(false);
      setSpeakingMsgId(null);
      if (isCallActiveRef?.current) startListening?.();
      return;
    }
    try {
      if (msgId) setSpeakingMsgId(msgId);
      stopSpeaking(); // cancel any current audio first
      setIsSpeaking(true);

      // Check if this is the introduction text and we have cached audio
      const isIntro = text.includes("Divya") && (text.includes("introduce") || text.includes("አስተዋውቅ") || (text.includes("ሰላም") && text.includes("Drive")));
      if (isIntro && localStorage.getItem('divya_intro_audio_cache')) {
        const cachedBase64 = localStorage.getItem('divya_intro_audio_cache');
        await playBase64Audio(cachedBase64, 'audio/wav');
        return;
      }

      // ── Gemini TTS ──────────────────────────────────────────────────────
      const keyParam = USE_BEARER_AUTH ? '' : `?key=${GEMINI_API_KEY}`;
      const headers  = USE_BEARER_AUTH
        ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GEMINI_API_KEY}` }
        : { 'Content-Type': 'application/json' };

      // Filter out multiple choice options for spoken audio
      let spokenText = text;
      if (text) {
        const lines = text.split('\n');
        const filteredLines = lines.filter(line => {
          const trimmed = line.trim();
          return !(/^[A-Z][)\.]\s/.test(trimmed) || /^(Choose one|Choose all that apply)/i.test(trimmed));
        });
        spokenText = filteredLines.join(' ');
      }

      if (!spokenText.trim()) spokenText = "Please make a selection.";

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${TTS_MODEL}:generateContent${keyParam}`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            contents: [{ parts: [{ text: spokenText }] }],
            generationConfig: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: getVoice(appLanguage) }
                }
              }
            }
          })
        }
      );

      if (!res.ok) throw new Error(`TTS HTTP ${res.status}`);
      const data = await res.json();
      const part = data.candidates?.[0]?.content?.parts?.[0]?.inlineData;

      if (part?.data) {
        if (isIntro) {
          localStorage.setItem('divya_intro_audio_cache', part.data);
        }
        await playBase64Audio(part.data, part.mimeType);
      } else {
        // Gemini returned something unexpected — fall back to browser TTS
        console.warn('Gemini TTS returned no audio data, using browser TTS');
        await speakWithBrowser(text, appLanguage);
      }

    } catch (err) {
      if (err.message !== 'Aborted') {
        console.warn('Gemini TTS failed, falling back to browser TTS:', err.message);
        // Graceful fallback to browser Web Speech API
        try { await speakWithBrowser(text, appLanguage); } catch {}
      }
    } finally {
      setIsSpeaking(false);
      setSpeakingMsgId(null);
      activeAudioRef.current = null;
      if (isCallActiveRef?.current) startListening?.();
    }
  };

  return { activeAudioRef, isSpeaking, speakingMsgId, speak, stopSpeaking };
}
