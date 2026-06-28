# Sprint 01: Foundation

> 建立工程骨架与治理结构，为后续功能迭代打下坚实地基。

**Status:** ✅ Done
**Created:** 2026-06-26

---

## Objective

建立 Personal Knowledge Asset OS 的工程骨架与治理结构，包括 Agent 治理、Astro 工程、内容真源、构建管线、基础页面与部署规划。

---

## Milestones

- [x] **M01: 治理结构建立** — Agent.md、context、PRD 双板
- [x] **M02: 工程初始化** — Astro + React + TailwindCSS
- [x] **M03: 内容管线与页面** — 数据模型、构建脚本、路由页面
- [x] **M04: 部署与扩展预留** — 部署文档、语义图谱占位

---

## Tasks

| ID | Title | Status |
|----|-------|--------|
| S01-T01 | Agent governance scaffold | ✅ Done |
| S01-T02 | Astro project scaffold | ✅ Done |
| S01-T03 | Content source-of-truth scaffold | ✅ Done |
| S01-T04 | Resume data and Typst pipeline placeholder | ✅ Done |
| S01-T05 | Slidev deck pipeline placeholder | ✅ Done |
| S01-T06 | Basic pages and routing | ✅ Done |
| S01-T07 | Deployment plan document | ✅ Done |
| S01-T08 | Semantic graph placeholder contract | ✅ Done |

---

## Milestone Details

### M01: 治理结构建立

**Status:** ✅ Done

**Tasks:**
- S01-T01: Agent governance scaffold

**Deliverables:**
- `Agent.md` — Agent 入口文件
- `README.md` — 人类入口文件
- `.agent/` — 治理结构目录
- `context/` — 项目记忆
- `prds/` — PRD 双板

---

### M02: 工程初始化

**Status:** ✅ Done

**Tasks:**
- S01-T02: Astro project scaffold
- S01-T03: Content source-of-truth scaffold

**Deliverables:**
- `package.json` + 依赖配置
- `astro.config.mjs`
- `tsconfig.json`
- `tailwind.config.mjs`
- `src/` 基础结构
- `content/` 内容真源目录

---

### M03: 内容管线与页面

**Status:** ✅ Done

**Tasks:**
- S01-T04: Resume data and Typst pipeline placeholder
- S01-T05: Slidev deck pipeline placeholder
- S01-T06: Basic pages and routing

**Deliverables:**
- `scripts/build-resume.js`
- `scripts/build-decks.js`
- `scripts/build-assets.js`
- 页面: `/`, `/resume`, `/notes`, `/projects`, `/decks`, `/lab/graph`

---

### M04: 部署与扩展预留

**Status:** ✅ Done

**Tasks:**
- S01-T07: Deployment plan document
- S01-T08: Semantic graph placeholder contract

**Deliverables:**
- `docs/deployment-plan.md`
- `scripts/build-semantic-graph.js`
- `public/assets/semantic_graph.json`

---

## Acceptance Criteria

1. Agent.md 存在且包含所有必需章节
2. Astro 工程可正常构建 (`npm run build`)
3. 内容真源目录结构完整
4. 所有构建脚本有清晰的输入/输出约定
5. 基础页面路由正常工作
6. 部署规划文档覆盖所有目标平台
7. 语义图谱占位数据符合约定 schema

---

## Notes

- 第一阶段聚焦地基，不实现 3D/MediaPipe/WebGPU 等实验性功能
- 视觉风格：工程工具感，非营销落地页
- 已有目录（doc/, reveal/）保留不动
- 所有占位脚本必须写清楚输入、输出和未来实现路径
- S01 已在 2026-06-27 对齐为完成状态，S02 进入 Sense v4.0 harness hardening。
