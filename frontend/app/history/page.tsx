'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  FileText,
  History,
  Radar,
  Search,
  Sparkles,
  Trash2,
  Trophy,
  X,
} from 'lucide-react';
import { interviewApi } from '@/lib/api';
import {
  PageTransition,
  FadeIn,
  StaggerContainer,
  StaggerItem,
  ParticleField,
  TelemetrySparkline,
  SignalBars,
} from '@/components';

interface SessionSummary {
  id: string;
  status: string;
  question_count: number;
  overall_score?: number;
  created_at?: string;
  started_at?: string;
}

function formatDate(dateString: string): string {
  if (!dateString) return '时间未知';

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;

  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function getScoreTone(score?: number): string {
  if (score === undefined) return 'text-muted';
  if (score >= 80) return 'text-success';
  if (score >= 60) return 'text-gold';
  return 'text-danger';
}

type SortMode = 'date-desc' | 'date-asc' | 'score-desc' | 'score-asc';

export default function HistoryPage() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('date-desc');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const data = await interviewApi.getSessions();
        setSessions(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch sessions', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  const handleDelete = useCallback((sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    setDeletingId(null);
  }, []);

  const sortedSessions = useMemo(() => {
    let filtered = [...sessions];

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.id.toLowerCase().includes(q) ||
          (s.status === 'completed' ? '已完成模拟面试' : '进行中的模拟任务').includes(q)
      );
    }

    filtered.sort((left, right) => {
      switch (sortMode) {
        case 'date-asc': {
          const lt = new Date(left.created_at || left.started_at || 0).getTime();
          const rt = new Date(right.created_at || right.started_at || 0).getTime();
          return lt - rt;
        }
        case 'score-desc':
          return (right.overall_score ?? -1) - (left.overall_score ?? -1);
        case 'score-asc':
          return (left.overall_score ?? -1) - (right.overall_score ?? -1);
        default: {
          const lt = new Date(left.created_at || left.started_at || 0).getTime();
          const rt = new Date(right.created_at || right.started_at || 0).getTime();
          return rt - lt;
        }
      }
    });

    return filtered;
  }, [sessions, searchQuery, sortMode]);

  const completedSessions = sortedSessions.filter((session) => session.status === 'completed');
  const scoreSessions = completedSessions.filter((session) => session.overall_score !== undefined);
  const averageScore = scoreSessions.length
    ? Math.round(
        scoreSessions.reduce((sum, session) => sum + (session.overall_score ?? 0), 0) /
          scoreSessions.length
      )
    : null;
  const activeSessions = sortedSessions.filter((session) => session.status !== 'completed').length;
  const bestScore = scoreSessions.length
    ? Math.max(...scoreSessions.map((session) => session.overall_score ?? 0))
    : null;

  const archiveCurve = useMemo(() => {
    if (sortedSessions.length === 0) {
      return [12, 18, 14, 24, 16];
    }

    return sortedSessions
      .slice(0, 8)
      .reverse()
      .map((session, index) => session.overall_score ?? Math.min(72, 38 + index * 6));
  }, [sortedSessions]);

  const archiveBars = useMemo(
    () => [
      Math.min(100, sortedSessions.length * 12),
      sortedSessions.length > 0 ? Math.round((completedSessions.length / sortedSessions.length) * 100) : 0,
      Math.min(100, activeSessions * 20),
      averageScore ?? 28,
      bestScore ?? 34,
    ],
    [activeSessions, averageScore, bestScore, completedSessions.length, sortedSessions.length]
  );

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="hero-panel rounded-[32px] p-6 md:p-8 mb-6">
          {/* Skeleton header */}
          <div className="h-5 w-24 rounded-full bg-white/[0.06] animate-pulse mb-4" />
          <div className="h-8 w-64 rounded-xl bg-white/[0.06] animate-pulse mb-3" />
          <div className="h-4 w-96 rounded-lg bg-white/[0.04] animate-pulse" />
        </div>
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="premium-card rounded-[24px] p-6 animate-pulse">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="h-5 w-48 rounded-lg bg-white/[0.06]" />
                  <div className="h-4 w-32 rounded-lg bg-white/[0.04]" />
                  <div className="flex gap-2 mt-2">
                    <div className="h-6 w-16 rounded-full bg-white/[0.04]" />
                    <div className="h-6 w-20 rounded-full bg-white/[0.04]" />
                    <div className="h-6 w-14 rounded-full bg-white/[0.04]" />
                  </div>
                </div>
                <div className="h-14 w-14 rounded-full bg-white/[0.06]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto">
        <FadeIn>
          <div className="hero-panel rounded-[32px] p-6 md:p-8 mb-6">
            <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr] xl:items-start">
              <div>
                <div className="section-kicker mb-4">
                  <Sparkles className="w-3.5 h-3.5" />
                  历史档案
                </div>

                <h1 className="text-3xl md:text-5xl font-semibold leading-tight max-w-3xl">
                  <span className="bg-gradient-to-r from-white via-[#f7e7ae] to-[#d4af37] bg-clip-text text-transparent">
                    把每一轮面试都沉淀成可追踪的战绩档案
                  </span>
                </h1>

                <p className="text-sm md:text-base text-white/70 leading-7 max-w-3xl mt-4">
                  历史页现在不仅展示记录，还会把完成数、平均分、最佳表现与最近活动浓缩成同一套赛博档案面板。
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mt-6">
                  {[
                    {
                      value: `${sortedSessions.length}`,
                      label: '全部会话',
                      hint: '总面试任务数',
                      toneClass: 'text-white',
                    },
                    {
                      value: `${completedSessions.length}`,
                      label: '已完成',
                      hint: '已完成回合',
                      toneClass: 'text-success',
                    },
                    {
                      value: averageScore !== null ? `${averageScore}` : '--',
                      label: '平均分',
                      hint: '已完成任务均分',
                      toneClass: 'text-gold',
                    },
                    {
                      value: bestScore !== null ? `${bestScore}` : '--',
                      label: '最高分',
                      hint: '历史最高表现',
                      toneClass: 'text-blue',
                    },
                  ].map((signal, index) => (
                    <motion.div
                      key={signal.label}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.08 + index * 0.06, duration: 0.38 }}
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
                transition={{ delay: 0.14, duration: 0.42 }}
                className="telemetry-panel rounded-[28px] p-6"
              >
                <ParticleField count={15} tone="mixed" compact />
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs tracking-normal text-gold/80">
                      档案数据
                    </p>
                    <h2 className="text-xl font-semibold text-white mt-2">历史档案状态</h2>
                    <p className="text-sm text-white/60 leading-6 mt-2">
                      当前看板聚焦最近记录、活跃会话与可复盘报告，帮助你快速定位下一次回看入口。
                    </p>
                  </div>
                  <span className="data-pill text-gold">
                    {sortedSessions.length > 0 ? 'ONLINE' : 'EMPTY'}
                  </span>
                </div>

                <div className="space-y-4 mt-6">
                  {[
                    {
                      label: '档案密度',
                      value: `${sortedSessions.length} sessions`,
                      percent: Math.min(100, sortedSessions.length * 12),
                      toneClass: 'text-gold',
                    },
                    {
                      label: '完成率',
                      value:
                        sortedSessions.length > 0
                          ? `${Math.round((completedSessions.length / sortedSessions.length) * 100)}%`
                          : '0%',
                      percent:
                        sortedSessions.length > 0
                          ? Math.round((completedSessions.length / sortedSessions.length) * 100)
                          : 0,
                      toneClass: 'text-success',
                    },
                    {
                      label: '活跃会话',
                      value: `${activeSessions}`,
                      percent: Math.min(100, activeSessions * 20),
                      toneClass: activeSessions > 0 ? 'text-blue' : 'text-muted',
                    },
                  ].map((item) => (
                    <div key={item.label} className="pipeline-node rounded-[22px] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs tracking-normal text-muted">
                            {item.label}
                          </p>
                          <p className="text-sm text-white mt-1">{item.value}</p>
                        </div>
                        <span className={`data-pill ${item.toneClass}`}>{Math.round(item.percent)}%</span>
                      </div>
                      <div className="telemetry-bar mt-3">
                        <span style={{ width: `${Math.min(100, item.percent)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-[1.08fr_0.92fr] gap-4 mt-5">
                  <div className="chart-panel rounded-[22px] p-4">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div>
                        <p className="text-xs tracking-normal text-muted">档案趋势</p>
                        <p className="text-sm text-white mt-1">最近会话评分与热度的连续波形</p>
                      </div>
                      <span className="data-pill text-gold">{sortedSessions.length}</span>
                    </div>
                    <TelemetrySparkline
                      values={archiveCurve}
                      labels={archiveCurve.map((_, index) => `S${index + 1}`)}
                      tone="gold"
                    />
                  </div>

                  <div className="chart-panel rounded-[22px] p-4">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div>
                        <p className="text-xs tracking-normal text-muted">档案柱状图</p>
                        <p className="text-sm text-white mt-1">密度、完成率、活跃度与成绩并列观察</p>
                      </div>
                      <span className="data-pill text-blue">LIVE</span>
                    </div>
                    <SignalBars values={archiveBars} tone="blue" />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </FadeIn>

        {sessions.length === 0 ? (
          <FadeIn delay={0.12}>
            <div className="premium-card premium-card-strong rounded-[28px] p-10 md:p-12 text-center">
              <FileText className="w-12 h-12 text-muted mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white">你的档案库还没有记录</h2>
              <p className="text-sm text-white/60 leading-7 mt-3 max-w-xl mx-auto">
                发起第一轮模拟面试后，这里会自动沉淀历史记录、分数与报告入口，并纳入同一套视觉战绩系统。
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 mt-6 rounded-2xl border border-gold/30 bg-gradient-to-r from-[#d4af37] via-[#f1d97b] to-[#e8c84a] px-6 py-3 text-sm font-semibold text-black shadow-[0_16px_36px_rgba(212,175,55,0.28)] transition-transform hover:-translate-y-0.5"
              >
                <Sparkles className="w-4 h-4" />
                开始第一次模拟面试
              </Link>
            </div>
          </FadeIn>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
            <FadeIn delay={0.12}>
              <div className="premium-card rounded-[28px] p-6 h-full">
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div>
                    <p className="text-sm font-medium text-gold flex items-center gap-2">
                      <History className="w-4 h-4" />
                      会话档案列表
                    </p>
                    <p className="text-sm text-white/60 mt-2 leading-6">
                      每条记录都改成了统一的档案卡，直接显示状态、题量、分数与时间信息。
                    </p>
                  </div>
                  <span className="data-pill text-gold">ARCHIVE</span>
                </div>

                {/* Search */}
                <div className="relative mb-4">
                  <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors ${searchFocused ? 'text-white/70' : 'text-muted'}`} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    placeholder="搜索会话 ID、状态..."
                    className="neo-input w-full rounded-2xl py-2.5 pl-11 pr-10 text-sm text-white placeholder:text-muted outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-white/40 hover:text-white/80 transition-colors"
                      aria-label="清除搜索"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Sort pills */}
                <div className="flex flex-wrap gap-2 mb-5">
                  {([
                    { key: 'date-desc', label: '最新优先' },
                    { key: 'date-asc', label: '最早优先' },
                    { key: 'score-desc', label: '高分优先' },
                    { key: 'score-asc', label: '低分优先' },
                  ] as const).map((pill) => (
                    <button
                      key={pill.key}
                      onClick={() => setSortMode(pill.key)}
                      className={`data-pill transition-colors cursor-pointer ${
                        sortMode === pill.key
                          ? 'border-gold/20 bg-gold/10 text-gold'
                          : 'text-muted hover:text-white'
                      }`}
                    >
                      {pill.label}
                    </button>
                  ))}
                </div>

                {/* Session list */}
                {sortedSessions.length === 0 && searchQuery.trim() ? (
                  <div className="text-center py-10">
                    <Search className="w-8 h-8 text-muted mx-auto mb-3" />
                    <p className="text-sm text-white/60">没有找到匹配的会话记录</p>
                    <p className="text-xs text-muted mt-1">试试其他关键词</p>
                  </div>
                ) : (
                <StaggerContainer className="space-y-4">
                  <AnimatePresence mode="popLayout">
                  {sortedSessions.map((session) => (
                    <motion.div
                      key={session.id}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -60, transition: { duration: 0.25 } }}
                    >
                    <StaggerItem>
                      <div className="strategy-card history-entry rounded-[24px] p-5 group relative">
                        {/* Delete button */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setDeletingId(deletingId === session.id ? null : session.id);
                          }}
                          className="absolute top-4 right-4 z-10 p-1.5 rounded-xl text-muted hover:text-danger transition-colors"
                          aria-label="删除会话"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        {/* Delete confirmation */}
                        <AnimatePresence>
                          {deletingId === session.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden mb-3"
                            >
                              <div className="flex items-center gap-3 rounded-2xl border border-danger/20 bg-danger/5 px-4 py-2.5">
                                <span className="text-xs text-danger">确认删除?</span>
                                <button
                                  onClick={() => handleDelete(session.id)}
                                  className="data-pill text-danger border-danger/20 bg-danger/10 cursor-pointer text-xs"
                                >
                                  确认
                                </button>
                                <button
                                  onClick={() => setDeletingId(null)}
                                  className="data-pill text-muted cursor-pointer text-xs"
                                >
                                  取消
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <Link
                          href={`/report/${session.id}`}
                          className="block"
                        >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="data-pill text-gold">#{session.id.slice(0, 8)}</span>
                              <span
                                className={`data-pill ${
                                  session.status === 'completed' ? 'text-success' : 'text-blue'
                                }`}
                              >
                                {session.status === 'completed' ? 'Completed' : 'In Progress'}
                              </span>
                            </div>
                            <p className="text-base text-white font-medium mt-4">
                              {session.status === 'completed' ? '已完成模拟面试' : '进行中的模拟任务'}
                            </p>
                            <p className="text-sm text-white/55 mt-2 leading-6">
                              {session.question_count} 道题 · {formatDate(session.created_at || session.started_at || '')}
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="grid grid-cols-2 gap-3 min-w-[200px]">
                              <div className="hud-panel rounded-[18px] p-3 text-center">
                                <p className={`text-lg font-semibold ${getScoreTone(session.overall_score)}`}>
                                  {session.overall_score ?? '--'}
                                </p>
                                <p className="text-xs tracking-normal text-muted mt-2">
                                  分数
                                </p>
                              </div>
                              <div className="hud-panel rounded-[18px] p-3 text-center">
                                <p className="text-lg font-semibold text-white">{session.question_count}</p>
                                <p className="text-xs tracking-normal text-muted mt-2">
                                  题数
                                </p>
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-muted group-hover:text-gold transition-colors shrink-0" />
                          </div>
                        </div>
                        </Link>
                      </div>
                    </StaggerItem>
                    </motion.div>
                  ))}
                  </AnimatePresence>
                </StaggerContainer>
                )}
              </div>
            </FadeIn>

            <FadeIn delay={0.18}>
              <div className="premium-card rounded-[28px] p-6 h-full">
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div>
                    <p className="text-sm font-medium text-gold flex items-center gap-2">
                      <Trophy className="w-4 h-4" />
                      档案亮点
                    </p>
                    <p className="text-sm text-white/60 mt-2 leading-6">
                      用更简洁的看板方式展示你的历史最佳状态、最近活跃度和下一步查看建议。
                    </p>
                  </div>
                  <span className="data-pill text-blue">HIGHLIGHTS</span>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="signal-card rounded-[22px] p-5">
                    <div className="flex items-center gap-3">
                      <Radar className="w-4 h-4 text-blue" />
                      <div>
                        <p className="text-xs tracking-normal text-muted">最近会话</p>
                        <p className="text-sm text-white mt-1">#{sortedSessions[0].id.slice(0, 8)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="signal-card rounded-[22px] p-5">
                    <div className="flex items-center gap-3">
                      <Trophy className="w-4 h-4 text-success" />
                      <div>
                        <p className="text-xs tracking-normal text-muted">最佳表现</p>
                        <p className="text-sm text-white mt-1">
                          {bestScore !== null ? `${bestScore} 分` : '暂无已评分记录'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="signal-card rounded-[22px] p-5">
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-4 h-4 text-gold" />
                      <div>
                        <p className="text-xs tracking-normal text-muted">下一步</p>
                        <p className="text-sm text-white mt-1">
                          优先回看最近一次报告，并对比历史最佳分数的差距。
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        )}
      </div>
    </PageTransition>
  );
}

