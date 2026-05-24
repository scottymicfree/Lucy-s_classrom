import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useSettings } from '../hooks/useSettings';

interface VoiceContextType {
  isListening: boolean;
  isWakeWordMode: boolean;
  isSpeaking: boolean;
  transcript: string;
  setTranscript: (t: string) => void;
  startListening: () => void;
  stopListening: () => void;
  startWakeWordMode: () => void;
  speak: (text: string) => void;
  stopSpeaking: () => void;
  error: string | null;
  setError: (e: string | null) => void;
  hasSupport: boolean;
}

const VoiceContext = createContext<VoiceContextType | null>(null);

export function VoiceProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();
  const [isListening, setIsListening] = useState(false);
  const [isWakeWordMode, setIsWakeWordMode] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const isSpeakingRef = useRef(false);

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          if (!event || !event.results) return;
          setError(null);
          
          // Interruption handling
          if (isSpeakingRef.current) {
            const currentResult = event.results[event.results.length - 1];
            if (currentResult && currentResult[0].transcript.trim().length > 2) {
              window.speechSynthesis.cancel();
              setIsSpeaking(false);
            }
          }

          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const result = event.results[i];
            if (result && result.isFinal) {
              finalTranscript += result[0].transcript;
            }
          }
          if (finalTranscript) {
            setTranscript(prev => prev + finalTranscript);
          }
        };

        recognition.onerror = (event: any) => {
          const errorType = event?.error;
          console.error('Speech recognition error', errorType);
          
          if (errorType === 'not-allowed') {
            setError('Microphone access blocked. Click "Open App" (top right) in a new window, or check browser permissions.');
          } else if (errorType === 'no-speech') {
            // No speech detected, usually ignoreable
          } else if (errorType === 'aborted' || errorType === 'network') {
            // Network or aborted, just log for now
          } else {
            setError(`Speech recognition error: ${errorType || 'Unknown error'}`);
          }
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;

        return () => {
          try {
            recognition.stop();
            recognition.onresult = null;
            recognition.onerror = null;
            recognition.onend = null;
          } catch (e) {}
        };
      } catch (err) {
        console.error('Failed to initialize SpeechRecognition', err);
      }
    }
  }, []);

  const startListening = useCallback(async () => {
    setTranscript('');
    setError(null);

    if (!recognitionRef.current) {
      setError('Speech recognition engine not initialized.');
      return;
    }

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
      }
    } catch (err: any) {
      console.error('getUserMedia error:', err);
      setError('Microphone access blocked. If you are in the preview, try clicking "Open App" in a new window, or check browser settings.');
      return;
    }

    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (e) {
      console.warn('SpeechRecognition start failed', e);
      // Sometimes it's already running if stop didn't fire yet
      try {
        recognitionRef.current.stop();
        setTimeout(() => {
          try {
            recognitionRef.current.start();
            setIsListening(true);
          } catch (e3) {
            setError('Failed to restart speech engine. Please refresh.');
          }
        }, 200);
      } catch (e2) {}
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setIsListening(false);
      setIsWakeWordMode(false);
    }
  }, []);

  const startWakeWordMode = useCallback(async () => {
    setTranscript('');
    setError(null);
    if (!recognitionRef.current) return;

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
      }
    } catch (err: any) {
      console.error('getUserMedia error:', err);
      setError('Microphone access blocked. Please open in a new tab or check settings.');
      return;
    }

    try {
      setIsWakeWordMode(true);
      setIsListening(true);
      recognitionRef.current.start();
    } catch (e) {
      setIsListening(true);
      setIsWakeWordMode(true);
    }
  }, []);

  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis || !text) return;

    try {
      const cleanText = String(text).replace(/[*_#`]/g, '').replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.volume = settings.voice.volume;
      utterance.rate = settings.voice.speed;
      utterance.pitch = settings.voice.pitch;

      const voices = window.speechSynthesis.getVoices();
      if (settings.voice.maleVoiceOnly && voices.length > 0) {
         // Priority list for deep/male voices
         const maleVoice = voices.find(v => v.name.includes('Google UK English Male')) ||
                          voices.find(v => v.name.includes('Microsoft David')) ||
                          voices.find(v => v.name.includes('Daniel')) ||
                          voices.find(v => v.name.includes('James')) ||
                          voices.find(v => v.name.toLowerCase().includes('male')) ||
                          voices.find(v => v.lang === 'en-GB' && v.name.includes('Male')) ||
                          voices[0];
         if (maleVoice) utterance.voice = maleVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      setIsSpeaking(false);
    }
  }, [settings.voice]);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const handleVoicesChanged = () => {
      try { window.speechSynthesis.getVoices(); } catch (e) {}
    };
    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
  }, []);

  return (
    <VoiceContext.Provider value={{
      isListening, isWakeWordMode, isSpeaking, transcript, setTranscript,
      startListening, stopListening, startWakeWordMode, speak, stopSpeaking,
      error, setError, 
      hasSupport: !!(typeof window !== 'undefined' && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition))
    }}>
      {children}
    </VoiceContext.Provider>
  );
}

export function useVoice() {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
}
