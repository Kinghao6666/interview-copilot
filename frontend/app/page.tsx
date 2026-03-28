'use client';

import {
  useState,
  useCallback,
  useRef,
  useMemo,
  type ChangeEvent,
  type DragEvent,
} from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  Activity,
  Briefcase,
  CheckCircle,
  Cpu,
  FileText,
  ShieldCheck,
  Sparkles,
  Target,
  Upload,
  type LucideIcon,
} from 'lucide-react';
import { resumeApi, jdApi, interviewApi } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import {
  PageTransition,
  FadeIn,
  GlowButton,
  AILoadingIndicator,
  ParticleField,
  TelemetrySparkline,
  SignalBars,
  Onboarding,
  useToast,
} from '@/components';

interface PipelineStage {
  icon: LucideIcon;
  title: string;
  description: string;
  active: boolean;
  complete: boolean;
}

function isSupportedResumeFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.txt');
}

function extractErrorMessage(data: unknown): string | null {
  if (typeof data === 'string' && data.trim()) return data;

  if (!data || typeof data !== 'object') return null;

  const errorData = data as Record<string, unknown>;
  if (typeof errorData.detail === 'string' && errorData.detail.trim()) {
    return errorData.detail;
  }

  if (Array.isArray(errorData.detail)) {
    const validationMessages = errorData.detail
      .map((item) => {
        if (item && typeof item === 'object' && 'msg' in item) {
          const message = (item as { msg?: unknown }).msg;
          return typeof message === 'string' ? message : null;
        }
        return null;
      })
      .filter((message): message is string => Boolean(message));

    if (validationMessages.length > 0) {
      return validationMessages.join('；');
    }
  }

  if (typeof errorData.message === 'string' && errorData.message.trim()) {
    return errorData.message;
  }

  return null;
}

function buildStartErrorMessage(error: unknown, step: string): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return `${step}失败：无法连接后端服务，请确认 FastAPI 已启动`;
    }

    const status = error.response.status;
    const message = extractErrorMessage(error.response.data);

    if (message) {
      return `${step}失败（${status}）：${message}`;
    }

    return `${step}失败（${status}）：请求异常，请稍后重试`;
  }

  if (error instanceof Error && error.message) {
    return `${step}失败：${error.message}`;
  }

  return `${step}失败：未知错误`;
}

