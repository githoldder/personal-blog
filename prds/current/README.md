# Current PRD Boundary

Active sprint: S12/S14 gated tail — release approval and semantic lab hardening.

Current priority:

0. Resume rebuild PRD and implementation completed locally in S10.
1. S08-S11 and S13 have local deliverables and CLI verification coverage.
2. S12 remains gated at human-approved deployment and production smoke testing.
3. S14 has deterministic semantic chunks/vector/clusters and lab entry prototypes; real Three.js/WebGPU/MediaPipe hardening remains experimental.
4. Keep private tokens and evidence files out of browser bundles and public packages.
5. All write access must be gated by explicit L4 rules and docs/publication-channel-policy.md.

Non-goals:

- No external public deployment is performed yet.
- No public mutations or remote writes are executed without strict authorization.
- Slidev preview/Typst build PDF workflows remain offline/local in this phase.

## Upcoming Sprint Queue

后续阶段按大目标拆分如下，当前 S08 已进入 active boundary：

| Sprint | Phase | Goal | PRD |
|--------|-------|------|-----|
| S07 | Phase 6: Product Prototype & Visual Direction | Maggie + Amelia 风格的信息架构与纯前端原型 | `prds/json/S07-product-prototype.json` (Done) |
| S08 | Phase 7: API & Cloud Source Sync | RESTful API 与 GitHub Obsidian_vault 云端真源同步 | `prds/json/S08-api-source-sync.json` (Done) |
| S09 | Phase 8: Two-End Product Implementation | Admin/User 双端核心功能 | `prds/json/S09-two-end-implementation.json` (Done) |
| S10 | Phase 9: Preview Pipeline & Resume Studio | 多格式预览、Typst/LaTeX 与简历工作台 | `prds/json/S10-preview-resume-studio.json` (Done) |
| S11 | Phase 10: Quality & CI | 测试体系、缺陷管理与 CI 验证 | `prds/json/S11-quality-ci.json` (Done) |
| S12 | Phase 11: Public Deployment & Release Operations | 公网部署、发布门禁与回滚演练 | `prds/json/S12-public-deployment.json` (In Progress: L4 approval gate) |
| S13 | Phase 12: Documentation & Handoff | 用户/管理员/开发者文档与最终交接 | `prds/json/S13-documentation-handoff.json` (Done) |
| S14 | Phase 13: Semantic Intelligence & Embodied Lab | Embedding、聚类、LLM Agent、3D 图谱、WebGPU 与手势识别 | `prds/json/S14-semantic-intelligence-lab.json` (In Progress: lab hardening) |

## Product Baseline

The original product intent from Obsidian `personal-blog/idea.md` has been structured into:

- `prds/project-charter.md`
- `prds/master-prd.md`

These files define the long-range OKRs, milestones, epics and user stories for the whole Personal Knowledge Asset OS.
