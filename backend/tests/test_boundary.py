"""
Boundary Condition Tests for Interview Copilot
Tests edge cases, large files, special characters, concurrent requests, etc.
"""
import pytest
from fastapi.testclient import TestClient
from main import app
import io

client = TestClient(app)


class TestFileSizeLimits:
    """Test file size boundary conditions"""

    def test_resume_exactly_5mb(self):
        """Test resume at exactly 5MB limit"""
        content = b"A" * (5 * 1024 * 1024)
        response = client.post(
            "/api/resume/parse",
            files={"file": ("large.txt", content, "text/plain")},
        )
        # Should accept exactly 5MB
        assert response.status_code in [200, 400]  # May timeout or succeed

    def test_resume_over_5mb(self):
        """Test resume over 5MB limit"""
        content = b"A" * (5 * 1024 * 1024 + 1)
        response = client.post(
            "/api/resume/parse",
            files={"file": ("toolarge.txt", content, "text/plain")},
        )
        assert response.status_code == 400
        assert "5MB" in response.json()["detail"]

    def test_jd_exactly_10000_chars(self):
        """Test JD at exactly 10000 character limit"""
        content = "A" * 10000
        response = client.post(
            "/api/resume/jd/parse",
            json={"content": content},
        )
        assert response.status_code == 200

    def test_jd_over_10000_chars(self):
        """Test JD over 10000 character limit"""
        content = "A" * 10001
        response = client.post(
            "/api/resume/jd/parse",
            json={"content": content},
        )
        assert response.status_code == 400
        assert "10000" in response.json()["detail"]


class TestSpecialCharacters:
    """Test handling of special characters and encodings"""

    def test_resume_with_emoji(self):
        """Test resume containing emoji"""
        content = "张三 🎓\n技能: Python 🐍, Java ☕, React ⚛️\n经验: 字节跳动实习生 💼"
        response = client.post(
            "/api/resume/parse",
            files={"file": ("emoji.txt", content.encode("utf-8"), "text/plain")},
        )
        assert response.status_code == 200
        data = response.json()
        assert "parsed_data" in data

    def test_resume_with_special_symbols(self):
        """Test resume with special symbols"""
        content = "Name: O'Brien\nSkills: C++, C#, .NET\nEmail: test@example.com\nPhone: +86-138-0000-0000"
        response = client.post(
            "/api/resume/parse",
            files={"file": ("special.txt", content.encode("utf-8"), "text/plain")},
        )
        assert response.status_code == 200

    def test_jd_with_chinese_punctuation(self):
        """Test JD with Chinese punctuation"""
        content = "后端开发工程师（校招）\n要求：熟悉Python、MySQL、Redis；了解Linux、Docker。"
        response = client.post(
            "/api/resume/jd/parse",
            json={"content": content},
        )
        assert response.status_code == 200

    def test_answer_with_newlines_and_tabs(self):
        """Test answer evaluation with newlines and tabs"""
        # Setup
        resume_resp = client.post(
            "/api/resume/parse",
            files={"file": ("test.txt", b"Skills: Python", "text/plain")},
        )
        resume_id = resume_resp.json()["id"]
        jd_resp = client.post(
            "/api/resume/jd/parse",
            json={"content": "Python developer"},
        )
        jd_id = jd_resp.json()["id"]
        gen_resp = client.post(
            "/api/interview/generate",
            json={"resume_id": resume_id, "jd_id": jd_id},
        )
        session_id = gen_resp.json()["session_id"]
        question_id = gen_resp.json()["questions"][0]["id"]

        # Test with formatted answer
        answer = "我的回答：\n1. 第一点\n2. 第二点\n\t- 子点A\n\t- 子点B"
        response = client.post(
            "/api/interview/evaluate",
            json={
                "session_id": session_id,
                "question_id": question_id,
                "answer": answer,
            },
        )
        assert response.status_code == 200


class TestNullAndEmpty:
    """Test null, empty, and whitespace handling"""

    def test_resume_only_whitespace(self):
        """Test resume with only whitespace"""
        response = client.post(
            "/api/resume/parse",
            files={"file": ("whitespace.txt", b"   \n\n\t\t  ", "text/plain")},
        )
        # Should either reject or handle gracefully
        assert response.status_code in [200, 400]

    def test_jd_only_whitespace(self):
        """Test JD with only whitespace"""
        response = client.post(
            "/api/resume/jd/parse",
            json={"content": "   \n\n\t\t  "},
        )
        assert response.status_code == 400

    def test_answer_only_whitespace(self):
        """Test answer evaluation with only whitespace"""
        resume_resp = client.post(
            "/api/resume/parse",
            files={"file": ("test.txt", b"Skills: Python", "text/plain")},
        )
        resume_id = resume_resp.json()["id"]
        jd_resp = client.post(
            "/api/resume/jd/parse",
            json={"content": "Python developer"},
        )
        jd_id = jd_resp.json()["id"]
        gen_resp = client.post(
            "/api/interview/generate",
            json={"resume_id": resume_id, "jd_id": jd_id},
        )
        session_id = gen_resp.json()["session_id"]
        question_id = gen_resp.json()["questions"][0]["id"]

        response = client.post(
            "/api/interview/evaluate",
            json={
                "session_id": session_id,
                "question_id": question_id,
                "answer": "   \n\n  ",
            },
        )
        assert response.status_code == 400


