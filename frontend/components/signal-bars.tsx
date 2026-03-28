'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useState, useCallback } from 'react';

type SignalTone = 'gold' | 'blue' | 'success';

interface SignalBarsProps {
  values: number[];
  className?: string;
  tone?: SignalTone;
}

const toneClassMap: Record<SignalTone, string> = {
  gold: 'signal-bar-fill signal-bar-fill-gold',
  blue: 'signal-bar-fill signal-bar-fill-blue',
  success: 'signal-bar-fill signal-bar-fill-success',
};

export function SignalBars({ values, className = '', tone = 'gold' }: SignalBarsProps) {
  const shouldReduceMotion = useReducedMotion();
  const [hoverInfo, setHoverInfo] = useState<{ index: number; x: number; y: number } | null>(null);

  const handleBarEnter = useCallback((index: number, e: React.MouseEvent) => {
    setHoverInfo({ index, x: e.clientX, y: e.clientY });
  }, []);

  const handleBarMove = useCallback((index: number, e: React.MouseEvent) => {
    setHoverInfo({ index, x: e.clientX, y: e.clientY });
  }, []);

  const handleBarLeave = useCallback(() => {
    setHoverInfo(null);
  }, []);

  return (
    <div className={`signal-bars relative ${className}`} aria-hidden="true">
      {values.map((value, index) => {
        const normalized = Math.min(100, Math.max(10, value));
        const baseHeight = `${normalized}%`;

        return (
          <div
            key={`${index}-${value}`}
            className="signal-bar-shell"
            onMouseEnter={(e) => handleBarEnter(index, e)}
            onMouseMove={(e) => handleBarMove(index, e)}
            onMouseLeave={handleBarLeave}
            style={{ cursor: 'pointer' }}
          >
            <motion.span
              className={toneClassMap[tone]}
              initial={{ height: 0, opacity: 0.32 }}
              animate={
                shouldReduceMotion
                  ? { height: baseHeight, opacity: 0.86 }
                  : {
                      height: [baseHeight, `${Math.min(100, normalized + 10)}%`, baseHeight],
                      opacity: [0.45, 0.95, 0.55],
                    }
              }
              transition={{
                duration: 1.8 + (index % 4) * 0.22,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: index * 0.08,
              }}
            />
          </div>
        );
      })}

      {hoverInfo && (
        <div
          className="fixed z-50 pointer-events-none bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white"
          style={{
            left: hoverInfo.x + 12,
            top: hoverInfo.y - 32,
          }}
        >
          {Math.round(values[hoverInfo.index])}%
        </div>
      )}
    </div>
  );
}
