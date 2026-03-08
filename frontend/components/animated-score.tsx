'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

interface AnimatedScoreProps {
  score: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  duration?: number;
  showRing?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { text: 'text-2xl', ring: 80, stroke: 6 },
  md: { text: 'text-4xl', ring: 100, stroke: 7 },
  lg: { text: 'text-5xl', ring: 112, stroke: 8 },
  xl: { text: 'text-7xl', ring: 160, stroke: 10 },
};

function scoreColor(score: number) {
  if (score >= 80) return '#00ff88';
  if (score >= 60) return '#d4af37';
  return '#ff4444';
}

export function AnimatedScore({
  score,
  size = 'lg',
  duration = 1.5,
  showRing = true,
  className = '',
}: AnimatedScoreProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const [displayScore, setDisplayScore] = useState(0);

  const { text, ring, stroke } = sizeMap[size];
  const color = scoreColor(score);
  const radius = (ring - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    if (!isInView) return;
    let start: number | null = null;
    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setDisplayScore(Math.round(eased * score));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [isInView, score, duration]);

  return (
    <div
      ref={ref}
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={showRing ? { width: ring, height: ring } : undefined}
    >
      {showRing && (
        <svg width={ring} height={ring} className="absolute inset-0 -rotate-90 overflow-visible">
          <circle
            cx={ring / 2}
            cy={ring / 2}
            r={radius}
            fill="none"
            stroke="#2a2a2a"
            strokeWidth={stroke}
          />
          <motion.circle
            cx={ring / 2}
            cy={ring / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={isInView ? { strokeDashoffset: circumference * (1 - score / 100) } : {}}
            transition={{ duration, ease: 'easeOut' }}
          />
        </svg>
      )}
      <span className={`${text} font-bold`} style={{ color }}>
        {displayScore}
      </span>
    </div>
  );
}
