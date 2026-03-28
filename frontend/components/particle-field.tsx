'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useMemo } from 'react';

type ParticleTone = 'gold' | 'blue' | 'mixed' | 'success';

interface ParticleFieldProps {
  className?: string;
  count?: number;
  tone?: ParticleTone;
  compact?: boolean;
  opacityRange?: [number, number, number];
  speedMultiplier?: number;
  driftMultiplier?: number;
}

function getParticleToneClass(tone: ParticleTone, index: number) {
  if (tone === 'gold') return 'particle-node particle-node-gold';
  if (tone === 'blue') return 'particle-node particle-node-blue';
  if (tone === 'success') return 'particle-node particle-node-gold'; // warm success glow
  return index % 3 === 0
    ? 'particle-node particle-node-gold'
    : index % 3 === 1
      ? 'particle-node particle-node-blue'
      : 'particle-node particle-node-soft';
}

export function ParticleField({
  className = '',
  count = 18,
  tone = 'mixed',
  compact = false,
  opacityRange = [0.08, 0.5, 0.1],
  speedMultiplier = 1,
  driftMultiplier = 1,
}: ParticleFieldProps) {
  const shouldReduceMotion = useReducedMotion();

  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, index) => ({
        id: index,
        left: `${6 + ((index * 11) % 88)}%`,
        top: `${8 + ((index * 17) % 82)}%`,
        delay: (index * 0.18) / speedMultiplier,
        duration: ((compact ? 5.5 : 7.5) + (index % 5) * 0.7) / speedMultiplier,
        driftX: ((index % 4) - 1.5) * (compact ? 4 : 10) * driftMultiplier,
        driftY: ((index % 5) - 2) * (compact ? 6 : 12) * driftMultiplier,
        scale: 0.7 + (index % 4) * 0.18,
      })),
    [compact, count, speedMultiplier, driftMultiplier]
  );

  return (
    <div className={`particle-field ${className}`} aria-hidden="true">
      <div className="particle-field-glow" />
      {!shouldReduceMotion && <motion.div className="particle-field-scan" />}
      {particles.map((particle) => (
        <motion.span
          key={particle.id}
          className={getParticleToneClass(tone, particle.id)}
          style={{ left: particle.left, top: particle.top }}
          initial={{ opacity: opacityRange[0], scale: particle.scale }}
          animate={
            shouldReduceMotion
              ? { opacity: opacityRange[0] + 0.08, scale: particle.scale }
              : {
                  opacity: opacityRange,
                  scale: [particle.scale, particle.scale * (1 + 0.15 * speedMultiplier), particle.scale],
                  x: [0, particle.driftX, 0],
                  y: [0, particle.driftY, 0],
                }
          }
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: particle.delay,
          }}
        />
      ))}
    </div>
  );
}
