from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class ParsedResumeData(BaseModel):
    name: str
    education: str
    skills: List[str]
    experience: List[str]
    projects: List[str]


class ResumeParseResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    file_url: str
    parsed_data: ParsedResumeData
    created_at: datetime


class ParsedJDData(BaseModel):
    position: str
    company: str
    requirements: List[str]
    skills_required: List[str]


class JDParseRequest(BaseModel):
    content: str


class JDParseResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    content: str
    parsed_data: ParsedJDData
    created_at: datetime


class Question(BaseModel):
    id: str
    type: str = Field(..., description="self_intro | skill_test | scenario | reverse")
    category: str
    content: str
    difficulty: str = Field(..., description="easy | medium | hard")
    time_limit: int = Field(..., description="Time limit in seconds")
    reference_answer: Optional[str] = None
    tags: List[str]


class InterviewGenerateRequest(BaseModel):
    resume_id: str
    jd_id: str


class InterviewGenerateResponse(BaseModel):
    session_id: str
    questions: List[Question]


class EvaluateRequest(BaseModel):
    session_id: str
    question_id: str
    answer: str


class EvaluateResponse(BaseModel):
    score: int = Field(..., ge=0, le=100)
    feedback: str
    strengths: List[str]
    improvements: List[str]


class StoredAnswer(BaseModel):
    question_id: str
    answer: str
    score: int = Field(..., ge=0, le=100)
    feedback: str
    strengths: List[str] = Field(default_factory=list)
    improvements: List[str] = Field(default_factory=list)
    submitted_at: datetime


class InterviewReport(BaseModel):
    id: str
    session_id: str
    overall_score: int
    section_scores: dict
    strengths: List[str]
    weaknesses: List[str]
    recommendations: List[str]
    created_at: datetime


class SessionSummary(BaseModel):
    id: str
    status: str
    question_count: int
    answer_count: int
    created_at: datetime
    overall_score: Optional[int] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class InterviewSessionDetail(BaseModel):
    id: str
    resume_id: str
    jd_id: str
    questions: List[Question]
    answers: List[StoredAnswer] = Field(default_factory=list)
    status: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    resume_data: Optional[ParsedResumeData] = None
    jd_data: Optional[ParsedJDData] = None
