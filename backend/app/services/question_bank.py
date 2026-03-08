"""
题库加载服务
从 JSON 文件加载题库数据
"""

import json
from pathlib import Path
from typing import Dict, List, Optional
from app.schemas import Question

class QuestionBankService:
    def __init__(self):
        self.question_bank = self._load_question_bank()

    def _load_question_bank(self) -> Dict:
        """从 JSON 文件加载题库"""
        # data/ is at project root (one level above backend/)
        json_path = Path(__file__).parent.parent.parent.parent / "data" / "question_bank.json"
        with open(json_path, "r", encoding="utf-8") as f:
            return json.load(f)

    def get_self_intro_question(self) -> Question:
        """获取自我介绍题目"""
        data = self.question_bank["self_intro"]
        return Question(**data)

    def get_skill_questions(self, skill: str, count: int = 3) -> List[Question]:
        """获取指定技能的题目"""
        questions = self.question_bank["skill_tests"].get(skill, [])
        if not questions:
            return []

        import random
        selected = random.sample(questions, min(count, len(questions)))
        return [Question(**q) for q in selected]

    def get_scenario_questions(self, count: int = 2, preferred_tags: Optional[List[str]] = None) -> List[Question]:
        """获取场景题"""
        questions = self.question_bank["scenario_questions"]
        import random

        selected = []
        remaining = questions
        if preferred_tags:
            normalized_tags = {tag.lower() for tag in preferred_tags if tag}
            prioritized = [
                question
                for question in questions
                if any(
                    tag.lower() in normalized_tags
                    for tag in question.get("tags", []) + [question.get("category", "")]
                )
            ]
            if prioritized:
                selected.extend(random.sample(prioritized, min(count, len(prioritized))))
                selected_ids = {question["id"] for question in selected}
                remaining = [question for question in questions if question["id"] not in selected_ids]

        if len(selected) < count and remaining:
            selected.extend(random.sample(remaining, min(count - len(selected), len(remaining))))

        return [Question(**q) for q in selected]

    def get_reverse_question(self) -> Question:
        """获取反问环节题目"""
        data = self.question_bank.get("reverse_questions")
        if data:
            return Question(**data)
        return None

    def get_available_skills(self) -> List[str]:
        """获取所有可用的技能列表"""
        return list(self.question_bank["skill_tests"].keys())

question_bank_service = QuestionBankService()
