# 我用 AI 做了一个校招面试助手：从 0 到 MVP 的技术复盘

> 发布平台：掘金 / 知乎 / 个人博客
> 预计阅读时间：15 分钟

---

## 为什么做这个项目

去年秋招的时候，我发现一个很普遍的问题：身边的同学（包括我自己）都在为面试焦虑，但市面上的解决方案要么太贵，要么太泛。

牛客网的真人模拟面试 ¥200-500 一次，学生党根本消费不起。LeetCode 只覆盖算法题，不管你简历写了什么，题目都一样。用 ChatGPT 模拟面试？体验像聊天，没有结构化流程，也没有评分反馈。

我想要的很简单：**上传我的简历，系统根据我写的技能出题，答完给我打分，告诉我哪里不行、怎么改。** 这个东西不存在，那就自己做一个。

顺便，这也是一个很好的简历项目——全栈 + AI 集成 + 云部署，面试的时候能讲的技术点非常多。一举两得。

## 技术选型：为什么是 Next.js + FastAPI + OpenAI

### 前端：Next.js 15

选 Next.js 不是因为它最新最酷，而是因为它**最省事**。

App Router + Server Components 让我不用纠结 SSR/CSR 的问题。TypeScript 保证类型安全，Tailwind CSS 让我不用写一行 CSS 就能搞出还不错的 UI。Framer Motion 处理动画，Zustand 管理状态——整个前端技术栈都是"拿来就能用"的成熟方案。

我考虑过 Vue 3，但 React 生态的组件库更丰富，面试的时候聊 React 也更有话题。

### 后端：FastAPI + Python

这个选择几乎没有犹豫。FastAPI 有三个杀手级特性：

1. **自动生成 API 文档** — 写完路由，Swagger UI 就有了，前后端联调效率翻倍
2. **Pydantic V2 数据验证** — 请求参数自动校验，不用手写一堆 if-else
3. **原生 async/await** — 调用 LLM API 是 IO 密集型操作，异步处理是刚需

我也考虑过 Express.js（前后端统一 JS），但 Python 在 AI/ML 领域的生态优势太大了。调用 OpenAI API、处理 PDF 解析、做数据处理，Python 的库支持远超 Node.js。

### AI：OpenAI API

选 OpenAI 的核心原因是**成本可控 + 中文效果好**。单次面试大概 4-5 次 API 调用（简历解析 1 次 + 答案评估 3-4 次 + 报告生成 1 次），总成本约 ¥0.05。一个月 1000 个用户也就 ¥50，完全在免费额度的射程范围内。

关键的 trade-off：我没有选择自己部署开源模型（比如 Llama 3）。原因很简单——GPU 服务器的成本远超 API 调用费用，而且部署运维的复杂度会让 MVP 周期从一周变成一个月。**先用 API 跑通业务，等用户量上来再考虑自建。**

### 数据库：Supabase

Supabase 是 Firebase 的开源替代品，底层是 PostgreSQL。选它的理由：

- 免费额度够用（500MB 数据库 + 1GB 存储）
- 开箱即用的 Auth、Realtime、Storage
- 标准 SQL，不被厂商锁定，随时可以迁移到自建 PostgreSQL

### 部署：Cloudflare

前端用 Cloudflare Pages，后端用 Workers，文件存储用 R2。全部免费额度内搞定，全球 CDN 加速。

**一句话总结技术选型哲学：Boring Technology。** 每一个选择都是成熟稳定的方案，没有一个是为了"简历好看"而选的新技术。面试官问起来，我能解释清楚每个选择背后的 trade-off，这比用一堆花哨技术更有说服力。

## 核心技术挑战

### 挑战一：简历解析 — 从非结构化文本到结构化数据

简历解析看起来简单，实际上坑很多。

**PDF 解析的坑：** 不同的 PDF 生成工具（Word 导出、LaTeX 编译、在线简历工具）产出的 PDF 内部结构完全不同。有的是文本流，有的是图片，有的是混合的。我用 `pypdf` 库提取文本，但遇到扫描件或图片型 PDF 就会返回空字符串。

我的处理策略是**防御性编程**：

```python
# 多编码自动检测
def _decode_text_file(content: bytes) -> str:
    for encoding in ("utf-8-sig", "utf-8", "gb18030", "gbk"):
        try:
            return content.decode(encoding)
        except UnicodeDecodeError:
            continue
    raise HTTPException(status_code=400, detail="编码不支持")

# 文本截断防止 token 爆炸
if len(text) > 8000:
    text = text[:8000]
```

**LLM 解析的 Prompt 设计：** 让 LLM 从简历文本中提取结构化信息，关键是**约束输出格式**。我直接在 prompt 里给出 JSON Schema：

```python
prompt = f"""你是一个专业的简历解析助手。请从以下简历中提取关键信息。
简历内容：{text}
仅返回 JSON：
{{"name": "...", "education": "...", "skills": [...], "experience": [...], "projects": [...]}}"""
```

