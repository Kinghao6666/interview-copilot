'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Play, History, Settings, Zap, Sparkles, Radio, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { href: '/', label: '开始面试', icon: Play, hint: '生成个性化题目' },
  { href: '/history', label: '历史记录', icon: History, hint: '查看表现趋势' },
  { href: '/settings', label: '设置', icon: Settings, hint: '调整体验偏好' },
];

const particles = Array.from({ length: 8 }, (_, index) => ({
  id: index,
  left: `${8 + ((index * 7) % 84)}%`,
  top: `${6 + ((index * 11) % 86)}%`,
  duration: 5.5 + (index % 5) * 1.1,
  delay: index * 0.3,
}));

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();

  const sidebarContent = (
    <aside className="relative w-[284px] h-screen shrink-0 px-3 py-3">
      <div className="absolute inset-[12px] rounded-[24px] border border-white/[0.06] bg-[#1C1C1E] shadow-[0_8px_32px_rgba(0,0,0,0.3)]" />
      <div className="absolute inset-[12px] opacity-35">
        {particles.map((particle) => (
          <motion.span
            key={particle.id}
            className="sidebar-particle"
            style={{ left: particle.left, top: particle.top }}
            animate={{
              y: [0, -10, 0],
              opacity: [0.06, 0.24, 0.06],
              scale: [0.9, 1.05, 0.9],
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

      <div className="relative flex h-full flex-col overflow-hidden rounded-[24px]">
        <div className="border-b border-white/[0.06] px-5 pt-5 pb-4">
          <div className="mb-4 flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-white/[0.08] bg-white/[0.06]">
              <Zap className="h-5 w-5 text-white/85" />
            </div>
            <div>
              <h1 className="text-[1.02rem] font-semibold tracking-[0.01em] text-white">
                Copilot
              </h1>
              <p className="mt-1 text-xs text-white/50">AI 校招面试练习助手</p>
            </div>
          </div>
        </div>

        <div className="px-4 pt-4">
          <div className="telemetry-panel rounded-[20px] px-4 py-3.5">
            <div className="flex items-center justify-between text-xs text-muted/80">
              <span>系统状态</span>
              <span className="inline-flex items-center gap-1 text-success">
                <Radio className="h-3 w-3" />
                在线
              </span>
            </div>
            <div className="mt-3 space-y-2.5">
              {['简历已就绪', '主题已同步', '报告引擎就绪'].map((item, index) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0.5 }}
                  animate={{ opacity: [0.5, 0.9, 0.5] }}
                  transition={{ duration: 3.2, repeat: Infinity, delay: index * 0.4 }}
                  className="flex items-center gap-2 text-xs text-white/65"
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
              <motion.div key={item.href} whileHover={{ x: 2 }} whileTap={{ scale: 0.97 }} transition={{ duration: 0.18 }}>
                <Link
                  href={item.href}
                  className={`relative flex items-center gap-3 overflow-hidden rounded-[18px] px-4 py-3.5 text-sm transition-colors ${
                    isActive ? 'text-white' : 'text-muted hover:text-white'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 rounded-[18px] border border-white/[0.1] bg-white/[0.08]"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}

                  <span
                    className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-[12px] border ${
                      isActive ? 'border-white/[0.1] bg-white/[0.08] text-white' : 'border-white/[0.06] bg-white/[0.03] text-muted'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>

                  <div className="relative z-10 flex-1">
                    <span className="block font-medium tracking-[0.01em]">{item.label}</span>
                    <span className="text-[11px] text-white/45">{item.hint}</span>
                  </div>

                  {isActive && <Sparkles className="relative z-10 h-4 w-4 text-white/70" />}
                </Link>
              </motion.div>
            );
          })}
        </nav>

        <div className="space-y-3 border-t border-white/[0.06] p-4">
          <div className="sidebar-stats rounded-[20px] p-3.5">
            <div className="flex items-center justify-between text-xs text-muted/80">
              <span>系统信息</span>
              <span className="text-success">在线</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="metric-chip rounded-[14px] px-3 py-2.5">
                <p className="text-muted/80">模式</p>
                <p className="mt-1 text-sm font-semibold text-white">模拟</p>
              </div>
              <div className="metric-chip rounded-[14px] px-3 py-2.5">
                <p className="text-muted/80">界面</p>
                <p className="mt-1 text-sm font-semibold text-white/85">毛玻璃</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-white/35 tracking-[0.04em]">v0.5.0</p>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop: always visible */}
      <div className="hidden lg:block">
        {sidebarContent}
      </div>

      {/* Mobile: overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
            />
            <motion.div
              className="fixed left-0 top-0 z-50 h-screen lg:hidden"
              initial={{ x: -284 }}
              animate={{ x: 0 }}
              exit={{ x: -284 }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            >
              <button
                onClick={onClose}
                className="absolute right-3 top-6 z-50 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors"
                aria-label="关闭侧边栏"
              >
                <X className="h-4 w-4" />
              </button>
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}