'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useMemo } from 'react';

type ParticleTone = 'gold' | 'blue' | 'mixed';

interface ParticleFieldProps {
  className?: string;
  count?: number;
  tone?: ParticleTone;
  compact?: boolean;
}

function getParticleToneClass(tone: ParticleTone, index: number) {
  if (tone === 'gold') return 'particle-node particle-node-gold';
  if (tone === 'blue') return 'particle-node particle-node-blue';
  return index % 3 === 0
    ? 'particle-node particle-node-gold'
    : index % 3 === 1
      ? 'particle-node particle-node-blue'
      : 'particle-node particle-node-soft';
}

export function ParticleField({ className = '', count = 18, tone = 'mixed', compact = false }: ParticleFieldProps) {
  const shouldReduceMotion = useReducedMotion();

  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, index) => ({
        id: index,
        left: `${6 + ((index * 11) % 88)}%`,
        top: `${8 + ((index * 17) % 82)}%`,
        delay: index * 0.18,
        duration: (compact ? 5.5 : 7.5) + (index % 5) * 0.7,
        driftX: ((index % 4) - 1.5) * (compact ? 4 : 10),
        driftY: ((index % 5) - 2) * (compact ? 6 : 12),
        scale: 0.7 + (index % 4) * 0.18,
      })),
    [compact, count]
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
          initial={{ opacity: 0.12, scale: particle.scale }}
          animate={
            shouldReduceMotion
              ? { opacity: 0.22, scale: particle.scale }
              : {
                  opacity: [0.12, 0.75, 0.14],
                  scale: [particle.scale, particle.scale * 1.22, particle.scale],
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
