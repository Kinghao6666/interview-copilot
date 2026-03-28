# Interview Copilot - 部署指南

## 前置准备

### 1. Supabase 配置

1. 访问 [Supabase](https://supabase.com) 创建项目
2. 在 SQL Editor 中执行 `backend/schema.sql` 创建数据库表
3. 获取项目 URL 和 API Key（Settings → API）

### 2. Cloudflare R2 配置

1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 创建 R2 存储桶：`interview-copilot`
3. 创建 API Token（R2 → Manage R2 API Tokens）
4. 记录 Account ID、Access Key ID、Secret Access Key

### 3. OpenAI API 配置

1. 访问 [OpenAI Platform](https://platform.openai.com)
2. 创建 API Key
3. 记录 API Key

---

## 本地开发

### 后端开发

```bash
cd backend

# 创建虚拟环境
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env 填写实际值

# 启动服务
python run.py

# 访问 API 文档
# http://localhost:8000/docs
```

### 前端开发

```bash
cd frontend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填写实际值

# 启动开发服务器
npm run dev

# 访问应用
# http://localhost:3000
```

---

## 生产部署

### 后端部署（Cloudflare Workers）

```bash
cd backend

# 安装 wrangler
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 配置 wrangler.toml
cat > wrangler.toml << EOF
name = "interview-copilot-api"
main = "main.py"
compatibility_date = "2024-01-01"

[vars]
OPENAI_API_BASE = "https://api.openai.com/v1"
OPENAI_MODEL = "gpt-5.3-codex"

[secrets]
DATABASE_URL
OPENAI_API_KEY
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
SUPABASE_URL
SUPABASE_KEY
EOF

# 设置环境变量
wrangler secret put DATABASE_URL
wrangler secret put OPENAI_API_KEY
wrangler secret put R2_ACCOUNT_ID
wrangler secret put R2_ACCESS_KEY_ID
wrangler secret put R2_SECRET_ACCESS_KEY
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_KEY

# 部署
wrangler deploy
```

### 前端部署（Cloudflare Pages）

```bash
cd frontend

# 构建
npm run build

# 部署
npx wrangler pages deploy .next --project-name=interview-copilot

# 或使用 Git 集成（推荐）
# 1. 推送代码到 GitHub
# 2. 在 Cloudflare Dashboard 中连接 GitHub 仓库
# 3. 配置构建命令：npm run build
# 4. 配置输出目录：.next
# 5. 添加环境变量
```

### 环境变量配置（Cloudflare Pages）

在 Cloudflare Dashboard → Pages → Settings → Environment Variables 中添加：

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
NEXT_PUBLIC_API_URL=https://interview-copilot-api.xxx.workers.dev
```

---

## 域名配置

### 后端域名

1. 在 Cloudflare Workers 中添加自定义域名
2. 配置 DNS 记录：`api.interview-copilot.com`

### 前端域名

1. 在 Cloudflare Pages 中添加自定义域名
2. 配置 DNS 记录：`interview-copilot.com`

---

## 监控与日志

### Cloudflare Analytics

- Workers Analytics：查看 API 请求量、错误率
- Pages Analytics：查看页面访问量、性能指标

### Sentry（可选）

```bash
# 安装 Sentry SDK
npm install @sentry/nextjs
pip install sentry-sdk

# 配置 Sentry
# 前端：next.config.js
# 后端：main.py
```

---

## 成本估算

### 免费额度

- **Cloudflare Workers：** 100K 请求/天
- **Cloudflare Pages：** 500 次构建/月
- **Cloudflare R2：** 10GB 存储 + 1M 读取/月
- **Supabase：** 500MB 数据库 + 1GB 文件存储
- **OpenAI API：** 按模型与 token 计费

### 预估成本（1000 用户/月）

- **OpenAI API：** 取决于模型和 token 用量
- **Cloudflare：** 免费额度内
- **Supabase：** 免费额度内

**总成本：** 取决于 OpenAI 模型选择与调用量

---

## 故障排查

### 后端 API 无法访问

1. 检查 Cloudflare Workers 部署状态
2. 检查环境变量是否正确配置
3. 查看 Workers 日志（wrangler tail）

### 前端页面无法加载

1. 检查 Cloudflare Pages 部署状态
2. 检查环境变量是否正确配置
3. 查看浏览器控制台错误

### OpenAI API 调用失败

1. 检查 API Key 是否有效
2. 检查账户额度/账单状态
3. 查看 API 调用日志

### 数据库连接失败

1. 检查 Supabase 项目状态
2. 检查数据库连接字符串是否正确
3. 检查 IP 白名单配置

---

## 回滚方案

### 回滚后端

```bash
# 查看部署历史
wrangler deployments list

# 回滚到指定版本
wrangler rollback <deployment-id>
```

### 回滚前端

```bash
# 在 Cloudflare Dashboard 中选择历史部署版本
# Pages → Deployments → 选择版本 → Rollback
```

---

## 备份策略

### 数据库备份

- Supabase 自动每日备份（保留 7 天）
- 手动备份：Settings → Database → Backups

### 代码备份

- Git 仓库（GitHub/GitLab）
- 定期打 tag 标记稳定版本

---

**文档作者：** Fullstack Developer (DHH)
**创建时间：** 2026-03-04
**版本：** v0.1.0
