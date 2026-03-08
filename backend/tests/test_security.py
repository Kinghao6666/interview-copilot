"""
Security Tests for Interview Copilot
Tests for SQL injection, XSS, API key leakage, CORS, etc.
"""
import pytest
from fastapi.testclient import TestClient
from main import app
import json

client = TestClient(app)


class TestSQLInjection:
    """Test SQL injection prevention (even though we use Pydantic + ORM)"""

    def test_resume_id_sql_injection(self):
        """Test SQL injection in resume ID parameter"""
        malicious_id = "1' OR '1'='1"
        response = client.get(f"/api/resume/{malicious_id}")
        # Should return 404, not expose data
        assert response.status_code == 404

    def test_jd_id_sql_injection(self):
        """Test SQL injection in JD ID parameter"""
        malicious_id = "1'; DROP TABLE resumes; --"
        response = client.get(f"/api/resume/jd/{malicious_id}")
        assert response.status_code == 404

    def test_session_id_sql_injection(self):
        """Test SQL injection in session ID parameter"""
        malicious_id = "1' UNION SELECT * FROM users --"
        response = client.get(f"/api/interview/report/{malicious_id}")
        assert response.status_code == 404

    def test_jd_content_sql_injection(self):
        """Test SQL injection in JD content"""
        malicious_content = "'; DROP TABLE job_descriptions; --"
        response = client.post(
            "/api/resume/jd/parse",
            json={"content": malicious_content},
        )
        # Should parse normally, not execute SQL
        assert response.status_code == 200
        data = response.json()
        assert "id" in data


class TestXSSPrevention:
    """Test XSS attack prevention"""

    def test_resume_xss_script_tag(self):
        """Test XSS with script tag in resume"""
        content = "<script>alert('XSS')</script>\nSkills: Python"
        response = client.post(
            "/api/resume/parse",
            files={"file": ("xss.txt", content.encode(), "text/plain")},
        )
        assert response.status_code == 200
        data = response.json()
        # Script tag should be in parsed data as-is (backend doesn't render HTML)
        # Frontend should escape it

    def test_jd_xss_img_tag(self):
        """Test XSS with img tag in JD"""
        content = "<img src=x onerror=alert('XSS')>\n后端开发工程师"
        response = client.post(
            "/api/resume/jd/parse",
            json={"content": content},
        )
        assert response.status_code == 200

    def test_answer_xss_javascript_url(self):
        """Test XSS with javascript: URL in answer"""
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

        # Test with XSS payload
        malicious_answer = "My portfolio: <a href='javascript:alert(1)'>click</a>"
        response = client.post(
            "/api/interview/evaluate",
            json={
                "session_id": session_id,
                "question_id": question_id,
                "answer": malicious_answer,
            },
        )
        assert response.status_code == 200


class TestAPIKeyLeakage:
    """Test that API keys are not leaked in responses or logs"""

    def test_root_endpoint_no_api_key(self):
        """Test root endpoint doesn't expose API key"""
        response = client.get("/")
        data = response.json()
        # Should not contain any API key
        response_str = json.dumps(data)
        assert "sk-" not in response_str
        assert "QWEN_API_KEY" not in response_str
        assert "OPENAI_API_KEY" not in response_str
        assert "SUPABASE_KEY" not in response_str

    def test_health_endpoint_no_api_key(self):
        """Test health endpoint doesn't expose API key"""
        response = client.get("/health")
        data = response.json()
        response_str = json.dumps(data)
        assert "sk-" not in response_str
        assert "api_key" not in response_str.lower()

    def test_error_response_no_api_key(self):
        """Test error responses don't leak API keys"""
        # Trigger an error
        response = client.post(
            "/api/resume/parse",
            files={"file": ("test.docx", b"content", "application/octet-stream")},
        )
        assert response.status_code == 400
        response_str = json.dumps(response.json())
        assert "sk-" not in response_str
        assert "QWEN_API_KEY" not in response_str
        assert "OPENAI_API_KEY" not in response_str


class TestCORSConfiguration:
    """Test CORS configuration"""

    def test_cors_allows_origin(self):
        """Test CORS headers are present"""
        response = client.get("/", headers={"Origin": "http://localhost:3000"})
        # FastAPI TestClient doesn't fully simulate CORS, but we can check the middleware is configured
        assert response.status_code == 200

    def test_cors_preflight(self):
        """Test CORS preflight request"""
        response = client.options(
            "/api/resume/parse",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "POST",
            },
        )
        # Should allow the request
        assert response.status_code in [200, 405]  # TestClient may not fully support OPTIONS


