-- Interview Copilot 数据库表结构（增强稳定版）
-- 目标：兼容当前 FastAPI 后端 + 更稳的 Beta / 生产前期使用
-- 说明：这是“新建库”用 schema；如果你已经执行过旧版 schema，请不要直接重复运行，先走迁移。

-- UUID / 随机 ID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 用户表（当前业务未强依赖，作为后续登录/归档扩展预留）
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT users_email_not_blank CHECK (length(trim(email)) > 3)
);

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 简历表
CREATE TABLE resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255),
    parsed_data JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT resumes_file_url_not_blank CHECK (length(trim(file_url)) > 0),
    CONSTRAINT resumes_parsed_data_is_object CHECK (jsonb_typeof(parsed_data) = 'object')
);

CREATE INDEX idx_resumes_user_id ON resumes(user_id);
CREATE INDEX idx_resumes_created_at ON resumes(created_at DESC);

CREATE TRIGGER update_resumes_updated_at
    BEFORE UPDATE ON resumes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- JD 表
CREATE TABLE job_descriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parsed_data JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT job_descriptions_content_not_blank CHECK (length(trim(content)) > 0),
    CONSTRAINT job_descriptions_parsed_data_is_object CHECK (jsonb_typeof(parsed_data) = 'object')
);

CREATE INDEX idx_jd_user_id ON job_descriptions(user_id);
CREATE INDEX idx_jd_created_at ON job_descriptions(created_at DESC);

CREATE TRIGGER update_job_descriptions_updated_at
    BEFORE UPDATE ON job_descriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 面试会话表
CREATE TABLE interview_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    jd_id UUID NOT NULL REFERENCES job_descriptions(id) ON DELETE CASCADE,
    questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    answers JSONB NOT NULL DEFAULT '[]'::jsonb,
    status VARCHAR(20) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT interview_sessions_questions_is_array CHECK (jsonb_typeof(questions) = 'array'),
    CONSTRAINT interview_sessions_answers_is_array CHECK (jsonb_typeof(answers) = 'array'),
    CONSTRAINT interview_sessions_completed_after_started CHECK (completed_at IS NULL OR completed_at >= started_at)
);

CREATE INDEX idx_sessions_user_id ON interview_sessions(user_id);
CREATE INDEX idx_sessions_status ON interview_sessions(status);
CREATE INDEX idx_sessions_resume_id ON interview_sessions(resume_id);
CREATE INDEX idx_sessions_jd_id ON interview_sessions(jd_id);
CREATE INDEX idx_sessions_started_at ON interview_sessions(started_at DESC);

CREATE TRIGGER update_interview_sessions_updated_at
    BEFORE UPDATE ON interview_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 面试报告表
CREATE TABLE interview_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL UNIQUE REFERENCES interview_sessions(id) ON DELETE CASCADE,
    overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    section_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
    strengths JSONB NOT NULL DEFAULT '[]'::jsonb,
    weaknesses JSONB NOT NULL DEFAULT '[]'::jsonb,
    recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT interview_reports_section_scores_is_object CHECK (jsonb_typeof(section_scores) = 'object'),
    CONSTRAINT interview_reports_strengths_is_array CHECK (jsonb_typeof(strengths) = 'array'),
    CONSTRAINT interview_reports_weaknesses_is_array CHECK (jsonb_typeof(weaknesses) = 'array'),
    CONSTRAINT interview_reports_recommendations_is_array CHECK (jsonb_typeof(recommendations) = 'array')
);

CREATE INDEX idx_reports_created_at ON interview_reports(created_at DESC);

CREATE TRIGGER update_interview_reports_updated_at
    BEFORE UPDATE ON interview_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 可选种子数据
-- INSERT INTO users (email) VALUES ('test@example.com');
