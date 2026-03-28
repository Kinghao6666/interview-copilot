# Phase 4 部署准备报告

**执行人**: Fullstack Developer (DHH)
**日期**: 2026-03-06
**版本**: v0.3.0 → v0.3.1

---

## 1. 技术债修复

### 1.1 已在前轮完成（验证通过）

| 项目 | 状态 | 说明 |
|------|------|------|
| Pydantic V2 ConfigDict | ✅ 已修复 | `config.py` 使用 `model_config = ConfigDict(env_file=".env")` |
| PyPDF2 → pypdf | ✅ 已修复 | `requirements.txt` + `resume.py` 均已迁移 |

### 1.2 本轮完成

| 项目 | 文件 | 变更 |
|------|------|------|
| CORS 安全收紧 | `config.py`, `main.py` | CORS origins 从 Settings 对象读取，不再用 `os.environ` |
| ENVIRONMENT 变量 | `config.py`, `.env.example` | 新增 `ENVIRONMENT` (dev/prod) 和 `is_production` 属性 |
| CORS_ORIGINS 配置化 | `config.py` | 新增 `CORS_ORIGINS` 字段 + `cors_origins_list` 属性 |
| Cloudflare Workers 配置 | `backend/wrangler.toml` | 新建，含 vars、secrets 注释、R2 binding |
| 部署检查清单更新 | `DEPLOYMENT_CHECKLIST.md` | 标记已完成项，补充 Secrets 和 Supabase 配置步骤 |

---

## 2. CORS 变更详情

**之前** (`main.py`):
```python
_cors_env = os.environ.get("CORS_ORIGINS", "")
_allowed_origins = [o.strip() for o in _cors_env.split(",") if o.strip()] if _cors_env else ["*"]
```

**之后** (`main.py` + `config.py`):
```python
# config.py
CORS_ORIGINS: str = "http://localhost:3000"

@property
def cors_origins_list(self) -> list[str]:
    return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

# main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    ...
)
```

改进点：
- 不再 fallback 到 `["*"]`，默认只允许 localhost:3000
- 统一走 Settings 对象，支持 `.env` 文件和环境变量
- 去掉了 `import os`

---
---

## 3. 部署配置说明

### wrangler.toml

`backend/wrangler.toml` 配置了：
- Worker 名称: `interview-copilot-api`
- 公开变量: `ENVIRONMENT`, `CORS_ORIGINS`, `OPENAI_API_BASE`, `OPENAI_MODEL`, `R2_BUCKET_NAME`
- R2 Bucket binding: `RESUME_BUCKET`
- Secrets（需通过 `wrangler secret put` 设置）: `OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_KEY`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`

### 部署命令

```bash
# 后端
cd backend
wrangler secret put OPENAI_API_KEY
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_KEY
wrangler deploy

# 前端
cd frontend
npm run build
wrangler pages deploy .next
```

---

## 4. 剩余待办

| 优先级 | 项目 | 说明 |
|--------|------|------|
| P0 | Supabase 项目创建 | 创建项目、获取 URL/Key、建表 |
| P0 | Cloudflare Secrets | 通过 wrangler secret put 设置 API keys |
| P1 | 域名配置 | 可选，默认用 *.workers.dev / *.pages.dev |
| P1 | 前端 env 配置 | `NEXT_PUBLIC_API_URL` 指向 Workers 地址 |
| P2 | 速率限制 | slowapi 或 Cloudflare Rate Limiting |
| P2 | 错误监控 | Sentry 或 Cloudflare Analytics |
| P3 | Redis 缓存 | 高频请求优化（1 月内） |

---

**结论**: 代码层面已 production-ready。剩余工作全是基础设施配置（Supabase 建表、Secrets 注入、域名），无代码变更。
