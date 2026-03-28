'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';

const AI_TIPS = [
  '正在连接 AI 面试引擎',
  '正在分析输入上下文',
  '正在生成个性化内容',
  '正在同步任务链路',
];

interface AILoadingIndicatorProps {
  step?: string;
  compact?: boolean;
}

export function AILoadingIndicator({ step, compact = false }: AILoadingIndicatorProps) {
  const [tipIndex, setTipIndex] = useState(0);

  const orbitParticles = useMemo(
    () =>
      Array.from({ length: 6 }, (_, index) => ({
        id: index,
        rotate: index * 60,
        delay: index * 0.12,
      })),
    []
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((currentIndex) => (currentIndex + 1) % AI_TIPS.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  if (compact) {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="relative flex items-center justify-center w-5 h-5">
          <motion.span
            className="absolute w-2 h-2 rounded-full bg-gold"
            animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.span
            className="absolute w-4 h-4 rounded-full border border-gold/40"
            animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0.2, 0.6] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
          />
          <motion.span
            className="absolute w-5 h-5 rounded-full border border-gold/20"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
          />
        </span>
        <span className="tracking-[0.08em]">{step || AI_TIPS[tipIndex]}</span>
      </span>
    );
  }

  return (
    <div className="premium-card premium-card-strong relative flex flex-col items-center gap-4 rounded-3xl py-8 px-6 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(138,168,216,0.08),transparent_38%),radial-gradient(circle_at_top,rgba(212,184,150,0.08),transparent_30%)]" />
      <div className="absolute inset-0 pointer-events-none opacity-50">
        {orbitParticles.map((particle) => (
          <motion.span
            key={particle.id}
            className="loading-particle"
            style={{ rotate: `${particle.rotate}deg` }}
            animate={{ y: [0, -10, 0], opacity: [0.2, 0.7, 0.2] }}
            transition={{ duration: 2.2, repeat: Infinity, delay: particle.delay, ease: 'easeInOut' }}
          />
        ))}
      </div>

      <div className="relative w-16 h-16 flex items-center justify-center">
        {[0, 1, 2].map((ring) => (
          <motion.div
            key={ring}
            className="absolute inset-0 rounded-full border border-gold/20"
            animate={{ scale: [1, 1.5 + ring * 0.28], opacity: [0.4, 0] }}
            transition={{ duration: 2.1, repeat: Infinity, delay: ring * 0.45, ease: 'easeOut' }}
          />
        ))}

        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          className="relative"
        >
          <motion.div
            className="absolute inset-[-12px] rounded-full border border-blue/20"
            animate={{ rotate: -360 }}
            transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
          />
          <Sparkles className="w-6 h-6 text-gold" />
        </motion.div>
      </div>

      <div className="w-52 h-1 bg-border rounded-full overflow-hidden relative">
        <motion.div
          className="absolute h-full w-1/3 bg-gradient-to-r from-transparent via-gold to-transparent"
          animate={{ x: ['-100%', '420%'] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="h-6 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.p
            key={step || tipIndex}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="text-sm text-gold/80 text-center"
          >
            {step || AI_TIPS[tipIndex]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
