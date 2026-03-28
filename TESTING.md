# Interview Copilot - API 测试指南

## 快速测试

### 1. 启动后端服务

```bash
cd backend
python run.py
```

访问 API 文档：http://localhost:8000/docs

---

## API 测试用例

### 1. 健康检查

```bash
curl http://localhost:8000/health
```

**预期响应：**
```json
{"status": "ok"}
```

---

### 2. 简历解析

**准备测试文件：** `test_resume.txt`

```
张三
教育背景：本科 - 清华大学 - 计算机科学与技术
技能：Python, FastAPI, React, MySQL, Docker
实习经历：2023.06-2023.09 字节跳动 后端开发实习生
项目经历：在线教育平台、电商推荐系统
```

**测试命令：**
```bash
curl -X POST "http://localhost:8000/api/resume/parse" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@test_resume.txt"
```

**预期响应：**
```json
{
  "id": "uuid",
  "user_id": "temp_user",
  "file_url": "r2://resumes/test_resume.txt",
  "parsed_data": {
    "name": "张三",
    "education": "本科 - 清华大学 - 计算机科学与技术",
    "skills": ["Python", "FastAPI", "React", "MySQL", "Docker"],
    "experience": ["2023.06-2023.09 字节跳动 后端开发实习生"],
    "projects": ["在线教育平台", "电商推荐系统"]
  },
  "created_at": "2026-03-04T10:00:00Z"
}
```

---

### 3. 生成面试题

**测试命令：**
```bash
curl -X POST "http://localhost:8000/api/interview/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "resume_id": "test-resume-id",
    "jd_id": "test-jd-id"
  }'
```

**预期响应：**
```json
{
  "session_id": "uuid",
  "questions": [
    {
      "id": "q_self_intro_001",
      "type": "self_intro",
      "category": "自我介绍",
      "content": "请做一个 3 分钟的自我介绍...",
      "difficulty": "easy",
      "time_limit": 180,
      "tags": ["自我介绍"]
    },
    {
      "id": "q_python_001",
      "type": "skill_test",
      "category": "Python",
      "content": "请解释 Python 中的 GIL...",
      "difficulty": "medium",
      "time_limit": 300,
      "reference_answer": "GIL 是...",
      "tags": ["Python", "并发"]
    }
  ]
}
```

---

### 4. 评估答案

**测试命令：**
```bash
curl -X POST "http://localhost:8000/api/interview/evaluate" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "your-session-id",
    "question_id": "q_python_001",
    "answer": "GIL 是 Python 解释器中的全局解释器锁，它确保同一时刻只有一个线程执行 Python 字节码。这意味着即使在多核 CPU 上，Python 多线程程序也无法真正并行执行 CPU 密集型任务。对于 I/O 密集型任务影响较小，因为线程在等待 I/O 时会释放 GIL。"
  }'
```

**预期响应：**
```json
{
  "score": 85,
  "feedback": "回答准确，对 GIL 的理解正确，解释了对多线程的影响。建议补充解决方案（如使用多进程）。",
  "strengths": [
    "技术理解准确",
    "表达清晰有条理"
  ],
  "improvements": [
    "可以补充 GIL 的解决方案",
    "可以举例说明实际应用场景"
  ]
}
```

---

### 5. 生成报告

**测试命令：**
```bash
curl -X GET "http://localhost:8000/api/interview/report/your-session-id"
```

**预期响应：**
```json
{
  "id": "uuid",
  "session_id": "your-session-id",
  "overall_score": 82,
  "section_scores": {
    "self_intro": 85,
    "skill_test": 78,
    "scenario": 82,
    "reverse": 90
  },
  "strengths": [
    "技术基础扎实",
    "表达清晰流畅",
    "思路有条理"
  ],
  "weaknesses": [
    "对分布式系统理解不够深入",
    "缺少实际项目经验"
  ],
  "recommendations": [
    "深入学习分布式系统原理",
    "多做实际项目积累经验",
    "加强算法训练"
  ],
  "created_at": "2026-03-04T11:00:00Z"
}
```

---

## Python 测试脚本

创建 `test_api.py`：

