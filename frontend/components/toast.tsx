'use client';

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 0;

const icons: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

const tones: Record<ToastType, string> = {
  success: 'text-[#30d158]',
  error: 'text-[#ff6b6b]',
  info: 'text-[#8aa8d8]',
};

const borders: Record<ToastType, string> = {
  success: 'border-[#30d158]/20',
  error: 'border-[#ff6b6b]/20',
  info: 'border-[#8aa8d8]/20',
};

const barColors: Record<ToastType, string> = {
  success: '#30d158',
  error: '#ff6b6b',
  info: '#8aa8d8',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = ++nextId;

      setToasts((prev) => {
        const next = [...prev, { id, message, type }];
        return next.length > 3 ? next.slice(next.length - 3) : next;
      });

      setTimeout(() => dismiss(id), 3000);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => {
            const Icon = icons[t.type];
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, x: 80 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 80 }}
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                className={`pointer-events-auto relative flex items-center gap-3 rounded-2xl border
                  ${borders[t.type]} bg-[#1c1c1e]/70 backdrop-blur-xl px-5 py-3.5 overflow-hidden
                  shadow-[0_8px_32px_rgba(0,0,0,0.4)]`}
              >
                <Icon className={`w-[18px] h-[18px] shrink-0 ${tones[t.type]}`} />
                <span className="text-sm text-white/90 leading-snug flex-1">{t.message}</span>
                <button
                  type="button"
                  onClick={() => dismiss(t.id)}
                  className="shrink-0 p-0.5 rounded-md text-white/40 hover:text-white/80 transition-colors"
                  aria-label="关闭"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                {/* Countdown bar */}
                <span
                  className="absolute bottom-0 left-0 h-[2px] toast-countdown-bar"
                  style={{ backgroundColor: barColors[t.type] }}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}
