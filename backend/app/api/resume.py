from fastapi import APIRouter, UploadFile, File, HTTPException
from app.schemas import ResumeParseResponse, ParsedResumeData, JDParseRequest, JDParseResponse, ParsedJDData
from app.services.qwen import qwen_service
from app.services.database import db
import pypdf
import io
import os
from datetime import datetime
import uuid
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


def _decode_text_file(content: bytes) -> str:
    """Decode uploaded TXT files with common encodings."""
    for encoding in ("utf-8-sig", "utf-8", "gb18030", "gbk"):
        try:
            return content.decode(encoding)
        except UnicodeDecodeError:
            continue
    raise HTTPException(
        status_code=400,
        detail="TXT 文件编码不支持，请保存为 UTF-8 或 GBK 后重试",
    )


def _sanitize_filename(filename: str) -> str:
    normalized = filename.replace("\\", "/")
    basename = os.path.basename(normalized)
    return basename or "resume"


@router.post("/parse", response_model=ResumeParseResponse)
async def parse_resume(file: UploadFile = File(...)):
    """解析简历文件（PDF/TXT），提取结构化信息"""
    if not file.filename:
        raise HTTPException(status_code=400, detail="文件名不能为空")

    allowed_extensions = ('.pdf', '.txt')
    if not any(file.filename.lower().endswith(ext) for ext in allowed_extensions):
        raise HTTPException(status_code=400, detail="不支持的文件格式，仅支持 PDF 和 TXT")

    try:
        content = await file.read()
        safe_filename = _sanitize_filename(file.filename)
        if len(content) == 0:
            raise HTTPException(status_code=400, detail="文件内容为空")
        if len(content) > 5 * 1024 * 1024:  # 5MB limit
            raise HTTPException(status_code=400, detail="文件大小不能超过 5MB")

        if file.filename.lower().endswith('.pdf'):
            try:
                pdf_reader = pypdf.PdfReader(io.BytesIO(content))
                text = ""
                for page in pdf_reader.pages:
                    text += page.extract_text() or ""
            except pypdf.errors.PyPdfError as error:
                logger.warning(f"Invalid PDF upload: {file.filename}, error: {error}")
                raise HTTPException(status_code=400, detail="PDF 文件损坏、加密或格式不支持")

            if not text.strip():
                raise HTTPException(status_code=400, detail="PDF 文件无法提取文本内容")
        else:
            text = _decode_text_file(content)

        # Truncate to avoid LLM token limit (keep first 8000 chars)
        if len(text) > 8000:
            original_length = len(text)
            text = text[:8000]
            logger.info(f"Resume text truncated to 8000 chars (original: {original_length})")

        parsed_data = await qwen_service.parse_resume(text)
        resume_id = str(uuid.uuid4())

        response = ResumeParseResponse(
            id=resume_id,
            user_id=None,
            file_url=f"resume://{resume_id}/{safe_filename}",
            parsed_data=ParsedResumeData(**parsed_data),
            created_at=datetime.now()
        )

        resume_payload = response.model_dump(mode="json")
        resume_payload["file_name"] = safe_filename
        await db.save_resume(resume_id, resume_payload)
        logger.info(f"Resume parsed: {resume_id} ({file.filename})")
        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Resume parse failed: {e}")
        raise HTTPException(status_code=500, detail=f"简历解析失败: {str(e)}")


@router.get("/{resume_id}")
async def get_resume(resume_id: str):
    """获取已解析的简历"""
    resume = await db.get_resume(resume_id)
    if not resume:
        raise HTTPException(status_code=404, detail="简历不存在")
    return resume


@router.post("/jd/parse", response_model=JDParseResponse)
async def parse_jd(request: JDParseRequest):
    """解析 JD 文本，提取岗位要求和技能"""
    if not request.content.strip():
        raise HTTPException(status_code=400, detail="JD 内容不能为空")
    if len(request.content) > 10000:
        raise HTTPException(status_code=400, detail="JD 内容不能超过 10000 字")

    try:
        parsed_data = await qwen_service.parse_jd(request.content)
        jd_id = str(uuid.uuid4())

        response = JDParseResponse(
            id=jd_id,
            user_id=None,
            content=request.content,
            parsed_data=ParsedJDData(**parsed_data),
            created_at=datetime.now()
        )

        await db.save_jd(jd_id, response.model_dump(mode="json"))
        logger.info(f"JD parsed: {jd_id}")
        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"JD parse failed: {e}")
        raise HTTPException(status_code=500, detail=f"JD 解析失败: {str(e)}")


@router.get("/jd/{jd_id}")
async def get_jd(jd_id: str):
    """获取已解析的 JD"""
    jd = await db.get_jd(jd_id)
    if not jd:
        raise HTTPException(status_code=404, detail="JD 不存在")
    return jd
