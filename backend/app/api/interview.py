from fastapi import APIRouter, HTTPException
from app.schemas import (
    InterviewGenerateRequest,
    InterviewGenerateResponse,
    EvaluateRequest,
    EvaluateResponse,
    InterviewReport,
    InterviewSessionDetail,
    SessionSummary,
    Question,
)
from app.services.qwen import qwen_service
from app.services.question_bank import question_bank_service
from app.services.database import db
import uuid
from datetime import datetime
from typing import List
import random
import logging
import re

logger = logging.getLogger(__name__)
router = APIRouter()


def _get_answered_question_ids(answers: List[dict]) -> set[str]:
    return {
        answer.get("question_id")
        for answer in answers
        if isinstance(answer, dict) and answer.get("question_id")
    }

DATABASE_SKILL = "数据库"
DATA_STRUCTURES_SKILL = "数据结构"
ALGORITHM_SKILL = "算法"
OPERATING_SYSTEM_SKILL = "操作系统"
NETWORK_SKILL = "计算机网络"

BACKEND_POSITION_KEYWORDS = ["后端", "backend", "服务端"]
FRONTEND_POSITION_KEYWORDS = ["前端", "frontend"]
DATA_POSITION_KEYWORDS = ["算法", "ai", "数据"]

SKILL_ALIAS_MAP = {
    "c++": ["C++"],
    "cpp": ["C++"],
    "c/c++": ["C++"],
    "cplusplus": ["C++"],
    "stl": ["C++"],
    "qt": ["C++"],
    "py": ["Python"],
    "python": ["Python"],
    "fastapi": ["Python"],
    "django": ["Python"],
    "flask": ["Python"],
    "java": ["Java"],
    "spring": ["Java"],
    "springboot": ["Java"],
    "spring boot": ["Java"],
    "jvm": ["Java"],
    "mybatis": ["Java"],
    "go": ["Go"],
    "golang": ["Go"],
    "gin": ["Go"],
    "goroutine": ["Go"],
    "js": ["JavaScript"],
    "javascript": ["JavaScript"],
    "node.js": ["JavaScript"],
    "node": ["JavaScript"],
    "express": ["JavaScript"],
    "next.js": ["JavaScript"],
    "nextjs": ["JavaScript"],
    "mysql": [DATABASE_SKILL],
    "postgresql": [DATABASE_SKILL],
    "postgres": [DATABASE_SKILL],
    "mongodb": [DATABASE_SKILL],
    "sql": [DATABASE_SKILL],
    "redis": [DATABASE_SKILL],
}

LANGUAGE_SKILLS = {"Python", "Java", "C++", "Go", "JavaScript"}
LANGUAGE_KEYWORD_PATTERNS = {
    "Python": [r"python", r"(?<![a-z])py(?![a-z])", r"fastapi", r"django", r"flask"],
    "Java": [r"(?<![a-z])java(?!script)", r"spring", r"springboot", r"spring boot", r"jvm", r"mybatis"],
    "C++": [r"c\+\+", r"cpp", r"c/c\+\+", r"cplusplus", r"stl", r"(?<![a-z])qt(?![a-z])"],
    "Go": [r"(?<![a-z])go(?![a-z])", r"golang", r"(?<![a-z])gin(?![a-z])", r"goroutine"],
    "JavaScript": [r"javascript", r"(?<![a-z])js(?![a-z])", r"node\.js", r"(?<![a-z])node(?![a-z])", r"express", r"next\.js", r"nextjs"],
}
CPP_KEYWORDS = ["c++", "cpp", "c/c++", "cplusplus", "stl", "qt"]

@router.post("/generate", response_model=InterviewGenerateResponse)
async def generate_interview(request: InterviewGenerateRequest):
    """根据简历技能和 JD 要求，生成个性化面试题"""
    try:
        resume = await db.get_resume(request.resume_id)
        if not resume:
            raise HTTPException(status_code=404, detail="简历不存在")

        jd = await db.get_jd(request.jd_id)
        if not jd:
            raise HTTPException(status_code=404, detail="JD 不存在")

        resume_parsed = resume.get("parsed_data", {})
        jd_parsed = jd.get("parsed_data", {})

        resume_skills = resume_parsed.get("skills", []) if isinstance(resume_parsed, dict) else []
        jd_skills = jd_parsed.get("skills_required", []) if isinstance(jd_parsed, dict) else []
        jd_position = jd_parsed.get("position", "") if isinstance(jd_parsed, dict) else ""

        questions = _select_questions(resume_skills, jd_skills, jd_position)

        session_id = str(uuid.uuid4())
        session_data = {
            "resume_id": request.resume_id,
            "jd_id": request.jd_id,
            "questions": [q.model_dump() for q in questions],
            "answers": [],
            "status": "in_progress",
            "started_at": datetime.now().isoformat(),
        }
        await db.save_session(session_id, session_data)

        logger.info(f"Interview generated: {session_id} ({len(questions)} questions)")
        return InterviewGenerateResponse(session_id=session_id, questions=questions)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Generate interview failed: {e}")
        raise HTTPException(status_code=500, detail=f"生成面试题失败: {str(e)}")


