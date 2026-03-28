'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  ChevronRight,
  CheckCircle,
  Clock,
  Hash,
  MessageSquareText,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  TimerReset,
} from 'lucide-react';
import { interviewApi } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import {
  AnimatedScore,
  PageTransition,
  FadeIn,
  GlowButton,
  AILoadingIndicator,
  ParticleField,
  TelemetrySparkline,
  SignalBars,
  SpeechButton,
  useToast,
} from '@/components';
import { useInterviewPhase } from '@/hooks';

const categoryLabels: Record<string, string> = {
  self_intro: '自我介绍',
  skill_test: '技能考察',
  scenario: '场景题',
  reverse: '反问环节',
};

const difficultyConfig: Record<string, { label: string; toneClass: string; pillClass: string }> = {
  easy: {
    label: 'Easy',
    toneClass: 'text-success',
    pillClass: 'border-success/20 bg-success/10 text-success',
  },
  medium: {
    label: 'Medium',
    toneClass: 'text-gold',
    pillClass: 'border-gold/20 bg-gold/10 text-gold',
  },
  hard: {
    label: 'Hard',
    toneClass: 'text-danger',
    pillClass: 'border-danger/20 bg-danger/10 text-danger',
  },
};

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainSeconds.toString().padStart(2, '0')}`;
}

export default function InterviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const store = useAppStore();
  const hydrateSession = useAppStore((state) => state.hydrateSession);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [timer, setTimer] = useState(0);
  const [restoring, setRestoring] = useState(false);
  const [speechListening, setSpeechListening] = useState(false);
  const [submitSent, setSubmitSent] = useState(false);
  const [timerBounce, setTimerBounce] = useState(false);
  const prevPaceRef = useRef(0);
  const { toast } = useToast();

  const { questions, currentQuestionIndex, sessionId, evalResults, jdData, resumeData } = store;
  const requestedSessionId = searchParams.get('sessionId');
  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const currentEval = currentQuestion ? evalResults[currentQuestion.id] : null;

  useEffect(() => {
    if (showFeedback) return;

    const interval = setInterval(() => {
      setTimer((previousTimer) => previousTimer + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [showFeedback, currentQuestionIndex]);

  useEffect(() => {
    setAnswer('');
    setShowFeedback(false);
    setTimer(0);
    textareaRef.current?.focus();
  }, [currentQuestionIndex]);

  // Prevent accidental navigation away during active interview
  useEffect(() => {
    const hasProgress = answer.trim().length > 0 || currentQuestionIndex > 0;
    if (!hasProgress || showFeedback) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [answer, currentQuestionIndex, showFeedback]);

  useEffect(() => {
    if (!requestedSessionId) {
      if (sessionId && questions.length > 0) {
        router.replace(`/interview?sessionId=${sessionId}`);
        return;
      }

      router.replace('/');
      return;
    }

    if (sessionId === requestedSessionId && questions.length > 0) {
      return;
    }

    let cancelled = false;

    const restoreSession = async () => {
      try {
        setRestoring(true);
        const session = await interviewApi.getSession(requestedSessionId);
        if (cancelled) {
          return;
        }

        hydrateSession(session);

        const answeredQuestionCount = new Set(session.answers.map((item: { question_id: string }) => item.question_id)).size;
        if (session.questions.length > 0 && answeredQuestionCount >= session.questions.length) {
          router.replace(`/report/${requestedSessionId}`);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Restore session failed:', error);
          router.replace('/');
        }
      } finally {
        if (!cancelled) {
          setRestoring(false);
        }
      }
    };

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, [requestedSessionId, sessionId, questions.length, router, hydrateSession]);

  const questionLabel = useMemo(() => {
    if (!currentQuestion) return '面试任务';
    return categoryLabels[currentQuestion.type] || currentQuestion.category || '面试任务';
  }, [currentQuestion]);

  const recommendedTimeSafe = Math.max(60, currentQuestion?.time_limit || 180);
  const paceSafe = Math.min(100, Math.round((timer / recommendedTimeSafe) * 100));
  const isOvertimeSafe = timer >= recommendedTimeSafe;

  const phaseConfig = useInterviewPhase({
    answerLength: answer.length,
    submitting,
    showFeedback,
    pace: paceSafe,
    isOvertime: isOvertimeSafe,
  });

  // Timer threshold bounce
  useEffect(() => {
    const prev = prevPaceRef.current;
    if ((prev < 72 && paceSafe >= 72) || (prev < 92 && paceSafe >= 92)) {
      setTimerBounce(true);
      setTimeout(() => setTimerBounce(false), 500);
    }
    prevPaceRef.current = paceSafe;
  }, [paceSafe]);

  if (restoring) {
    return (
      <div className="flex items-center justify-center min-h-[440px]">
        <div className="premium-card premium-card-strong rounded-[28px] p-8 w-full max-w-md text-center">
          <AILoadingIndicator step="恢复面试进度中..." compact />
        </div>
      </div>
    );
  }

  if (!currentQuestion || !sessionId) return null;

  const difficulty = difficultyConfig[currentQuestion.difficulty] || difficultyConfig.medium;
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const recommendedTime = Math.max(60, currentQuestion.time_limit || 180);
  const pace = Math.min(100, Math.round((timer / recommendedTime) * 100));
  const isOvertime = timer >= recommendedTime;
  const isTimeWarning = pace >= 72;
  const isTimeCritical = pace >= 92;

  const answerWords = answer.trim() ? answer.trim().split(/\s+/).length : 0;
  const statusText = showFeedback ? '反馈已生成' : submitting ? 'AI 评分中' : '正在作答';
  const statusClass = showFeedback
    ? 'text-success'
    : submitting
      ? 'text-blue'
      : 'text-gold';
  const timerToneClass = isOvertime || isTimeCritical ? 'text-danger' : isTimeWarning ? 'text-gold' : 'text-blue';
  const timerPillClass = isOvertime || isTimeCritical
    ? 'border-danger/30 bg-danger/15 text-danger animate-pulse'
    : isTimeWarning
      ? 'border-gold/30 bg-gold/15 text-gold'
      : 'border-blue/25 bg-blue/10 text-blue';
  const timerStateText = isOvertime
    ? '建议时间已到，请尽快收束答案'
    : isTimeCritical
      ? '进入收束窗口，建议开始总结'
      : isTimeWarning
        ? '节奏可以再快一点'
        : '节奏稳定';
  const answerConsoleClass = isOvertime || isTimeCritical
    ? 'border border-danger/25 shadow-[0_0_52px_rgba(255,107,107,0.18)]'
    : isTimeWarning
      ? 'border border-gold/20 shadow-[0_0_44px_rgba(212,175,55,0.14)]'
      : 'border border-white/10 shadow-[0_0_36px_rgba(90,185,255,0.10)]';
  const timeBarStyle = {
    width: `${Math.min(100, pace)}%`,
    background:
      isOvertime || isTimeCritical
        ? 'linear-gradient(90deg, rgba(255,107,107,0.96), rgba(255,163,112,0.92))'
        : isTimeWarning
          ? 'linear-gradient(90deg, rgba(212,175,55,0.96), rgba(255,219,120,0.92))'
          : undefined,
  };

  const missionSignals = [
    {
      value: `${currentQuestionIndex + 1}/${questions.length}`,
      label: 'Current Stage',
      hint: questionLabel,
      toneClass: 'text-white',
    },
    {
      value: formatTime(timer),
      label: '已用时间',
      hint: `${timerStateText} · 建议 ${formatTime(recommendedTime)}`,
      toneClass: timerToneClass,
    },
    {
      value: showFeedback && currentEval ? `${currentEval.score}` : `${answer.length}`,
      label: showFeedback ? 'AI Score' : 'Answer Length',
      hint: showFeedback ? '本题即时评分' : `${answerWords} 词`,
      toneClass: showFeedback ? 'text-success' : 'text-gold',
    },
    {
      value: statusText,
      label: 'Mission Status',
      hint: `Session ${sessionId.slice(0, 8)}...`,
      toneClass: statusClass,
    },
  ];

  const telemetryWave = [
    Math.max(18, progress * 0.72),
    Math.max(16, pace),
    showFeedback && currentEval ? currentEval.score : Math.min(100, answer.length * 1.4),
    Math.min(100, answerWords * 12),
    showFeedback ? 100 : submitting ? 78 : 32,
  ];

  const telemetryCurve = [
    Math.round(progress * 0.46),
    Math.round(progress * 0.72),
    pace,
    showFeedback && currentEval ? currentEval.score : Math.min(100, answer.length),
    showFeedback ? 100 : submitting ? 74 : 40,
  ];

  const handleSubmit = async () => {
    if (!answer.trim() || submitting) return;
    setSubmitting(true);
    setSubmitSent(true);
    setTimeout(() => setSubmitSent(false), 600);
    toast('回答已提交，AI 评分中...', 'info');

    try {
      const result = await interviewApi.evaluate(sessionId, currentQuestion.id, answer);
      store.submitAnswer(
        currentQuestion.id,
        {
          question_id: currentQuestion.id,
          content: answer,
          score: result.score,
          feedback: result.feedback,
          submitted_at: new Date().toISOString(),
        },
        result
      );
      setShowFeedback(true);
      toast('评分完成', 'success');
    } catch (error) {
      console.error('Evaluate failed:', error);
      toast('评分失败，请重试', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSpeechTranscript = (text: string) => {
    setAnswer((prev) => prev + text);
  };

  const handleNext = () => {
    if (isLastQuestion) {
      router.push(`/report/${sessionId}`);
      return;
    }

    store.nextQuestion();
  };

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto">
        <FadeIn>
          <div className="hero-panel rounded-[32px] p-6 md:p-8 mb-6">
            <div className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr] xl:items-start">
              <div>
                <div className="section-kicker mb-4">
                  <Sparkles className="w-3.5 h-3.5" />
                  Live Interview Mission
                </div>

                <h1 className="text-3xl md:text-5xl font-semibold leading-tight max-w-3xl">
                  <span className="bg-gradient-to-r from-white via-[#f7e7ae] to-[#d4af37] bg-clip-text text-transparent">
                    正在进行一场实时联动的 AI 模拟面试
                  </span>
                </h1>

                <p className="text-sm md:text-base text-white/70 leading-7 max-w-3xl mt-4">
                  当前问题维持独立任务卡，答题区域升级成一张更聚焦的大卡片，让你在实时计时和即时反馈下更稳定地推进整轮面试。
                </p>

                <div className="flex flex-wrap gap-3 mt-6">
                  <span className="glass-tag rounded-full px-3 py-1.5 text-xs text-white/80">
                    {jdData?.position || '目标岗位'}
                  </span>
                  <span className="glass-tag rounded-full px-3 py-1.5 text-xs text-white/80">
                    {resumeData?.name || 'Candidate Profile'}
                  </span>
                  <span className={`data-pill ${difficulty.pillClass}`}>{difficulty.label}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mt-6">
                  {missionSignals.map((signal, index) => (
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
                <ParticleField
                  count={phaseConfig.particles.count}
                  tone={phaseConfig.tone}
                  compact
                  opacityRange={phaseConfig.particles.opacityRange}
                  speedMultiplier={phaseConfig.particles.speedMultiplier}
                  driftMultiplier={phaseConfig.particles.driftMultiplier}
                />
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs tracking-normal text-gold/80">
                      实时数据
                    </p>
                    <h2 className="text-xl font-semibold text-white mt-2">本题执行状态</h2>
                    <p className="text-sm text-white/60 leading-6 mt-2">
                      通过进度、节奏、状态和当前题型来观察整轮面试在这一刻的运行状态。
                    </p>
                  </div>
                  <span className={`data-pill ${statusClass}`}>{showFeedback ? '已完成' : '进行中'}</span>
                </div>

                <div className="space-y-4 mt-6">
                  {[
                    {
                      icon: Hash,
                      label: '答题进度',
                      value: `${currentQuestionIndex + 1} / ${questions.length}`,
                      percent: progress,
                      toneClass: 'text-gold',
                    },
                    {
                      icon: Clock,
                      label: '时间节奏',
                      value: `${formatTime(timer)} / ${formatTime(recommendedTime)}`,
                      percent: pace,
                      toneClass: timerToneClass,
                    },
                    {
                      icon: Activity,
                      label: '回答就绪度',
                      value: showFeedback ? '已提交' : answer.trim() ? '草稿就绪' : '等待输入',
                      percent: showFeedback ? 100 : Math.min(100, answer.length),
                      toneClass: showFeedback ? 'text-success' : 'text-white',
                    },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className="pipeline-node rounded-[22px] p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
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
                          <span className={`data-pill ${item.toneClass}`}>{Math.round(item.percent)}%</span>
                        </div>
                        <div className="telemetry-bar mt-3">
                          <span style={{ width: `${Math.min(100, item.percent)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-[1.05fr_0.95fr] gap-4 mt-5">
                  <div className="chart-panel rounded-[22px] p-4">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div>
                        <p className="text-xs tracking-normal text-muted">趋势曲线</p>
                        <p className="text-sm text-white mt-1">本题进度、节奏与提交状态的实时走势</p>
                      </div>
                      <span className={`data-pill ${statusClass}`}>{showFeedback ? '已锁定' : '实时'}</span>
                    </div>
                    <TelemetrySparkline
                      values={telemetryCurve}
                      labels={['启动', '进行', '节奏', '草稿', '提交']}
                      tone={showFeedback ? 'success' : 'blue'}
                    />
                  </div>

                  <div className="chart-panel rounded-[22px] p-4">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div>
                        <p className="text-xs tracking-normal text-muted">状态指标</p>
                        <p className="text-sm text-white mt-1">将答题张力拆成多通道可视信号</p>
                      </div>
                      <span className={`data-pill ${timerToneClass}`}>{Math.round(pace)}%</span>
                    </div>
                    <SignalBars values={telemetryWave} tone={showFeedback ? 'success' : isTimeWarning ? 'gold' : 'blue'} />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </FadeIn>

        <div className="space-y-4">
          <FadeIn delay={0.08}>
            <div className="premium-card premium-card-strong rounded-[28px] p-5 md:p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium text-gold flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    当前题目
                  </p>
                  <p className="text-xs md:text-sm text-white/60 mt-2 leading-5 md:leading-6">
                    保留题型、难度、标签与建议时长，但尽量收紧高度，让题目和输入区同时进入首屏。
                  </p>
                </div>
                <span className={`data-pill ${difficulty.pillClass}`}>{questionLabel}</span>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <span className="glass-tag rounded-full px-3 py-1.5 text-xs text-white/80">
                  Category · {currentQuestion.category}
                </span>
                <span className="glass-tag rounded-full px-3 py-1.5 text-xs text-white/80">
                  Suggested · {formatTime(recommendedTime)}
                </span>
                {currentQuestion.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="glass-tag rounded-full px-3 py-1.5 text-xs text-white/80">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="hud-panel rounded-[24px] p-4 md:p-5 min-h-[220px] flex flex-col justify-between">
                <div>
                  <p className="text-xs tracking-normal text-muted mb-2">Prompt</p>
                  <p className="text-base md:text-lg text-white leading-7 md:leading-8 tracking-[0.01em]">
                    {currentQuestion.content}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 md:gap-3 mt-4">
                  <div className="signal-card rounded-[20px] p-3">
                    <p className="text-base md:text-lg font-semibold text-white">{currentQuestion.tags.length}</p>
                    <p className="text-xs tracking-normal text-muted mt-2">话题标签</p>
                  </div>
                  <div className="signal-card rounded-[20px] p-3">
                    <p className="text-base md:text-lg font-semibold text-white">{difficulty.label}</p>
                    <p className="text-xs tracking-normal text-muted mt-2">Difficulty</p>
                  </div>
                  <div className="signal-card rounded-[20px] p-3">
                    <p className="text-base md:text-lg font-semibold text-white">Q{currentQuestionIndex + 1}</p>
                    <p className="text-xs tracking-normal text-muted mt-2">题目序号</p>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.14}>
            <div
              className={`premium-card answer-glow rounded-[32px] p-5 md:p-6 ${answerConsoleClass}`}
              style={{ '--glow-opacity': phaseConfig.glowOpacity } as React.CSSProperties}
            >
              <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-gold flex items-center gap-2">
                    <MessageSquareText className="w-4 h-4" />
                    回答区
                  </p>
                  <p className="text-xs md:text-sm text-white/60 mt-2 leading-5 md:leading-6">
                    把遥测压缩成更紧凑的信息条，优先把输入区和提交按钮留在首屏。
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`data-pill ${statusClass}`}>{statusText}</span>
                  <motion.span
                    className={`data-pill ${timerPillClass}`}
                    animate={timerBounce ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 12 }}
                  >
                    {formatTime(timer)} / {formatTime(recommendedTime)}
                  </motion.span>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-[1fr_0.34fr] gap-3 mb-4">
                <div className="hud-panel rounded-[24px] p-4">
                  <div className="flex items-center justify-between text-xs tracking-normal text-muted">
                    <span>答题进度</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="telemetry-bar mt-3">
                    <span style={{ width: `${progress}%` }} />
                  </div>

                  <div className="flex items-center justify-between text-xs tracking-normal text-muted mt-4">
                    <span>时间压力</span>
                    <span className={timerToneClass}>{pace}%</span>
                  </div>
                  <div className="telemetry-bar mt-3">
                    <span style={timeBarStyle} />
                  </div>

                  <div className="grid grid-cols-3 gap-2 md:gap-3 mt-4">
                    <div className="signal-card rounded-[20px] p-3">
                      <p className={`text-sm md:text-base font-semibold ${timerToneClass}`}>{isOvertime ? 'Over' : isTimeWarning ? 'Push' : 'Stable'}</p>
                      <p className="text-xs tracking-normal text-muted mt-1.5">紧迫度</p>
                    </div>
                    <div className="signal-card rounded-[20px] p-3">
                      <p className="text-sm md:text-base font-semibold text-white">{answer.length}</p>
                      <p className="text-xs tracking-normal text-muted mt-1.5">字数</p>
                    </div>
                    <div className="signal-card rounded-[20px] p-3">
                      <p className="text-sm md:text-base font-semibold text-white">{answerWords}</p>
                      <p className="text-xs tracking-normal text-muted mt-1.5">词数</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 xl:grid-cols-1 gap-2 md:gap-3">
                  <div className="signal-card rounded-[20px] p-3">
                    <p className="text-sm md:text-base font-semibold text-white">{formatTime(timer)}</p>
                    <p className="text-xs tracking-normal text-muted mt-1.5">已用时</p>
                  </div>
                  <div className="signal-card rounded-[20px] p-3">
                    <p className="text-sm md:text-base font-semibold text-white">{formatTime(recommendedTime)}</p>
                    <p className="text-xs tracking-normal text-muted mt-1.5">目标</p>
                  </div>
                  <div className="signal-card rounded-[20px] p-3">
                    <p className={`text-sm md:text-base font-semibold ${timerToneClass}`}>{timerStateText}</p>
                    <p className="text-xs tracking-normal text-muted mt-1.5">节奏</p>
                  </div>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {!showFeedback ? (
                  <motion.div
                    key="answer"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                    className="space-y-4"
                  >
                    <div className="hud-panel rounded-[28px] p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
                        <div>
                          <p className="text-xs tracking-normal text-muted">输入回答</p>
                          <p className="text-xs md:text-sm text-white/60 mt-1.5 leading-5">
                            先给结论，再补依据、复杂度和项目例子，直接进入提交节奏。
                          </p>
                        </div>
                        <span className={`data-pill ${timerPillClass}`}>{timerStateText}</span>
                      </div>

                      <textarea
                        ref={textareaRef}
                        value={answer}
                        onChange={(event) => setAnswer(event.target.value)}
                        onKeyDown={(event) => {
                          if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                            event.preventDefault();
                            handleSubmit();
                          }
                        }}
                        placeholder={speechListening ? '正在聆听...' : '在这张大答题卡里输入你的回答：先给结论，再补原理、复杂度、项目例子与权衡...'}
                        className="neo-textarea w-full rounded-[28px] p-4 text-sm md:text-base text-white placeholder-muted/50 resize-none focus:outline-none transition-colors overflow-hidden"
                        style={{ minHeight: '220px', height: 'auto' }}
                        onInput={(event) => {
                          const target = event.target as HTMLTextAreaElement;
                          target.style.height = 'auto';
                          target.style.height = `${Math.max(220, Math.min(target.scrollHeight, 500))}px`;
                        }}
                      />
                    </div>

                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] md:text-xs text-muted leading-5">
                          推荐结构：结论 → 原理 → 权衡 → 例子
                        </span>
                        <span className={`data-pill text-[11px] ${
                          answer.length >= 200 && answer.length <= 400
                            ? 'border-success/20 bg-success/10 text-success'
                            : answer.length > 400
                              ? 'border-gold/20 bg-gold/10 text-gold'
                              : 'border-white/6 bg-white/4 text-muted'
                        }`}>
                          {answer.length} / 200-400 字
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <SpeechButton
                          onTranscript={handleSpeechTranscript}
                          onListeningChange={setSpeechListening}
                          disabled={submitting || showFeedback}
                        />
                        <GlowButton
                        onClick={handleSubmit}
                        disabled={!answer.trim() || submitting}
                        loading={submitting}
                        className="w-full lg:w-auto px-7 py-3 text-sm flex items-center justify-center gap-2"
                      >
                        {submitting ? (
                          <AILoadingIndicator step="AI 评分中..." compact />
                        ) : (
                          <>
                            <AnimatePresence mode="wait">
                              {submitSent ? (
                                <motion.span key="check" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 15 }}>
                                  <CheckCircle className="w-4 h-4 text-success" />
                                </motion.span>
                              ) : (
                                <motion.span key="send" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}>
                                  <Send className="w-4 h-4" />
                                </motion.span>
                              )}
                            </AnimatePresence>
                            提交回答
                          </>
                        )}
                      </GlowButton>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  currentEval && (
                    <motion.div
                      key="feedback"
                      initial={{ opacity: 0, y: 24, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 18, mass: 0.8 }}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-1 xl:grid-cols-[0.38fr_0.62fr] gap-4">
                        <div className="premium-card premium-card-strong rounded-[24px] p-5">
                          <div className="flex flex-col items-center justify-center gap-5">
                            <AnimatedScore score={currentEval.score} size="md" duration={1} />
                            <div className="grid grid-cols-2 gap-3 w-full">
                              <div className="signal-card rounded-[20px] p-4">
                                <p className="text-lg font-semibold text-white">{formatTime(timer)}</p>
                                <p className="text-xs tracking-normal text-muted mt-2">已用时</p>
                              </div>
                              <div className="signal-card rounded-[20px] p-4">
                                <p className={`text-lg font-semibold ${timerToneClass}`}>{timerStateText}</p>
                                <p className="text-xs tracking-normal text-muted mt-2">节奏</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="hud-panel rounded-[24px] p-5">
                          <p className="text-xs tracking-normal text-muted mb-3">AI 反馈</p>
                          <p className="text-sm text-white/80 leading-7">{currentEval.feedback}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="strategy-card rounded-[24px] p-5">
                          <div className="flex items-center gap-2 mb-4">
                            <ShieldCheck className="w-4 h-4 text-success" />
                            <p className="text-sm font-medium text-success">亮点信号</p>
                          </div>
                          <div className="space-y-3">
                            {currentEval.strengths.map((item, index) => (
                              <div key={item + index} className="hud-panel rounded-[18px] p-3">
                                <p className="text-sm text-white/80 leading-6">+ {item}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="strategy-card rounded-[24px] p-5">
                          <div className="flex items-center gap-2 mb-4">
                            <TimerReset className="w-4 h-4 text-danger" />
                            <p className="text-sm font-medium text-danger">改进重点</p>
                          </div>
                          <div className="space-y-3">
                            {currentEval.improvements.map((item, index) => (
                              <div key={item + index} className="hud-panel rounded-[18px] p-3">
                                <p className="text-sm text-white/80 leading-6">- {item}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <GlowButton
                        onClick={handleNext}
                        className="w-full py-3.5 text-sm flex items-center justify-center gap-2"
                      >
                        {isLastQuestion ? '查看面试报告' : '进入下一题'}
                        <ChevronRight className="w-4 h-4" />
                      </GlowButton>
                    </motion.div>
                  )
                )}
              </AnimatePresence>
            </div>
          </FadeIn>
        </div>
      </div>
    </PageTransition>
  );
}
