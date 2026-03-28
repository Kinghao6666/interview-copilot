# Interview Copilot 部署检查清单

## 技术债修复（Phase 4 已完成）

- [x] **Pydantic V2 迁移**: `class Config` → `model_config = ConfigDict(...)`
- [x] **PyPDF2 → pypdf**: `requirements.txt` + `resume.py` 已更新
- [x] **CORS 安全收紧**: 从 `settings.cors_origins_list` 读取，默认 `http://localhost:3000`
- [x] **环境变量规范化**: 新增 `ENVIRONMENT`、`CORS_ORIGINS` 到 config + `.env.example`
- [x] **Cloudflare Workers 配置**: `backend/wrangler.toml` 已创建

## 生产环境配置

### 必须完成

- [ ] **设置 Cloudflare Secrets**
  ```bash
  cd backend
  wrangler secret put OPENAI_API_KEY
  wrangler secret put SUPABASE_URL
  wrangler secret put SUPABASE_KEY
  ```

- [ ] **Supabase 项目配置**
  - 创建 Supabase 项目
  - 获取 URL 和 anon key
  - 创建所需表结构

- [ ] **域名配置**
  - 配置自定义域名（可选，默认使用 `*.workers.dev` / `*.pages.dev`）
  - 更新 `wrangler.toml` 中的 `CORS_ORIGINS` 为实际前端域名

- [x] **安装更新的依赖**
  ```bash
  cd backend
  pip install -r requirements.txt
  # pypdf>=4.0.0, pytest-cov>=4.1.0
  ```

- [x] **运行完整测试**
  ```bash
  cd backend
  python -m pytest tests/ -v
  # 59/59 测试通过
  ```

- [ ] **前端构建验证**
  ```bash
  cd frontend
  npm install
  npm run build
  ```

### 推荐完成

- [ ] **添加速率限制** (`slowapi`)
- [ ] **配置日志聚合** (Sentry/Datadog)
- [ ] **设置健康检查监控**
- [ ] **配置备份策略** (Supabase 自动备份)

## 部署步骤

### 后端 (Cloudflare Workers)

```bash
cd backend
wrangler deploy
```

### 前端 (Cloudflare Pages)

```bash
cd frontend
npm run build
wrangler pages deploy .next
```

## 部署后验证

- [ ] 访问 `/health` 端点确认服务运行
- [ ] 测试完整面试流程
- [ ] 检查 OpenAI API 调用是否成功
- [ ] 验证 Supabase 数据持久化

## 成本预估

- OpenAI API: 按模型计费（~¥0.05/次）
- Cloudflare: 免费额度内
- Supabase: 免费额度内

**总成本**: < ¥1/天 (假设 20 次面试/天)