@router.post("/evaluate", response_model=EvaluateResponse)
async def evaluate_answer(request: EvaluateRequest):
    """评估面试答案，返回分数和改进建议"""
    if not request.answer.strip():
        raise HTTPException(status_code=400, detail="答案不能为空")

    session = await db.get_session(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="面试会话不存在")
    if session.get("status") == "completed":
        raise HTTPException(status_code=409, detail="面试会话已完成，无法继续提交答案")

    questions = session.get("questions", [])
    question = next(
        (q for q in questions if q["id"] == request.question_id), None
    )
    if not question:
        raise HTTPException(status_code=404, detail="题目不存在")

    try:
        evaluation = await qwen_service.evaluate_answer(
            question=question["content"],
            answer=request.answer,
            reference_answer=question.get("reference_answer"),
        )

        answers = list(session.get("answers", []))
        answer_record = {
            "question_id": request.question_id,
            "answer": request.answer,
            "score": evaluation["score"],
            "feedback": evaluation["feedback"],
            "strengths": evaluation.get("strengths", []),
            "improvements": evaluation.get("improvements", []),
            "submitted_at": datetime.now().isoformat(),
        }

        existing_index = next(
            (index for index, item in enumerate(answers) if item.get("question_id") == request.question_id),
            None,
        )
        if existing_index is None:
            answers.append(answer_record)
        else:
            answers[existing_index] = answer_record

        await db.update_session(request.session_id, {"answers": answers})

        logger.info(f"Answer evaluated: session={request.session_id[:8]} q={request.question_id} score={evaluation['score']}")
        return EvaluateResponse(**evaluation)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Evaluate failed: {e}")
        raise HTTPException(status_code=500, detail=f"评估答案失败: {str(e)}")


@router.get("/session/{session_id}", response_model=InterviewSessionDetail)
async def get_session_detail(session_id: str):
    session = await db.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="面试会话不存在")

    resume = await db.get_resume(session.get("resume_id", "")) if session.get("resume_id") else None
    jd = await db.get_jd(session.get("jd_id", "")) if session.get("jd_id") else None

    return InterviewSessionDetail(
        id=session_id,
        resume_id=session.get("resume_id", ""),
        jd_id=session.get("jd_id", ""),
        questions=session.get("questions", []),
        answers=session.get("answers", []),
        status=session.get("status", "in_progress"),
        started_at=session.get("started_at") or datetime.now().isoformat(),
        completed_at=session.get("completed_at"),
        resume_data=resume.get("parsed_data") if isinstance(resume, dict) else None,
        jd_data=jd.get("parsed_data") if isinstance(jd, dict) else None,
    )


