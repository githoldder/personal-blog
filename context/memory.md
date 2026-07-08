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

## 初心归档与产品章程化 (2026-07-03)

**决策：** 将 Obsidian 中的 `personal-blog/idea.md` 确认为 Personal Knowledge Asset OS 的上位产品初心，并整理为 `prds/project-charter.md` 与 `prds/master-prd.md`。

**原始意图：**
- 第一目的：可靠展示简历 PDF，并探索结构化源数据到 PDF 的热更新预览。
- 第二目的：完整展示技术面，将 GitHub 项目转化为可演示、可预览、可下载的项目路演资产。
- 第三目的：同步 Obsidian 笔记库、经验库和多媒体资产，在本地维护的同时投影到 personal-site。
- 第四目的：尝试更极客的知识图谱与语义智能体验，包括聚类、向量嵌入、3D 可视化、手势控制和类似 Jarvis 的知识 cockpit。

**影响：**
- 后续 S08-S14 不只是功能堆叠，而是围绕“个人知识资产操作系统”的长期产品路线展开。
- 公开网站必须优先保证简历、项目、笔记和阅读体验可访问；实验室能力只能作为增强，不可破坏核心路径。
- 私有 Obsidian 真源与公开网站投影必须通过 publish manifest、source record、隐私过滤和本地/云端适配器明确隔离。

## 前端阅读体验修复与远端归档 (2026-07-03)

**决策：** 网站前端不应依赖用户本地 Obsidian 才能阅读笔记；`obsidian://`、本地路径、插件原始数据都不应出现在公开阅读体验中。

**执行：**
- 修复 `notes/[slug].astro` 的阅读页体验，增加 Wattenberger 风格的长文阅读节奏。
- 清理 Excalidraw 插件噪声和 Obsidian block id。
- 使用 Playwright 对目标笔记页做端到端检查，确认非 404、无控制台错误、无本地链接泄漏。
- 将当前版本提交为 `f087d1c archive: capture immersive knowledge site snapshot` 并推送至 `githoldder/personal-blog`。

## 首页星链、音乐频谱与书封本地化 (2026-07-08)

**决策：** 首页首屏从单列长文案调整为左右分栏，右侧用轻量 CSS/SVG 星链动画表达知识图谱入口，而不是在首屏加载完整图谱 React 岛。

**执行：**
- 将 resume 入口压缩为专业的短入口，减少首屏下方空间占用。
- 新增可点击的 Semantic Starlink 预览，连接 Resume、Projects、Notes、Graph、Library、Music。
- 音乐播放器升级为唱片 + 频谱 + lyric/waveform surface；`/music` 支持 provider、外链音频 URL、歌词线和本地 synth tone 配置。
- 外部音乐策略采用“可配置直链/免费 API 输出 + 本地合成 fallback”，不默认嵌入 QQ 音乐专有流媒体。
- 书封同步脚本升级为 Google Books + Open Library 双源抓取，封面下载到 `public/assets/book-covers`，并保持有本地 PDF 的书籍优先打开本地 PDF。

**影响：**
- S18 的 homepage command center、library shelf 和 media/music tools 进入局部实现状态。
- 后续如果要接入具体音乐 API，只需在设置页写入合法可播放的音频 URL，不需要改首页组件。
