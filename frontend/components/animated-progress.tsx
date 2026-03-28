'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

interface AnimatedProgressProps {
  value: number;
  label?: string;
  showValue?: boolean;
  className?: string;
}

function barColor(value: number) {
  if (value >= 80) return 'from-[#9edbbe] to-[#7ad9b0]';
  if (value >= 60) return 'from-[#efe4d2] to-[#d2c0a1]';
  return 'from-[#ff9d93] to-[#ff7e73]';
}

function textColor(value: number) {
  if (value >= 80) return 'text-success';
  if (value >= 60) return 'text-gold';
  return 'text-danger';
}

export function AnimatedProgress({ value, label, showValue = true, className = '' }: AnimatedProgressProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  return (
    <div ref={ref} className={className}>
      {(label || showValue) && (
        <div className="flex justify-between text-sm mb-1.5">
          {label && <span className="text-white/80">{label}</span>}
          {showValue && <span className={textColor(value)}>{value}</span>}
        </div>
      )}
      <div className="h-3 bg-white/8 rounded-full overflow-hidden relative backdrop-blur-xl">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${barColor(value)} relative`}
          initial={{ width: 0 }}
          animate={isInView ? { width: `${value}%` } : {}}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
        >
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            initial={{ x: '-100%' }}
            animate={isInView ? { x: '200%' } : {}}
            transition={{ duration: 1.2, delay: 0.6, ease: 'easeInOut' }}
          />
        </motion.div>
      </div>
    </div>
  );
}
