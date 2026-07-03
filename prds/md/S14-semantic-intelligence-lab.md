# Sprint 14: Semantic Intelligence, 3D Modeling and Embodied Interaction Lab

**Status:** In Progress
**Created:** 2026-07-02

## Objective

在不偏离 Personal Knowledge Asset OS 初始设想的前提下，正式实现语义智能实验室能力：向量嵌入、聚类分类、大语言模型 Agent、Three.js 3D 知识图谱、WebGPU 本地计算、MediaPipe 手势识别和科学可视化分析。

## Phase Mapping

对应大目标 **Phase 13: Semantic Intelligence & Embodied Lab**。

## Milestones

- [ ] **M01: Semantic computation foundation** — 语义计算基础
- [ ] **M02: 3D graph and embodied interaction** — 3D 图谱与具身交互
- [ ] **M03: Science visualization and Agent workflows** — 科学可视化与 Agent 工作流

## Tasks

| ID | Title | Status |
|----|-------|--------|
| S14-T01 | Build embedding-ready corpus and chunk pipeline | Done |
| S14-T02 | Implement vector embedding and similarity index prototype | Done |
| S14-T03 | Add clustering and topic modeling layer | Done |
| S14-T04 | Implement Three.js 3D knowledge graph prototype | In Progress |
| S14-T05 | Add MediaPipe gesture navigation experiment | In Progress |
| S14-T06 | Prototype WebGPU local semantic analytics | In Progress |
| S14-T07 | Design and implement local LLM Agent workflow prototype | Done |

## Acceptance Criteria

1. 原项目简介中的 embedding、3D Graph、MediaPipe、WebGPU 与 Agent 方向被明确实现，而不是永久搁置。
2. 所有实验能力默认关闭，必须 opt-in，并保留 2D/鼠标/键盘/静态分析 fallback。
3. 向量、聚类、图谱和 Agent 输出都不得突破 publish manifest 的公开边界。
4. LLM 和 embedding 的远程模型调用必须先经过人类审批，默认优先本地或 fixture 驱动。
5. 3D 与手势交互必须通过性能、可访问性、权限释放和视觉渲染门禁。

## Notes

- S14 是原始 Semantic Lab 愿景的正式产品化阶段。
- 它不替代 S07-S13，而是在基础双端、预览、质量、部署和文档之后进入高阶智能与交互实验。
