# Phase 1 架构设计与实现

## 项目概述

**项目名称：** Interview Copilot - AI 校招面试助手

**定位：** 帮助本科生校招求职者通过 AI 模拟面试提升面试表现，快速定位薄弱环节，获得针对性改进建议。

**技术栈：** Next.js 15 + FastAPI + OpenAI GPT-5.3-codex + Supabase + Cloudflare R2

---

## 技术架构

### 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                         用户浏览器                            │
│                    (Next.js 15 + React)                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare Pages                          │
│                    (前端静态资源)                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ API 调用
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   FastAPI 后端服务                            │
│                 (Cloudflare Workers)                         │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
                ▼             ▼             ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │ OpenAI   │  │ Supabase │  │    R2    │
        │   API    │  │   (DB)   │  │  (文件)  │
        └──────────┘  └──────────┘  └──────────┘
```

### 技术选型理由

#### 前端：Next.js 15 + TypeScript
- **App Router**：最新的路由系统，支持 Server Components
- **TypeScript**：类型安全，减少运行时错误
- **Tailwind CSS**：快速构建黑金配色 UI
- **Framer Motion**：流畅的动画效果

#### 后端：FastAPI + Python
- **FastAPI**：现代、快速、自动生成 API 文档
- **Pydantic V2**：数据验证和序列化
- **异步支持**：高并发场景下性能优秀
- **Python 生态**：丰富的 AI/ML 库

#### 数据库：Supabase (PostgreSQL)
- **开箱即用**：认证、存储、实时订阅
- **PostgreSQL**：成熟稳定的关系型数据库
- **免费额度**：适合 MVP 阶段

#### 文件存储：Cloudflare R2
- **S3 兼容**：标准 API，易于迁移
- **零出口费用**：成本可控
- **全球 CDN**：访问速度快

#### AI：OpenAI GPT-5.3-codex
- **中文优化**：适合中文简历和面试场景
- **成本可控**：性价比高
- **响应速度快**：适合实时评分场景

---

## 数据模型

### 数据库表结构

```sql
-- 用户表
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 简历表
CREATE TABLE resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    file_url TEXT NOT NULL,
    parsed_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- JD 表
CREATE TABLE job_descriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    content TEXT NOT NULL,
    parsed_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 面试会话表
CREATE TABLE interview_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    resume_id UUID REFERENCES resumes(id),
    jd_id UUID REFERENCES job_descriptions(id),
    questions JSONB NOT NULL,
    answers JSONB DEFAULT '[]',
    status VARCHAR(20) DEFAULT 'in_progress',
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- 面试报告表
CREATE TABLE interview_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES interview_sessions(id),
    overall_score INTEGER,
    section_scores JSONB,
    strengths JSONB,
    weaknesses JSONB,
    recommendations JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## API 设计

### 1. 简历解析 API

**Endpoint:** `POST /api/resume/parse`

**Request:**
```
Content-Type: multipart/form-data

file: <PDF/TXT 文件>
```

