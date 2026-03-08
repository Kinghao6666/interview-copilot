import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import resume, interview
from app.config import settings
from app.services.database import db

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Interview Copilot API",
    description="AI 校招面试助手后端服务",
    version="0.3.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(resume.router, prefix="/api/resume", tags=["resume"])
app.include_router(interview.router, prefix="/api/interview", tags=["interview"])


@app.get("/")
async def root():
    return {
        "message": "Interview Copilot API",
        "version": "0.3.0",
        "mock_mode": settings.is_mock_mode,
        "llm_provider": settings.llm_provider,
        "llm_model": settings.llm_model,
        "database": "supabase" if db.is_supabase else "memory",
    }


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "mock_mode": settings.is_mock_mode,
        "llm_provider": settings.llm_provider,
        "llm_model": settings.llm_model,
        "database": "supabase" if db.is_supabase else "memory",
    }
