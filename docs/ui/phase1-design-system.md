# Interview Copilot — Phase 1 设计系统

**设计师：** UI Designer (Matías Duarte)
**版本：** v1.0
**日期：** 2026-03-04
**适用范围：** MVP Phase 1 — 桌面端优先

---

## 设计哲学

这是一个面向校招求职者的 AI 面试助手，视觉语言需要传达：

1. **专业可信** — 黑金配色营造高端、严肃的面试氛围
2. **数据驱动** — 金融数据看板风格，强调实时反馈和量化评估
3. **即时反馈** — 动效赋予意义，每个交互都有清晰的视觉响应
4. **层级清晰** — Material Design 的物理隐喻，用阴影和层级传达信息重要性

---

## 一、配色方案

### 1.1 主色系统

| 色彩角色 | 色值 | 用途 | Tailwind 类名 |
|---------|------|------|--------------|
| **背景主色** | `#0a0a0a` | 页面背景、卡片背景 | `bg-[#0a0a0a]` |
| **背景次级** | `#1a1a1a` | 卡片、面板、输入框背景 | `bg-[#1a1a1a]` |
| **背景三级** | `#2a2a2a` | Hover 状态、分隔线 | `bg-[#2a2a2a]` |

| 色彩角色 | 色值 | 用途 | Tailwind 类名 |
|---------|------|------|--------------|
| **金色主色** | `#d4af37` | CTA 按钮、重要数据、高亮 | `text-[#d4af37]` `bg-[#d4af37]` |
| **金色辅助** | `#f4d03f` | Hover 状态、光效 | `text-[#f4d03f]` |
| **金色暗调** | `#b8941f` | 禁用状态、次要强调 | `text-[#b8941f]` |

| 色彩角色 | 色值 | 用途 | Tailwind 类名 |
|---------|------|------|--------------|
| **蓝色主色** | `#1e90ff` | 链接、信息提示、进度条 | `text-[#1e90ff]` `bg-[#1e90ff]` |
| **蓝色辅助** | `#4da6ff` | Hover 状态 | `text-[#4da6ff]` |
| **蓝色暗调** | `#0d6ecc` | Active 状态 | `text-[#0d6ecc]` |

### 1.2 语义色系统

| 语义 | 色值 | 用途 | Tailwind 类名 |
|------|------|------|--------------|
| **成功** | `#10b981` | 高分、通过、正确答案 | `text-emerald-500` `bg-emerald-500` |
| **警告** | `#f59e0b` | 中等分数、需改进 | `text-amber-500` `bg-amber-500` |
| **错误** | `#ef4444` | 低分、失败、错误 | `text-red-500` `bg-red-500` |
| **信息** | `#3b82f6` | 提示、说明 | `text-blue-500` `bg-blue-500` |

### 1.3 文本色系统

| 层级 | 色值 | 用途 | Tailwind 类名 |
|------|------|------|--------------|
| **主文本** | `#ffffff` | 标题、重要内容 | `text-white` |
| **次文本** | `#a0a0a0` | 正文、描述 | `text-[#a0a0a0]` |
| **辅助文本** | `#6a6a6a` | 提示、标签、时间戳 | `text-[#6a6a6a]` |
| **禁用文本** | `#4a4a4a` | 禁用状态 | `text-[#4a4a4a]` |

### 1.4 配色使用原则

1. **黑色背景为主** — 减少视觉疲劳，突出内容
2. **金色用于强调** — 仅用于 CTA、高分、重要数据，不超过页面 10%
3. **蓝色用于交互** — 链接、按钮、进度条
4. **语义色精准使用** — 绿色=好，黄色=中，红色=差，不混用
5. **对比度保证** — 所有文本与背景对比度 ≥ 4.5:1（WCAG AA 标准）

---

## 二、核心组件设计

### 2.1 QuestionCard（面试题目卡片）

**设计意图：** 模拟真实面试场景，卡片翻转营造"抽题"仪式感。

