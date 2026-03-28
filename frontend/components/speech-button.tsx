'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SpeechButtonProps {
  onTranscript: (text: string) => void;
  onListeningChange?: (listening: boolean) => void;
  disabled?: boolean;
}

// Web Speech API types (not in standard TS DOM lib)
interface SpeechRecognitionResult {
  readonly [index: number]: { transcript: string };
  readonly isFinal: boolean;
}
interface SpeechRecognitionResultList {
  readonly length: number;
  readonly [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
}
interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  start(): void;
  stop(): void;
}

function getSpeechRecognitionCtor(): (new () => SpeechRecognitionInstance) | null {
  if (typeof window === 'undefined') return null;
  return (
    (window as any).SpeechRecognition ??
    (window as any).webkitSpeechRecognition ??
    null
  );
}

export function SpeechButton({ onTranscript, onListeningChange, disabled }: SpeechButtonProps) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;
  const onListeningChangeRef = useRef(onListeningChange);
  onListeningChangeRef.current = onListeningChange;

  useEffect(() => {
    setSupported(getSpeechRecognitionCtor() !== null);
  }, []);

  useEffect(() => {
    onListeningChangeRef.current?.(listening);
  }, [listening]);

  const toggle = useCallback(() => {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.lang = 'zh-CN';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      if (transcript) {
        onTranscriptRef.current(transcript);
      }
    };

    recognition.onend = () => setListening(false);
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== 'aborted') {
        console.warn('SpeechRecognition error:', event.error);
      }
      setListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [listening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const rings = [
    { scale: 1.8, duration: 1.2, delay: 0 },
    { scale: 2.2, duration: 1.6, delay: 0.3 },
    { scale: 2.6, duration: 2.0, delay: 0.6 },
  ];

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={disabled}
      aria-label={listening ? '停止语音输入' : '开始语音输入'}
      className={`
        relative flex items-center justify-center w-10 h-10 rounded-full
        transition-colors duration-200
        ${listening
          ? 'bg-red-500/20 text-red-400 border border-red-500/40'
          : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white/80'
        }
        disabled:opacity-40 disabled:pointer-events-none
      `}
    >
      {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
      <AnimatePresence>
        {listening &&
          rings.map((ring, i) => (
            <motion.span
              key={i}
              className="absolute inset-0 rounded-full border-2 border-red-400"
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: ring.scale, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: ring.duration,
                delay: ring.delay,
                repeat: Infinity,
                ease: 'easeOut',
              }}
            />
          ))}
      </AnimatePresence>
    </button>
  );
}
