import httpx
import asyncio
import logging
from app.config import settings
import json
import re
from typing import List, Dict

logger = logging.getLogger(__name__)

MAX_RETRIES = 3
RETRY_DELAYS = [1, 2, 4]


class QwenService:
    def __init__(self):
        if not settings.is_mock_mode:
            self._api_url = f"{settings.llm_api_base}/responses"
            self._headers = {
                "Authorization": f"Bearer {settings.llm_api_key}",
                "Content-Type": "application/json",
            }
            self._http = httpx.AsyncClient(timeout=60)
        self.model = settings.llm_model

    async def _call_llm(self, prompt: str, temperature: float = 0.3) -> str:
        payload = {
            "model": self.model,
            "input": [{"role": "user", "content": prompt}],
            "temperature": temperature,
        }
        last_error = None
        for attempt in range(MAX_RETRIES):
            try:
                resp = await self._http.post(self._api_url, json=payload, headers=self._headers)
                resp.raise_for_status()
                data = resp.json()
                for item in data.get("output", []):
                    if item.get("type") == "message":
                        for c in item.get("content", []):
                            if c.get("type") == "output_text":
                                return c["text"]
                raise ValueError(f"No text output in LLM response: {json.dumps(data)[:300]}")
            except (httpx.HTTPStatusError, httpx.ConnectError, httpx.ReadTimeout) as e:
                last_error = e
                if isinstance(e, httpx.HTTPStatusError) and e.response.status_code < 500:
                    raise
                if attempt < MAX_RETRIES - 1:
                    delay = RETRY_DELAYS[attempt]
                    logger.warning(f"LLM call failed (attempt {attempt + 1}/{MAX_RETRIES}), retrying in {delay}s: {e}")
                    await asyncio.sleep(delay)
        raise last_error

    def _parse_json_response(self, text: str) -> Dict:
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass
        match = re.search(r"```(?:json)?\s*\n?(.*?)\n?```", text, re.DOTALL)
        if match:
            return json.loads(match.group(1).strip())
        raise ValueError(f"Cannot parse JSON from LLM response: {text[:200]}")

    async def parse_resume(self, text: str) -> Dict:
        if settings.is_mock_mode:
            return self._mock_parse_resume(text)

        prompt = f"""你是一个专业的简历解析助手。请从以下简历中提取关键信息。

简历内容：
{text}

仅返回 JSON：
{{"name": "...", "education": "...", "skills": [...], "experience": [...], "projects": [...]}}"""

        result = await self._call_llm(prompt, temperature=0.1)
        return self._parse_json_response(result)

    async def parse_jd(self, text: str) -> Dict:
        if settings.is_mock_mode:
            return self._mock_parse_jd(text)

        prompt = f"""你是一个专业的 JD 解析助手。请从以下职位描述中提取关键信息。

JD 内容：
{text}

仅返回 JSON：
{{"position": "...", "company": "...", "requirements": [...], "skills_required": [...]}}"""

        result = await self._call_llm(prompt, temperature=0.1)
        return self._parse_json_response(result)

    async def evaluate_answer(
        self, question: str, answer: str, reference_answer: str = None
    ) -> Dict:
        if settings.is_mock_mode:
            return self._mock_evaluate(question, answer)

        ref_section = f"\n参考答案：\n{reference_answer}" if reference_answer else ""
        prompt = f"""你是一个专业的面试官。请评估候选人的回答质量。

面试题目：{question}
候选人回答：{answer}{ref_section}

评分维度（总分100）：技术准确性40分、表达清晰度30分、结构完整性20分、深度广度10分。

仅返回 JSON：
{{"score": 85, "feedback": "...", "strengths": ["..."], "improvements": ["..."]}}"""

        result = await self._call_llm(prompt, temperature=0.3)
        return self._parse_json_response(result)

    async def generate_report(
        self, questions: List[Dict], answers: List[Dict]
    ) -> Dict:
        if settings.is_mock_mode:
            return self._mock_report(questions, answers)

        prompt = f"""你是一个专业的面试评估专家。请根据面试表现生成复盘报告。

面试数据：
{json.dumps({"questions": questions, "answers": answers}, ensure_ascii=False)}

仅返回 JSON：
{{"overall_score": 82, "section_scores": {{"self_intro": 85, "skill_test": 78, "scenario": 82}}, "strengths": [...], "weaknesses": [...], "recommendations": [...]}}"""

        result = await self._call_llm(prompt, temperature=0.3)
        return self._parse_json_response(result)

    # === Mock implementations for local dev ===

    def _extract_mock_skills(self, text: str) -> List[str]:
        normalized_text = text.lower().replace("＋", "+")
        skill_patterns = [
            ("Python", [r"python", r"(?<![a-z])py(?![a-z])", r"django", r"flask", r"fastapi"]),
            ("Java", [r"(?<![a-z])java(?!script)", r"spring", r"springboot", r"spring boot", r"jvm", r"mybatis"]),
            ("C++", [r"c\+\+", r"(?<![a-z])cpp(?![a-z])", r"c/c\+\+", r"cplusplus", r"stl", r"(?<![a-z])qt(?![a-z])"]),
            ("JavaScript", [r"javascript", r"(?<![a-z])js(?![a-z])", r"node\.js", r"(?<![a-z])node(?![a-z])", r"express", r"next\.js", r"nextjs"]),
            ("TypeScript", [r"typescript"]),
            ("React", [r"\breact\b"]),
            ("Vue", [r"\bvue\b"]),
            ("Node", [r"node\.js", r"\bnode\b"]),
            ("Go", [r"(?<![a-z])go(?![a-z])", r"\bgolang\b", r"(?<![a-z])gin(?![a-z])", r"goroutine"]),
            ("Rust", [r"\brust\b"]),
            ("MySQL", [r"\bmysql\b"]),
            ("PostgreSQL", [r"\bpostgresql\b", r"\bpostgres\b"]),
            ("Redis", [r"\bredis\b"]),
            ("Docker", [r"\bdocker\b"]),
            ("Kubernetes", [r"\bkubernetes\b", r"\bk8s\b"]),
            ("Linux", [r"\blinux\b"]),
            ("Git", [r"\bgit\b"]),
            ("FastAPI", [r"\bfastapi\b"]),
            ("Spring", [r"\bspring\b"]),
            ("数据结构", [r"数据结构"]),
            ("算法", [r"算法"]),
            ("操作系统", [r"操作系统"]),
            ("计算机网络", [r"计算机网络", r"网络编程"]),
            ("数据库", [r"数据库", r"\bsql\b"]),
        ]

        skills = []
        for skill, patterns in skill_patterns:
            if any(re.search(pattern, normalized_text, re.IGNORECASE) for pattern in patterns):
                skills.append(skill)
        return skills

    def _mock_parse_resume(self, text: str) -> Dict:
        skills = self._extract_mock_skills(text)
        if not skills:
            skills = ["数据结构", "算法", "计算机网络"]
        return {
            "name": "模拟用户",
            "education": "本科 - 示例大学 - 计算机科学与技术",
            "skills": skills,
            "experience": ["2025.06-2025.09 示例公司 后端开发实习生"],
            "projects": ["AI 面试助手", "在线教育平台"],
        }

    def _mock_parse_jd(self, text: str) -> Dict:
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        position_match = re.search(
            r"([A-Za-z0-9+#/＋\-\s\u4e00-\u9fff]{2,40}(?:工程师|开发|实习生|架构师|研究员|负责人))",
            text,
        )
        position = (
            position_match.group(1).strip(" ：:，,。；;·")
            if position_match
            else (lines[0][:40] if lines else "通用开发工程师")
        )

        requirements = []
        for line in lines[1:]:
            cleaned = line.strip("-•* ").removeprefix("要求：").removeprefix("职责：").strip()
            if len(cleaned) >= 4:
                requirements.append(cleaned)
            if len(requirements) >= 3:
                break

        normalized_text = text.lower().replace("＋", "+")
        skills_required = self._extract_mock_skills(text)
        if not skills_required:
            if any(keyword in normalized_text for keyword in ["c++", "cpp", "c/c++", "cplusplus", "stl"]):
                skills_required = ["C++", "数据结构", "操作系统", "计算机网络"]
            elif any(keyword in normalized_text for keyword in ["前端", "frontend", "react", "javascript", "typescript"]):
                skills_required = ["JavaScript", "TypeScript", "React"]
            elif any(keyword in normalized_text for keyword in ["后端", "backend", "服务端", "python", "mysql", "redis"]):
                skills_required = ["Python", "MySQL", "Redis", "Linux"]
            else:
                skills_required = ["数据结构", "算法", "计算机网络"]

        if not requirements:
            requirements = [
                "计算机相关专业本科及以上",
                "熟悉岗位对应语言与基础知识",
                "具备良好的问题分析和沟通能力",
            ]

        return {
            "position": position,
            "company": "示例科技",
            "requirements": requirements,
            "skills_required": skills_required,
        }

    def _mock_evaluate(self, question: str, answer: str) -> Dict:
        base_score = min(60 + len(answer) // 10, 95)
        return {
            "score": base_score,
            "feedback": "回答覆盖了主要知识点，建议补充实际应用场景和性能分析。",
            "strengths": ["基本概念理解正确", "表达较为清晰"],
            "improvements": ["可以补充更多实际应用场景", "建议深入讨论底层原理"],
        }

    def _mock_report(self, questions: List[Dict], answers: List[Dict]) -> Dict:
        avg = 78
        if answers:
            scores = [a.get("score", 70) for a in answers]
            avg = sum(scores) // len(scores) if scores else 78
        return {
            "overall_score": avg,
            "section_scores": {
                "self_intro": avg + 5, "skill_test": avg - 2,
                "scenario": avg + 3,
            },
            "strengths": ["技术基础扎实", "表达清晰流畅", "思路有条理"],
            "weaknesses": ["对分布式系统理解不够深入", "缺少实际项目经验的深度描述"],
            "recommendations": ["深入学习分布式系统原理", "多做实际项目积累经验", "加强算法训练"],
        }


qwen_service = QwenService()