**视觉规范：**
```tsx
// 组件结构
<div className="question-card">
  <div className="card-header">
    <span className="question-type">技能测试</span>
    <span className="question-number">第 3/12 题</span>
  </div>
  <div className="card-body">
    <h3 className="question-title">解释 Python 的 GIL 机制及其影响</h3>
    <p className="question-hint">提示：从多线程并发角度回答</p>
  </div>
  <div className="card-footer">
    <span className="time-limit">建议用时：2 分钟</span>
  </div>
</div>

// Tailwind CSS 类名
className="
  relative w-full max-w-3xl mx-auto
  bg-[#1a1a1a] rounded-2xl
  border border-[#2a2a2a]
  shadow-[0_8px_32px_rgba(212,175,55,0.1)]
  p-8
  transition-all duration-300
  hover:shadow-[0_12px_48px_rgba(212,175,55,0.15)]
  hover:border-[#d4af37]
"
```

**层级结构：**
- 卡片背景：`#1a1a1a`，elevation 2
- 边框：默认 `#2a2a2a`，hover 时变为金色 `#d4af37`
- 阴影：金色光晕，hover 时增强

**动效规范（Framer Motion）：**
```tsx
const cardVariants = {
  hidden: { opacity: 0, y: 20, rotateY: -15 },
  visible: {
    opacity: 1,
    y: 0,
    rotateY: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1] // Material Design easing
    }
  },
  flip: {
    rotateY: 180,
    transition: { duration: 0.6, ease: "easeInOut" }
  }
}
```

---

### 2.2 ScorePanel（实时得分面板）

**设计意图：** 金融数据看板风格，数字滚动动画营造"实时计算"感。

**视觉规范：**
```tsx
<div className="score-panel">
  <div className="score-main">
    <span className="score-value">87</span>
    <span className="score-unit">/100</span>
  </div>
  <div className="score-breakdown">
    <div className="score-item">
      <span className="label">技术准确性</span>
      <span className="value">35/40</span>
    </div>
    <div className="score-item">
      <span className="label">表达清晰度</span>
      <span className="value">26/30</span>
    </div>
    <div className="score-item">
      <span className="label">结构完整性</span>
      <span className="value">18/20</span>
    </div>
    <div className="score-item">
      <span className="label">深度与广度</span>
      <span className="value">8/10</span>
    </div>
  </div>
</div>

// 主分数样式
className="
  text-6xl font-bold
  bg-gradient-to-br from-[#d4af37] to-[#f4d03f]
  bg-clip-text text-transparent
  tabular-nums // 等宽数字
"

// 面板容器
className="
  bg-[#1a1a1a] rounded-xl
  border border-[#2a2a2a]
  p-6
  shadow-[0_4px_24px_rgba(0,0,0,0.4)]
"
```

**数字滚动动画：**
```tsx
import { animate } from "framer-motion"

const animateScore = (from: number, to: number, onUpdate: (value: number) => void) => {
  animate(from, to, {
    duration: 1.2,
    ease: "easeOut",
    onUpdate: (latest) => onUpdate(Math.round(latest))
  })
}
```

**分数颜色映射：**
- 90-100 分：金色渐变 `from-[#d4af37] to-[#f4d03f]`
- 70-89 分：蓝色渐变 `from-[#1e90ff] to-[#4da6ff]`
- 50-69 分：黄色 `text-amber-500`
- <50 分：红色 `text-red-500`

---

### 2.3 RadarChart（技能雷达图）

**设计意图：** 可视化技能短板，一眼看出需要加强的方向。

**视觉规范：**
```tsx
// 使用 recharts 库
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts'

<RadarChart width={400} height={400} data={skillData}>
  <PolarGrid stroke="#2a2a2a" />
  <PolarAngleAxis
    dataKey="skill"
    tick={{ fill: '#a0a0a0', fontSize: 12 }}
  />
  <PolarRadiusAxis
    angle={90}
    domain={[0, 100]}
    tick={{ fill: '#6a6a6a' }}
  />
  <Radar
    name="得分"
    dataKey="score"
    stroke="#d4af37"
    fill="#d4af37"
    fillOpacity={0.3}
    strokeWidth={2}
  />
</RadarChart>
```

**配色方案：**
- 网格线：`#2a2a2a`（低对比度，不抢眼）
- 数据区域：金色填充 `#d4af37`，透明度 30%
- 数据边线：金色 `#d4af37`，2px 粗
- 轴标签：次文本色 `#a0a0a0`

