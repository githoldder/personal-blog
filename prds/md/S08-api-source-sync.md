# Sprint 08: RESTful API and Cloud Source Sync

**Status:** Done
**Created:** 2026-07-02

## Objective

建立 RESTful API 与 GitHub Obsidian_vault 云端真源同步层，替代本地硬编码路径，并为管理端提供文件树、内容读取、发布清单与预览接口。

## Phase Mapping

对应大目标 **Phase 7: API & Cloud Source Sync**。

## Milestones

- [~] **M01: API contract and source configuration** — API 契约与真源配置
- [x] **M02: Content normalization and manifest APIs** — 内容归一化与发布清单
- [x] **M03: Preview and security boundary** — 预览接口与安全边界

## Tasks

| ID | Title | Status |
|----|-------|--------|
| S08-T01 | Design RESTful API contract | Done |
| S08-T02 | Configure GitHub Obsidian source adapter | Done |
| S08-T03 | Normalize Markdown metadata and source records | Done |
| S08-T04 | Define publish manifest schema | Done |
| S08-T05 | Implement local API skeleton | Done |
| S08-T06 | Add preview API contracts | Done |
| S08-T07 | Document API security and permissions | Done |

## Acceptance Criteria

1. GitHub Obsidian_vault 能作为云端真源被读取和映射。
2. 本地硬编码 Obsidian 路径被配置化。
3. Source records 为后续 embedding、聚类分类和 LLM Agent 提供稳定 chunk id 与 graph metadata。
4. API 明确区分 L3 外部读取与 L4 外部写入。
5. Publish manifest 成为完整知识库与公网发布投影之间的边界。

## Notes

- 私有仓库 token 不得进入浏览器端。
- 本阶段不做公网部署。
