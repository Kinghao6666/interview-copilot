'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Play, History, Settings, Zap, Sparkles, Activity, Radio } from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  { href: '/', label: '开始面试', icon: Play, hint: '生成个性化题目' },
  { href: '/history', label: '历史记录', icon: History, hint: '查看表现趋势' },
  { href: '/settings', label: '设置', icon: Settings, hint: '调整体验偏好' },
];

const particles = Array.from({ length: 12 }, (_, index) => ({
  id: index,
  left: `${8 + ((index * 7) % 84)}%`,
  top: `${6 + ((index * 11) % 86)}%`,
  duration: 4.5 + (index % 5) * 0.9,
  delay: index * 0.22,
}));

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="relative w-64 h-screen shrink-0 overflow-hidden border-r border-white/6 bg-[#090c12]/85 backdrop-blur-2xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.1),transparent_32%),radial-gradient(circle_at_bottom,rgba(30,144,255,0.08),transparent_30%)]" />
      <div className="absolute inset-0 opacity-70">
        {particles.map((particle) => (
          <motion.span
            key={particle.id}
            className="sidebar-particle"
            style={{ left: particle.left, top: particle.top }}
            animate={{
              y: [0, -18, 0],
              opacity: [0.15, 0.6, 0.15],
              scale: [0.9, 1.15, 0.9],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: particle.delay,
            }}
          />
        ))}
      </div>

      <div className="relative flex h-full flex-col">
        <div className="border-b border-white/8 p-5">
          <div className="section-kicker mb-4">
            <Activity className="h-3 w-3" />
            Live AI Console
          </div>

          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 6, -4, 0], scale: [1, 1.06, 1] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-gold/20 bg-gold/10 glow-border"
            >
              <Zap className="h-5 w-5 text-gold" />
            </motion.div>
            <div>
              <h1 className="gold-text-glow text-lg font-bold uppercase tracking-[0.22em] text-white">
                Copilot
              </h1>
              <p className="mt-1 text-xs text-muted">AI 校招面试助手</p>
            </div>
          </div>
        </div>

        <div className="px-4 pt-4">
          <div className="telemetry-panel rounded-[22px] px-4 py-3">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-muted/80">
              <span>Realtime Feed</span>
              <span className="inline-flex items-center gap-1 text-success">
                <Radio className="h-3 w-3" />
                Live
              </span>
            </div>
            <div className="mt-3 space-y-2.5">
              {['Resume signal online', 'HUD theme synced', 'Report engine armed'].map((item, index) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0.4 }}
                  animate={{ opacity: [0.45, 1, 0.45] }}
                  transition={{ duration: 2.8, repeat: Infinity, delay: index * 0.35 }}
                  className="flex items-center gap-2 text-xs text-white/70"
                >
                  <span className={index === 0 ? 'status-dot status-dot-success' : index === 1 ? 'status-dot' : 'status-dot status-dot-blue'} />
                  {item}
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-2 p-4 pt-4 overflow-y-auto cyber-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/'
                ? pathname === '/' || pathname.startsWith('/interview')
                : pathname.startsWith(item.href);

            return (
              <motion.div key={item.href} whileHover={{ x: 4 }} transition={{ duration: 0.18 }}>
                <Link
                  href={item.href}
                  className={`relative flex items-center gap-3 overflow-hidden rounded-2xl px-4 py-3 text-sm transition-colors ${
                    isActive ? 'text-white' : 'text-muted hover:text-white'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 rounded-2xl border border-gold/20 bg-gradient-to-r from-gold/18 via-gold/6 to-blue/12 shadow-[0_0_26px_rgba(212,175,55,0.14)]"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}

                  <span
                    className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-xl border ${
                      isActive ? 'border-gold/25 bg-gold/10 text-gold' : 'border-white/8 bg-white/5 text-muted'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>

                  <div className="relative z-10 flex-1">
                    <span className="block font-medium">{item.label}</span>
                    <span className="text-[11px] text-muted/80">{item.hint}</span>
                  </div>

                  {isActive && <Sparkles className="relative z-10 h-4 w-4 text-gold" />}
                </Link>
              </motion.div>
            );
          })}
        </nav>

        <div className="space-y-3 border-t border-white/8 p-4">
          <div className="sidebar-stats rounded-2xl p-3">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-muted/80">
              <span>System</span>
              <span className="text-success">Online</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="metric-chip rounded-xl px-3 py-2">
                <p className="text-muted/80">Flow</p>
                <p className="mt-1 text-sm font-semibold text-white">Mock</p>
              </div>
              <div className="metric-chip rounded-xl px-3 py-2">
                <p className="text-muted/80">UI</p>
                <p className="mt-1 text-sm font-semibold text-gold">Dynamic</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted">v0.4.0 Cyber Build</p>
        </div>
      </div>
    </aside>
  );
}
