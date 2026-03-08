"""
Database service layer — abstracts storage behind a clean interface.
Uses in-memory store when SUPABASE_URL is not configured (dev/mock mode).
Uses Supabase when credentials are provided (production).
"""
from typing import Dict, List, Optional
import uuid
import logging

from app.config import settings

logger = logging.getLogger(__name__)


class DatabaseService:
    """Abstract database operations. Auto-selects backend based on config."""

    def __init__(self):
        self._use_supabase = bool(settings.SUPABASE_URL and settings.SUPABASE_KEY)
        self._client = None

        if self._use_supabase:
            try:
                from supabase import create_client
                self._client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
                logger.info("Database: Supabase connected")
            except Exception as e:
                logger.warning(f"Supabase init failed, falling back to memory: {e}")
                self._use_supabase = False

        if not self._use_supabase:
            self._memory: Dict[str, Dict[str, dict]] = {
                "resumes": {},
                "jds": {},
                "sessions": {},
                "reports": {},
            }
            logger.info("Database: in-memory store (dev mode)")

    @property
    def is_supabase(self) -> bool:
        return self._use_supabase

    @staticmethod
    def _normalize_optional_uuid(value: object) -> Optional[str]:
        if value in (None, ""):
            return None
        try:
            return str(uuid.UUID(str(value)))
        except (ValueError, TypeError, AttributeError):
            return None

    # === Resume ===

    async def save_resume(self, resume_id: str, data: dict) -> dict:
        if self._use_supabase:
            row = {
                "id": resume_id,
                "file_url": data.get("file_url", ""),
                "file_name": data.get("file_name", ""),
                "parsed_data": data.get("parsed_data", {}),
            }
            user_id = self._normalize_optional_uuid(data.get("user_id"))
            if user_id:
                row["user_id"] = user_id
            result = self._client.table("resumes").insert(row).execute()
            return result.data[0] if result.data else row
        else:
            self._memory["resumes"][resume_id] = data
            return data

    async def get_resume(self, resume_id: str) -> Optional[dict]:
        if self._use_supabase:
            result = self._client.table("resumes").select("*").eq("id", resume_id).execute()
            return result.data[0] if result.data else None
        else:
            return self._memory["resumes"].get(resume_id)

    # === JD ===

    async def save_jd(self, jd_id: str, data: dict) -> dict:
        if self._use_supabase:
            row = {
                "id": jd_id,
                "content": data.get("content", ""),
                "parsed_data": data.get("parsed_data", {}),
            }
            user_id = self._normalize_optional_uuid(data.get("user_id"))
            if user_id:
                row["user_id"] = user_id
            result = self._client.table("job_descriptions").insert(row).execute()
            return result.data[0] if result.data else row
        else:
            self._memory["jds"][jd_id] = data
            return data

    async def get_jd(self, jd_id: str) -> Optional[dict]:
        if self._use_supabase:
            result = self._client.table("job_descriptions").select("*").eq("id", jd_id).execute()
            return result.data[0] if result.data else None
        else:
            return self._memory["jds"].get(jd_id)

    # === Session ===

    async def save_session(self, session_id: str, data: dict) -> dict:
        if self._use_supabase:
            row = {
                "id": session_id,
                "resume_id": data.get("resume_id"),
                "jd_id": data.get("jd_id"),
                "questions": data.get("questions", []),
                "answers": data.get("answers", []),
                "status": data.get("status", "in_progress"),
                "started_at": data.get("started_at"),
                "completed_at": data.get("completed_at"),
            }
            user_id = self._normalize_optional_uuid(data.get("user_id"))
            if user_id:
                row["user_id"] = user_id
            result = self._client.table("interview_sessions").insert(row).execute()
            return result.data[0] if result.data else row
        else:
            self._memory["sessions"][session_id] = data
            return data

    async def get_session(self, session_id: str) -> Optional[dict]:
        if self._use_supabase:
            result = self._client.table("interview_sessions").select("*").eq("id", session_id).execute()
            return result.data[0] if result.data else None
        else:
            return self._memory["sessions"].get(session_id)

    async def update_session(self, session_id: str, updates: dict) -> Optional[dict]:
        if self._use_supabase:
            result = self._client.table("interview_sessions").update(updates).eq("id", session_id).execute()
            return result.data[0] if result.data else None
        else:
            session = self._memory["sessions"].get(session_id)
            if session:
                session.update(updates)
            return session

    async def list_sessions(self) -> List[dict]:
        if self._use_supabase:
            session_result = (
                self._client.table("interview_sessions")
                .select("id, status, questions, answers, started_at, completed_at")
                .order("started_at", desc=True)
                .limit(50)
                .execute()
            )
            sessions = session_result.data or []
            report_result = (
                self._client.table("interview_reports")
                .select("session_id, overall_score")
                .execute()
            )
            report_map = {
                item["session_id"]: item.get("overall_score")
                for item in (report_result.data or [])
                if item.get("session_id")
            }
            results = []
            for session in sessions:
                started_at = session.get("started_at")
                session_id = session.get("id", "")
                results.append({
                    "id": session_id,
                    "status": session.get("status", "in_progress"),
                    "questions": session.get("questions", []),
                    "answers": session.get("answers", []),
                    "started_at": started_at,
                    "created_at": started_at,
                    "completed_at": session.get("completed_at"),
                    "overall_score": report_map.get(session_id),
                })
            return results
        else:
            results = []
            for sid, session in self._memory["sessions"].items():
                report = self._memory["reports"].get(sid, {})
                started_at = session.get("started_at")
                results.append({
                    "id": sid,
                    "status": session.get("status", "in_progress"),
                    "questions": session.get("questions", []),
                    "answers": session.get("answers", []),
                    "started_at": started_at,
                    "created_at": started_at,
                    "completed_at": session.get("completed_at"),
                    "overall_score": report.get("overall_score"),
                })
            return sorted(results, key=lambda x: x.get("started_at", ""), reverse=True)

    # === Report ===

    async def save_report(self, session_id: str, data: dict) -> dict:
        if self._use_supabase:
            row = {
                "id": data.get("id", str(uuid.uuid4())),
                "session_id": session_id,
                "overall_score": data.get("overall_score"),
                "section_scores": data.get("section_scores"),
                "strengths": data.get("strengths"),
                "weaknesses": data.get("weaknesses"),
                "recommendations": data.get("recommendations"),
                "created_at": data.get("created_at"),
            }
            result = self._client.table("interview_reports").insert(row).execute()
            return result.data[0] if result.data else row
        else:
            self._memory["reports"][session_id] = data
            return data

    async def get_report(self, session_id: str) -> Optional[dict]:
        if self._use_supabase:
            result = (
                self._client.table("interview_reports")
                .select("*")
                .eq("session_id", session_id)
                .execute()
            )
            return result.data[0] if result.data else None
        else:
            return self._memory["reports"].get(session_id)


# Singleton
db = DatabaseService()
