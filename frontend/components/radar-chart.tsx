'use client';

import { motion, useInView } from 'framer-motion';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';

interface RadarChartProps {
  data: { label: string; value: number }[];
  className?: string;
}

export function RadarChart({ data, className = '' }: RadarChartProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const [mounted, setMounted] = useState(false);
  const gradientId = useId().replace(/:/g, '');

  useEffect(() => {
    setMounted(true);
  }, []);

  const chartData = useMemo(
    () =>
      data.map((item) => ({
        subject: item.label,
        score: item.value,
        fullMark: 100,
      })),
    [data]
  );

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`radar-shell rounded-[28px] p-4 ${className}`}
    >
      <div className="radar-grid-lines" />
      <div className="radar-sweep" />
      {!mounted ? (
        <div className="h-[280px] rounded-[24px] hud-panel animate-pulse" />
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <RechartsRadarChart data={chartData} cx="50%" cy="50%" outerRadius="70%">
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(210,192,161,0.42)" />
                <stop offset="100%" stopColor="rgba(138,168,216,0.08)" />
              </linearGradient>
            </defs>
            <PolarGrid stroke="rgba(255,255,255,0.06)" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#d1d5df', fontSize: 12 }} tickLine={false} />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: '#8c93a5', fontSize: 10 }}
              axisLine={false}
            />
            <Radar
              name="得分"
              dataKey="score"
              stroke="#d2c0a1"
              fill={`url(#${gradientId})`}
              fillOpacity={1}
              strokeWidth={2.2}
            />
          </RechartsRadarChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  );
}