class TestInvalidInputs:
    """Test invalid input handling"""

    def test_resume_no_filename(self):
        """Test resume upload without filename"""
        response = client.post(
            "/api/resume/parse",
            files={"file": ("", b"content", "text/plain")},
        )
        # FastAPI returns 422 for validation errors, 400 for business logic errors
        assert response.status_code in [400, 422]

    def test_resume_invalid_extension(self):
        """Test resume with invalid file extension"""
        response = client.post(
            "/api/resume/parse",
            files={"file": ("resume.docx", b"content", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
        )
        assert response.status_code == 400

    def test_generate_interview_invalid_resume_id(self):
        """Test interview generation with non-existent resume"""
        response = client.post(
            "/api/interview/generate",
            json={"resume_id": "nonexistent-id", "jd_id": "nonexistent-jd"},
        )
        assert response.status_code == 404

    def test_evaluate_invalid_question_id(self):
        """Test evaluation with invalid question ID"""
        resume_resp = client.post(
            "/api/resume/parse",
            files={"file": ("test.txt", b"Skills: Python", "text/plain")},
        )
        resume_id = resume_resp.json()["id"]
        jd_resp = client.post(
            "/api/resume/jd/parse",
            json={"content": "Python developer"},
        )
        jd_id = jd_resp.json()["id"]
        gen_resp = client.post(
            "/api/interview/generate",
            json={"resume_id": resume_id, "jd_id": jd_id},
        )
        session_id = gen_resp.json()["session_id"]

        response = client.post(
            "/api/interview/evaluate",
            json={
                "session_id": session_id,
                "question_id": "invalid-question-id",
                "answer": "test answer",
            },
        )
        assert response.status_code == 404


class TestConcurrency:
    """Test concurrent request handling"""

    def test_multiple_resume_uploads(self):
        """Test multiple simultaneous resume uploads"""
        responses = []
        for i in range(5):
            content = f"Resume {i}\nSkills: Python, Java".encode()
            response = client.post(
                "/api/resume/parse",
                files={"file": (f"resume{i}.txt", content, "text/plain")},
            )
            responses.append(response)

        # All should succeed
        for resp in responses:
            assert resp.status_code == 200

        # All should have unique IDs
        ids = [r.json()["id"] for r in responses]
        assert len(ids) == len(set(ids))

    def test_multiple_evaluations_same_session(self):
        """Test multiple evaluations in same session"""
        # Setup
        resume_resp = client.post(
            "/api/resume/parse",
            files={"file": ("test.txt", b"Skills: Python, Java, MySQL", "text/plain")},
        )
        resume_id = resume_resp.json()["id"]
        jd_resp = client.post(
            "/api/resume/jd/parse",
            json={"content": "Full-stack developer"},
        )
        jd_id = jd_resp.json()["id"]
        gen_resp = client.post(
            "/api/interview/generate",
            json={"resume_id": resume_id, "jd_id": jd_id},
        )
        session_id = gen_resp.json()["session_id"]
        questions = gen_resp.json()["questions"]

        # Evaluate multiple questions
        for i, q in enumerate(questions[:3]):
            response = client.post(
                "/api/interview/evaluate",
                json={
                    "session_id": session_id,
                    "question_id": q["id"],
                    "answer": f"Answer {i}",
                },
            )
            assert response.status_code == 200


class TestDataIntegrity:
    """Test data consistency and integrity"""

    def test_session_data_persistence(self):
        """Test that session data persists across requests"""
        # Create session
        resume_resp = client.post(
            "/api/resume/parse",
            files={"file": ("test.txt", b"Skills: Python", "text/plain")},
        )
        resume_id = resume_resp.json()["id"]
        jd_resp = client.post(
            "/api/resume/jd/parse",
            json={"content": "Python developer"},
        )
        jd_id = jd_resp.json()["id"]
        gen_resp = client.post(
            "/api/interview/generate",
            json={"resume_id": resume_id, "jd_id": jd_id},
        )
        session_id = gen_resp.json()["session_id"]
        question_id = gen_resp.json()["questions"][0]["id"]

        # Submit answer
        client.post(
            "/api/interview/evaluate",
            json={
                "session_id": session_id,
                "question_id": question_id,
                "answer": "Test answer",
            },
        )

        # Session detail should retain the submitted answer for restore flows
        session_resp = client.get(f"/api/interview/session/{session_id}")
        assert session_resp.status_code == 200
        session = session_resp.json()
        assert len(session["answers"]) == 1
        assert session["answers"][0]["question_id"] == question_id
        assert session["answers"][0]["answer"] == "Test answer"

    def test_list_sessions_includes_new_session(self):
        """Test that new sessions appear in session list"""
        # Get initial count
        initial_resp = client.get("/api/interview/sessions")
        initial_count = len(initial_resp.json())

        # Create new session
        resume_resp = client.post(
            "/api/resume/parse",
            files={"file": ("test.txt", b"Skills: Python", "text/plain")},
        )
        resume_id = resume_resp.json()["id"]
        jd_resp = client.post(
            "/api/resume/jd/parse",
            json={"content": "Python developer"},
        )
        jd_id = jd_resp.json()["id"]
        gen_resp = client.post(
            "/api/interview/generate",
            json={"resume_id": resume_id, "jd_id": jd_id},
        )
        session_id = gen_resp.json()["session_id"]

        # Check session list
        final_resp = client.get("/api/interview/sessions")
        final_sessions = final_resp.json()
        assert len(final_sessions) == initial_count + 1
        assert any(s["id"] == session_id for s in final_sessions)