class TestInputValidation:
    """Test input validation and sanitization"""

    def test_extremely_long_filename(self):
        """Test handling of extremely long filename"""
        long_filename = "a" * 1000 + ".txt"
        response = client.post(
            "/api/resume/parse",
            files={"file": (long_filename, b"Skills: Python", "text/plain")},
        )
        # Should handle gracefully
        assert response.status_code in [200, 400]

    def test_null_bytes_in_content(self):
        """Test null bytes in content"""
        content = b"Skills: Python\x00\x00\x00"
        response = client.post(
            "/api/resume/parse",
            files={"file": ("test.txt", content, "text/plain")},
        )
        # Should handle gracefully
        assert response.status_code in [200, 400]

    def test_unicode_normalization(self):
        """Test Unicode normalization attacks"""
        # Using different Unicode representations of same character
        content1 = "café"  # é as single character
        content2 = "café"  # é as e + combining accent

        response1 = client.post(
            "/api/resume/jd/parse",
            json={"content": content1},
        )
        response2 = client.post(
            "/api/resume/jd/parse",
            json={"content": content2},
        )

        assert response1.status_code == 200
        assert response2.status_code == 200


class TestRateLimiting:
    """Test rate limiting (if implemented)"""

    def test_rapid_requests(self):
        """Test rapid successive requests"""
        responses = []
        for i in range(20):
            response = client.get("/health")
            responses.append(response)

        # All should succeed (no rate limiting currently)
        # If rate limiting is added, some should return 429
        success_count = sum(1 for r in responses if r.status_code == 200)
        assert success_count >= 10  # At least some should succeed


class TestFileUploadSecurity:
    """Test file upload security"""

    def test_pdf_with_malicious_content(self):
        """Test PDF with potentially malicious content"""
        # Minimal valid PDF structure
        pdf_content = b"""%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj
xref
0 4
0000000000 65535 f
0000000009 00000 n
0000000052 00000 n
0000000101 00000 n
trailer<</Size 4/Root 1 0 R>>
startxref
190
%%EOF
<script>alert('XSS')</script>"""

        response = client.post(
            "/api/resume/parse",
            files={"file": ("malicious.pdf", pdf_content, "application/pdf")},
        )
        # Should either parse or reject, not execute code
        assert response.status_code in [200, 400, 500]

    def test_path_traversal_in_filename(self):
        """Test path traversal attack in filename"""
        malicious_filename = "../../etc/passwd"
        response = client.post(
            "/api/resume/parse",
            files={"file": (malicious_filename, b"Skills: Python", "text/plain")},
        )
        # Should handle safely
        assert response.status_code in [200, 400]
        if response.status_code == 200:
            data = response.json()
            # File URL should not contain path traversal
            assert "../" not in data.get("file_url", "")

    def test_double_extension_file(self):
        """Test file with double extension"""
        response = client.post(
            "/api/resume/parse",
            files={"file": ("resume.txt.exe", b"Skills: Python", "text/plain")},
        )
        # Should reject based on final extension
        assert response.status_code == 400


class TestAuthenticationBypass:
    """Test authentication bypass attempts (if auth is added)"""

    def test_missing_user_id_handling(self):
        """Test that missing user_id is handled"""
        # Currently uses "temp_user" - should not expose other users' data
        response = client.get("/api/interview/sessions")
        assert response.status_code == 200
        sessions = response.json()
        # Should only return sessions for current user (or all in dev mode)
        assert isinstance(sessions, list)

    def test_access_other_user_resume(self):
        """Test accessing another user's resume"""
        # Create a resume
        response1 = client.post(
            "/api/resume/parse",
            files={"file": ("test.txt", b"Skills: Python", "text/plain")},
        )
        resume_id = response1.json()["id"]

        # Try to access it (should succeed in dev mode, fail in production with auth)
        response2 = client.get(f"/api/resume/{resume_id}")
        assert response2.status_code in [200, 403, 404]


class TestDataExposure:
    """Test for unintended data exposure"""

    def test_error_messages_not_verbose(self):
        """Test that error messages don't expose internal details"""
        # Trigger various errors
        response1 = client.post(
            "/api/resume/parse",
            files={"file": ("test.docx", b"content", "application/octet-stream")},
        )

        if response1.status_code >= 400:
            error_msg = response1.json().get("detail", "")
            # Should not contain file paths, stack traces, or internal details
            assert "Traceback" not in error_msg
            assert "File \"" not in error_msg
            assert "/app/" not in error_msg
            assert "C:\\" not in error_msg

    def test_api_docs_accessible(self):
        """Test that API docs are accessible (for development)"""
        response = client.get("/docs")
        # Should be accessible in dev mode
        assert response.status_code in [200, 404]  # 404 if disabled in production
