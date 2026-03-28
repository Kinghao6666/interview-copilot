# Interview Copilot — 截图素材规划

**设计师：** UI Designer (Matias Duarte)
**版本：** v1.0
**日期：** 2026-03-06
**用途：** README 展示、博客文章、Product Hunt 发布

---

## 截图清单

### 1. Hero Shot — 首页全貌

- **页面：** `/` (首页)
- **状态：** 空白初始状态，侧边栏展开，简历上传区和 JD 输入区并排显示
- **标注重点：** 黑金配色整体氛围、侧边栏 Logo、双栏布局
- **建议尺寸：** 1920x1080 (16:9)
- **格式：** PNG
- **用途：** README 首图、博客 banner

### 2. 上传完成态 — 数据解析展示

- **页面：** `/`
- **状态：** 简历已上传（显示绿色勾 + 文件名 + 技能标签），JD 已填写（显示公司/职位 + 技能标签），"开始面试"按钮高亮可点击
- **标注重点：** 技能标签的金色/蓝色 pill、文件上传成功状态、GlowButton 金色渐变
- **建议尺寸：** 1920x1080
- **格式：** PNG
- **用途：** README 功能展示、博客"使用流程"配图

### 3. 面试进行中 — 答题界面

- **页面：** `/interview`
- **状态：** 第 2/5 题，难度 MEDIUM（金色标签），类别"技术考察"，计时器运行中，textarea 中有部分输入内容
- **标注重点：** 进度条金色渐变光效、难度标签、题号、计时器、textarea focus 状态
- **建议尺寸：** 1920x1080
- **格式：** PNG
- **用途：** README 核心功能展示

### 4. AI 反馈 — 实时评分

- **页面：** `/interview`
- **状态：** 提交回答后，显示 AnimatedScore 圆环（85 分）、AI 反馈文字、亮点/改进双栏
- **标注重点：** 分数圆环动画（截取动画中间帧）、亮点绿色/改进红色对比、"下一题"按钮
- **建议尺寸：** 1920x1080
- **格式：** PNG
- **用途：** README 核心功能展示、博客"AI 评估"配图

### 5. 面试报告 — 综合得分

- **页面：** `/report/[sessionId]`
- **状态：** 报告加载完成，综合得分 82 分（大号圆环），雷达图显示三维能力分布
- **标注重点：** 大号 AnimatedScore、雷达图金色填充区域、双栏布局
- **建议尺寸：** 1920x1080
- **格式：** PNG
- **用途：** README 报告展示、博客"数据看板"配图

### 6. 面试报告 — 详细分析

- **页面：** `/report/[sessionId]`（滚动到下半部分）
- **状态：** 各环节得分进度条（AnimatedProgress）、优势/待改进列表、改进建议列表
- **标注重点：** 进度条渐变光效、绿色优势/红色待改进/蓝色建议的语义色区分
- **建议尺寸：** 1920x1080
- **格式：** PNG
- **用途：** README 报告展示

### 7. 历史记录 — 多次面试

- **页面：** `/history`
- **状态：** 3-5 条历史记录，包含已完成（绿色标签 + 分数）和进行中（金色标签）
- **标注重点：** 列表卡片 hover 效果（截取 hover 态）、分数颜色分级、状态标签
- **建议尺寸：** 1920x1080
- **格式：** PNG
- **用途：** README 功能展示

### 8. 动效 GIF — 答题到评分流程

- **页面：** `/interview`
- **状态：** 录制从"提交回答" -> loading -> 分数圆环动画 -> 反馈展开的完整流程
- **标注重点：** 动画流畅性、数字滚动效果、卡片展开过渡
- **建议尺寸：** 800x600 (裁剪主内容区)
- **格式：** GIF 或 WebM（< 5MB）
- **用途：** README 动效展示、Product Hunt 动图

---

## 截图规范

### 浏览器设置
- 使用 Chrome DevTools 设备模拟，固定 1920x1080 视口
- 隐藏浏览器 UI（使用全屏截图工具或 DevTools Capture）
- 确保字体渲染为 subpixel antialiasing

### 数据准备
- 使用 Mock 数据，确保中文内容真实可信（不要用 Lorem ipsum）
- 分数分布合理：综合 82，自我介绍 78，技术考察 85，场景题 80
- 技能标签使用真实技术栈：React、TypeScript、Node.js、Python 等

### 后处理
- 不加水印
- 不加设备 mockup frame（保持干净）
- 可选：添加微妙的阴影底衬（`box-shadow: 0 20px 60px rgba(0,0,0,0.5)`）
- GIF 帧率 15fps，循环播放

### 文件命名
```
screenshot-01-hero.png
screenshot-02-upload-done.png
screenshot-03-interview.png
screenshot-04-feedback.png
screenshot-05-report-score.png
screenshot-06-report-detail.png
screenshot-07-history.png
screenshot-08-flow.gif
```

---

**设计师签名：** UI Designer (Matias Duarte)
**下一步：** DHH 完成 P0 修复后，再进行截图采集
