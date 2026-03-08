"""
Interview Copilot API Tests
Tests core endpoints using FastAPI TestClient (mock mode).
"""
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


class TestHealthEndpoints:
    def test_root(self):
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Interview Copilot API"
        assert "mock_mode" in data
        assert "database" in data

    def test_health(self):
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"


class TestResumeAPI:
    def test_parse_resume_txt(self):
        """Test resume parsing with a TXT file"""
        content = b"Zhang San\nEducation: BS Computer Science\nSkills: Python, Java, React, MySQL\nExperience: Backend intern at ByteDance"
        response = client.post(
            "/api/resume/parse",
            files={"file": ("resume.txt", content, "text/plain")},
        )
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "parsed_data" in data
        assert "skills" in data["parsed_data"]
        assert len(data["parsed_data"]["skills"]) > 0

    def test_parse_resume_invalid_format(self):
        """Test resume parsing with unsupported file format"""
        response = client.post(
            "/api/resume/parse",
            files={"file": ("resume.docx", b"content", "application/octet-stream")},
        )
        assert response.status_code == 400

    def test_parse_resume_empty_file(self):
        """Test resume parsing with empty file"""
        response = client.post(
            "/api/resume/parse",
            files={"file": ("resume.txt", b"", "text/plain")},
        )
        assert response.status_code == 400

    def test_parse_resume_invalid_pdf(self):
        """Test resume parsing with malformed PDF content"""
        response = client.post(
            "/api/resume/parse",
            files={"file": ("resume.pdf", b"not-a-real-pdf", "application/pdf")},
        )
        assert response.status_code == 400

    def test_parse_resume_invalid_text_encoding(self):
        """Test resume parsing with unsupported TXT encoding bytes"""
        response = client.post(
            "/api/resume/parse",
            files={"file": ("resume.txt", b"\xff\xfe\xff\xfe", "text/plain")},
        )
        assert response.status_code == 400

    def test_get_resume_not_found(self):
        """Test getting a non-existent resume"""
        response = client.get("/api/resume/nonexistent-id")
        assert response.status_code == 404


