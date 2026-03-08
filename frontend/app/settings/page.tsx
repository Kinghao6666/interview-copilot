'use client';

import Link from 'next/link';
import {
  Bell,
  Cpu,
  Palette,
  Settings,
  ShieldCheck,
  Sparkles,
  Workflow,
} from 'lucide-react';
import { PageTransition, FadeIn } from '@/components';

export default function SettingsPage() {
  const settingsModules = [
    {
      icon: Cpu,
      title: 'AI 模型引擎',
      status: 'ACTIVE',
      statusClass: 'text-success',
      description:
        '当前项目使用 OpenAI 兼容接口，默认目标模型为 GPT-5.3-codex；未配置 Key 时回退到 Mock 流程。',
      meta: ['OpenAI Compatible', 'GPT-5.3-codex', 'Fallback Ready'],
    },
    {
      icon: Palette,
      title: '视觉主题系统',
      status: 'STABLE',
      statusClass: 'text-gold',
      description:
        '当前界面已经统一到黑金 + 冷蓝的赛博 HUD 语言，后续可以继续扩展主题切换与动效粒度。',
      meta: ['Cyber HUD', 'Glassmorphism', 'Gold + Blue'],
    },
    {
      icon: Bell,
      title: '通知与提醒',
      status: 'PLANNED',
      statusClass: 'text-blue',
      description:
        '报告完成提醒、异步任务通知和更细粒度的系统反馈仍在规划中，当前页面先展示能力位与扩展方向。',
      meta: ['Report Alert', 'Async Notice', 'Future Module'],
    },
  ];

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto">
        <FadeIn>
          <div className="hero-panel rounded-[32px] p-6 md:p-8 mb-6">
            <div className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr] xl:items-start">
              <div>
                <div className="section-kicker mb-4">
                  <Sparkles className="w-3.5 h-3.5" />
                  System Control Deck
                </div>

                <h1 className="text-3xl md:text-5xl font-semibold leading-tight max-w-3xl">
                  <span className="gold-text-glow bg-gradient-to-r from-white via-[#f7e7ae] to-[#d4af37] bg-clip-text text-transparent">
                    把设置页也做成系统级控制与状态面板
                  </span>
                </h1>

                <p className="text-sm md:text-base text-white/70 leading-7 max-w-3xl mt-4">
                  这里暂时不做伪装成可交互却无效的表单，而是将模型、主题和通知模块以真实可读的系统面板方式呈现。
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mt-6">
                  {[
                    {
                      value: '3',
                      label: 'Modules',
                      hint: '当前展示模块',
                      toneClass: 'text-white',
                    },
                    {
                      value: 'HUD',
                      label: 'Visual Language',
                      hint: '统一赛博风格',
                      toneClass: 'text-gold',
                    },
                    {
                      value: 'AI',
                      label: 'Core Engine',
                      hint: '模型驱动面试链路',
                      toneClass: 'text-success',
                    },
                    {
                      value: 'RO',
                      label: 'Read Only',
                      hint: '当前以状态展示为主',
                      toneClass: 'text-blue',
                    },
                  ].map((signal, index) => (
                    <div key={signal.label} className="signal-card rounded-[22px] p-4">
                      <p className={`text-lg font-semibold ${signal.toneClass}`}>{signal.value}</p>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-muted mt-2">
                        {signal.label}
                      </p>
                      <p className="text-xs text-white/55 mt-3 leading-5">{signal.hint}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="telemetry-panel corner-frame rounded-[28px] p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-gold/80">
                      Console Status
                    </p>
                    <h2 className="text-xl font-semibold text-white mt-2">控制台快照</h2>
                    <p className="text-sm text-white/60 leading-6 mt-2">
                      统一展示系统模块状态、可扩展方向与当前视觉控制层级，保持和首页、面试页、报告页一致的观感。
                    </p>
                  </div>
                  <span className="data-pill text-gold">SYNCED</span>
                </div>

                <div className="space-y-4 mt-6">
                  {[
                    {
                      label: 'Visual Consistency',
                      value: 'Cyber theme aligned',
                      percent: 92,
                      toneClass: 'text-gold',
                    },
                    {
                      label: 'Module Readiness',
                      value: '3 visible modules',
                      percent: 76,
                      toneClass: 'text-success',
                    },
                    {
                      label: 'Interactive Depth',
                      value: 'More controls planned',
                      percent: 46,
                      toneClass: 'text-blue',
                    },
                  ].map((item) => (
                    <div key={item.label} className="pipeline-node rounded-[22px] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
                            {item.label}
                          </p>
                          <p className="text-sm text-white mt-1">{item.value}</p>
                        </div>
                        <span className={`data-pill ${item.toneClass}`}>{item.percent}%</span>
                      </div>
                      <div className="telemetry-bar mt-3">
                        <span style={{ width: `${item.percent}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 xl:grid-cols-[1.08fr_0.92fr] gap-6">
          <FadeIn delay={0.08}>
            <div className="premium-card rounded-[28px] p-6 h-full">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <p className="text-sm font-medium text-gold flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    System Modules
                  </p>
                  <p className="text-sm text-white/60 mt-2 leading-6">
                    以统一的模块卡展示系统当前可见能力，而不是放置没有真实逻辑的占位控件。
                  </p>
                </div>
                <span className="data-pill text-gold">MODULES</span>
              </div>

              <div className="space-y-4">
                {settingsModules.map((module) => {
                  const Icon = module.icon;
                  return (
                    <div key={module.title} className="strategy-card rounded-[24px] p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="rounded-[18px] border border-white/10 bg-white/[0.04] p-3">
                            <Icon className="w-5 h-5 text-gold" />
                          </div>
                          <div>
                            <p className="text-base font-medium text-white">{module.title}</p>
                            <p className="text-sm text-white/60 leading-6 mt-2">{module.description}</p>
                          </div>
                        </div>
                        <span className={`data-pill ${module.statusClass}`}>{module.status}</span>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-4">
                        {module.meta.map((item) => (
                          <span key={item} className="glass-tag rounded-full px-3 py-1.5 text-xs text-white/80">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.14}>
            <div className="space-y-6">
              <div className="premium-card premium-card-strong rounded-[28px] p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Workflow className="w-4 h-4 text-blue" />
                  <p className="text-sm font-medium text-blue">后续扩展方向</p>
                </div>

                <div className="space-y-3">
                  {[
                    '增加真实可保存的模型选择与环境切换。',
                    '加入主题级别的动态强弱、粒子密度与过渡动画控制。',
                    '补上报告完成通知、异步任务提醒与系统消息中心。',
                  ].map((item, index) => (
                    <div key={item} className="hud-panel rounded-[22px] p-4">
                      <div className="flex items-start gap-3">
                        <span className="data-pill text-blue">0{index + 1}</span>
                        <p className="text-sm text-white/80 leading-7">{item}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="premium-card rounded-[28px] p-6">
                <div className="flex items-center gap-2 mb-4">
                  <ShieldCheck className="w-4 h-4 text-success" />
                  <p className="text-sm font-medium text-success">快速入口</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Link href="/" className="signal-card rounded-[22px] p-4 block">
                    <p className="text-sm font-medium text-white">返回首页</p>
                    <p className="text-xs text-white/55 mt-2 leading-5">继续发起新的模拟面试任务。</p>
                  </Link>
                  <Link href="/history" className="signal-card rounded-[22px] p-4 block">
                    <p className="text-sm font-medium text-white">查看历史</p>
                    <p className="text-xs text-white/55 mt-2 leading-5">回看历史报告与面试档案。</p>
                  </Link>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </PageTransition>
  );
}
