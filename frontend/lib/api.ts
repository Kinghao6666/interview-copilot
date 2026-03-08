import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

api.interceptors.response.use(undefined, async (error) => {
  const config = error.config;
  if (config && !config._retried && (error.response?.status >= 500 || !error.response)) {
    config._retried = true;
    await new Promise((r) => setTimeout(r, 1000));
    return api(config);
  }
  return Promise.reject(error);
});

// Resume API
export const resumeApi = {
  parse: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/api/resume/parse', formData, {
      timeout: 120000,
    });
    return response.data;
  },
};

// JD API
export const jdApi = {
  parse: async (content: string) => {
    const response = await api.post('/api/resume/jd/parse', { content });
    return response.data;
  },
};

// Interview API
export const interviewApi = {
  generate: async (resumeId: string, jdId: string) => {
    const response = await api.post('/api/interview/generate', {
      resume_id: resumeId,
      jd_id: jdId,
    });
    return response.data;
  },

  evaluate: async (sessionId: string, questionId: string, answer: string) => {
    const response = await api.post('/api/interview/evaluate', {
      session_id: sessionId,
      question_id: questionId,
      answer,
    });
    return response.data;
  },

  getSession: async (sessionId: string) => {
    const response = await api.get(`/api/interview/session/${sessionId}`);
    return response.data;
  },

  getReport: async (sessionId: string) => {
    const response = await api.get(`/api/interview/report/${sessionId}`);
    return response.data;
  },

  getSessions: async () => {
    const response = await api.get('/api/interview/sessions');
    return response.data;
  },
};
