# Sprint 12: Public Deployment and Release Operations

**Status:** In Progress
**Created:** 2026-07-02

## Objective

在严格遵守 L4 人类授权的前提下，将用户端部署到公网，完成生产 SEO、资产策略、回滚演练和上线留档。

## Phase Mapping

对应大目标 **Phase 11: Public Deployment & Release Operations**。

## Milestones

- [x] **M01: Deployment preparation** — 部署准备
- [ ] **M02: Release execution and rollback** — 发布执行与回滚

## Tasks

| ID | Title | Status |
|----|-------|--------|
| S12-T01 | Prepare Cloudflare or Vercel deployment configuration | Done |
| S12-T02 | Finalize production SEO and feed checks | Done |
| S12-T03 | Define R2 or CDN large asset strategy | Done |
| S12-T04 | Create release report and approval gate | Done |
| S12-T05 | Execute deployment only after approval | Todo |
| S12-T06 | Run production smoke test and rollback drill | Todo |

## Acceptance Criteria

1. 用户端可部署到公网，管理端不默认公网暴露。
2. 发布必须记录人类授权、commit hash、部署 URL 和回滚路径。
3. SEO、Feeds、Sitemap、Robots 和大资产策略在生产前完成核查。
4. 回滚演练真实可执行。

## Notes

- S12-T05 是 L4 外部写入任务，Agent 不得静默执行。
