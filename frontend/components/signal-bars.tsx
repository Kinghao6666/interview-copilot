'use client';

import { motion, useReducedMotion } from 'framer-motion';

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

  return (
    <div className={`signal-bars ${className}`} aria-hidden="true">
      {values.map((value, index) => {
        const normalized = Math.min(100, Math.max(10, value));
        const baseHeight = `${normalized}%`;

        return (
          <div key={`${index}-${value}`} className="signal-bar-shell">
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
    </div>
  );
}
