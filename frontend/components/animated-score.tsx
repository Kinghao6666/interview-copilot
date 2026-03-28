'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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
  if (score >= 80) return '#7ad9b0';
  if (score >= 60) return '#d2c0a1';
  return '#ff7e73';
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
  const [burstDone, setBurstDone] = useState(false);

  const { text, ring, stroke } = sizeMap[size];
  const color = scoreColor(score);
  const radius = (ring - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    if (!isInView) return;
    let start: number | null = null;
    const overshoot = 1.06;
    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const elapsed = (timestamp - start) / (duration * 1000);
      const progress = Math.min(elapsed, 1);
      // easeOutCubic with overshoot: goes to 106% then settles back
      const eased = progress < 0.85
        ? (1 - Math.pow(1 - progress / 0.85, 3)) * overshoot
        : overshoot - (overshoot - 1) * ((progress - 0.85) / 0.15) + (1 - overshoot) * Math.pow((progress - 0.85) / 0.15, 2);
      const val = Math.min(Math.round(eased * score), Math.round(score * overshoot));
      setDisplayScore(progress >= 1 ? score : val);
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setBurstDone(true);
      }
    };
    requestAnimationFrame(animate);
  }, [isInView, score, duration]);

  const burstRings = [0, 1, 2];

  // Confetti particles for high scores
  const confettiParticles = useMemo(() => {
    if (score < 85) return [];
    return Array.from({ length: 12 }, (_, i) => {
      const angle = (i / 12) * Math.PI * 2;
      const distance = 60 + Math.random() * 40;
      return {
        id: i,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        rotate: Math.random() * 360,
        color: ['#7ad9b0', '#d2c0a1', '#8aa8d8', '#b0a6eb'][i % 4],
        size: 4 + Math.random() * 4,
        delay: Math.random() * 0.3,
      };
    });
  }, [score]);

  return (
    <motion.div
      ref={ref}
      initial={{ scale: 0.85, opacity: 0 }}
      animate={isInView ? { scale: 1, opacity: 1 } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 15 }}
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={showRing ? { width: ring, height: ring } : undefined}
    >
      {/* Burst rings on score reveal */}
      {showRing && burstDone && burstRings.map((i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-full"
          style={{ border: `1.5px solid ${color}` }}
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{ scale: 1.4 + i * 0.15, opacity: 0 }}
          transition={{ duration: 0.6, delay: i * 0.1, ease: 'easeOut' }}
        />
      ))}
      {/* Confetti for high scores */}
      {burstDone && confettiParticles.map((p) => (
        <motion.div
          key={`confetti-${p.id}`}
          className="absolute rounded-sm"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            left: '50%',
            top: '50%',
            marginLeft: -p.size / 2,
            marginTop: -p.size / 2,
          }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
          animate={{ x: p.x, y: p.y, opacity: 0, rotate: p.rotate, scale: 0.3 }}
          transition={{ duration: 0.8, delay: p.delay, ease: 'easeOut' }}
        />
      ))}
      {showRing && (
        <svg width={ring} height={ring} className="absolute inset-0 -rotate-90 overflow-visible">
          <circle
            cx={ring / 2}
            cy={ring / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
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
      <motion.span
        className={`${text} font-bold`}
        style={{ color }}
        animate={burstDone ? { scale: [1.08, 1] } : {}}
        transition={{ type: 'spring', stiffness: 400, damping: 12 }}
      >
        {displayScore}
      </motion.span>
    </motion.div>
  );
}