这里有个细节：`temperature` 设为 0.1（接近确定性输出），因为简历解析需要准确性，不需要创造性。而答案评估的 `temperature` 设为 0.3，给 LLM 一点发挥空间来生成更自然的反馈。

### 挑战二：智能出题 — 题库 + 技能匹配

最初我想让 LLM 直接生成面试题，但很快发现问题：**LLM 生成的题目质量不稳定**，有时候太简单，有时候跑题，而且每次生成的题目不同，没法做质量控制。

最终方案是**题库 + 智能匹配**的混合策略：

1. 人工整理 108 道高质量面试题，覆盖 10 个技能类别（Python、Java、C++、数据结构、算法、操作系统、计算机网络、数据库、React、Docker）
2. 每道题包含参考答案和评分标准
3. LLM 负责解析简历提取技能列表，然后从题库中匹配抽题

```python
def _select_questions(skills: List[str]) -> List[Question]:
    questions = []
    # Part 1: 自我介绍（固定）
    questions.append(question_bank_service.get_self_intro_question())
    # Part 2: 技能测试（基于简历匹配）
    matched_skills = [s for s in skills if s in available_skills]
    selected_skills = random.sample(matched_skills, min(4, len(matched_skills)))
    for skill in selected_skills:
        questions.extend(question_bank_service.get_skill_questions(skill, count=3))
    # Part 3: 场景题（随机）
    questions.extend(question_bank_service.get_scenario_questions(count=2))
    return questions
```

这个设计的好处是：**LLM 做它擅长的事（理解语义、提取信息），题库保证质量底线。** 面试官问起来，这是一个很好的"工程思维 vs 纯 AI 思维"的讨论点。

### 挑战三：实时评分 — 结构化 Prompt + JSON 约束

评分是整个系统最核心也最难的部分。难点不在于调用 API，而在于**如何让 LLM 的评分稳定、可解释、有参考价值**。

我定义了 4 个评分维度，每个维度有明确的权重：

- 技术准确性（40%）— 回答的知识点是否正确
- 表达清晰度（30%）— 是否条理清晰、逻辑连贯
- 结构完整性（20%）— 是否有开头、论述、总结
- 深度与广度（10%）— 是否有深入分析或横向对比

Prompt 的关键技巧是**给出参考答案**。当题库中有参考答案时，LLM 的评分一致性会大幅提升：

```python
ref_section = f"\n参考答案：\n{reference_answer}" if reference_answer else ""
prompt = f"""你是一个专业的面试官。请评估候选人的回答质量。
面试题目：{question}
候选人回答：{answer}{ref_section}
评分维度（总分100）：技术准确性40分、表达清晰度30分、结构完整性20分、深度广度10分。
仅返回 JSON：
{{"score": 85, "feedback": "...", "strengths": ["..."], "improvements": ["..."]}}"""
```

另一个关键设计是 **JSON 解析的容错处理**。LLM 有时候会在 JSON 外面包一层 markdown 代码块，有时候会加一句"以下是评分结果"。我写了一个两级解析器：

```python
def _parse_json_response(self, text: str) -> Dict:
    try:
        return json.loads(text)  # 先尝试直接解析
    except json.JSONDecodeError:
        pass
    # 回退：从 markdown 代码块中提取
    match = re.search(r"```(?:json)?\s*\n?(.*?)\n?```", text, re.DOTALL)
    if match:
        return json.loads(match.group(1).strip())
    raise ValueError(f"Cannot parse JSON from LLM response")
```

## 架构设计：Majestic Monolith

我的架构哲学来自 DHH（Ruby on Rails 创始人）的 Majestic Monolith 理念：**单体架构不是落后，是务实。**

```
用户浏览器 (Next.js 15)
       │ HTTPS
       ▼
Cloudflare Pages (前端静态资源)
       │ REST API
       ▼
FastAPI 后端 (Cloudflare Workers)
       │
  ┌────┼────┐
  ▼    ▼    ▼
 LLM  DB   R2
 API  (PG) (文件)
```

整个系统就两个进程：一个 Next.js，一个 FastAPI。没有消息队列，没有微服务，没有 Redis。

**为什么不用微服务？** 因为这是一个 MVP，用户量级是百级别。微服务带来的运维复杂度（服务发现、链路追踪、分布式事务）远超它解决的问题。等日活过万再拆不迟。

**数据库抽象层是我比较得意的设计：**

```python
class DatabaseService:
    def __init__(self):
        self._use_supabase = bool(settings.SUPABASE_URL and settings.SUPABASE_KEY)
        if self._use_supabase:
            self._client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        else:
            self._memory = {"resumes": {}, "sessions": {}, "reports": {}}

    async def save_resume(self, resume_id, data):
        if self._use_supabase:
            return self._client.table("resumes").insert(row).execute()
        else:
            self._memory["resumes"][resume_id] = data
```

本地开发不需要配置任何数据库，直接用内存存储跑通全流程。配置了 Supabase 环境变量就自动切换到 PostgreSQL。**业务代码零改动。** 这个模式在面试中可以展开聊"依赖倒置"和"策略模式"。

## 踩过的坑

### 坑 1：Pydantic V2 迁移

