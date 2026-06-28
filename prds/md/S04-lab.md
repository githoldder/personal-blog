# Sprint 04: Semantic Lab

**Status:** Todo
**Created:** 2026-06-27

## Objective

在已有内容管线之上实现可解释的语义图谱实验区，让知识资产之间的关系可以被生成、检查和交互式浏览。

## Phase Mapping

对应大目标 **Phase 3: Lab**。

## Milestones

- [ ] **M01: Semantic graph generation** — 从内容元数据生成图谱
- [ ] **M02: Graph interaction surface** — 可检查、可浏览的图谱页面
- [ ] **M03: Experimental input policy** — MediaPipe/WebGPU 等实验边界

## Tasks

| ID | Title | Status |
|----|-------|--------|
| S04-T01 | Build semantic graph from content metadata | Todo |
| S04-T02 | Add semantic graph validation | Todo |
| S04-T03 | Implement 2D graph browser MVP | Todo |
| S04-T04 | Evaluate 3D graph feasibility | Todo |
| S04-T05 | Define experimental input guardrails | Todo |

## Acceptance Criteria

1. `semantic_graph.json` 由真实内容元数据生成，而不是静态占位。
2. 图谱校验能发现重复节点和悬空边。
3. `/lab/graph` 能渲染非空图谱并允许查看节点详情。
4. 3D、MediaPipe、WebGPU 均有明确进入条件和风险记录。
5. `npm run validate:prd` passes.

## Notes

- 先做可解释的 2D 图谱，再评估 3D。
- 实验能力不能绕过 Sense 权限与外部副作用规则。