**容器样式：**
```tsx
className="
  bg-[#1a1a1a] rounded-xl
  border border-[#2a2a2a]
  p-6
  flex items-center justify-center
"
```

---

### 2.4 ProgressBar（进度条动画）

**设计意图：** 实时反馈面试进度，渐变光效营造"能量积累"感。

**视觉规范：**
```tsx
<div className="progress-container">
  <div className="progress-bar">
    <div className="progress-fill" style={{ width: `${progress}%` }}>
      <div className="progress-glow"></div>
    </div>
  </div>
  <span className="progress-text">{progress}%</span>
</div>

// 容器
className="
  w-full h-2
  bg-[#2a2a2a]
  rounded-full
  overflow-hidden
  relative
"

// 填充条
className="
  h-full
  bg-gradient-to-r from-[#1e90ff] via-[#4da6ff] to-[#d4af37]
  rounded-full
  transition-all duration-500 ease-out
  relative
"

// 光效层
className="
  absolute inset-0
  bg-gradient-to-r from-transparent via-white to-transparent
  opacity-30
  animate-shimmer
"
```

**光效动画（Tailwind 配置）：**
```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        }
      },
      animation: {
        shimmer: 'shimmer 2s infinite'
      }
    }
  }
}
```

---

## 三、动效规范

### 3.1 动效原则

1. **有意义的动效** — 每个动画都传递信息（加载、成功、错误、进度）
2. **物理直觉** — 遵循真实世界的加速度和惯性
3. **性能优先** — 使用 `transform` 和 `opacity`，避免触发 reflow
4. **可访问性** — 尊重 `prefers-reduced-motion` 设置

### 3.2 动效时长标准

| 动效类型 | 时长 | Easing | 用途 |
|---------|------|--------|------|
| **微交互** | 150ms | `ease-out` | Hover、Focus、点击反馈 |
| **过渡** | 300ms | `ease-in-out` | 页面切换、卡片展开 |
| **强调** | 500ms | `cubic-bezier(0.25, 0.1, 0.25, 1)` | 数字滚动、进度条 |
| **叙事** | 800ms+ | `ease-in-out` | 卡片翻转、雷达图绘制 |

### 3.3 核心动效实现

#### 数字滚动（CountUp）
```tsx
import { useEffect, useState } from 'react'
import { animate } from 'framer-motion'

export const CountUp = ({ value, duration = 1.2 }: { value: number, duration?: number }) => {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const controls = animate(0, value, {
      duration,
      ease: "easeOut",
      onUpdate: (latest) => setDisplayValue(Math.round(latest))
    })
    return () => controls.stop()
  }, [value, duration])

  return <span className="tabular-nums">{displayValue}</span>
}
```

#### 卡片翻转（Flip Card）
```tsx
import { motion } from 'framer-motion'

export const FlipCard = ({ front, back, isFlipped }) => (
  <motion.div
    className="relative w-full h-64"
    initial={false}
    animate={{ rotateY: isFlipped ? 180 : 0 }}
    transition={{ duration: 0.6, ease: "easeInOut" }}
    style={{ transformStyle: "preserve-3d" }}
  >
    <div className="absolute inset-0" style={{ backfaceVisibility: "hidden" }}>
      {front}
    </div>
    <div
      className="absolute inset-0"
      style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
    >
      {back}
    </div>
  </motion.div>
)
```

#### 渐变光效（Shimmer）
```tsx
// Tailwind 类名
className="
  relative overflow-hidden
  before:absolute before:inset-0
  before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent
  before:translate-x-[-100%]
  hover:before:animate-[shimmer_1.5s_ease-in-out]
"
```

---

## 四、布局规范

### 4.1 整体布局（桌面端）

```
┌─────────────────────────────────────────────────────────┐
│  Header (64px)                                          │
│  Logo | 面试进度 | 用户头像                              │
├──────────┬──────────────────────────┬───────────────────┤
│          │                          │                   │
│  左侧导航 │      主内容区域           │   右侧数据面板     │
│  (240px) │      (flex-1)            │   (320px)         │
│          │                          │                   │
│  - 首页   │  QuestionCard           │  ScorePanel       │
│  - 面试   │  AnswerInput            │  ProgressBar      │
│  - 报告   │  FeedbackBox            │  TimerDisplay     │
│  - 设置   │                          │  SkillTags        │
│          │                          │                   │
│  (固定)   │  (滚动)                  │  (固定)           │
│          │                          │                   │
└──────────┴──────────────────────────┴───────────────────┘
```

