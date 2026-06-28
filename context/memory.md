# Long-Term Memory — Personal Knowledge Asset OS

> 关键决策归档，保留最新活跃上下文。

## 项目重定义 (2026-06-26)

**决策：** 将项目从"个人博客"重新定义为"Personal Knowledge Asset OS"

**原因：**
- 博客定位过窄，无法覆盖简历、项目、演示文稿等多元资产
- 需要统一的数据底座和构建管线
- 博客只是公开展示层，背后需要操作系统级的基础设施

**影响：**
- 核心闭环：内容真源 → 构建管线 → 多端输出
- 目录结构：content/ 统一存放所有内容真源
- 技术选型：Astro（静态优先）+ React Islands（交互）+ TailwindCSS（样式）

## 技术栈确认 (2026-06-26)

**决策：** 采用 Astro + React Islands + TailwindCSS

**原因：**
- Astro：静态优先，Islands 架构，适合内容型站点
- React Islands：按需交互，不增加全局 bundle
- TailwindCSS：原子化样式，快速迭代

**替代方案（已排除）：**
- Next.js：过于重量级，SSR 对本项目非必要
- Pure Astro：交互需求需要 React 支撑
- Vue：团队偏好/生态考虑

## 内容真源策略 (2026-06-26)

**决策：** 所有内容真源统一放在 `content/` 目录

**原因：**
- 单一来源，避免数据分散
- 构建管线从 content/ 读取，输出到 public/assets/
- 便于版本管理和备份

**子目录划分：**
- `content/resume/` — 简历（YAML + Typst）
- `content/notes/` — 笔记（Markdown）
- `content/projects/` — 项目（Markdown）
- `content/decks/` — 演示文稿（Markdown）

## 简历方案 (2026-06-26)

**决策：** 采用 YAML 数据源 + Typst 模板生成 PDF

**原因：**
- YAML：结构化数据，便于程序读取和版本管理
- Typst：高质量排版，LaTeX 的现代替代
- PDF 输出：标准格式，便于分享和打印

**管线：** resume.yaml + template.typ → build-resume.js → public/assets/resume.pdf

## 第一阶段边界 (2026-06-26)

**决策：** 第一阶段聚焦地基，不实现 3D/MediaPipe/WebGPU

**原因：**
- 实验性功能需要稳定地基支撑
- 避免过早陷入炫技，偏离核心价值
- 先建立内容管理闭环，再扩展可视化

**预留：**
- `/lab/graph` 页面路由
- `semantic_graph.json` 接口约定
- `src/lib/semantic/` 工具库目录

## 部署策略 (2026-06-26)

**决策：** 第一阶段本地构建，后续考虑 Cloudflare Pages / Vercel

**原因：**
- 第一阶段不需要复杂部署
- Astro 静态构建，任何静态托管即可
- 后续根据实际情况选择部署平台

**资产方案（规划）：**
- PicGo + Cloudflare R2 存储生成资产
- Obsidian Git 同步内容真源
