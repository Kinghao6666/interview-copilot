export interface Resume {
  id: string;
  user_id: string;
  file_url: string;
  parsed_data: ParsedResumeData;
  created_at: string;
}

export interface ParsedResumeData {
  name: string;
  education: string;
  skills: string[];
  experience: string[];
  projects: string[];
}

export interface JobDescription {
  id: string;
  user_id: string;
  content: string;
  parsed_data: ParsedJDData;
  created_at: string;
}

export interface ParsedJDData {
  position: string;
  company: string;
  requirements: string[];
  skills_required: string[];
}

export interface Question {
  id: string;
  type: 'self_intro' | 'skill_test' | 'scenario' | 'reverse';
  category: string;
  content: string;
  difficulty: 'easy' | 'medium' | 'hard';
  time_limit: number; // seconds
  reference_answer?: string;
  tags: string[];
}

export interface PersistedAnswer {
  question_id: string;
  answer: string;
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  submitted_at: string;
}

export interface InterviewSession {
  id: string;
  user_id: string;
  resume_id: string;
  jd_id: string;
  questions: Question[];
  answers: Answer[];
  status: 'in_progress' | 'completed';
  started_at: string;
  completed_at?: string;
}

export interface Answer {
  question_id: string;
  content: string;
  score: number;
  feedback: string;
  submitted_at: string;
}

export interface InterviewReport {
  id: string;
  session_id: string;
  overall_score: number;
  section_scores: {
    self_intro: number;
    skill_test: number;
    scenario: number;
  };
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  created_at: string;
}

export interface InterviewSessionDetail {
  id: string;
  resume_id: string;
  jd_id: string;
  questions: Question[];
  answers: PersistedAnswer[];
  status: 'in_progress' | 'completed';
  started_at: string;
  completed_at?: string;
  resume_data?: ParsedResumeData | null;
  jd_data?: ParsedJDData | null;
}