### 4.2 间距系统（基于 8px 网格）

| 间距名称 | 数值 | Tailwind 类名 | 用途 |
|---------|------|--------------|------|
| xs | 4px | `space-1` | 图标与文字间距 |
| sm | 8px | `space-2` | 标签、小组件内边距 |
| md | 16px | `space-4` | 卡片内边距、段落间距 |
| lg | 24px | `space-6` | 组件间距 |
| xl | 32px | `space-8` | 区块间距 |
| 2xl | 48px | `space-12` | 页面区域间距 |

### 4.3 圆角系统

| 圆角名称 | 数值 | Tailwind 类名 | 用途 |
|---------|------|--------------|------|
| 小圆角 | 4px | `rounded` | 按钮、标签 |
| 中圆角 | 8px | `rounded-lg` | 输入框、小卡片 |
| 大圆角 | 12px | `rounded-xl` | 主卡片、面板 |
| 超大圆角 | 16px | `rounded-2xl` | QuestionCard |
| 全圆角 | 9999px | `rounded-full` | 头像、进度条 |

### 4.4 阴影系统

| 阴影名称 | CSS 值 | 用途 |
|---------|--------|------|
| 悬浮 | `0 2px 8px rgba(0,0,0,0.2)` | 按钮、小卡片 |
| 卡片 | `0 4px 24px rgba(0,0,0,0.4)` | QuestionCard、面板 |
| 强调 | `0 8px 32px rgba(212,175,55,0.1)` | 金色光晕（hover） |
| 深层 | `0 12px 48px rgba(0,0,0,0.6)` | 模态框、弹窗 |

---

## 五、响应式布局

### 5.1 断点系统

| 断点 | 宽度 | Tailwind 前缀 | 布局调整 |
|------|------|--------------|---------|
| 桌面端 | ≥1280px | `xl:` | 三栏布局（左导航 + 主内容 + 右面板） |
| 笔记本 | 1024-1279px | `lg:` | 两栏布局（主内容 + 右面板，导航折叠） |
| 平板 | 768-1023px | `md:` | 单栏布局，右面板移至底部 |
| 手机 | <768px | `sm:` | 单栏布局，导航变为底部 Tab |

### 5.2 移动端适配（Phase 2）

当前 MVP 专注桌面端，移动端适配延后。但设计时预留响应式能力：

```tsx
// 响应式容器示例
className="
  w-full max-w-7xl mx-auto
  px-4 sm:px-6 lg:px-8
  grid grid-cols-1 lg:grid-cols-3 gap-6
"
```

---

## 六、排版系统

### 6.1 字体家族

```css
/* 主字体 */
font-family:
  'Inter',
  -apple-system,
  BlinkMacSystemFont,
  'Segoe UI',
  'Microsoft YaHei',
  sans-serif;

/* 等宽字体（代码、数字） */
font-family:
  'JetBrains Mono',
  'Fira Code',
  'Consolas',
  monospace;
```

### 6.2 字号系统

| 用途 | 字号 | 行高 | Tailwind 类名 |
|------|------|------|--------------|
| 大标题 | 48px | 1.2 | `text-5xl` |
| 页面标题 | 36px | 1.3 | `text-4xl` |
| 区块标题 | 24px | 1.4 | `text-2xl` |
| 卡片标题 | 20px | 1.5 | `text-xl` |
| 正文 | 16px | 1.6 | `text-base` |
| 小字 | 14px | 1.5 | `text-sm` |
| 辅助文本 | 12px | 1.4 | `text-xs` |

### 6.3 字重系统

| 用途 | 字重 | Tailwind 类名 |
|------|------|--------------|
| 标题 | 700 | `font-bold` |
| 强调 | 600 | `font-semibold` |
| 正文 | 400 | `font-normal` |
| 辅助 | 300 | `font-light` |

