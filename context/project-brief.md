# Project Brief — Personal Knowledge Asset OS

## 产品定位

Personal Knowledge Asset OS（个人知识资产操作系统）是一个统一管理个人知识资产的基础设施。它不是博客，而是将笔记、简历、项目、演示文稿、语义图谱统一管理的操作系统。

**一句话定位：** 以内容真源为核心，通过构建管线实现多端输出的个人知识资产操作系统。

## 核心闭环

```
内容真源 (content/)
    ↓
构建管线 (scripts/)
    ↓
资产目录 (public/assets/)
    ↓
多端输出 (Web / PDF / Slides / Graph)
```

## 第一阶段目标（S01 — Foundation）

建立工程骨架与治理结构，为后续功能迭代打下坚实地基。

**具体目标：**
1. 建立 Agent 治理结构（Agent.md、context、PRD 双板）
2. 初始化 Astro + React + TailwindCSS 工程
3. 建立内容真源目录结构
4. 定义简历数据模型（YAML）与 Typst 模板
5. 定义演示文稿 Markdown 格式与构建约定
6. 建立基础页面路由
7. 输出部署规划文档
8. 预留语义图谱接口与目录

## 非目标（第一阶段不做）

| 不做 | 原因 |
|------|------|
| 3D 语义图谱渲染 | 实验性功能，地基优先 |
| MediaPipe 手势识别 | 实验性功能，地基优先 |
| WebGPU 语义计算 | 实验性功能，地基优先 |
| 营销型大首页 | 定位是工作台，不是落地页 |
| 紫蓝渐变、发光球等装饰 | 克制风格，工程工具感 |
| 多云容灾 | 第一阶段只保留规划 |
| 真实 embedding 计算 | 第一阶段只预留接口 |
| CI/CD 自动化 | 第一阶段手动部署 |

## 技术分期

### Phase 1: Foundation（当前）
- Astro 工程骨架
- 内容真源目录
- 简历 YAML → Typst → PDF 管线（占位）
- 演示文稿 Markdown 构建管线（占位）
- 基础页面与路由
- 部署规划

### Phase 2: Pipeline
- 简历 Typst 构建真正可用
- Slidev 演示文稿构建
- 笔记/项目内容集合
- 基础样式与排版

### Phase 3: Lab（实验性）
- 语义图谱构建（embedding 预计算）
- 3D 图谱可视化（Three.js / WebGL）
- MediaPipe 手势映射
- WebGPU 语义计算（如浏览器支持）

### Phase 4: Polish
- 响应式设计优化
- 搜索功能
- RSS / Atom 订阅
- 性能优化与 SEO

## 核心数据模型

```yaml
# 简历数据模型 (content/resume/resume.yaml)
basics:
  name: string
  label: string
  email: string
  phone: string
  url: string
  summary: string
  location: string

education:
  - institution: string
    area: string
    studyType: string
    startDate: date
    endDate: date

experience:
  - company: string
    position: string
    startDate: date
    endDate: date
    summary: string
    highlights: string[]

projects:
  - name: string
    description: string
    highlights: string[]
    keywords: string[]
    startDate: date
    endDate: date
    type: string
    url: string

skills:
  - name: string
    level: string
    keywords: string[]
```

## 关键决策

| 日期 | 决策 | 原因 |
|------|------|------|
| 2026-06-26 | 项目重定义为 Knowledge Asset OS | 博客定位过窄，需统一资产底座 |
| 2026-06-26 | 第一阶段聚焦地基 | 避免过早陷入炫技功能 |
| 2026-06-26 | 技术栈 Astro + React + Tailwind | 静态优先、Islands 交互、原子化样式 |
| 2026-06-26 | 内容真源统一在 content/ | 单一来源，多端输出 |
| 2026-06-26 | 简历用 YAML + Typst | 结构化数据 + 高质量排版 |
