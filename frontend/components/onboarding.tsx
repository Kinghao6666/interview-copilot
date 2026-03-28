'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Sparkles } from 'lucide-react';
import { GlowButton } from './glow-button';

const STORAGE_KEY = 'interview-copilot-onboarded';

const steps = [
  {
    icon: Upload,
    title: '上传简历',
    description: '上传你的简历，AI 将自动解析技能和经验',
  },
  {
    icon: FileText,
    title: '粘贴职位描述',
    description: '粘贴目标岗位的 JD，系统会匹配技能生成针对性题目',
  },
  {
    icon: Sparkles,
    title: '开始模拟面试',
    description: 'AI 面试官会根据你的背景提问，实时评分并给出反馈',
  },
];

export function Onboarding() {
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  const dismiss = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setVisible(false);
  }, []);

  const next = useCallback(() => {
    if (current < steps.length - 1) {
      setDirection(1);
      setCurrent((prev) => prev + 1);
    } else {
      dismiss();
    }
  }, [current, dismiss]);

  const back = useCallback(() => {
    if (current > 0) {
      setDirection(-1);
      setCurrent((prev) => prev - 1);
    }
  }, [current]);

  const isLast = current === steps.length - 1;
  const step = steps[current];
  const Icon = step.icon;

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -80 : 80, opacity: 0 }),
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="premium-card relative max-w-md w-full mx-4 rounded-[28px] p-8"
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          >
            {/* Step content */}
            <div className="overflow-hidden">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={current}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                  className="flex flex-col items-center text-center"
                >
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6 border border-white/[0.08] bg-white/[0.04]">
                    <Icon className="w-7 h-7 text-gold" />
                  </div>
                  <h2 className="text-xl font-semibold text-white mb-3">
                    {step.title}
                  </h2>
                  <p className="text-sm leading-relaxed text-white/55">
                    {step.description}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Dot indicators */}
            <div className="flex items-center justify-center gap-2 mt-8 mb-6">
              {steps.map((_, i) => (
                <motion.span
                  key={i}
                  animate={{ scale: i === current ? 1.5 : 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className={`block w-2 h-2 rounded-full transition-colors duration-300 ${
                    i === current ? 'bg-gold' : 'bg-white/20'
                  }`}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-col items-center gap-3">
              <div className="flex w-full gap-3">
                {current > 0 && (
                  <button
                    onClick={back}
                    className="flex-1 py-3.5 text-sm rounded-[20px] border border-white/[0.06] bg-white/[0.03] text-white/60 hover:text-white transition-colors"
                  >
                    上一步
                  </button>
                )}
                <GlowButton
                  onClick={next}
                  className={`${current > 0 ? 'flex-1' : 'w-full'} py-3.5 text-sm rounded-[20px]`}
                >
                  {isLast ? '开始使用' : '下一步'}
                </GlowButton>
              </div>
              {!isLast && (
                <button
                  onClick={dismiss}
                  className="text-xs text-white/40 hover:text-white/60 transition-colors"
                >
                  跳过
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}