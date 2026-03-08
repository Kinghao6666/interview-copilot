'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useId, useMemo } from 'react';

type SparklineTone = 'gold' | 'blue' | 'success';

interface TelemetrySparklineProps {
  values: number[];
  labels?: string[];
  className?: string;
  tone?: SparklineTone;
}

const toneMap: Record<SparklineTone, { stroke: string; fillStart: string; fillEnd: string; dot: string }> = {
  gold: {
    stroke: '#f6df8f',
    fillStart: 'rgba(212,175,55,0.28)',
    fillEnd: 'rgba(212,175,55,0.02)',
    dot: '#d4af37',
  },
  blue: {
    stroke: '#72baff',
    fillStart: 'rgba(30,144,255,0.28)',
    fillEnd: 'rgba(30,144,255,0.02)',
    dot: '#1e90ff',
  },
  success: {
    stroke: '#7ff5c7',
    fillStart: 'rgba(46,204,113,0.24)',
    fillEnd: 'rgba(46,204,113,0.02)',
    dot: '#2ecc71',
  },
};

export function TelemetrySparkline({ values, labels = [], className = '', tone = 'gold' }: TelemetrySparklineProps) {
  const shouldReduceMotion = useReducedMotion();
  const gradientId = useId().replace(/:/g, '');
  const chartWidth = 100;
  const chartHeight = 44;
  const colors = toneMap[tone];

  const { linePath, areaPath, points } = useMemo(() => {
    const safeValues = values.length > 1 ? values : [0, values[0] ?? 0, 100];
    const max = Math.max(...safeValues, 100);
    const min = Math.min(...safeValues, 0);
    const range = Math.max(max - min, 1);

    const computedPoints = safeValues.map((value, index) => {
      const x = (index / Math.max(safeValues.length - 1, 1)) * chartWidth;
      const normalized = (value - min) / range;
      const y = chartHeight - normalized * chartHeight;
      return { x, y, value };
    });

    const line = computedPoints.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
    const area = `${line} L ${computedPoints[computedPoints.length - 1].x} ${chartHeight} L 0 ${chartHeight} Z`;

    return {
      linePath: line,
      areaPath: area,
      points: computedPoints,
    };
  }, [values]);

  return (
    <div className={`telemetry-sparkline ${className}`}>
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight + 8}`} className="w-full h-full" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.fillStart} />
            <stop offset="100%" stopColor={colors.fillEnd} />
          </linearGradient>
        </defs>

        {[0, 1, 2, 3].map((row) => (
          <line
            key={row}
            x1="0"
            y1={(chartHeight / 3) * row}
            x2={chartWidth}
            y2={(chartHeight / 3) * row}
            className="sparkline-grid"
          />
        ))}

        <motion.path
          d={areaPath}
          fill={`url(#${gradientId})`}
          initial={shouldReduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        />

        <motion.path
          d={linePath}
          fill="none"
          stroke={colors.stroke}
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={shouldReduceMotion ? false : { pathLength: 0, opacity: 0.4 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="sparkline-glow"
        />

        {points.map((point, index) => (
          <motion.circle
            key={`${point.x}-${point.y}-${index}`}
            cx={point.x}
            cy={point.y}
            r="1.8"
            fill={colors.dot}
            initial={shouldReduceMotion ? false : { scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.28, delay: 0.12 + index * 0.05 }}
          />
        ))}
      </svg>

      {labels.length > 1 && (
        <div className="mt-3 grid text-[10px] uppercase tracking-[0.16em] text-muted/80" style={{ gridTemplateColumns: `repeat(${labels.length}, minmax(0, 1fr))` }}>
          {labels.map((label) => (
            <span key={label} className="truncate text-center">
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
