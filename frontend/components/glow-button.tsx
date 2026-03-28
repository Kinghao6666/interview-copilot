'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface GlowButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'gold' | 'outline';
  loading?: boolean;
  className?: string;
  type?: 'button' | 'submit';
}

export function GlowButton({
  children,
  onClick,
  disabled = false,
  variant = 'gold',
  loading = false,
  className = '',
  type = 'button',
}: GlowButtonProps) {
  const base =
    variant === 'gold'
      ? 'border border-white/[0.1] bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.06))] text-white font-medium shadow-[0_4px_16px_rgba(0,0,0,0.2)] backdrop-blur-2xl'
      : 'border border-white/[0.06] bg-white/[0.03] text-muted hover:text-white backdrop-blur-xl';

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : { scale: 1.01, y: -1 }}
      whileTap={disabled ? {} : { scale: 0.992 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`group relative overflow-hidden rounded-2xl transition-all disabled:opacity-40 disabled:cursor-not-allowed ${base} ${className}`}
    >
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_42%)] opacity-80" />
      <motion.span
        className="absolute inset-y-0 left-[-35%] w-1/3 rotate-12 bg-gradient-to-r from-transparent via-white/16 to-transparent opacity-0 group-hover:opacity-100"
        animate={disabled ? {} : { x: ['0%', '420%'] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
      />
      {loading && (
        <motion.span
          className="absolute inset-0 rounded-2xl border-2 border-white/20"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
    </motion.button>
  );
}
