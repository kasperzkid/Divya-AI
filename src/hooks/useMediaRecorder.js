import { useRef } from 'react';

export function useMediaRecorder({ setIsListening, processAudio, isCallActiveRef, setCallStatus, isMuted, isThinking, isSpeaking }) {
  const mediaRecorderRef = useRef(null);
  const audioChunksRef  = useRef([]);
  const streamRef       = useRef(null);
  const isStartingRef   = useRef(false);

  const startListening = async (e) => {
    e?.preventDefault();
    if (isThinking || isSpeaking || isMuted || isStartingRef.current || mediaRecorderRef.current) return;
    
    isStartingRef.current = true;
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Microphone access is not supported on this browser context. Please ensure you are using a secure connection (HTTPS) or localhost.');
        isStartingRef.current = false;
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // If user let go of the button before permission was granted
      if (!isStartingRef.current) {
        stream.getTracks().forEach(t => t.stop());
        return;
      }

      streamRef.current = stream;
      audioChunksRef.current = [];
      
      const mimeTypes = ['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/aac'];
      let supportedType = '';
      for (const type of mimeTypes) {
        if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(type)) {
          supportedType = type;
          break;
        }
      }

      const mediaRecorder = new MediaRecorder(stream, supportedType ? { mimeType: supportedType } : undefined);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: supportedType || 'audio/webm' });
        mediaRecorderRef.current = null;
        if (audioBlob.size < 1000) return;
        await processAudio(audioBlob);
      };

      mediaRecorder.start(250);
      setIsListening(true);
      if (isCallActiveRef.current) setCallStatus('listening');
    } catch (err) {
      console.error('Microphone error', err);
    } finally {
      isStartingRef.current = false;
    }
  };

  const stopListening = async (e, shouldIgnore = false) => {
    e?.preventDefault();
    // Cancel any pending startup
    isStartingRef.current = false;
    
    if (!mediaRecorderRef.current) return;
    if (mediaRecorderRef.current.state === 'inactive') return;
    
    if (shouldIgnore) {
      mediaRecorderRef.current.onstop = () => {
        mediaRecorderRef.current = null;
      };
    }
    
    setIsListening(false);
    mediaRecorderRef.current.stop();
    streamRef.current?.getTracks().forEach(t => t.stop());
  };

  return { mediaRecorderRef, streamRef, startListening, stopListening };
}
