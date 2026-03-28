'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Check,
  Cpu,
  Eye,
  EyeOff,
  Globe,
  KeyRound,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { PageTransition, FadeIn, GlowButton } from '@/components';

const STORAGE_KEY = 'interview-copilot-settings';

interface Settings {
  apiBaseUrl: string;
  apiKey: string;
  selectedModel: string;
}

const DEFAULT_SETTINGS: Settings = {
  apiBaseUrl: 'http://localhost:8000',
  apiKey: '',
  selectedModel: 'gpt-4o',
};

const MODEL_OPTIONS = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    desc: '最新多模态旗舰，速度与质量兼顾',
    badge: '推荐',
    badgeClass: 'text-success',
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    desc: '轻量高速，适合高频调用场景',
    badge: '经济',
    badgeClass: 'text-blue',
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    desc: '经典模型，低延迟低成本',
    badge: '经典',
    badgeClass: 'text-gold',
  },
  {
    id: 'deepseek-chat',
    name: 'DeepSeek Chat',
    desc: '国产高性价比大模型，中文表现优秀',
    badge: '国产',
    badgeClass: 'text-purple',
  },
];

function loadSettings(): Settings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(settings: Settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export default function SettingsPage() {
  const [form, setForm] = useState<Settings>(DEFAULT_SETTINGS);
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm(loadSettings());
  }, []);

  const update = useCallback(
    <K extends keyof Settings>(key: K, value: Settings[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      setSaved(false);
    },
    [],
  );

  const handleSave = () => {
    saveSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto">
        <FadeIn>
          <div className="hero-panel rounded-[32px] p-6 md:p-8 mb-6">
            <div className="section-kicker mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              系统设置
            </div>

            <h1 className="text-3xl md:text-4xl font-semibold leading-tight">
              <span className="bg-gradient-to-r from-white via-[#f7e7ae] to-[#d4af37] bg-clip-text text-transparent">
                配置你的 AI 面试引擎
              </span>
            </h1>

            <p className="text-sm md:text-base text-white/70 leading-7 max-w-2xl mt-4">
              设置 API 连接与模型偏好，所有配置保存在本地浏览器中。
            </p>
          </div>
        </FadeIn>

        {/* API Base URL */}
        <FadeIn delay={0.06}>
          <div className="premium-card rounded-[28px] p-6 mb-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="rounded-[16px] border border-white/10 bg-white/[0.04] p-2.5">
                <Globe className="w-4 h-4 text-blue" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">API 基础地址</p>
                <p className="text-xs text-white/50 mt-0.5">后端服务的根 URL</p>
              </div>
            </div>
            <input
              type="text"
              value={form.apiBaseUrl}
              onChange={(e) => update('apiBaseUrl', e.target.value)}
              placeholder="http://localhost:8000"
              className="neo-input w-full rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition-all focus:ring-1 focus:ring-gold/30"
            />
          </div>
        </FadeIn>

        {/* API Key */}
        <FadeIn delay={0.1}>
          <div className="premium-card rounded-[28px] p-6 mb-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="rounded-[16px] border border-white/10 bg-white/[0.04] p-2.5">
                <KeyRound className="w-4 h-4 text-gold" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">API Key</p>
                <p className="text-xs text-white/50 mt-0.5">OpenAI 兼容接口密钥，仅存储在本地</p>
              </div>
            </div>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={form.apiKey}
                onChange={(e) => update('apiKey', e.target.value)}
                placeholder="sk-..."
                className="neo-input w-full rounded-2xl px-4 py-3 pr-12 text-sm text-white placeholder:text-white/30 outline-none transition-all focus:ring-1 focus:ring-gold/30 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-xl text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-all"
                aria-label={showKey ? '隐藏密钥' : '显示密钥'}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </FadeIn>

        {/* Model Selection */}
        <FadeIn delay={0.14}>
          <div className="premium-card rounded-[28px] p-6 mb-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="rounded-[16px] border border-white/10 bg-white/[0.04] p-2.5">
                <Cpu className="w-4 h-4 text-success" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">模型选择</p>
                <p className="text-xs text-white/50 mt-0.5">选择面试生成与评估使用的 AI 模型</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {MODEL_OPTIONS.map((model) => {
                const active = form.selectedModel === model.id;
                return (
                  <motion.button
                    key={model.id}
                    type="button"
                    onClick={() => update('selectedModel', model.id)}
                    animate={active ? { scale: [1, 1.03, 1] } : { scale: 1 }}
                    transition={active ? { duration: 0.3, ease: 'easeInOut' } : { duration: 0.15 }}
                    className={`relative text-left rounded-[22px] p-4 transition-all outline-none ${
                      active
                        ? 'border border-gold/40 bg-gold/[0.06] shadow-[0_0_20px_rgba(212,184,150,0.08)]'
                        : 'border border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className={`text-sm font-medium ${active ? 'text-gold' : 'text-white'}`}>
                        {model.name}
                      </p>
                      <span className={`data-pill ${model.badgeClass}`}>{model.badge}</span>
                    </div>
                    <p className="text-xs text-white/55 leading-5">{model.desc}</p>
                    {active && (
                      <div className="absolute top-3 right-3">
                        <div className="w-5 h-5 rounded-full bg-gold/20 flex items-center justify-center">
                          <Check className="w-3 h-3 text-gold" />
                        </div>
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </FadeIn>

        {/* Save Button */}
        <FadeIn delay={0.18}>
          <div className="flex items-center justify-between gap-4 mb-6">
            <p className="text-xs text-white/40">
              所有设置仅保存在当前浏览器的 localStorage 中
            </p>
            <GlowButton
              onClick={handleSave}
              className={`px-8 py-3 text-sm transition-all ${
                saved ? 'ring-1 ring-green-500/40' : ''
              }`}
            >
              <AnimatePresence mode="wait">
                {saved ? (
                  <motion.span
                    key="saved"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="inline-flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4 text-green-400" />
                    <span className="text-green-400">已保存</span>
                  </motion.span>
                ) : (
                  <motion.span
                    key="save"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    保存设置
                  </motion.span>
                )}
              </AnimatePresence>
            </GlowButton>
          </div>
        </FadeIn>

        {/* Quick Links */}
        <FadeIn delay={0.22}>
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
        </FadeIn>
      </div>
    </PageTransition>
  );
}
