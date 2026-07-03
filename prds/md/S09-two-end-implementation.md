# Sprint 09: Admin and Public User Two-End Implementation

**Status:** Todo
**Created:** 2026-07-02

## Objective

完成用户端与本地管理端的核心功能开发，使用户端只消费公开投影，管理端负责源内容预览、白名单勾选、发布队列、质量门禁、图谱分类与未来 3D/Agent 能力的产品承载位。

## Phase Mapping

对应大目标 **Phase 8: Two-End Product Implementation**。

## Milestones

- [ ] **M01: Public user surfaces** — 用户端公开界面
- [ ] **M02: Semantic graph and visualization foundations** — 语义图谱与可视化承载
- [ ] **M03: Local admin workflows** — 本地管理端工作流

## Tasks

| ID | Title | Status |
|----|-------|--------|
| S09-T01 | Implement public library and note detail pages | Todo |
| S09-T02 | Implement portfolio and timeline pages | Todo |
| S09-T03 | Upgrade public graph explorer and 3D entry point | Todo |
| S09-T04 | Implement clustering and taxonomy surfaces | Todo |
| S09-T05 | Implement admin source browser | Todo |
| S09-T06 | Implement admin preview and whitelist workflow | Todo |
| S09-T07 | Integrate admin build and verify panel | Todo |

## Acceptance Criteria

1. 用户端只展示 publish manifest 允许的公开内容。
2. 管理端能够浏览源内容、预览内容、管理白名单和发布队列。
3. 用户端图谱具备搜索、过滤、聚类分类和未来 3D 入口。
4. 管理端默认本地优先，不从公网导航暴露。
5. 图谱、Library、作品集、时间线和阅读页形成完整用户端体验。

## Notes

- 管理端写操作是本地写，不等同于远程发布。
