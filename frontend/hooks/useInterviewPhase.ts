'use client';

import { useMemo } from 'react';

export type InterviewPhase = 'idle' | 'composing' | 'submitting' | 'revealing' | 'feedback';

export interface PhaseConfig {
  phase: InterviewPhase;
  intensity: number;
  urgency: number;
  spring: { type: 'spring'; stiffness: number; damping: number; mass: number };
  particles: {
    count: number;
    opacityRange: [number, number, number];
    speedMultiplier: number;
    driftMultiplier: number;
  };
  glowOpacity: number;
  tone: 'gold' | 'blue' | 'mixed' | 'success';
}

const SPRINGS = {
  idle:       { type: 'spring' as const, stiffness: 120, damping: 20, mass: 1 },
  composing:  { type: 'spring' as const, stiffness: 180, damping: 22, mass: 0.9 },
  submitting: { type: 'spring' as const, stiffness: 260, damping: 18, mass: 0.8 },
  revealing:  { type: 'spring' as const, stiffness: 300, damping: 14, mass: 0.7 },
  feedback:   { type: 'spring' as const, stiffness: 150, damping: 24, mass: 1 },
};

interface Input {
  answerLength: number;
  submitting: boolean;
  showFeedback: boolean;
  pace: number;
  isOvertime: boolean;
}

export function useInterviewPhase({ answerLength, submitting, showFeedback, pace, isOvertime }: Input): PhaseConfig {
  return useMemo(() => {
    let phase: InterviewPhase;
    if (showFeedback) phase = 'feedback';
    else if (submitting) phase = 'submitting';
    else if (answerLength > 0) phase = 'composing';
    else phase = 'idle';

    const urgency = Math.min(1, Math.max(0, (pace - 40) / 60));

    const baseIntensity: Record<InterviewPhase, number> = {
      idle: 0.15,
      composing: 0.35 + Math.min(0.25, answerLength / 800),
      submitting: 0.85,
      revealing: 1.0,
      feedback: 0.45,
    };
    const intensity = Math.min(1, baseIntensity[phase] + urgency * 0.2);

    const baseCount = 14;
    const particles = {
      count: Math.round(baseCount + intensity * 18),
      opacityRange: [
        0.04 + intensity * 0.06,
        0.2 + intensity * 0.5,
        0.06 + intensity * 0.08,
      ] as [number, number, number],
      speedMultiplier: 0.6 + intensity * 0.8,
      driftMultiplier: 0.5 + intensity * 1.0,
    };

    const glowOpacity = phase === 'idle' ? 0
      : phase === 'composing' ? 0.08 + urgency * 0.12
      : phase === 'submitting' ? 0.35
      : phase === 'feedback' ? 0.15 : 0;

    const tone: PhaseConfig['tone'] = phase === 'feedback' ? 'success'
      : phase === 'submitting' ? 'blue'
      : isOvertime ? 'gold' : 'mixed';

    return { phase, intensity, urgency, spring: SPRINGS[phase], particles, glowOpacity, tone };
  }, [answerLength, submitting, showFeedback, pace, isOvertime]);
}
