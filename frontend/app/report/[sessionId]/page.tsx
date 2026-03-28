'use client';

import { useEffect, useState, useCallback, useId, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  ArrowLeft,
  Cpu,
  Download,
  Lightbulb,
  Link2,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { interviewApi } from '@/lib/api';
import {
  AnimatedScore,
  AnimatedProgress,
  GlowButton,
  PageTransition,
  FadeIn,
  RadarChart,
  ParticleField,
  TelemetrySparkline,
  SignalBars,
} from '@/components';
import type { InterviewReport } from '@/types';

const sectionLabels: Record<string, string> = {
  self_intro: '自我介绍',
  skill_test: '技能考察',
  scenario: '场景题',
};

function getScoreProfile(score: number) {
  if (score >= 85) {
    return {
      tier: 'Elite',
      headline: '高强度输出已锁定',
      summary: '整体表现接近真实面试中的高竞争态，表达与内容稳定性都处在优秀区间。',
      badgeClass: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200',
      toneClass: 'text-emerald-300',
    };
  }

  if (score >= 70) {
    return {
      tier: 'Strong',
      headline: '核心能力成型，仍有进阶空间',
      summary: '本轮输出已经具备良好的可用性，继续补齐短板后可显著提升面试稳定度。',
      badgeClass: 'border-sky-400/25 bg-sky-400/10 text-sky-200',
      toneClass: 'text-sky-300',
    };
  }

  if (score >= 60) {
    return {
      tier: 'Recoverable',
      headline: '基础框架在线，需要集中强化薄弱段',
      summary: '说明你已经具备一定表达与答题结构，但关键维度之间仍有较明显落差。',
      badgeClass: 'border-amber-400/25 bg-amber-400/10 text-amber-200',
      toneClass: 'text-amber-300',
    };
  }

  return {
    tier: 'Needs Training',
    headline: '需要重新校准答题结构与信号密度',
    summary: '建议先以复盘报告为训练清单，重新搭建自我介绍、技术表达和场景拆解的基础模板。',
    badgeClass: 'border-rose-400/25 bg-rose-400/10 text-rose-200',
    toneClass: 'text-rose-300',
  };
}

function formatReportDate(dateString: string): string {
  const parsedDate = new Date(dateString);

  if (Number.isNaN(parsedDate.getTime())) {
    return dateString;
  }

  return new Intl.DateTimeFormat('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsedDate);
}

interface SessionSummary {
  id: string;
  status: string;
  question_count: number;
  overall_score?: number;
  created_at?: string;
  started_at?: string;
}

function ScoreTrendChart({
  sessions,
  currentSessionId,
}: {
  sessions: SessionSummary[];
  currentSessionId: string;
}) {
  const router = useRouter();
  const gradientId = useId().replace(/:/g, '');
  const recent = sessions
    .filter((s) => s.overall_score !== undefined)
    .slice(-10);

  if (recent.length <= 1) {
    return (
      <p className="text-sm text-white/50 text-center py-6">
        完成更多面试后可查看趋势
      </p>
    );
  }

  const scores = recent.map((s) => s.overall_score!);
  const max = Math.max(...scores, 100);
  const min = Math.min(...scores, 0);
  const range = Math.max(max - min, 1);

  const W = 400;
  const H = 120;
  const padX = 24;
  const padY = 12;
  const innerW = W - padX * 2;
  const innerH = H - padY * 2;

  const points = recent.map((s, i) => {
    const x = padX + (i / Math.max(recent.length - 1, 1)) * innerW;
    const y = padY + innerH - ((s.overall_score! - min) / range) * innerH;
    return { x, y, score: s.overall_score!, id: s.id };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${H - padY} L ${points[0].x} ${H - padY} Z`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      style={{ minHeight: 120 }}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(212,184,150,0.2)" />
          <stop offset="100%" stopColor="rgba(212,184,150,0.02)" />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3].map((row) => (
        <line
          key={row}
          x1={padX}
          y1={padY + (innerH / 3) * row}
          x2={W - padX}
          y2={padY + (innerH / 3) * row}
          className="sparkline-grid"
        />
      ))}
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path
        d={linePath}
        fill="none"
        stroke="#e8d5b0"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="sparkline-glow"
      />
      {points.map((p) => {
        const isCurrent = p.id === currentSessionId;
        const baseR = isCurrent ? 5 : 3;
        return (
          <circle
            key={p.id}
            cx={p.x}
            cy={p.y}
            r={baseR}
            fill={isCurrent ? '#d4b896' : '#8aa8d8'}
            stroke={isCurrent ? '#fff' : 'none'}
            strokeWidth={isCurrent ? 1.5 : 0}
            style={{ cursor: 'pointer', transition: 'r 0.15s ease, stroke 0.15s ease, stroke-width 0.15s ease' }}
            onClick={() => router.push(`/report/${p.id}`)}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.setAttribute('r', String(baseR + 2));
              el.setAttribute('stroke', '#fff');
              el.setAttribute('stroke-width', '1.5');
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.setAttribute('r', String(baseR));
              el.setAttribute('stroke', isCurrent ? '#fff' : 'none');
              el.setAttribute('stroke-width', isCurrent ? '1.5' : '0');
            }}
          >
            <title>{p.score} 分</title>
          </circle>
        );
      })}
      {points.map((p, i) => (
        <text
          key={`label-${p.id}`}
          x={p.x}
          y={H - 1}
          textAnchor="middle"
          className="fill-white/40"
          style={{ fontSize: 8 }}
        >
          #{i + 1}
        </text>
      ))}
    </svg>
  );
}

export default function ReportPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [report, setReport] = useState<InterviewReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [copied, setCopied] = useState(false);

  const handleExportPDF = useCallback(() => {
    window.print();
  }, []);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }, []);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const data = await interviewApi.getReport(sessionId);
        setReport(data);
      } catch {
        setError('加载报告失败');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [sessionId]);

  useEffect(() => {
    interviewApi.getSessions().then(setSessions).catch(() => {});
  }, []);

  const loadingCurve = [22, 38, 54, 68, 82, 76, 90];
  const loadingBars = [28, 46, 62, 78, 88];

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="hero-panel rounded-[32px] p-6 md:p-8 overflow-hidden">
          <ParticleField count={22} tone="mixed" />

          <div className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr] xl:items-start">
            <div>
              <div className="section-kicker mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                智能复盘加载中
              </div>

              <h1 className="text-3xl md:text-5xl font-semibold leading-tight max-w-3xl">
                <span className="bg-gradient-to-r from-white via-[#f7e7ae] to-[#d4af37] bg-clip-text text-transparent">
                  报告正在生成，不只是转圈，而是在构建你的战术复盘场
                </span>
              </h1>

              <p className="text-sm md:text-base text-white/70 leading-7 max-w-3xl mt-4">
                系统正在回放答题表现、抽取强弱项、合成行动卡，并把过程映射成连续的动态信号，让等待本身也有反馈感。
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
                {[
                  { label: '答题回放', value: 'RUN', hint: '重放答题轨迹', toneClass: 'text-blue' },
                  { label: '模式扫描', value: 'LIVE', hint: '扫描亮点与短板', toneClass: 'text-gold' },
                  { label: '行动卡', value: 'SYNC', hint: '组织训练建议', toneClass: 'text-success' },
                ].map((signal, index) => (
                  <motion.div
                    key={signal.label}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 + index * 0.07, duration: 0.4 }}
                    className="signal-card rounded-[22px] p-4"
                  >
                    <p className={`text-lg font-semibold ${signal.toneClass}`}>{signal.value}</p>
                    <p className="text-xs tracking-normal text-muted mt-2">{signal.label}</p>
                    <p className="text-xs text-white/55 mt-3 leading-5">{signal.hint}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="telemetry-panel rounded-[28px] p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs tracking-normal text-gold/80">实时合成</p>
                  <h2 className="text-xl font-semibold text-white mt-2">生成中的复盘信号</h2>
                  <p className="text-sm text-white/60 leading-6 mt-2">
                    让等待阶段也具备沉浸感：看到模型正在做什么，而不是只看见一个 spinner。
                  </p>
                </div>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                  className="w-11 h-11 rounded-full border-2 border-gold/60 border-t-transparent shrink-0"
                />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-[1.02fr_0.98fr] gap-4 mt-6">
                <div className="chart-panel rounded-[22px] p-4">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div>
                      <p className="text-xs tracking-normal text-muted">合成趋势</p>
                      <p className="text-sm text-white mt-1">从回放到建议的实时推进</p>
                    </div>
                    <span className="data-pill text-blue">INFER</span>
                  </div>
                  <TelemetrySparkline
                    values={loadingCurve}
                    labels={['Replay', 'Score', 'Bias', 'Gap', 'Map', 'Card', 'Ready']}
                    tone="gold"
                  />
                </div>

                <div className="chart-panel rounded-[22px] p-4">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div>
                      <p className="text-xs tracking-normal text-muted">信号密度</p>
                      <p className="text-sm text-white mt-1">多通道并行构建复盘结果</p>
                    </div>
                    <span className="data-pill text-success">5 NODES</span>
                  </div>
                  <SignalBars values={loadingBars} tone="blue" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5">
                {['重放答案结构', '归纳优势模式', '生成行动清单'].map((item, index) => (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0.35 }}
                    animate={{ opacity: [0.35, 1, 0.35] }}
                    transition={{ duration: 2.4, repeat: Infinity, delay: index * 0.35 }}
                    className="hud-panel rounded-[20px] p-4"
                  >
                    <p className="text-xs tracking-normal text-muted">Step 0{index + 1}</p>
                    <p className="text-sm text-white mt-2 leading-6">{item}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex items-center justify-center min-h-[440px]">
        <div className="premium-card rounded-[28px] p-8 w-full max-w-md text-center">
          <p className="text-danger text-base">{error || '报告不存在'}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue text-sm hover:text-white transition-colors mt-4"
          >
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  const sectionEntries = Object.entries(report.section_scores) as Array<[
    keyof InterviewReport['section_scores'],
    number,
  ]>;

  const strongestSection =
    [...sectionEntries].sort((left, right) => right[1] - left[1])[0] ?? ['self_intro', 0];
  const weakestSection =
    [...sectionEntries].sort((left, right) => left[1] - right[1])[0] ?? ['scenario', 0];
  const consistencyIndex = Math.max(0, 100 - (strongestSection[1] - weakestSection[1]));
  const profile = getScoreProfile(report.overall_score);
  const generatedAt = formatReportDate(report.created_at);

  const radarData = sectionEntries.map(([key, value]) => ({
    label: sectionLabels[key] || key,
    value,
  }));

  const sectionWave = sectionEntries.map(([, value]) => value);
  const reportCurve = [
    report.overall_score,
    strongestSection[1],
    consistencyIndex,
    weakestSection[1],
    report.recommendations.length * 18,
  ];

  const reportSignals = [
    {
      value: `${report.overall_score}`,
      label: '综合分',
      hint: '综合评分',
      toneClass: profile.toneClass,
    },
    {
      value: sectionLabels[strongestSection[0]] || strongestSection[0],
      label: '最佳维度',
      hint: `${strongestSection[1]} 分`,
      toneClass: 'text-success',
    },
    {
      value: sectionLabels[weakestSection[0]] || weakestSection[0],
      label: '短板维度',
      hint: `${weakestSection[1]} 分`,
      toneClass: 'text-danger',
    },
    {
      value: `${report.recommendations.length}`,
      label: '建议数量',
      hint: '行动卡',
      toneClass: 'text-gold',
    },
  ];

  const strategyTitles = ['优先强化', '表达升级', '技术补位', '下一轮重点'];

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto">
        <FadeIn>
          <div className="hero-panel rounded-[32px] p-6 md:p-8 mb-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-6">
              <div className="flex items-start gap-4">
                <Link href="/" className="premium-card rounded-2xl p-3 transition-colors">
                  <ArrowLeft className="w-4 h-4 text-muted" />
                </Link>
                <div>
                  <div className="section-kicker mb-4">
                    <Sparkles className="w-3.5 h-3.5" />
                    智能复盘
                  </div>
                  <h1 className="text-3xl md:text-5xl font-semibold leading-tight">
                    <span className="bg-gradient-to-r from-white via-[#f6e8b3] to-[#d4af37] bg-clip-text text-transparent">
                      面试战术报告
                    </span>
                  </h1>
                  <p className="text-sm md:text-base text-white/65 leading-7 mt-4 max-w-3xl">
                    把这一轮模拟面试拆成可追踪的能力信号、强弱项与训练动作，帮助你更快进入下一次迭代。
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start no-print">
                <GlowButton variant="outline" onClick={handleExportPDF} className="px-4 py-2.5 rounded-2xl text-sm">
                  <Download className="w-4 h-4" />
                  导出 PDF
                </GlowButton>
                <GlowButton variant="outline" onClick={handleCopyLink} className="px-4 py-2.5 rounded-2xl text-sm">
                  <Link2 className="w-4 h-4" />
                  <AnimatePresence mode="wait">
                    {copied ? (
                      <motion.span
                        key="copied"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.2 }}
                      >
                        已复制
                      </motion.span>
                    ) : (
                      <motion.span
                        key="copy"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.2 }}
                      >
                        复制链接
                      </motion.span>
                    )}
                  </AnimatePresence>
                </GlowButton>
                <Link
                  href="/"
                  className="premium-card px-4 py-3 rounded-2xl text-sm text-muted hover:text-white transition-colors inline-flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  重新开始
                </Link>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr] xl:items-start">
              <div>
                <div className="flex flex-wrap gap-3">
                  <span className={`data-pill ${profile.badgeClass}`}>{profile.tier}</span>
                  <span className="glass-tag rounded-full px-3 py-1.5 text-xs text-white/75">
                    Session · {sessionId.slice(0, 8)}...
                  </span>
                  <span className="glass-tag rounded-full px-3 py-1.5 text-xs text-white/75">
                    Generated · {generatedAt}
                  </span>
                </div>

                <p className={`text-lg md:text-xl font-medium mt-5 ${profile.toneClass}`}>
                  {profile.headline}
                </p>
                <p className="text-sm text-white/65 leading-7 mt-3 max-w-3xl">{profile.summary}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mt-6">
                  {reportSignals.map((signal, index) => (
                    <motion.div
                      key={signal.label}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.08 + index * 0.06, duration: 0.4 }}
                      className="signal-card rounded-[22px] p-4"
                    >
                      <p className={`text-lg font-semibold ${signal.toneClass}`}>{signal.value}</p>
                      <p className="text-xs tracking-normal text-muted mt-2">
                        {signal.label}
                      </p>
                      <p className="text-xs text-white/55 mt-3 leading-5">{signal.hint}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15, duration: 0.42 }}
                className="telemetry-panel rounded-[28px] p-6"
              >
                <ParticleField count={16} tone="mixed" compact />
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs tracking-normal text-gold/80">
                      表现等级
                    </p>
                    <h2 className="text-xl font-semibold text-white mt-2">总体现状判定</h2>
                    <p className="text-sm text-white/60 leading-6 mt-2">
                      综合分、维度差值与建议数量汇总为本轮战斗力快照。
                    </p>
                  </div>
                  <span className={`data-pill ${profile.badgeClass}`}>{profile.tier.toUpperCase()}</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mt-6">
                  <div className="mx-auto md:mx-0">
                    <AnimatedScore score={report.overall_score} size="xl" />
                    <p className="text-xs tracking-normal text-muted text-center mt-4">
                      综合战斗力评分
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 flex-1">
                    {[
                      {
                        label: '最佳输出',
                        value: `${sectionLabels[strongestSection[0]] || strongestSection[0]} · ${strongestSection[1]}`,
                        icon: TrendingUp,
                        toneClass: 'text-success',
                      },
                      {
                        label: '差距控制',
                        value: `${consistencyIndex}% consistency`,
                        icon: Activity,
                        toneClass: 'text-blue',
                      },
                      {
                        label: '下一轮',
                        value: `${report.recommendations.length} 个重点动作`,
                        icon: ShieldCheck,
                        toneClass: 'text-gold',
                      },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.label} className="hud-panel rounded-[22px] p-4">
                          <div className="flex items-center gap-3">
                            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-2.5">
                              <Icon className={`w-4 h-4 ${item.toneClass}`} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs tracking-normal text-muted">
                                {item.label}
                              </p>
                              <p className="text-sm text-white mt-1 truncate">{item.value}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="hud-panel rounded-[24px] p-4 mt-5">
                  <div className="flex items-center justify-between text-xs tracking-normal text-muted">
                    <span>一致性指数</span>
                    <span>{consistencyIndex}%</span>
                  </div>
                  <div className="telemetry-bar mt-3">
                    <span style={{ width: `${consistencyIndex}%` }} />
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-[1.05fr_0.95fr] gap-4 mt-5">
                  <div className="chart-panel rounded-[22px] p-4">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div>
                        <p className="text-xs tracking-normal text-muted">复盘趋势</p>
                        <p className="text-sm text-white mt-1">总分、稳定性与行动密度的复盘趋势</p>
                      </div>
                      <span className={`data-pill ${profile.toneClass}`}>{generatedAt}</span>
                    </div>
                    <TelemetrySparkline
                      values={reportCurve}
                      labels={['Overall', 'Best', 'Stable', 'Gap', 'Next']}
                      tone="gold"
                    />
                  </div>

                  <div className="chart-panel rounded-[22px] p-4">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div>
                        <p className="text-xs tracking-normal text-muted">维度密度</p>
                        <p className="text-sm text-white mt-1">把各维度得分拆成独立能量条</p>
                      </div>
                      <span className="data-pill text-blue">{sectionEntries.length} AXES</span>
                    </div>
                    <SignalBars values={sectionWave} tone="blue" />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 xl:grid-cols-[1.04fr_0.96fr] gap-6 mb-6">
          <FadeIn delay={0.08}>
            <div className="premium-card rounded-[28px] p-5 md:p-6 h-full">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <p className="text-sm font-medium text-gold flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    能力总览
                  </p>
                  <p className="text-sm text-white/60 mt-2 leading-6">
                    从整体能力分布上看三大环节的覆盖情况，方便快速判断哪一段需要补训。
                  </p>
                </div>
                <span className="data-pill text-gold">VISUAL MAP</span>
              </div>

              <div className="radar-shell rounded-[26px] p-4 md:p-5">
                <div className="radar-grid-lines" />
                <div className="radar-sweep" />
                <RadarChart data={radarData} className="relative z-10" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                {sectionEntries.map(([key, score]) => (
                  <div key={key} className="signal-card rounded-[22px] p-4">
                    <p className="text-lg font-semibold text-white">{score}</p>
                    <p className="text-xs tracking-normal text-muted mt-2">
                      {sectionLabels[key] || key}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.14}>
            <div className="premium-card rounded-[28px] p-6 h-full">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <p className="text-sm font-medium text-gold flex items-center gap-2">
                    <Cpu className="w-4 h-4" />
                    维度拆解
                  </p>
                  <p className="text-sm text-white/60 mt-2 leading-6">
                    每个环节分别展示分数、进度条与强弱信号，便于定位答题结构中的落差。
                  </p>
                </div>
                <span className="data-pill text-blue">DETAILED</span>
              </div>

              <div className="space-y-5">
                {sectionEntries.map(([key, score]) => (
                  <div key={key} className="hud-panel rounded-[22px] p-4">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div>
                        <p className="text-sm text-white font-medium">{sectionLabels[key] || key}</p>
                        <p className="text-xs text-white/50 mt-1">
                          {score >= 80
                            ? '输出稳定，已接近优势项'
                            : score >= 60
                              ? '具备基础框架，建议继续打磨'
                              : '需要优先补齐这一段的答题结构'}
                        </p>
                      </div>
                      <span
                        className={`data-pill ${
                          score >= 80
                            ? 'text-success'
                            : score >= 60
                              ? 'text-gold'
                              : 'text-danger'
                        }`}
                      >
                        {score}
                      </span>
                    </div>
                    <AnimatedProgress value={score} label={sectionLabels[key] || key} />
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
          <FadeIn delay={0.2}>
            <div className="premium-card rounded-[28px] p-6 h-full">
              <div className="flex items-center gap-2 mb-5">
                <TrendingUp className="w-4 h-4 text-success" />
                <h2 className="text-sm font-medium text-success">优势信号</h2>
              </div>

              <div className="space-y-3">
                {(report.strengths.length > 0 ? report.strengths : ['本次报告暂未返回优势摘要']).map(
                  (item, index) => (
                    <motion.div
                      key={`${item}-${index}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.28 + index * 0.06 }}
                      className="hud-panel rounded-[22px] p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="rounded-2xl border border-success/20 bg-success/10 px-3 py-1 text-xs text-success">
                          +{String(index + 1).padStart(2, '0')}
                        </div>
                        <p className="text-sm text-white/80 leading-7">{item}</p>
                      </div>
                    </motion.div>
                  )
                )}
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.26}>
            <div className="premium-card rounded-[28px] p-6 h-full">
              <div className="flex items-center gap-2 mb-5">
                <TrendingDown className="w-4 h-4 text-danger" />
                <h2 className="text-sm font-medium text-danger">待强化区</h2>
              </div>

              <div className="space-y-3">
                {(report.weaknesses.length > 0 ? report.weaknesses : ['本次报告暂未返回弱项摘要']).map(
                  (item, index) => (
                    <motion.div
                      key={`${item}-${index}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.34 + index * 0.06 }}
                      className="hud-panel rounded-[22px] p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="rounded-2xl border border-danger/20 bg-danger/10 px-3 py-1 text-xs text-danger">
                          -{String(index + 1).padStart(2, '0')}
                        </div>
                        <p className="text-sm text-white/80 leading-7">{item}</p>
                      </div>
                    </motion.div>
                  )
                )}
              </div>
            </div>
          </FadeIn>
        </div>

        <FadeIn delay={0.32}>
          <div className="premium-card premium-card-strong rounded-[28px] p-6 mb-8">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between mb-5">
              <div>
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-blue" />
                  <h2 className="text-sm font-medium text-blue">训练策略卡</h2>
                </div>
                <p className="text-sm text-white/60 leading-6 mt-3 max-w-3xl">
                  把建议拆成更易执行的动作卡，下一轮模拟时可直接按优先级逐条对照完成。
                </p>
              </div>
              <span className="data-pill text-blue">ACTIONABLE</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(report.recommendations.length > 0
                ? report.recommendations
                : ['当前暂无建议，请回到首页重新发起一轮模拟面试。']
              ).map((item, index) => (
                <motion.div
                  key={`${item}-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.06 }}
                  className="strategy-card rounded-[24px] p-5"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="rounded-[18px] border border-gold/20 bg-gold/10 px-3 py-2 text-sm font-semibold text-gold">
                      {String(index + 1).padStart(2, '0')}
                    </div>
                    <div>
                      <p className="text-xs tracking-normal text-muted">
                        行动卡
                      </p>
                      <p className="text-sm font-medium text-white mt-1">
                        {strategyTitles[index] ?? `第 ${index + 1} 轮优化`}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-white/80 leading-7">{item}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.4}>
          <div className="premium-card premium-card-strong rounded-[28px] p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-gold" />
              <h2 className="text-sm font-medium text-gold">历史趋势</h2>
            </div>
            <p className="text-sm text-white/60 leading-6 mb-5">
              跨场次平均分走势，点击节点可跳转对应报告。
            </p>
            <ScoreTrendChart sessions={sessions} currentSessionId={sessionId} />
          </div>
        </FadeIn>
      </div>
    </PageTransition>
  );
}