@router.get("/report/{session_id}", response_model=InterviewReport)
async def get_report(session_id: str):
    """生成面试复盘报告"""
    session = await db.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="面试会话不存在")

    existing = await db.get_report(session_id)
    if existing:
        return existing

    questions = session.get("questions", [])
    answered_question_ids = _get_answered_question_ids(session.get("answers", []))
    if not questions:
        raise HTTPException(status_code=400, detail="面试会话中没有可用题目")
    if len(answered_question_ids) < len(questions):
        raise HTTPException(
            status_code=409,
            detail=f"面试尚未完成，已作答 {len(answered_question_ids)}/{len(questions)} 题",
        )

    try:
        report_data = await qwen_service.generate_report(
            questions=questions,
            answers=session.get("answers", []),
        )

        await db.update_session(session_id, {
            "status": "completed",
            "completed_at": datetime.now().isoformat(),
        })

        report = InterviewReport(
            id=str(uuid.uuid4()),
            session_id=session_id,
            created_at=datetime.now(),
            **report_data,
        )

        await db.save_report(session_id, report.model_dump(mode="json"))
        logger.info(f"Report generated: session={session_id[:8]} score={report_data.get('overall_score')}")
        return report

    except Exception as e:
        logger.error(f"Report generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"生成报告失败: {str(e)}")


@router.get("/sessions", response_model=List[SessionSummary])
async def list_sessions():
    """列出所有面试会话"""
    sessions = await db.list_sessions()
    result = []
    for session in sessions:
        sid = session.get("id", "")
        result.append({
            "id": sid,
            "status": session.get("status", "in_progress"),
            "question_count": len(session.get("questions", [])),
            "answer_count": len(session.get("answers", [])),
            "overall_score": session.get("overall_score"),
            "created_at": session.get("created_at") or session.get("started_at"),
            "started_at": session.get("started_at"),
            "completed_at": session.get("completed_at"),
        })
    return result


def _match_skills(candidate_skills: List[str], available_skills: List[str]) -> List[str]:
    matched_skills = []
    for candidate_skill in candidate_skills:
        if not candidate_skill:
            continue

        raw_candidates = [candidate_skill]
        raw_candidates.extend(
            token.strip()
            for token in re.split(r"[、,，/|]", candidate_skill)
            if token.strip()
        )

        expanded_candidates = []
        for raw_candidate in raw_candidates:
            normalized_candidate = raw_candidate.lower().replace("＋", "+")
            if raw_candidate not in expanded_candidates:
                expanded_candidates.append(raw_candidate)
            for alias in SKILL_ALIAS_MAP.get(normalized_candidate, []):
                if alias not in expanded_candidates:
                    expanded_candidates.append(alias)

        for expanded_candidate in expanded_candidates:
            normalized_expanded = expanded_candidate.lower().replace("＋", "+")
            for bank_skill in available_skills:
                normalized_bank = bank_skill.lower().replace("＋", "+")
                if bank_skill in LANGUAGE_SKILLS:
                    is_match = normalized_expanded == normalized_bank
                else:
                    is_match = (
                        normalized_expanded == normalized_bank
                        or normalized_expanded in normalized_bank
                        or normalized_bank in normalized_expanded
                    )
                if is_match and bank_skill not in matched_skills:
                    matched_skills.append(bank_skill)
    return matched_skills


def _normalize_text(value: str) -> str:
    return value.lower().replace("＋", "+").strip()


def _is_language_skill(skill: str) -> bool:
    return skill in LANGUAGE_SKILLS


def _matches_language_pattern(text: str, language: str) -> bool:
    normalized_text = _normalize_text(text)
    return any(
        re.search(pattern, normalized_text, re.IGNORECASE)
        for pattern in LANGUAGE_KEYWORD_PATTERNS.get(language, [])
    )


def _detect_focus_languages(
    jd_position: str,
    jd_skills: List[str],
    resume_skills: List[str],
    available_skills: List[str],
) -> List[str]:
    available_languages = [skill for skill in available_skills if skill in LANGUAGE_SKILLS]
    matched_resume_languages = [
        skill for skill in _match_skills(resume_skills, available_languages) if skill in available_languages
    ]
    matched_jd_languages = [
        skill for skill in _match_skills(jd_skills, available_languages) if skill in available_languages
    ]
    inferred_position_languages = [
        skill for skill in available_languages if _matches_language_pattern(jd_position, skill)
    ]

    focus_languages = []
    for skill_group in [
        [skill for skill in matched_resume_languages if skill in matched_jd_languages],
        matched_jd_languages,
        inferred_position_languages,
        matched_resume_languages if len(matched_resume_languages) == 1 else [],
    ]:
        for skill in skill_group:
            if skill not in focus_languages:
                focus_languages.append(skill)
    return focus_languages


def _filter_language_skills(skills: List[str], focus_languages: List[str]) -> List[str]:
    if not focus_languages:
        return skills

    focus_set = set(focus_languages)
    filtered_skills = []
    for skill in skills:
        if _is_language_skill(skill) and skill not in focus_set:
            continue
        if skill not in filtered_skills:
            filtered_skills.append(skill)
    return filtered_skills


def _has_cpp_focus(focus_languages: List[str]) -> bool:
    return "C++" in focus_languages


def _infer_position_skills(jd_position: str, jd_skills: List[str], focus_languages: List[str]) -> List[str]:
    normalized_position = _normalize_text(jd_position)
    cpp_focus = _has_cpp_focus(focus_languages)

    if cpp_focus and any(keyword in normalized_position for keyword in BACKEND_POSITION_KEYWORDS):
        return ["C++", DATA_STRUCTURES_SKILL, OPERATING_SYSTEM_SKILL, NETWORK_SKILL, DATABASE_SKILL]
    if cpp_focus:
        return ["C++", DATA_STRUCTURES_SKILL, ALGORITHM_SKILL, OPERATING_SYSTEM_SKILL, NETWORK_SKILL]
    if "Java" in focus_languages and any(keyword in normalized_position for keyword in BACKEND_POSITION_KEYWORDS):
        return ["Java", DATABASE_SKILL, OPERATING_SYSTEM_SKILL, NETWORK_SKILL]
    if "Java" in focus_languages:
        return ["Java", DATA_STRUCTURES_SKILL, ALGORITHM_SKILL, DATABASE_SKILL]
    if "Python" in focus_languages and any(keyword in normalized_position for keyword in BACKEND_POSITION_KEYWORDS + DATA_POSITION_KEYWORDS):
        return ["Python", DATABASE_SKILL, DATA_STRUCTURES_SKILL, NETWORK_SKILL]
    if "Python" in focus_languages:
        return ["Python", DATA_STRUCTURES_SKILL, ALGORITHM_SKILL, DATABASE_SKILL]
    if "Go" in focus_languages and any(keyword in normalized_position for keyword in BACKEND_POSITION_KEYWORDS):
        return ["Go", DATABASE_SKILL, OPERATING_SYSTEM_SKILL, NETWORK_SKILL, DATA_STRUCTURES_SKILL]
    if "Go" in focus_languages:
        return ["Go", DATA_STRUCTURES_SKILL, ALGORITHM_SKILL, NETWORK_SKILL]
    if "JavaScript" in focus_languages and any(keyword in normalized_position for keyword in FRONTEND_POSITION_KEYWORDS):
        return ["JavaScript", "React", DATA_STRUCTURES_SKILL, NETWORK_SKILL]
    if "JavaScript" in focus_languages and any(keyword in normalized_position for keyword in BACKEND_POSITION_KEYWORDS):
        return ["JavaScript", DATABASE_SKILL, NETWORK_SKILL, "Docker"]
    if "JavaScript" in focus_languages:
        return ["JavaScript", "React", DATA_STRUCTURES_SKILL, DATABASE_SKILL]

    if any(keyword in normalized_position for keyword in BACKEND_POSITION_KEYWORDS):
        return ["Python", "MySQL", "Redis", "Linux", DATABASE_SKILL, NETWORK_SKILL]
    if any(keyword in normalized_position for keyword in FRONTEND_POSITION_KEYWORDS):
        return ["JavaScript", "TypeScript", "React"]
    if any(keyword in normalized_position for keyword in DATA_POSITION_KEYWORDS):
        return ["Python", DATA_STRUCTURES_SKILL, DATABASE_SKILL]
    return []
def _infer_scenario_tags(jd_position: str, jd_skills: List[str]) -> List[str]:
    tags = []
    normalized_position = jd_position.lower()

    if any(keyword in normalized_position for keyword in ["后端", "backend", "服务端"]):
        tags.extend(["后端", "系统设计", "问题排查"])
    if any(keyword in skill.lower() for skill in jd_skills for keyword in ["mysql", "postgresql", "mongodb", "数据库"]):
        tags.append("数据库")
    if any(keyword in skill.lower() for skill in jd_skills for keyword in ["redis", "kafka", "mq", "高并发"]):
        tags.append("高并发")
    if any(keyword in skill.lower() for skill in jd_skills for keyword in ["linux", "docker", "kubernetes", "运维"]):
        tags.append("问题排查")

    return tags


def _select_questions(resume_skills: List[str], jd_skills: List[str], jd_position: str) -> List[Question]:
    """从题库中选择题目，优先满足 JD 和简历共同命中的技能。"""
    questions = []

    # Part 1: 自我介绍（1题，3-5分钟）
    questions.append(question_bank_service.get_self_intro_question())

    # Part 2: 技能测试（6-10题，10-12分钟）
    available_skills = question_bank_service.get_available_skills()

    focus_languages = _detect_focus_languages(
        jd_position,
        jd_skills,
        resume_skills,
        available_skills,
    )
    matched_resume_skills = _filter_language_skills(
        _match_skills(resume_skills, available_skills),
        focus_languages,
    )
    matched_jd_skills = _filter_language_skills(
        _match_skills(jd_skills, available_skills),
        focus_languages,
    )
    inferred_position_skills = _filter_language_skills(
        _match_skills(_infer_position_skills(jd_position, jd_skills, focus_languages), available_skills),
        focus_languages,
    )

    prioritized_skills = []
    for skill_group in [
        focus_languages,
        [skill for skill in matched_resume_skills if skill in matched_jd_skills],
        matched_jd_skills,
        inferred_position_skills,
        matched_resume_skills,
    ]:
        for skill in skill_group:
            if skill not in prioritized_skills:
                prioritized_skills.append(skill)

    if len(prioritized_skills) < 3:
        remaining = _filter_language_skills(
            [skill for skill in available_skills if skill not in prioritized_skills],
            focus_languages,
        )
        fill_count = min(3 - len(prioritized_skills), len(remaining))
        prioritized_skills.extend(random.sample(remaining, fill_count))

    selected_skills = prioritized_skills[:3]
    for skill in selected_skills:
        skill_questions = question_bank_service.get_skill_questions(skill, count=3)
        questions.extend(skill_questions)

    # Part 3: 场景题（2题，8-10分钟）
    scenario_questions = question_bank_service.get_scenario_questions(
        count=2,
        preferred_tags=_infer_scenario_tags(jd_position, jd_skills),
    )
    questions.extend(scenario_questions)

    # Part 4: 反问环节（1题，2-3分钟）
    reverse_q = question_bank_service.get_reverse_question()
    if reverse_q:
        questions.append(reverse_q)

    return questions