```python
import requests
import json

BASE_URL = "http://localhost:8000"

def test_health():
    """测试健康检查"""
    response = requests.get(f"{BASE_URL}/health")
    print("Health Check:", response.json())
    assert response.status_code == 200

def test_resume_parse():
    """测试简历解析"""
    # 创建测试文件
    with open("test_resume.txt", "w", encoding="utf-8") as f:
        f.write("""
张三
教育背景：本科 - 清华大学 - 计算机科学与技术
技能：Python, FastAPI, React, MySQL, Docker
实习经历：2023.06-2023.09 字节跳动 后端开发实习生
项目经历：在线教育平台、电商推荐系统
        """)

    # 上传文件
    with open("test_resume.txt", "rb") as f:
        files = {"file": f}
        response = requests.post(f"{BASE_URL}/api/resume/parse", files=files)

    print("Resume Parse:", json.dumps(response.json(), indent=2, ensure_ascii=False))
    assert response.status_code == 200

def test_interview_generate():
    """测试生成面试题"""
    data = {
        "resume_id": "test-resume-id",
        "jd_id": "test-jd-id"
    }
    response = requests.post(f"{BASE_URL}/api/interview/generate", json=data)
    result = response.json()
    print("Interview Generate:", json.dumps(result, indent=2, ensure_ascii=False))
    assert response.status_code == 200
    return result["session_id"]

def test_evaluate_answer(session_id):
    """测试评估答案"""
    data = {
        "session_id": session_id,
        "question_id": "q_python_001",
        "answer": "GIL 是 Python 解释器中的全局解释器锁..."
    }
    response = requests.post(f"{BASE_URL}/api/interview/evaluate", json=data)
    print("Evaluate Answer:", json.dumps(response.json(), indent=2, ensure_ascii=False))
    assert response.status_code == 200

def test_get_report(session_id):
    """测试生成报告"""
    response = requests.get(f"{BASE_URL}/api/interview/report/{session_id}")
    print("Interview Report:", json.dumps(response.json(), indent=2, ensure_ascii=False))
    assert response.status_code == 200

if __name__ == "__main__":
    print("=== 开始测试 ===\n")

    print("1. 测试健康检查")
    test_health()
    print()

    print("2. 测试简历解析")
    test_resume_parse()
    print()

    print("3. 测试生成面试题")
    session_id = test_interview_generate()
    print()

    print("4. 测试评估答案")
    test_evaluate_answer(session_id)
    print()

    print("5. 测试生成报告")
    test_get_report(session_id)
    print()

    print("=== 测试完成 ===")
```

**运行测试：**
```bash
pip install requests
python test_api.py
```

---

## 前端测试

### 1. 启动前端

```bash
cd frontend
npm run dev
```

访问：http://localhost:3000

### 2. 测试页面

- 首页加载
- 黑金配色显示
- API 连接测试

---

## 性能测试

### 使用 Apache Bench

```bash
# 测试健康检查接口
ab -n 1000 -c 10 http://localhost:8000/health

# 测试面试题生成接口
ab -n 100 -c 5 -p generate.json -T application/json http://localhost:8000/api/interview/generate
```

### 使用 wrk

```bash
# 安装 wrk
# macOS: brew install wrk
# Linux: apt-get install wrk

# 测试
wrk -t4 -c100 -d30s http://localhost:8000/health
```

---

## 常见问题

### Q: OpenAI GPT-5.3-codex 调用失败

**A:** 检查以下几点：
1. API Key 是否正确
2. 账户余额是否充足
3. 网络连接是否正常
4. API 调用频率是否超限

### Q: 简历解析返回空数据

**A:** 检查以下几点：
1. 简历文件格式是否正确（PDF/TXT）
2. 简历内容是否包含必要信息
3. OpenAI GPT-5.3-codex 响应是否正常

### Q: 题库加载失败

**A:** 检查以下几点：
1. `data/question_bank.json` 文件是否存在
2. JSON 格式是否正确
3. 文件路径是否正确

---

**文档作者：** Fullstack Developer (DHH)
**创建时间：** 2026-03-04
**版本：** v0.1.0
