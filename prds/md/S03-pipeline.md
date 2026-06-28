# Sprint 03: Asset Build Pipeline

**Status:** In Progress
**Created:** 2026-06-27

## Objective

把内容真源到多端输出的核心构建管线做成可用闭环，使简历、演示文稿、笔记和项目都能从 `content/` 稳定生成 Web 与静态资产。

## Phase Mapping

对应大目标 **Phase 2: Pipeline**。

## Milestones

- [x] **M01: Resume pipeline** — 简历 YAML 校验与 Web/PDF 产物
- [x] **M02: Deck pipeline** — 演示文稿元数据与本地输出清单
- [ ] **M03: Content collections** — 笔记与项目内容集合
- [ ] **M04: Pipeline verification** — 构建编排与回归校验

## Tasks

| ID | Title | Status |
|----|-------|--------|
| S03-T01 | Make resume YAML validation explicit | Done |
| S03-T02 | Generate resume web and PDF artifacts | Done |
| S03-T03 | Define deck metadata and build manifest | Done |
| S03-T04 | Make deck outputs browsable | Done |
| S03-T05 | Promote notes and projects to typed content collections | Done |
| S03-T06 | Add asset build orchestration | Todo |
| S03-T07 | Add pipeline regression checks | Todo |

## Acceptance Criteria

1. Resume, decks, notes and projects all read from `content/` as source of truth.
2. Generated assets are reproducible through npm scripts.
3. Pages render real content metadata rather than placeholder copy.
4. Optional local dependency blockers are documented with exact commands and expected outputs.
5. `npm run validate:prd` passes.

## Notes

- 本 sprint 不做 3D 图谱、MediaPipe、WebGPU 或生产部署。
- S03-T03 已生成 `public/assets/decks/manifest.json`，Slidev HTML/PDF 导出仍留给后续本地构建步骤。
- S03-T05 已通过 Astro content collections 从 `content/notes/` 与 `content/projects/` 渲染真实元数据。
- JSON 文件是执行真源；本 MD 仅做评审摘要。