FastAPI 从 0.100 开始全面拥抱 Pydantic V2，但很多教程和 Stack Overflow 答案还是 V1 的写法。最常见的坑：

- `model_dump()` 替代了 `dict()`
- `model_config = ConfigDict(...)` 替代了 `class Config:`
- `pydantic-settings` 从 pydantic 主包中独立出来了，需要单独安装

我的建议：直接看 Pydantic V2 官方迁移指南，不要看第三方教程。

### 坑 2：CORS 配置

前后端分离的经典问题。开发环境前端跑在 `localhost:3000`，后端跑在 `localhost:8000`，浏览器会拦截跨域请求。

我的处理方式是通过环境变量控制：

```python
_cors_env = os.environ.get("CORS_ORIGINS", "")
_allowed_origins = [o.strip() for o in _cors_env.split(",") if o.strip()] if _cors_env else ["*"]
```

开发环境默认允许所有来源（`*`），生产环境通过 `CORS_ORIGINS` 环境变量指定前端域名。简单粗暴但有效。

### 坑 3：OpenAI API 成本控制

LLM API 调用是按 token 计费的，不控制成本很容易翻车。我做了几个优化：

1. **简历文本截断** — 超过 8000 字符的简历只取前 8000 字，避免 token 爆炸
2. **低 temperature** — 简历解析用 0.1，减少不必要的"创造性"输出
3. **Mock 模式** — 本地开发完全不调用 API，用预设的 mock 数据跑通流程
4. **指数退避重试** — API 调用失败后等 1s、2s、4s 再重试，避免被限流

```python
MAX_RETRIES = 3
RETRY_DELAYS = [1, 2, 4]

for attempt in range(MAX_RETRIES):
    try:
        resp = await self._http.post(self._api_url, json=payload, headers=self._headers)
        resp.raise_for_status()
        # ... 解析响应
    except (httpx.HTTPStatusError, httpx.ConnectError, httpx.ReadTimeout) as e:
        if isinstance(e, httpx.HTTPStatusError) and e.response.status_code < 500:
            raise  # 4xx 错误不重试
        if attempt < MAX_RETRIES - 1:
            await asyncio.sleep(RETRY_DELAYS[attempt])
```

### 坑 4：PDF 编码问题

中文简历的 PDF 编码是个大坑。有的用 UTF-8，有的用 GBK，有的用 GB18030。我写了一个编码瀑布检测：依次尝试 UTF-8-SIG → UTF-8 → GB18030 → GBK，第一个成功的就用。

这个看起来不起眼的细节，实际上决定了用户的第一印象——如果上传简历就报错，用户直接就走了。

## 数据和成果

### 代码规模

- 后端：~800 行 Python（不含测试）
- 前端：~1500 行 TypeScript/TSX
- 测试：3 个测试文件，覆盖 API 端点、边界条件、安全防护
- 题库：108 道面试题，10 个技能类别

### 成本

- 开发时间：约 1 周（利用课余时间）
- 运营成本：Mock 模式 ¥0/天，真实 LLM 模式 < ¥1/天（按 20 次面试/天估算）
- 基础设施：全部在 Cloudflare + Supabase 免费额度内

### 技术覆盖面（面试可讲的点）

| 领域 | 具体技术 |
|------|----------|
| 前端 | Next.js 15 App Router, TypeScript, Tailwind CSS, Zustand, Framer Motion |
| 后端 | FastAPI, Pydantic V2, async/await, RESTful API 设计 |
| AI/ML | Prompt Engineering, JSON Schema 约束, 成本控制, Mock 模式 |
| 数据库 | PostgreSQL (Supabase), 数据库抽象层, Schema 设计 |
| 工程实践 | 防御性编程, 指数退避重试, 编码检测, 安全测试 |
| DevOps | Cloudflare Pages/Workers/R2, 环境变量管理, CORS 配置 |

## 下一步计划

1. **语音面试模式** — 接入 Web Speech API，模拟真实面试的口头表达场景
2. **历史趋势分析** — 多次面试的分数对比曲线，可视化进步轨迹
3. **题库扩展** — 接入社区贡献的题目，支持按公司/岗位筛选
4. **移动端适配** — 响应式 UI，支持手机上随时练习

## 写在最后

这个项目从想法到 MVP 上线大概花了一周时间。回头看，最大的收获不是技术本身，而是**做技术决策的思维方式**：

- 不要为了简历好看选技术，要为了解决问题选技术
- MVP 阶段，能用免费方案就不花钱，能用成熟方案就不造轮子
- 先让它跑起来，再让它跑得好——完美是交付的敌人

如果你也在准备校招，不妨试试自己做一个"解决自己痛点"的项目。面试官最喜欢听的不是"我用了什么技术"，而是"我为什么做这个选择"。

项目开源在 GitHub，欢迎 Star 和 PR。有问题可以在评论区交流。

---

*作者是一名普通 211 本科生，正在准备 2026 秋招。这篇文章记录的是真实的开发过程，不是事后编的。如果对你有帮助，点个赞就是最大的支持。*
