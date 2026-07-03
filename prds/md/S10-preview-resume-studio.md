# Sprint 10: Universal Preview Pipeline and Resume Studio

**Status:** Done
**Created:** 2026-07-02

## Objective

建立多格式预览能力和 Resume Studio，使 Markdown、多媒体、PDF、Typst、LaTeX 与简历模板下载进入可维护的本地工作流。

## Phase Mapping

对应大目标 **Phase 9: Preview Pipeline & Resume Studio**。

## Milestones

- [x] **M01: Universal preview pipeline** — 多格式预览管线
- [x] **M02: Resume and document studio** — 简历与文档工作台

## Tasks

| ID | Title | Status |
|----|-------|--------|
| S10-T01 | Implement rich Markdown preview | Done |
| S10-T02 | Implement media and document preview adapters | Done |
| S10-T03 | Implement Typst and LaTeX compile preview plan | Done |
| S10-T04 | Build Resume Studio interface | Done |
| S10-T05 | Bind evidence files to resume facts | Done |
| S10-T06 | Add resume template download package | Done |

## Acceptance Criteria

1. Markdown、图片、PDF、音视频、代码和常见文档都有安全预览路径或降级模式。
2. Typst 与 LaTeX 编译预览被纳入本地管线。
3. Resume Studio 支持事实源预览、PDF 编译状态和模板下载。
4. 证据链文件可被管理端关联，但不默认公开发布。

## Notes

- 编译产物必须进入受控输出目录，避免污染真源。
