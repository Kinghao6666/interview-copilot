'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useId, useMemo, useState, useCallback } from 'react';

type SparklineTone = 'gold' | 'blue' | 'success';

interface TelemetrySparklineProps {
  values: number[];
  labels?: string[];
  className?: string;
  tone?: SparklineTone;
}

const toneMap: Record<SparklineTone, { stroke: string; fillStart: string; fillEnd: string; dot: string }> = {
  gold: {
    stroke: '#e8d5b0',
    fillStart: 'rgba(212,184,150,0.2)',
    fillEnd: 'rgba(212,184,150,0.02)',
    dot: '#d4b896',
  },
  blue: {
    stroke: '#a8c2e8',
    fillStart: 'rgba(138,168,216,0.2)',
    fillEnd: 'rgba(138,168,216,0.02)',
    dot: '#8aa8d8',
  },
  success: {
    stroke: '#7ae8b0',
    fillStart: 'rgba(48,209,88,0.18)',
    fillEnd: 'rgba(48,209,88,0.02)',
    dot: '#30D158',
  },
};

const defaultTooltipLabels = ['进度', '节奏', '评分', '字数', '状态'];

export function TelemetrySparkline({ values, labels = [], className = '', tone = 'gold' }: TelemetrySparklineProps) {
  const shouldReduceMotion = useReducedMotion();
  const gradientId = useId().replace(/:/g, '');
  const chartWidth = 100;
  const chartHeight = 44;
  const colors = toneMap[tone];
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

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

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / rect.width;
      const svgX = relX * chartWidth;

      let closest = 0;
      let minDist = Infinity;
      for (let i = 0; i < points.length; i++) {
        const dist = Math.abs(points[i].x - svgX);
        if (dist < minDist) {
          minDist = dist;
          closest = i;
        }
      }
      setHoverIndex(closest);
      setTooltipPos({ x: e.clientX, y: e.clientY });
    },
    [points, chartWidth],
  );

  const handleMouseLeave = useCallback(() => {
    setHoverIndex(null);
    setTooltipPos(null);
  }, []);

  const tooltipLabels = labels.length === values.length ? labels : defaultTooltipLabels;
  const hoveredPoint = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div className={`telemetry-sparkline relative ${className}`}>
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight + 8}`}
        className="w-full h-full"
        preserveAspectRatio="none"
        aria-hidden="true"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: 'crosshair' }}
      >
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
            r={hoverIndex === index ? 3 : 1.8}
            fill={colors.dot}
            initial={shouldReduceMotion ? false : { scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.28, delay: 0.12 + index * 0.05 }}
          />
        ))}

        {hoveredPoint && (
          <line
            x1={hoveredPoint.x}
            y1={0}
            x2={hoveredPoint.x}
            y2={chartHeight}
            stroke={colors.stroke}
            strokeWidth="0.8"
            strokeDasharray="2 2"
            opacity={0.5}
          />
        )}
      </svg>

      {hoverIndex !== null && tooltipPos && hoveredPoint && (
        <div
          className="fixed z-50 pointer-events-none bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white"
          style={{
            left: tooltipPos.x + 12,
            top: tooltipPos.y - 32,
          }}
        >
          {tooltipLabels[hoverIndex] ?? `#${hoverIndex + 1}`}: {Math.round(hoveredPoint.value)}%
        </div>
      )}

      {labels.length > 1 && (
        <div className="mt-3 grid text-[10px] tracking-normal text-muted/80" style={{ gridTemplateColumns: `repeat(${labels.length}, minmax(0, 1fr))` }}>
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