---

## 七、无障碍性检查清单

### 7.1 颜色对比度

- [ ] 所有文本与背景对比度 ≥ 4.5:1（WCAG AA）
- [ ] 大文本（≥18px）对比度 ≥ 3:1
- [ ] 交互元素（按钮、链接）对比度 ≥ 3:1
- [ ] 不仅依赖颜色传递信息（配合图标、文字）

### 7.2 键盘导航

- [ ] 所有交互元素可通过 Tab 键访问
- [ ] Focus 状态有清晰的视觉反馈（金色边框）
- [ ] 支持 Enter/Space 触发按钮
- [ ] 支持 Esc 关闭模态框

### 7.3 屏幕阅读器

- [ ] 所有图片有 `alt` 属性
- [ ] 交互元素有 `aria-label`
- [ ] 动态内容更新使用 `aria-live`
- [ ] 表单输入有关联的 `<label>`

### 7.4 动效可访问性

```tsx
// 尊重用户的动效偏好
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

const transition = prefersReducedMotion
  ? { duration: 0 }
  : { duration: 0.5, ease: "easeOut" }
```

### 7.5 色盲友好

- [ ] 不仅用红绿区分成功/失败（配合图标 ✓/✗）
- [ ] 雷达图使用纹理/图案辅助颜色
- [ ] 提供高对比度模式（可选）

---

## 八、设计资源

### 8.1 Tailwind 配置

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0a0a0a',
        'bg-secondary': '#1a1a1a',
        'bg-tertiary': '#2a2a2a',
        'gold': {
          DEFAULT: '#d4af37',
          light: '#f4d03f',
          dark: '#b8941f',
        },
        'blue-primary': '#1e90ff',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'gold-glow': '0 8px 32px rgba(212, 175, 55, 0.1)',
        'gold-glow-lg': '0 12px 48px rgba(212, 175, 55, 0.15)',
      },
    },
  },
}
```

### 8.2 Framer Motion 预设

```tsx
// lib/motion-presets.ts
export const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
}

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } }
}

export const slideInRight = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4 } }
}
```

### 8.3 组件库推荐

| 组件 | 库 | 理由 |
|------|-----|------|
| 图表 | Recharts | 轻量、可定制、React 原生 |
| 动画 | Framer Motion | 声明式、性能好、易用 |
| 图标 | Lucide React | 现代、一致、树摇优化 |
| 表单 | React Hook Form | 性能好、验证强大 |
| 样式 | Tailwind CSS | 快速、一致、可维护 |

---

## 九、实现优先级

### Phase 1（MVP）
1. ✅ 配色系统
2. ✅ QuestionCard 组件
3. ✅ ScorePanel 组件
4. ✅ ProgressBar 组件
5. ✅ 基础布局（三栏）

### Phase 2（优化）
1. RadarChart 组件
2. 卡片翻转动画
3. 数字滚动动画
4. 响应式适配（平板、手机）

### Phase 3（增强）
1. 暗色/亮色主题切换
2. 自定义配色方案
3. 高级动效（粒子效果、光线追踪）
4. 无障碍性全面审计

---

## 十、设计交付物

### 10.1 给 Fullstack 的实现清单

1. **Tailwind 配置文件** — 复制上述配置到 `tailwind.config.js`
2. **组件代码示例** — 参考本文档的 TSX 代码片段
3. **动效预设** — 创建 `lib/motion-presets.ts`
4. **色彩常量** — 创建 `lib/colors.ts` 统一管理色值
5. **无障碍性测试** — 使用 axe DevTools 检查

### 10.2 设计验收标准

- [ ] 所有页面使用黑金配色
- [ ] QuestionCard 有金色 hover 光晕
- [ ] ScorePanel 数字有滚动动画
- [ ] ProgressBar 有渐变光效
- [ ] 所有交互有 150ms 内的视觉反馈
- [ ] 对比度通过 WCAG AA 标准
- [ ] 支持键盘导航

---

**设计师签名：** UI Designer (Matías Duarte)
**下一步：** 交付给 Fullstack (DHH) 实现组件库
**协作方式：** 如需调整设计，在 `docs/ui/` 下创建新版本文档
