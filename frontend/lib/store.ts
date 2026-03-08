import { create } from 'zustand';
import type {
  ParsedResumeData,
  ParsedJDData,
  Question,
  Answer,
  InterviewReport,
  InterviewSessionDetail,
} from '@/types';

export type AppStep = 'upload' | 'interview' | 'report';

interface EvalResult {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

interface AppState {
  // Navigation
  step: AppStep;
  setStep: (step: AppStep) => void;

  // Resume
  resumeId: string | null;
  resumeData: ParsedResumeData | null;
  setResume: (id: string, data: ParsedResumeData) => void;

  // JD
  jdId: string | null;
  jdData: ParsedJDData | null;
  setJD: (id: string, data: ParsedJDData) => void;

  // Interview session
  sessionId: string | null;
  questions: Question[];
  currentQuestionIndex: number;
  answers: Record<string, Answer>;
  evalResults: Record<string, EvalResult>;
  setSession: (sessionId: string, questions: Question[]) => void;
  hydrateSession: (session: InterviewSessionDetail) => void;
  submitAnswer: (questionId: string, answer: Answer, evalResult: EvalResult) => void;
  nextQuestion: () => void;

  // Report
  report: InterviewReport | null;
  setReport: (report: InterviewReport) => void;

  // Reset
  reset: () => void;
}

const initialState = {
  step: 'upload' as AppStep,
  resumeId: null,
  resumeData: null,
  jdId: null,
  jdData: null,
  sessionId: null,
  questions: [],
  currentQuestionIndex: 0,
  answers: {},
  evalResults: {},
  report: null,
};

export const useAppStore = create<AppState>((set) => ({
  ...initialState,

  setStep: (step) => set({ step }),

  setResume: (id, data) => set({ resumeId: id, resumeData: data }),

  setJD: (id, data) => set({ jdId: id, jdData: data }),

  setSession: (sessionId, questions) =>
    set({ sessionId, questions, currentQuestionIndex: 0, answers: {}, evalResults: {} }),

  hydrateSession: (session) =>
    set(() => {
      const answers = session.answers.reduce<Record<string, Answer>>((accumulator, item) => {
        accumulator[item.question_id] = {
          question_id: item.question_id,
          content: item.answer,
          score: item.score,
          feedback: item.feedback,
          submitted_at: item.submitted_at,
        };
        return accumulator;
      }, {});

      const evalResults = session.answers.reduce<Record<string, EvalResult>>((accumulator, item) => {
        accumulator[item.question_id] = {
          score: item.score,
          feedback: item.feedback,
          strengths: item.strengths,
          improvements: item.improvements,
        };
        return accumulator;
      }, {});

      const answeredQuestionIds = new Set(session.answers.map((item) => item.question_id));
      const firstUnansweredIndex = session.questions.findIndex(
        (question) => !answeredQuestionIds.has(question.id)
      );

      return {
        step: 'interview' as AppStep,
        resumeId: session.resume_id,
        resumeData: session.resume_data ?? null,
        jdId: session.jd_id,
        jdData: session.jd_data ?? null,
        sessionId: session.id,
        questions: session.questions,
        currentQuestionIndex:
          firstUnansweredIndex === -1 ? Math.max(session.questions.length - 1, 0) : firstUnansweredIndex,
        answers,
        evalResults,
      };
    }),

  submitAnswer: (questionId, answer, evalResult) =>
    set((state) => ({
      answers: { ...state.answers, [questionId]: answer },
      evalResults: { ...state.evalResults, [questionId]: evalResult },
    })),

  nextQuestion: () =>
    set((state) => ({
      currentQuestionIndex: Math.min(state.currentQuestionIndex + 1, state.questions.length - 1),
    })),

  setReport: (report) => set({ report }),

  reset: () => set(initialState),
}));
