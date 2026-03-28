# Interview Copilot - 项目结构

```
interview-copilot/
├── README.md                          # 项目说明
├── frontend/                          # Next.js 前端
│   ├── app/                          # App Router
│   │   ├── layout.tsx               # 根布局
│   │   ├── page.tsx                 # 首页
│   │   └── globals.css              # 全局样式
│   ├── components/                   # React 组件
│   ├── lib/                         # 工具库
│   │   ├── api.ts                   # API 客户端
│   │   └── supabase.ts              # Supabase 客户端
│   ├── types/                       # TypeScript 类型定义
│   │   └── index.ts                 # 核心类型
│   ├── package.json                 # 依赖配置
│   ├── tsconfig.json                # TypeScript 配置
│   ├── tailwind.config.ts           # Tailwind 配置
│   ├── postcss.config.js            # PostCSS 配置
│   ├── next.config.js               # Next.js 配置
│   ├── .env.example                 # 环境变量示例
│   └── .gitignore                   # Git 忽略文件
├── backend/                          # FastAPI 后端
│   ├── app/                         # 应用代码
│   │   ├── api/                     # API 路由
│   │   │   ├── resume.py           # 简历解析 API
│   │   │   └── interview.py        # 面试相关 API
│   │   ├── models/                  # 数据模型
│   │   ├── schemas/                 # Pydantic 模型
│   │   │   └── __init__.py         # 数据模型定义
│   │   ├── services/                # 业务逻辑
│   │   │   └── qwen.py             # OpenAI GPT-5.3-codex 服务
│   │   └── config.py                # 配置管理
│   ├── main.py                      # FastAPI 入口
│   ├── requirements.txt             # Python 依赖
│   ├── .env.example                 # 环境变量示例
│   └── .gitignore                   # Git 忽略文件
├── data/                             # 数据文件
│   └── question_bank.json           # 题库（108 题）
└── docs/                             # 技术文档
    └── fullstack/                   # 全栈开发文档
        └── phase1-architecture.md   # Phase 1 架构设计
```

## 已完成的工作

### ✅ 前端架构
- Next.js 15 项目初始化
- TypeScript 配置
- Tailwind CSS 黑金配色
- 核心类型定义（Resume, Question, Interview, Report）
- API 客户端封装
- Supabase 客户端配置

### ✅ 后端架构
- FastAPI 项目初始化
- 路由结构（resume, interview）
- Pydantic 数据模型
- OpenAI GPT-5.3-codex 服务封装
- 简历解析 API
- 面试题生成 API
- 答案评估 API
- 报告生成 API

### ✅ 题库数据
- 108 道面试题（JSON 格式）
- 覆盖 10+ 技术栈
- 包含参考答案和评分标准

### ✅ 技术文档
- 完整的架构设计文档
- API 接口文档
- 数据模型设计
- 部署方案
- 成本估算

## 下一步工作

### Phase 1: 核心功能完善
1. 创建 Supabase 数据库表
2. 实现 R2 文件上传
3. 完善错误处理
4. 添加日志记录
5. 从 JSON 文件加载题库

### Phase 2: UI/UX 开发
1. 设计黑金配色 UI
2. 实现上传简历页面
3. 实现面试进行页面
4. 实现实时评分展示
5. 实现报告展示页面

### Phase 3: 测试与部署
1. 单元测试
2. 集成测试
3. 部署到 Cloudflare
4. 配置域名和 SSL

## 快速开始

### 前端开发
```bash
cd frontend
npm install
npm run dev
# 访问 http://localhost:3000
```

### 后端开发
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
# 访问 http://localhost:8000/docs
```

## 技术栈

- **前端：** Next.js 15, TypeScript, Tailwind CSS, Framer Motion
- **后端：** FastAPI, Pydantic V2, SQLAlchemy
- **数据库：** Supabase (PostgreSQL)
- **存储：** Cloudflare R2
- **AI：** OpenAI GPT-5.3-codex
- **部署：** Cloudflare Pages + Workers
