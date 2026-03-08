'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface GlowButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'gold' | 'outline';
  className?: string;
  type?: 'button' | 'submit';
}

export function GlowButton({
  children,
  onClick,
  disabled = false,
  variant = 'gold',
  className = '',
  type = 'button',
}: GlowButtonProps) {
  const base =
    variant === 'gold'
      ? 'border border-gold/30 bg-gradient-to-r from-[#d4af37] via-[#f1d97b] to-[#e8c84a] text-black font-semibold shadow-[0_16px_36px_rgba(212,175,55,0.28)]'
      : 'border border-white/10 bg-white/[0.04] text-muted hover:text-white backdrop-blur-xl';

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : { scale: 1.018, y: -1 }}
      whileTap={disabled ? {} : { scale: 0.985 }}
      transition={{ duration: 0.16, ease: 'easeOut' }}
      className={`group relative overflow-hidden rounded-2xl transition-all disabled:opacity-40 disabled:cursor-not-allowed ${base} ${className}`}
    >
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.35),transparent_40%)] opacity-70" />
      <motion.span
        className="absolute inset-y-0 left-[-35%] w-1/3 rotate-12 bg-gradient-to-r from-transparent via-white/45 to-transparent opacity-0 group-hover:opacity-100"
        animate={{ x: ['0%', '420%'] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
    </motion.button>
  );
}
