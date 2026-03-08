# Interview Copilot 🎯

**AI 驱动的校招模拟面试助手 — 上传简历，20 分钟模拟面试，立即获得评分和改进建议。**

*An AI-powered mock interview assistant for campus recruitment.*

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](https://python.org)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=next.js&logoColor=white)](https://nextjs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-gold.svg)](LICENSE)

<!-- TODO: 添加截图/GIF — 建议录制 20 秒核心流程演示（上传简历 → 面试答题 → 查看报告） -->
<!-- ![Demo Screenshot](docs/assets/demo.png) -->

---

## 这个项目做了什么 / What It Does

Interview Copilot 是一个面向校招求职者的 AI 模拟面试系统。它解决的核心问题是：**校招生缺乏高质量、低成本、随时可用的面试练习渠道。**

传统方案要么贵（真人辅导 ¥500+/次），要么泛（通用 LLM 没有结构化流程），要么只覆盖算法题。Interview Copilot 把这三个问题一起解决了：

## ✨ Features

- 📄 **简历智能解析** — 上传 PDF/TXT 简历，LLM 自动提取姓名、学历、技能、项目经历等结构化信息
- 🎯 **个性化出题** — 基于简历技能从 108 道题库中智能匹配，你写了 Redis 就考 Redis，没写就不考
- 🏗️ **结构化面试流程** — 自我介绍 → 技能测试 → 场景题，模拟真实面试节奏，不是随便聊天
- 📊 **4 维度实时评分** — 技术准确性(40%) + 表达清晰度(30%) + 结构完整性(20%) + 深度广度(10%)
- 📋 **可视化复盘报告** — 雷达图能力分析、各环节得分、优劣势总结、具体改进建议
- 🎨 **黑金数据看板 UI** — Framer Motion 动画 + SVG 分数环 + 进度条 shimmer，金融终端既视感
- 🔄 **双模式架构** — Mock 模式零成本本地开发，配置 API Key 即切换真实 LLM
- 💾 **数据库抽象层** — 自动检测 Supabase 配置，无缝切换内存存储 / PostgreSQL

## 🛠️ Tech Stack

| 层级 | 技术 | 说明 |
|------|------|------|
| **前端** | Next.js 15, TypeScript, Tailwind CSS | App Router, Zustand 状态管理 |
| **UI/动画** | Framer Motion, Recharts, Lucide Icons | 页面过渡、雷达图、数字滚动 |
| **后端** | FastAPI, Pydantic V2, Python 3.11+ | 异步 API, 自动生成 OpenAPI 文档 |
| **AI** | OpenAI API (可替换) | 简历解析、答案评估、报告生成 |
| **数据库** | Supabase (PostgreSQL) | 用户数据、面试记录、复盘报告 |
| **存储** | Cloudflare R2 | 简历文件 CDN，S3 兼容，零出口费 |
| **部署** | Cloudflare Pages + Workers | 全球 CDN, 免费额度内运行 |

## 🚀 Quick Start

### 前置条件 / Prerequisites

- Python 3.11+
- Node.js 18+
- (可选) OpenAI API Key — 不配置则自动使用 Mock 模式，零成本跑通全流程

### 后端 / Backend

```bash
cd backend
pip install -r requirements.txt

# 复制环境变量（可选配置 API Key）
cp .env.example .env

# 启动服务
python run.py
# API: http://localhost:8000
# Swagger 文档: http://localhost:8000/docs
```

### 前端 / Frontend

```bash
cd frontend
npm install

# 复制环境变量
cp .env.example .env.local

npm run dev
# 访问: http://localhost:3000
```

### 环境变量 / Environment Variables

后端 `backend/.env`:
```env
# LLM API（不配置则使用 Mock 模式）
OPENAI_API_KEY=sk-xxx
OPENAI_API_BASE=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o

# Supabase（不配置则使用内存存储）
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=xxx

# CORS（生产环境配置前端域名）
CORS_ORIGINS=https://your-domain.com
```

前端 `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 📡 API Documentation

| 方法 | 端点 | 说明 |
|------|------|------|
| `POST` | `/api/resume/parse` | 上传并解析简历（PDF/TXT），返回结构化数据 |
| `POST` | `/api/resume/jd/parse` | 解析职位描述，提取岗位要求和技能 |
| `POST` | `/api/interview/generate` | 根据简历技能 + JD 要求，从题库智能抽题 |
| `POST` | `/api/interview/evaluate` | 评估单题答案，返回 4 维度评分 + 改进建议 |
| `GET` | `/api/interview/report/{id}` | 生成面试复盘报告（雷达图数据、优劣势、建议） |
| `GET` | `/api/interview/sessions` | 获取历史面试记录列表 |

启动后端后访问 `http://localhost:8000/docs` 查看完整 Swagger 文档。

## 📁 Project Structure

```
interview-copilot/
├── frontend/                    # Next.js 15 前端
│   ├── app/                     # App Router 页面
│   │   ├── page.tsx             # 首页（上传简历 + JD）
│   │   ├── interview/           # 面试答题页
│   │   ├── report/[sessionId]/  # 复盘报告页
│   │   ├── history/             # 历史记录页
│   │   └── settings/            # 设置页
│   ├── components/              # 动画组件库
│   │   ├── animated-score.tsx   # SVG 分数环动画
│   │   ├── animated-progress.tsx# 进度条 + shimmer 光效
│   │   ├── radar-chart.tsx      # 雷达图
│   │   ├── page-transition.tsx  # 页面过渡动画
│   │   └── glow-button.tsx      # 金色光效按钮
│   └── lib/                     # 工具层
│       ├── api.ts               # Axios API 客户端（自动重试）
│       ├── store.ts             # Zustand 全局状态
│       └── supabase.ts          # Supabase 客户端
├── backend/                     # FastAPI 后端
│   ├── main.py                  # 应用入口 + CORS + 路由注册
│   ├── app/
│   │   ├── api/
│   │   │   ├── resume.py        # 简历解析 + JD 解析端点
│   │   │   └── interview.py     # 出题 + 评分 + 报告端点
│   │   ├── services/
│   │   │   ├── qwen.py          # LLM 服务（真实 + Mock 双模式）
│   │   │   ├── question_bank.py # 题库加载与抽题逻辑
│   │   │   └── database.py      # 数据库抽象层（内存/Supabase）
│   │   ├── schemas/             # Pydantic V2 数据模型
│   │   └── config.py            # 配置管理（pydantic-settings）
│   ├── tests/                   # pytest 测试套件
│   │   ├── test_api.py          # API 端点测试 + 端到端流程
│   │   ├── test_boundary.py     # 边界条件（文件大小、特殊字符、空值）
│   │   └── test_security.py     # 安全测试（SQL 注入、XSS、密钥泄露）
│   └── schema.sql               # 数据库 DDL
├── data/
│   └── question_bank.json       # 108 道面试题库（10 个技能类别）
└── docs/                        # 设计文档
    ├── fullstack/               # 架构设计
    ├── product/                 # 产品规格
    ├── ui/                      # 设计系统
    └── marketing/               # 营销策略
```

## 🧪 Testing

```bash
cd backend
python -m pytest tests/ -v

# 测试覆盖：
# - test_api.py: 核心 API + 端到端完整流程
# - test_boundary.py: 文件大小限制、特殊字符、空值处理
# - test_security.py: SQL 注入、XSS、API Key 泄露防护
```

## 💰 Cost

| 项目 | 费用 |
|------|------|
| 单次模拟面试 AI 调用 | ~¥0.05 |
| Cloudflare (Pages/Workers/R2) | 免费额度内 |
| Supabase (PostgreSQL + Auth) | 免费额度内 |
| **月运营成本 (1000 用户)** | **~¥50** |

## 🏗️ Architecture Highlights

**面试官 30 秒速览：**

1. **Majestic Monolith** — 前后端各一个单体，不搞微服务，一周出 MVP
2. **双模式 LLM 集成** — `is_mock_mode` 一个 flag 切换真实/模拟，本地开发零成本
3. **数据库抽象层** — `DatabaseService` 自动检测 Supabase 配置，dev 用内存，prod 用 PostgreSQL，业务代码零改动
4. **结构化 Prompt Engineering** — JSON Schema 约束 LLM 输出格式，降低幻觉风险，保证评分结构一致
5. **防御性编程** — 文件大小限制、编码自动检测（UTF-8/GBK/GB18030）、LLM 调用指数退避重试、前端 Axios 自动重试

## 🤝 Contributing

欢迎贡献！请遵循以下步骤：

1. Fork 本仓库
2. 创建 feature 分支 (`git checkout -b feat/your-feature`)
3. 提交代码 (`git commit -m 'feat: add something'`)
4. 推送分支 (`git push origin feat/your-feature`)
5. 创建 Pull Request

## 📄 License

[MIT](LICENSE)

---

> Built with ☕ and curiosity. 如果这个项目对你有帮助，欢迎 Star ⭐
#   i n t e r v i e w - c o p i l o t  
 