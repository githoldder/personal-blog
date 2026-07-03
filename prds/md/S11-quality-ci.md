# Sprint 11: Testing, Quality Control, Defect Management and CI

**Status:** Todo
**Created:** 2026-07-02

## Objective

建立完整的软件测试体系、质量控制、缺陷管理计划和 CI 验证流水线，使双端系统和内容管线具备可持续演进的工程保障。

## Phase Mapping

对应大目标 **Phase 10: Quality & CI**。

## Milestones

- [ ] **M01: Automated testing expansion** — 自动化测试扩展
- [ ] **M02: Quality governance and CI** — 质量治理与 CI

## Tasks

| ID | Title | Status |
|----|-------|--------|
| S11-T01 | Expand parser and manifest unit tests | Todo |
| S11-T02 | Add integration tests for source to public projection | Todo |
| S11-T03 | Add end-to-end tests for admin and public flows | Todo |
| S11-T04 | Define visual regression and accessibility gates | Todo |
| S11-T05 | Create defect management plan | Todo |
| S11-T06 | Add CI validation pipeline | Todo |

## Acceptance Criteria

1. Parser、manifest、API、preview 和 public projection 有自动化测试覆盖。
2. Admin 到 User 的关键链路可被 E2E 验证。
3. 缺陷管理计划覆盖 UI、API、内容泄露、构建失败和部署失败。
4. CI 只做验证和构建，不执行静默部署或外部写入。

## Notes

- 任何 CI/CD 发布行为仍属于 L4，必须另走 S12 授权门禁。