**Response:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "file_url": "r2://resumes/xxx.pdf",
  "parsed_data": {
    "name": "张三",
    "education": "本科 - 清华大学 - 计算机科学与技术",
    "skills": ["Python", "Java", "React", "MySQL"],
    "experience": ["2023.06-2023.09 字节跳动 后端开发实习生"],
    "projects": ["在线教育平台", "电商推荐系统"]
  },
  "created_at": "2026-03-04T10:00:00Z"
}
```

**实现逻辑:**
1. 接收文件上传
2. 根据文件类型（PDF/TXT）提取文本
3. 调用 OpenAI GPT-5.3-codex 解析简历
4. 上传文件到 R2
5. 保存解析结果到数据库
6. 返回结构化数据

---

### 2. 生成面试题 API

**Endpoint:** `POST /api/interview/generate`

**Request:**
```json
{
  "resume_id": "uuid",
  "jd_id": "uuid"
}
```

**Response:**
```json
{
  "session_id": "uuid",
  "questions": [
    {
      "id": "q_001",
      "type": "self_intro",
      "category": "自我介绍",
      "content": "请做一个 3 分钟的自我介绍...",
      "difficulty": "easy",
      "time_limit": 180,
      "tags": ["自我介绍"]
    },
    {
      "id": "q_002",
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

**实现逻辑:**
1. 从数据库获取简历和 JD 数据
2. 提取简历中的技能列表
3. 从题库中选择题目：
   - Part 1: 自我介绍（固定）
   - Part 2: 技能测试（根据简历技能随机抽取 3-4 项，每项 2-3 题）
   - Part 3: 场景题（根据 JD 岗位选择 1-2 道）
   - Part 4: 反问环节（固定）
4. 创建面试会话，保存到数据库
5. 返回题目列表

---

### 3. 评估答案 API

**Endpoint:** `POST /api/interview/evaluate`

**Request:**
```json
{
  "session_id": "uuid",
  "question_id": "q_001",
  "answer": "我叫张三，本科毕业于清华大学计算机系..."
}
```

**Response:**
```json
{
  "score": 85,
  "feedback": "整体回答不错，技术点掌握扎实，表达清晰流畅。建议补充更多项目细节。",
  "strengths": [
    "技术理解准确",
    "表达清晰有条理"
  ],
  "improvements": [
    "可以补充更多实际应用场景",
    "深入讨论性能优化"
  ]
}
```

**实现逻辑:**
1. 获取面试会话和题目信息
2. 调用 OpenAI GPT-5.3-codex 评估答案：
   - 技术准确性（40%）
   - 表达清晰度（30%）
   - 结构完整性（20%）
   - 深度与广度（10%）
3. 保存答案和评分到数据库
4. 返回评分和反馈

---

### 4. 生成报告 API

**Endpoint:** `GET /api/interview/report/{session_id}`

**Response:**
```json
{
  "id": "uuid",
  "session_id": "uuid",
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

**实现逻辑:**
1. 获取面试会话的所有题目和答案
2. 调用 OpenAI GPT-5.3-codex 生成综合报告
3. 保存报告到数据库
4. 返回报告数据

---

## 题库设计

### 题库结构

题库存储在 `data/question_bank.json`，包含 108 道题目：

```json
{
  "self_intro": { /* 自我介绍题 */ },
  "skill_tests": {
    "Python": [ /* 3 道题 */ ],
    "Java": [ /* 1 道题 */ ],
    "C++": [ /* 2 道题 */ ],
    "数据结构": [ /* 2 道题 */ ],
    "算法": [ /* 1 道题 */ ],
    "操作系统": [ /* 2 道题 */ ],
    "计算机网络": [ /* 3 道题 */ ],
    "数据库": [ /* 3 道题 */ ],
    "React": [ /* 1 道题 */ ],
    "Docker": [ /* 1 道题 */ ]
  },
  "scenario_questions": [ /* 4 道场景题 */ ],
  "reverse_questions": { /* 反问环节 */ }
}
```

### 题目选择策略

```python
def select_questions(resume_skills: List[str]) -> List[Question]:
    questions = []

    # Part 1: 自我介绍（固定）
    questions.append(QUESTION_BANK["self_intro"])

    # Part 2: 技能测试（随机抽取 3-4 项技能，每项 2-3 题）
    selected_skills = random.sample(resume_skills, min(4, len(resume_skills)))
    for skill in selected_skills:
        skill_questions = QUESTION_BANK["skill_tests"].get(skill, [])
        if skill_questions:
            questions.extend(random.sample(skill_questions, min(3, len(skill_questions))))

    # Part 3: 场景题（1-2 道）
    scenario_pool = QUESTION_BANK["scenario_questions"]
    questions.extend(random.sample(scenario_pool, min(2, len(scenario_pool))))

    # Part 4: 反问环节（固定）
    questions.append(QUESTION_BANK["reverse_questions"])

    return questions
```

---

## OpenAI GPT-5.3-codex 集成

### 1. 简历解析

```python
async def parse_resume(text: str) -> Dict:
    prompt = f"""
你是一个专业的简历解析助手。请从以下简历中提取关键信息，以 JSON 格式返回。

简历内容：
{text}

请提取以下信息：
1. name: 姓名
2. education: 学历（本科/硕士/博士 + 学校 + 专业）
3. skills: 技能列表（编程语言、框架、工具等）
4. experience: 工作/实习经历列表
5. projects: 项目经历列表

返回格式：
{{
  "name": "张三",
  "education": "本科 - 清华大学 - 计算机科学与技术",
  "skills": ["Python", "Java", "React", "MySQL"],
  "experience": ["2023.06-2023.09 字节跳动 后端开发实习生"],
  "projects": ["在线教育平台", "电商推荐系统"]
}}
"""

    response = client.chat.completions.create(
        model="gpt-5.3-codex",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1,
    )

    return json.loads(response.choices[0].message.content)
```

### 2. 答案评估

```python
async def evaluate_answer(question: str, answer: str, reference: str = None) -> Dict:
    prompt = f"""
你是一个专业的面试官。请评估候选人的回答质量。

面试题目：
{question}

候选人回答：
{answer}

{"参考答案：\n" + reference if reference else ""}

请从以下维度评分（总分100分）：
1. 技术准确性（40分）：回答是否正确、准确
2. 表达清晰度（30分）：逻辑是否清晰、表达是否流畅
3. 结构完整性（20分）：回答是否有条理、结构完整
4. 深度与广度（10分）：是否有深入思考、是否考虑全面

返回 JSON 格式：
{{
  "score": 85,
  "feedback": "整体回答不错，技术点掌握扎实...",
  "strengths": ["技术理解准确", "表达清晰"],
  "improvements": ["可以补充更多实际应用场景", "深入讨论性能优化"]
}}
"""

    response = client.chat.completions.create(
        model="gpt-5.3-codex",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
    )

    return json.loads(response.choices[0].message.content)
```

### 3. 报告生成

```python
async def generate_report(questions: List[Dict], answers: List[Dict]) -> Dict:
    prompt = f"""
你是一个专业的面试评估专家。请根据候选人的面试表现生成详细的复盘报告。

面试题目和回答：
{json.dumps({"questions": questions, "answers": answers}, ensure_ascii=False, indent=2)}

请生成包含以下内容的报告（JSON 格式）：
1. overall_score: 总分（0-100）
2. section_scores: 各部分得分
3. strengths: 优势列表（3-5条）
4. weaknesses: 薄弱环节列表（3-5条）
5. recommendations: 改进建议列表（3-5条具体行动项）
"""

    response = client.chat.completions.create(
        model="gpt-5.3-codex",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
    )

    return json.loads(response.choices[0].message.content)
```

---

## 部署方案

### 前端部署（Cloudflare Pages）

```bash
cd frontend
npm install
npm run build
wrangler pages deploy .next --project-name=interview-copilot
```

### 后端部署（Cloudflare Workers）

```bash
cd backend
wrangler deploy
```

### 环境变量配置

**前端 (.env.local):**
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
NEXT_PUBLIC_API_URL=https://api.interview-copilot.com
```

**后端 (.env):**
```
DATABASE_URL=postgresql://xxx
OPENAI_API_KEY=sk-xxx
OPENAI_API_BASE=https://api.penguinsaichat.dpdns.org/v1
OPENAI_MODEL=gpt-5.3-codex
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME=interview-copilot
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=xxx
```

---

## 成本估算

### OpenAI GPT-5.3-codex
- **简历解析：** ~500 tokens/次 × ¥0.004/1K tokens = ¥0.002/次
- **答案评估：** ~1000 tokens/次 × ¥0.004/1K tokens = ¥0.004/次
- **报告生成：** ~2000 tokens/次 × ¥0.004/1K tokens = ¥0.008/次
- **单次面试成本：** ~¥0.05（1 次解析 + 10 次评估 + 1 次报告）

### Cloudflare
- **Pages：** 免费（500 次构建/月）
- **Workers：** 免费（100K 请求/天）
- **R2：** 免费（10GB 存储 + 1M 读取/月）

### Supabase
- **免费版：** 500MB 数据库 + 1GB 文件存储 + 50K 月活用户

**总成本：** MVP 阶段几乎零成本，单次面试成本 ~¥0.05

---

## 开发计划

### Phase 1: 核心功能（1 周）
- [x] 项目初始化
- [x] 前端基础架构
- [x] 后端 API 框架
- [x] OpenAI GPT-5.3-codex 集成
- [x] 题库数据准备
- [x] 数据库表创建（MVP 使用内存存储，schema.sql 已准备）
- [x] 简历解析功能
- [x] 面试题生成功能
- [x] 答案评估功能
- [x] 报告生成功能

### Phase 2: UI/UX（3 天）
- [x] 黑金配色 UI 设计
- [x] 上传简历页面
- [x] 面试进行页面
- [x] 实时评分展示
- [x] 报告展示页面
- [x] 动画效果（Framer Motion）

### Phase 3: 测试与优化（2 天）
- [ ] 单元测试
- [ ] 集成测试
- [ ] 性能优化
- [ ] 错误处理
- [ ] 用户体验优化

### Phase 4: 部署上线（1 天）
- [ ] 环境配置
- [ ] 前端部署
- [ ] 后端部署
- [ ] 域名配置
- [ ] 监控告警

---

## 技术债务与优化方向

### 当前简化（MVP 阶段可接受）
1. **认证系统：** 暂时使用临时用户 ID，后续接入 Supabase Auth
2. **文件存储：** 暂时返回模拟 URL，后续实现 R2 上传
3. **数据库：** 暂时使用内存存储，后续接入 Supabase
4. **题库加载：** 暂时硬编码，后续从 JSON 文件动态加载
5. **错误处理：** 基础错误处理，后续完善重试、降级机制

### 后续优化方向
1. **缓存策略：** Redis 缓存题库、用户数据
2. **并发优化：** 批量评估、异步处理
3. **监控告警：** Sentry 错误追踪、性能监控
4. **A/B 测试：** 不同 prompt 效果对比
5. **多模型支持：** 支持切换不同 AI 模型

---

## 总结

这是一个典型的 **Majestic Monolith** 架构：
- **单体前端：** Next.js 一把梭
- **单体后端：** FastAPI 一把梭
- **Boring Technology：** 成熟稳定的技术栈
- **快速迭代：** 一周内可上线 MVP

**核心原则：**
1. **先让它跑起来**：MVP 功能优先，不过度设计
2. **成本可控**：免费额度内完成验证
3. **用户价值**：聚焦核心流程（上传 → 面试 → 报告）
4. **技术深度**：展示全栈能力 + AI 集成能力

---

**文档作者：** Fullstack Developer (DHH)
**创建时间：** 2026-03-04
**版本：** v0.1.0