class TestJDAPI:
    def test_parse_jd(self):
        """Test JD parsing"""
        response = client.post(
            "/api/resume/jd/parse",
            json={"content": "后端开发工程师\n要求：熟悉 Python、MySQL、Redis、Linux"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "parsed_data" in data
        assert "skills_required" in data["parsed_data"]

    def test_parse_jd_empty(self):
        """Test JD parsing with empty content"""
        response = client.post(
            "/api/resume/jd/parse",
            json={"content": ""},
        )
        assert response.status_code == 400

    def test_get_jd_not_found(self):
        """Test getting a non-existent JD"""
        response = client.get("/api/resume/jd/nonexistent-id")
        assert response.status_code == 404

    def test_parse_cpp_jd_extracts_cpp_focus(self):
        """Test C++ JD parsing keeps the position and key skills."""
        response = client.post(
            "/api/resume/jd/parse",
            json={"content": "C++开发工程师\n要求：熟悉 C++、STL、Linux、数据结构、操作系统"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["parsed_data"]["position"].startswith("C++开发工程师")
        assert "C++" in data["parsed_data"]["skills_required"]


class TestInterviewAPI:
    @pytest.fixture(autouse=True)
    def setup(self):
        """Create resume and JD for interview tests"""
        # Parse resume
        resume_resp = client.post(
            "/api/resume/parse",
            files={"file": ("test.txt", b"Skills: Python, C++, MySQL, Linux", "text/plain")},
        )
        self.resume_id = resume_resp.json()["id"]

        # Parse JD
        jd_resp = client.post(
            "/api/resume/jd/parse",
            json={"content": "后端开发工程师，要求 Python、MySQL"},
        )
        self.jd_id = jd_resp.json()["id"]

    def test_generate_interview(self):
        """Test interview generation"""
        response = client.post(
            "/api/interview/generate",
            json={"resume_id": self.resume_id, "jd_id": self.jd_id},
        )
        assert response.status_code == 200
        data = response.json()
        assert "session_id" in data
        assert "questions" in data
        assert len(data["questions"]) > 0

        # Verify question structure
        q = data["questions"][0]
        assert "id" in q
        assert "type" in q
        assert "content" in q
        assert "difficulty" in q

        skill_categories = {
            item["category"]
            for item in data["questions"]
            if item["type"] == "skill_test"
        }
        assert "Python" in skill_categories
        assert "数据库" in skill_categories

    def test_generate_cpp_interview_prioritizes_cpp(self):
        """Test C++ JD prioritizes C++ questions over Python defaults."""
        resume_resp = client.post(
            "/api/resume/parse",
            files={"file": ("cpp.txt", "Skills: C++, Linux, STL".encode("utf-8"), "text/plain")},
        )
        resume_id = resume_resp.json()["id"]

        jd_resp = client.post(
            "/api/resume/jd/parse",
            json={"content": "C++ backend engineer\nrequirements: C++, STL, Linux"},
        )
        jd_id = jd_resp.json()["id"]

        response = client.post(
            "/api/interview/generate",
            json={"resume_id": resume_id, "jd_id": jd_id},
        )
        assert response.status_code == 200
        data = response.json()

        skill_categories = [
            item["category"]
            for item in data["questions"]
            if item["type"] == "skill_test"
        ]

        assert skill_categories
        assert skill_categories[0] == "C++"
        assert "C++" in skill_categories
        assert "Python" not in set(skill_categories)

    def test_generate_python_interview_does_not_mix_languages(self):
        """Test Python JD keeps Python questions and excludes Java/C++."""
        resume_resp = client.post(
            "/api/resume/parse",
            files={"file": ("python.txt", "Skills: Python, Java, C++, FastAPI, MySQL, Linux".encode("utf-8"), "text/plain")},
        )
        resume_id = resume_resp.json()["id"]

        jd_resp = client.post(
            "/api/resume/jd/parse",
            json={"content": "py backend engineer\nrequirements: py, FastAPI, MySQL, Linux"},
        )
        jd_id = jd_resp.json()["id"]

        response = client.post(
            "/api/interview/generate",
            json={"resume_id": resume_id, "jd_id": jd_id},
        )
        assert response.status_code == 200
        data = response.json()

        skill_categories = [
            item["category"]
            for item in data["questions"]
            if item["type"] == "skill_test"
        ]

        assert skill_categories
        assert skill_categories[0] == "Python"
        assert "Python" in skill_categories
        assert "Java" not in set(skill_categories)
        assert "C++" not in set(skill_categories)

    def test_generate_java_interview_does_not_mix_languages(self):
        """Test Java JD keeps Java questions and excludes Python/C++."""
        resume_resp = client.post(
            "/api/resume/parse",
            files={"file": ("java.txt", "Skills: Java, Python, Spring, MySQL".encode("utf-8"), "text/plain")},
        )
        resume_id = resume_resp.json()["id"]

        jd_resp = client.post(
            "/api/resume/jd/parse",
            json={"content": "Java backend engineer\nrequirements: Java, Spring, MySQL"},
        )
        jd_id = jd_resp.json()["id"]

        response = client.post(
            "/api/interview/generate",
            json={"resume_id": resume_id, "jd_id": jd_id},
        )
        assert response.status_code == 200
        data = response.json()

        skill_categories = [
            item["category"]
            for item in data["questions"]
            if item["type"] == "skill_test"
        ]

        assert skill_categories
        assert skill_categories[0] == "Java"
        assert "Java" in skill_categories
        assert "Python" not in set(skill_categories)
        assert "C++" not in set(skill_categories)

    def test_generate_go_interview_does_not_mix_languages(self):
        """Test Go JD keeps Go questions and excludes Python/Java/C++."""
        resume_resp = client.post(
            "/api/resume/parse",
            files={"file": ("go.txt", "Skills: Go, Python, Java, Gin, MySQL, Linux".encode("utf-8"), "text/plain")},
        )
        resume_id = resume_resp.json()["id"]

        jd_resp = client.post(
            "/api/resume/jd/parse",
            json={"content": "Go backend engineer\nrequirements: Go, Gin, MySQL, Linux, goroutine"},
        )
        jd_id = jd_resp.json()["id"]

        response = client.post(
            "/api/interview/generate",
            json={"resume_id": resume_id, "jd_id": jd_id},
        )
        assert response.status_code == 200
        data = response.json()

        skill_categories = [
            item["category"]
            for item in data["questions"]
            if item["type"] == "skill_test"
        ]

        assert skill_categories
        assert skill_categories[0] == "Go"
        assert "Go" in skill_categories
        assert "Python" not in set(skill_categories)
        assert "Java" not in set(skill_categories)
        assert "C++" not in set(skill_categories)

    def test_generate_javascript_interview_does_not_mix_languages(self):
        """Test JavaScript JD keeps JavaScript questions and excludes Python/Java/C++."""
        resume_resp = client.post(
            "/api/resume/parse",
            files={"file": ("js.txt", "Skills: JavaScript, Python, Java, Node.js, Express, React".encode("utf-8"), "text/plain")},
        )
        resume_id = resume_resp.json()["id"]

        jd_resp = client.post(
            "/api/resume/jd/parse",
            json={"content": "js frontend engineer\nrequirements: js, Node.js, Express, React"},
        )
        jd_id = jd_resp.json()["id"]

        response = client.post(
            "/api/interview/generate",
            json={"resume_id": resume_id, "jd_id": jd_id},
        )
        assert response.status_code == 200
        data = response.json()

        skill_categories = [
            item["category"]
            for item in data["questions"]
            if item["type"] == "skill_test"
        ]

        assert skill_categories
        assert skill_categories[0] == "JavaScript"
        assert "JavaScript" in skill_categories
        assert "Python" not in set(skill_categories)
        assert "Java" not in set(skill_categories)
        assert "C++" not in set(skill_categories)

    def test_evaluate_answer(self):
        """Test answer evaluation"""
        # Generate interview first
        gen_resp = client.post(
            "/api/interview/generate",
            json={"resume_id": self.resume_id, "jd_id": self.jd_id},
        )
        session_id = gen_resp.json()["session_id"]
        question_id = gen_resp.json()["questions"][0]["id"]

        # Evaluate answer
        response = client.post(
            "/api/interview/evaluate",
            json={
                "session_id": session_id,
                "question_id": question_id,
                "answer": "我叫张三，本科毕业于清华大学计算机系，擅长 Python 和后端开发。",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "score" in data
        assert 0 <= data["score"] <= 100
        assert "feedback" in data
        assert "strengths" in data
        assert "improvements" in data

    def test_get_session_detail(self):
        """Test fetching a session for interview state recovery."""
        gen_resp = client.post(
            "/api/interview/generate",
            json={"resume_id": self.resume_id, "jd_id": self.jd_id},
        )
        session = gen_resp.json()
        session_id = session["session_id"]
        question_id = session["questions"][0]["id"]

        client.post(
            "/api/interview/evaluate",
            json={
                "session_id": session_id,
                "question_id": question_id,
                "answer": "first answer",
            },
        )

        response = client.get(f"/api/interview/session/{session_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == session_id
        assert len(data["questions"]) == len(session["questions"])
        assert len(data["answers"]) == 1
        assert data["answers"][0]["question_id"] == question_id
        assert data["answers"][0]["answer"] == "first answer"
        assert "resume_data" in data
        assert "jd_data" in data

    def test_duplicate_question_submission_overwrites_previous_answer(self):
        """Test repeated submissions for the same question stay idempotent."""
        gen_resp = client.post(
            "/api/interview/generate",
            json={"resume_id": self.resume_id, "jd_id": self.jd_id},
        )
        session_id = gen_resp.json()["session_id"]
        question_id = gen_resp.json()["questions"][0]["id"]

        first_response = client.post(
            "/api/interview/evaluate",
            json={
                "session_id": session_id,
                "question_id": question_id,
                "answer": "first answer",
            },
        )
        second_response = client.post(
            "/api/interview/evaluate",
            json={
                "session_id": session_id,
                "question_id": question_id,
                "answer": "updated answer",
            },
        )

        assert first_response.status_code == 200
        assert second_response.status_code == 200

        session_response = client.get(f"/api/interview/session/{session_id}")
        assert session_response.status_code == 200
        session_data = session_response.json()
        assert len(session_data["answers"]) == 1
        assert session_data["answers"][0]["answer"] == "updated answer"
        assert "strengths" in session_data["answers"][0]
        assert "improvements" in session_data["answers"][0]

    def test_evaluate_empty_answer(self):
        """Test evaluation with empty answer"""
        gen_resp = client.post(
            "/api/interview/generate",
            json={"resume_id": self.resume_id, "jd_id": self.jd_id},
        )
        session_id = gen_resp.json()["session_id"]
        question_id = gen_resp.json()["questions"][0]["id"]

        response = client.post(
            "/api/interview/evaluate",
            json={
                "session_id": session_id,
                "question_id": question_id,
                "answer": "  ",
            },
        )
        assert response.status_code == 400

    def test_evaluate_invalid_session(self):
        """Test evaluation with invalid session"""
        response = client.post(
            "/api/interview/evaluate",
            json={
                "session_id": "nonexistent",
                "question_id": "q1",
                "answer": "test",
            },
        )
        assert response.status_code == 404

    def test_get_report(self):
        """Test report generation"""
        # Generate interview and answer all questions
        gen_resp = client.post(
            "/api/interview/generate",
            json={"resume_id": self.resume_id, "jd_id": self.jd_id},
        )
        session_id = gen_resp.json()["session_id"]

        for q in gen_resp.json()["questions"]:
            client.post(
                "/api/interview/evaluate",
                json={
                    "session_id": session_id,
                    "question_id": q["id"],
                    "answer": "这是我的回答，包含了关键知识点和实际应用场景。",
                },
            )

        # Get report
        response = client.get(f"/api/interview/report/{session_id}")
        assert response.status_code == 200
        data = response.json()
        assert "overall_score" in data
        assert "section_scores" in data
        assert "strengths" in data
        assert "weaknesses" in data
        assert "recommendations" in data

    def test_get_report_requires_completed_session(self):
        """Test report generation is blocked until all questions are answered."""
        gen_resp = client.post(
            "/api/interview/generate",
            json={"resume_id": self.resume_id, "jd_id": self.jd_id},
        )
        session_id = gen_resp.json()["session_id"]
        question_id = gen_resp.json()["questions"][0]["id"]

        eval_resp = client.post(
            "/api/interview/evaluate",
            json={
                "session_id": session_id,
                "question_id": question_id,
                "answer": "partial answer",
            },
        )
        assert eval_resp.status_code == 200

        response = client.get(f"/api/interview/report/{session_id}")
        assert response.status_code == 409

    def test_get_report_not_found(self):
        """Test report for non-existent session"""
        response = client.get("/api/interview/report/nonexistent")
        assert response.status_code == 404

    def test_list_sessions(self):
        """Test listing sessions"""
        # Generate at least one session
        client.post(
            "/api/interview/generate",
            json={"resume_id": self.resume_id, "jd_id": self.jd_id},
        )

        response = client.get("/api/interview/sessions")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        assert "id" in data[0]
        assert "status" in data[0]
        assert "question_count" in data[0]
        assert "created_at" in data[0]


class TestFullFlow:
    def test_complete_interview_flow(self):
        """End-to-end test: upload → generate → answer → report"""
        # 1. Parse resume
        resume_resp = client.post(
            "/api/resume/parse",
            files={"file": ("cv.txt", b"Zhang San\nSkills: Python, Java, MySQL, Docker, Linux\nExperience: Backend developer", "text/plain")},
        )
        assert resume_resp.status_code == 200
        resume_id = resume_resp.json()["id"]

        # 2. Parse JD
        jd_resp = client.post(
            "/api/resume/jd/parse",
            json={"content": "后端开发工程师\n要求：Python、MySQL、Redis、Docker"},
        )
        assert jd_resp.status_code == 200
        jd_id = jd_resp.json()["id"]

        # 3. Generate interview
        gen_resp = client.post(
            "/api/interview/generate",
            json={"resume_id": resume_id, "jd_id": jd_id},
        )
        assert gen_resp.status_code == 200
        session_id = gen_resp.json()["session_id"]
        questions = gen_resp.json()["questions"]
        assert len(questions) >= 4  # At least: intro + some skills + scenario + reverse

        # 4. Answer all questions
        for q in questions:
            eval_resp = client.post(
                "/api/interview/evaluate",
                json={
                    "session_id": session_id,
                    "question_id": q["id"],
                    "answer": f"关于{q['category']}，我的理解是这样的：首先需要理解核心概念，然后结合实际应用场景进行分析。",
                },
            )
            assert eval_resp.status_code == 200
            assert eval_resp.json()["score"] >= 0

        # 5. Get report
        report_resp = client.get(f"/api/interview/report/{session_id}")
        assert report_resp.status_code == 200
        report = report_resp.json()
        assert report["overall_score"] >= 0
        assert len(report["strengths"]) > 0
        assert len(report["recommendations"]) > 0

        # 6. Verify session in history
        sessions_resp = client.get("/api/interview/sessions")
        assert sessions_resp.status_code == 200
        sessions = sessions_resp.json()
        session_ids = [s["id"] for s in sessions]
        assert session_id in session_ids

        current_session = next(s for s in sessions if s["id"] == session_id)
        assert current_session["overall_score"] == report["overall_score"]