export default function Home() {
  const router = useRouter();
  const store = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jdText, setJdText] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [rejectShake, setRejectShake] = useState(false);
  const [pasteFlash, setPasteFlash] = useState(false);
  const [particleBurst, setParticleBurst] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const jdDraftLength = jdText.replace(/\s+/g, '').length;
  const canStart = Boolean(resumeFile && jdText.trim());
  const isGenerating = loadingStep.includes('生成');

  const overlappingSkills = useMemo(() => {
    if (!store.resumeData || !store.jdData) {
      return [] as string[];
    }

    const resumeSkills = new Set(store.resumeData.skills.map((skill) => skill.toLowerCase()));
    return store.jdData.skills_required.filter((skill) => resumeSkills.has(skill.toLowerCase()));
  }, [store.jdData, store.resumeData]);

  const readinessScore = Math.min(
    100,
    (resumeFile ? 36 : 0) +
      (jdText.trim() ? 34 : 0) +
      (store.resumeData ? 15 : 0) +
      (store.jdData ? 15 : 0)
  );

  const missionSignals = [
    {
      value: resumeFile ? `${Math.max(1, Math.round(resumeFile.size / 1024))}KB` : '--',
      label: '简历状态',
      hint: resumeFile ? '文件已装载' : '等待简历',
      accent: resumeFile ? 'text-white' : 'text-muted',
    },
    {
      value: jdText.trim() ? `${jdDraftLength}` : '--',
      label: 'JD Length',
      hint: jdText.trim() ? '字符已载入' : '等待 JD',
      accent: jdText.trim() ? 'text-blue' : 'text-muted',
    },
    {
      value: store.resumeData ? `${store.resumeData.skills.length}` : 'Auto',
      label: '技能图谱',
      hint: store.resumeData ? '最近一次解析' : '启动后提取',
      accent: 'text-gold',
    },
    {
      value: loading ? 'RUN' : canStart ? '就绪' : 'IDLE',
      label: '启动状态',
      hint: loading ? loadingStep : canStart ? '可立即启动' : '待准备',
      accent: loading ? 'text-blue' : canStart ? 'text-success' : 'text-muted',
    },
  ];

  const pipelineStages: PipelineStage[] = [
    {
      icon: FileText,
      title: 'Resume Intake',
      description: resumeFile
        ? `已接入 ${resumeFile.name}`
        : '等待 PDF / TXT 简历进入系统',
      active: Boolean(resumeFile),
      complete: completedSteps.has(0) || Boolean(store.resumeData),
    },
    {
      icon: Briefcase,
      title: 'JD Mapping',
      description: jdText.trim()
        ? `已加载 ${jdDraftLength} 字岗位描述`
        : '粘贴岗位描述，建立目标画像',
      active: Boolean(jdText.trim()),
      complete: completedSteps.has(1) || Boolean(store.jdData),
    },
    {
      icon: Cpu,
      title: 'Question Matrix',
      description: canStart
        ? '启动后融合 JD 与简历技能生成题组'
        : '等待双输入完成后激活建题',
      active: canStart || isGenerating,
      complete: completedSteps.has(2) || isGenerating,
    },
    {
      icon: ShieldCheck,
      title: '开始面试',
      description: canStart
        ? '当前已满足模拟面试启动条件'
        : '完成 Resume 与 JD 后解锁',
      active: canStart || loading,
      complete: completedSteps.has(3) || loading,
    },
  ];

  const readinessTimeline = [
    16,
    resumeFile ? 38 : 18,
    jdText.trim() ? 56 : 24,
    store.resumeData ? 76 : 36,
    store.jdData ? 88 : 44,
    canStart ? 100 : 58,
  ];

  const pipelineSignals = pipelineStages.map((stage) => (stage.complete ? 100 : stage.active ? 72 : 24));

  const launchChecklist = [
    {
      label: 'Resume 输入',
      ready: Boolean(resumeFile),
      detail: resumeFile ? resumeFile.name : '上传 1 份 PDF/TXT 简历',
    },
    {
      label: 'JD 输入',
      ready: Boolean(jdText.trim()),
      detail: jdText.trim() ? `已载入 ${jdDraftLength} 字岗位描述` : '粘贴岗位描述文本',
    },
    {
      label: '启动条件',
      ready: canStart,
      detail: canStart ? '系统可进入解析 + 建题流程' : '需同时准备 Resume 与 JD',
    },
  ];

  const handleFileDrop = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);

    const file = event.dataTransfer.files[0];
    if (file && isSupportedResumeFile(file)) {
      setResumeFile(file);
      setError('');
      return;
    }

    setError('请上传 PDF 或 TXT 格式的简历');
    setRejectShake(true);
    setTimeout(() => setRejectShake(false), 600);
  }, []);

  const handleFileSelect = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (isSupportedResumeFile(file)) {
      setResumeFile(file);
      setError('');
      return;
    }

    setError('请上传 PDF 或 TXT 格式的简历');
  }, []);

  const handleStart = async () => {
    if (!resumeFile || !jdText.trim()) {
      setError('请上传简历并填写职位描述');
      toast('请上传简历并填写职位描述', 'error');
      return;
    }

    if (resumeFile.size === 0) {
      setError('简历文件不能为空，请重新选择文件');
      toast('简历文件不能为空，请重新选择文件', 'error');
      return;
    }

    setLoading(true);
    setError('');
    setCompletedSteps(new Set());
    let currentStep = '简历解析';

    try {
      setLoadingStep('解析简历中...');
      const resumeResult = await resumeApi.parse(resumeFile);
      store.setResume(resumeResult.id, resumeResult.parsed_data);
      setCompletedSteps((prev) => new Set(prev).add(0));
      toast('简历解析完成', 'success');

      currentStep = '职位描述解析';
      setLoadingStep('解析职位描述中...');
      const jdResult = await jdApi.parse(jdText);
      store.setJD(jdResult.id, jdResult.parsed_data);
      setCompletedSteps((prev) => new Set(prev).add(1));
      toast('职位描述已解析', 'success');

      currentStep = '面试题生成';
      setLoadingStep('生成面试题目中...');
      const session = await interviewApi.generate(resumeResult.id, jdResult.id);
      store.setSession(session.session_id, session.questions);
      setCompletedSteps((prev) => { const next = new Set(prev); next.add(2); next.add(3); return next; });
      toast('面试已生成，即将开始', 'success');

      setParticleBurst(true);
      await new Promise((resolve) => setTimeout(resolve, 500));
      setParticleBurst(false);

      router.push(`/interview?sessionId=${session.session_id}`);
    } catch (unknownError: unknown) {
      const errorMsg = buildStartErrorMessage(unknownError, currentStep);
      setError(errorMsg);
      toast(errorMsg, 'error');
      console.error(`[${currentStep}]`, unknownError);
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <>
    <PageTransition>
      <div className="max-w-6xl mx-auto">
        <FadeIn>
          <div className="hero-panel rounded-[32px] p-6 md:p-8 mb-6">
            <div className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr] xl:items-start">
              <div>
                <div className="section-kicker mb-4">
                  <Sparkles className="w-3.5 h-3.5" />
                  Interview Practice, Refined
                </div>

                <h1 className="text-3xl md:text-5xl font-semibold leading-tight max-w-3xl">
                    <span className="bg-gradient-to-r from-white via-[#f2ece4] to-[#d2c0a1] bg-clip-text text-transparent">
                      把模拟面试打磨成一次更安静、更高级的练习体验
                    </span>
                </h1>

                <p className="text-sm md:text-base text-white/70 leading-7 max-w-3xl mt-4">
                    上传简历、粘贴 JD、开始一轮练习。系统会自动完成解析、出题、评分与复盘，
                    同时把整条流程收敛成更克制、更顺滑的专业界面。
                </p>

                <div className="flex flex-wrap gap-3 mt-6">
                  {[
                    ['JD + Resume', '双输入建模'],
                    ['Adaptive', '题目动态生成'],
                    ['Realtime', '可视化任务状态'],
                  ].map(([value, label], index) => (
                    <motion.div
                      key={label}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.08 + index * 0.07, duration: 0.4 }}
                      className="metric-chip rounded-2xl px-4 py-3 min-w-[140px]"
                    >
                      <p className="text-sm font-semibold text-white tracking-[0.12em] uppercase">
                        {value}
                      </p>
                      <p className="text-xs tracking-normal text-muted mt-1">
                        {label}
                      </p>
                    </motion.div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mt-6">
                  {missionSignals.map((signal, index) => (
                    <motion.div
                      key={signal.label}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.16 + index * 0.06, duration: 0.42 }}
                      className="signal-card rounded-[22px] p-4"
                    >
                      <p className={`text-xl font-semibold ${signal.accent}`}>{signal.value}</p>
                      <p className="text-xs tracking-normal text-muted mt-2">
                        {signal.label}
                      </p>
                      <p className="text-xs text-white/55 mt-3 leading-5">{signal.hint}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.14, duration: 0.45 }}
                className="telemetry-panel rounded-[28px] p-5 md:p-6"
              >
                <ParticleField count={particleBurst ? 32 : 16} tone={particleBurst ? 'gold' : loading ? 'blue' : 'mixed'} compact />
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs tracking-normal text-gold/80">
                      AI 处理状态
                    </p>
                    <h2 className="text-xl font-semibold text-white mt-2">任务管线遥测</h2>
                    <p className="text-sm text-white/60 mt-2 leading-6">
                      当前首页不只负责输入，还会展示从素材接入到面试启动前的全链路状态。
                    </p>
                  </div>
                  <span className="data-pill text-gold">
                    {loading ? 'RUNNING' : canStart ? '就绪' : '待命'}
                  </span>
                </div>

                <div className="space-y-3 mt-6">
                  {pipelineStages.map((stage, index) => {
                    const Icon = stage.icon;
                    const progress = stage.complete ? 100 : stage.active ? 72 : 24;
                    const toneClass = stage.complete
                      ? 'text-success'
                      : stage.active
                        ? 'text-gold'
                        : 'text-muted';
                    const dotClass = stage.complete
                      ? 'status-dot status-dot-success'
                      : stage.active
                        ? 'status-dot'
                        : 'status-dot status-dot-blue';

                    return (
                      <motion.div
                        key={stage.title}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + index * 0.07, duration: 0.38 }}
                        className="relative"
                      >
                        <div className="pipeline-node rounded-[22px] p-4">
                          <div className="flex items-start gap-3">
                            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                              <Icon className={`w-4 h-4 ${toneClass}`} />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className={dotClass} />
                                  <p className="text-sm font-medium text-white truncate">{stage.title}</p>
                                </div>
                                <span className={`data-pill ${toneClass}`}>
                                  {stage.complete ? 'SYNCED' : stage.active ? 'ONLINE' : 'WAIT'}
                                </span>
                              </div>
                              <p className="text-xs text-white/55 leading-5 mt-2">
                                {stage.description}
                              </p>
                              <div className="telemetry-bar mt-3">
                                <span style={{ width: `${progress}%` }} />
                              </div>
                            </div>
                          </div>
                        </div>
                        {index < pipelineStages.length - 1 && <div className="pipeline-link" />}
                      </motion.div>
                    );
                  })}
                </div>

                <div className="soft-divider my-5" />

                <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-4 mb-5">
                  <div className="chart-panel rounded-[22px] p-4">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div>
                        <p className="text-xs tracking-normal text-muted">Readiness Curve</p>
                        <p className="text-sm text-white mt-1">从素材接入到任务解锁的跃迁曲线</p>
                      </div>
                      <span className="data-pill text-gold">{readinessScore}%</span>
                    </div>
                    <TelemetrySparkline
                      values={readinessTimeline}
                      labels={['空闲', '简历', '职位', '解析', '匹配', '启动']}
                      tone="gold"
                    />
                  </div>

                  <div className="chart-panel rounded-[22px] p-4">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div>
                        <p className="text-xs tracking-normal text-muted">流程 Density</p>
                        <p className="text-sm text-white mt-1">每个阶段当前在线程度与活跃强度</p>
                      </div>
                      <span className={`data-pill ${loading ? 'text-blue' : 'text-gold'}`}>
                        {loading ? 'FLOW' : 'READY'}
                      </span>
                    </div>
                    <SignalBars values={pipelineSignals} tone={loading ? 'blue' : 'gold'} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      value: `${readinessScore}%`,
                      label: '准备就绪',
                    },
                    {
                      value: `${store.jdData?.skills_required.length ?? 0}`,
                      label: 'Structured JD Skills',
                    },
                  ].map((item) => (
                    <div key={item.label} className="hud-panel rounded-2xl p-4">
                      <p className="text-lg font-semibold text-white">{item.value}</p>
                      <p className="text-xs tracking-normal text-muted mt-2">
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </FadeIn>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger shadow-[0_10px_30px_rgba(255,68,68,0.14)]"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
          <FadeIn delay={0.08}>
            <div className="premium-card premium-card-strong rounded-[28px] p-6 h-full">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <p className="text-sm font-medium text-gold flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    上传简历
                  </p>
                  <p className="text-sm text-white/60 mt-2">
                    上传简历后，系统会在启动阶段自动抽取技能、项目与经历信号。
                  </p>
                </div>
                <span className="data-pill text-gold">
                  {resumeFile ? 'LOCKED' : 'WAITING'}
                </span>
              </div>

              <motion.div
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                whileHover={{ borderColor: 'rgba(212,175,55,0.48)' }}
                animate={rejectShake ? { x: [0, -8, 8, -6, 6, -3, 3, 0], borderColor: 'rgba(255,69,58,0.6)' } : { x: 0 }}
                transition={rejectShake ? { duration: 0.5 } : { duration: 0.3 }}
                className={`neo-dropzone border-2 border-dashed rounded-[26px] min-h-[250px] p-8 text-center cursor-pointer transition-colors flex items-center justify-center ${
                  rejectShake
                    ? 'border-danger bg-danger/5'
                    : dragOver
                      ? 'border-gold bg-gold/5'
                    : resumeFile
                      ? 'border-success/50 bg-success/5'
                      : 'border-border'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <AnimatePresence mode="wait">
                  {resumeFile ? (
                    <motion.div
                      key="selected"
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <CheckCircle className="w-10 h-10 text-success mx-auto mb-3" />
                      <p className="text-success text-sm tracking-[0.14em] uppercase">Payload Linked</p>
                      <p className="text-white text-base font-medium mt-2 break-all">{resumeFile.name}</p>
                      <p className="text-muted text-xs mt-2">
                        {(resumeFile.size / 1024).toFixed(1)} KB · 点击重新选择
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <Upload className="w-10 h-10 text-muted mx-auto mb-3" />
                      <p className="text-white/80 text-sm">拖拽或点击上传简历</p>
                      <p className="text-muted/60 text-xs mt-2">支持 PDF、TXT</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              <AnimatePresence>
                {store.resumeData && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-5 space-y-4"
                  >
                    <div className="soft-divider" />
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs tracking-normal text-muted">
                        最近一次解析快照
                      </p>
                      <span className="data-pill text-success">SNAPSHOT</span>
                    </div>
                    <p className="text-sm text-white">{store.resumeData.name}</p>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="signal-card rounded-2xl p-3">
                        <p className="text-lg font-semibold text-white">
                          {store.resumeData.skills.length}
                        </p>
                        <p className="text-xs tracking-normal text-muted mt-2">
                          Skills
                        </p>
                      </div>
                      <div className="signal-card rounded-2xl p-3">
                        <p className="text-lg font-semibold text-white">
                          {store.resumeData.experience.length}
                        </p>
                        <p className="text-xs tracking-normal text-muted mt-2">
                          Experience
                        </p>
                      </div>
                      <div className="signal-card rounded-2xl p-3">
                        <p className="text-lg font-semibold text-white">
                          {store.resumeData.projects.length}
                        </p>
                        <p className="text-xs tracking-normal text-muted mt-2">
                          Projects
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {store.resumeData.skills.map((skill, index) => (
                        <motion.span
                          key={skill}
                          initial={{ opacity: 0, scale: 0.82 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.04 }}
                          className="glass-tag px-2.5 py-1 text-gold text-xs rounded-full"
                        >
                          {skill}
                        </motion.span>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </FadeIn>

          <FadeIn delay={0.14}>
            <div className="premium-card rounded-[28px] p-6 h-full">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <p className="text-sm font-medium text-gold flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    职位描述
                  </p>
                  <p className="text-sm text-white/60 mt-2">
                    输入岗位描述后，系统会在启动时提取目标技能、要求和职位画像。
                  </p>
                </div>
                <span className="data-pill text-blue">
                  {jdText.trim() ? 'LIVE INPUT' : 'NO SIGNAL'}
                </span>
              </div>

              <textarea
                value={jdText}
                onChange={(event) => setJdText(event.target.value)}
                onPaste={() => {
                  setPasteFlash(true);
                  setTimeout(() => setPasteFlash(false), 400);
                }}
                placeholder={
                  '粘贴职位描述内容...\n\n例如：\n岗位：前端开发工程师\n要求：熟悉 React、TypeScript、工程化与性能优化'
                }
                className="neo-textarea w-full rounded-[26px] p-4 text-sm text-white placeholder-muted/50 resize-none focus:outline-none transition-colors overflow-hidden"
                style={{
                  minHeight: '250px',
                  height: 'auto',
                  ...(pasteFlash
                    ? { borderColor: 'rgba(212,184,150,0.6)', boxShadow: '0 0 20px rgba(212,184,150,0.15)' }
                    : {}),
                }}
                onInput={(event) => {
                  const target = event.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${Math.max(250, Math.min(target.scrollHeight, 500))}px`;
                }}
              />

              <div className="grid grid-cols-3 gap-3 mt-5">
                <div className="signal-card rounded-2xl p-3">
                  <p className="text-lg font-semibold text-white">{jdText.trim() ? jdDraftLength : '--'}</p>
                  <p className="text-xs tracking-normal text-muted mt-2">
                    Draft Length
                  </p>
                </div>
                <div className="signal-card rounded-2xl p-3">
                  <p className="text-lg font-semibold text-white">
                    {store.jdData ? store.jdData.skills_required.length : '--'}
                  </p>
                  <p className="text-xs tracking-normal text-muted mt-2">
                    Skill Targets
                  </p>
                </div>
                <div className="signal-card rounded-2xl p-3">
                  <p className="text-lg font-semibold text-white">
                    {store.jdData ? store.jdData.requirements.length : '--'}
                  </p>
                  <p className="text-xs tracking-normal text-muted mt-2">
                    Requirements
                  </p>
                </div>
              </div>

              <AnimatePresence>
                {store.jdData && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-5 space-y-4"
                  >
                    <div className="soft-divider" />
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs tracking-normal text-muted">
                        最近一次结构化结果
                      </p>
                      <span className="data-pill text-blue">STRUCTURED</span>
                    </div>
                    <p className="text-sm text-white">
                      {store.jdData.company} · {store.jdData.position}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {store.jdData.skills_required.map((skill, index) => (
                        <motion.span
                          key={skill}
                          initial={{ opacity: 0, scale: 0.82 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.04 }}
                          className="glass-tag px-2.5 py-1 text-blue text-xs rounded-full"
                        >
                          {skill}
                        </motion.span>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </FadeIn>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-6">
          <FadeIn delay={0.2}>
            <div className="premium-card rounded-[28px] p-6 h-full">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-gold flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    匹配预览
                  </p>
                  <p className="text-sm text-white/60 mt-2 leading-6">
                    这里提前展示面试启动后的关键聚焦点：素材完整度、结构化结果与候选匹配信号。
                  </p>
                </div>
                <span className="data-pill text-gold">PREVIEW</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5">
                <div className="signal-card rounded-[22px] p-4">
                  <p className="text-2xl font-semibold text-white">
                    {store.resumeData && store.jdData ? overlappingSkills.length : '--'}
                  </p>
                  <p className="text-xs tracking-normal text-muted mt-2">
                    Skill Overlap
                  </p>
                  <p className="text-xs text-white/55 mt-3 leading-5">
                    {store.resumeData && store.jdData
                      ? '最近一次解析中，JD 与简历的技能交集数'
                      : '启动后自动进行技能交叉比对'}
                  </p>
                </div>
                <div className="signal-card rounded-[22px] p-4">
                  <p className="text-2xl font-semibold text-white">
                    {store.resumeData ? store.resumeData.projects.length : '--'}
                  </p>
                  <p className="text-xs tracking-normal text-muted mt-2">
                    Project Signals
                  </p>
                  <p className="text-xs text-white/55 mt-3 leading-5">
                    用于生成开放题与追问方向的项目信号
                  </p>
                </div>
                <div className="signal-card rounded-[22px] p-4">
                  <p className="text-2xl font-semibold text-white">
                    {canStart ? 'READY' : 'LOCKED'}
                  </p>
                  <p className="text-xs tracking-normal text-muted mt-2">
                    Interview Mode
                  </p>
                  <p className="text-xs text-white/55 mt-3 leading-5">
                    {canStart ? '已满足启动条件，可进入正式模拟' : '等待双输入完成后解锁'}
                  </p>
                </div>
              </div>

              <div className="soft-divider my-5" />

              {store.resumeData && store.jdData && overlappingSkills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {overlappingSkills.map((skill) => (
                    <span
                      key={skill}
                      className="glass-tag rounded-full px-3 py-1.5 text-xs text-white/85"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="hud-panel rounded-[22px] p-4 text-sm text-white/65 leading-7">
                  开始任务后，系统会将 Resume、JD、题目矩阵与评分模型串联为一条完整的面试流水线，
                  并在此处显示结构化交集与聚焦技能标签。
                </div>
              )}
            </div>
          </FadeIn>

          <FadeIn delay={0.26}>
            <div className="premium-card premium-card-strong rounded-[28px] p-6 h-full flex flex-col">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-gold flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    开始面试
                  </p>
                  <p className="text-sm text-white/60 mt-2 leading-6">
                    确认输入条件后，一键进入解析、建题与面试会话。启动区也同步展示当前任务完成度。
                  </p>
                </div>
                <span className="data-pill text-success">{readinessScore}%</span>
              </div>

              <div className="space-y-3 mt-5">
                {launchChecklist.map((item) => (
                  <div key={item.label} className="hud-panel rounded-[22px] p-4">
                    <div className="flex items-start gap-3">
                      <span
                        className={item.ready ? 'status-dot status-dot-success mt-1.5' : 'status-dot status-dot-blue mt-1.5'}
                      />
                      <div>
                        <p className="text-sm font-medium text-white">{item.label}</p>
                        <p className="text-xs text-white/55 mt-2 leading-5">{item.detail}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hud-panel rounded-[24px] p-4 mt-5 mb-5">
                <div className="flex items-center justify-between text-xs tracking-normal text-muted">
                  <span>启动就绪度</span>
                  <span>{readinessScore}%</span>
                </div>
                <div className="telemetry-bar mt-3">
                  <span style={{ width: `${readinessScore}%` }} />
                </div>
              </div>

              <GlowButton
                onClick={handleStart}
                disabled={loading || !canStart}
                className="w-full py-4 text-sm md:text-base flex items-center justify-center gap-2 rounded-[24px] mt-auto"
              >
                {loading ? (
                  <AILoadingIndicator step={loadingStep} compact />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    启动模拟面试
                  </>
                )}
              </GlowButton>
            </div>
          </FadeIn>
        </div>
      </div>
    </PageTransition>
    <Onboarding />
    </>
  );
}
