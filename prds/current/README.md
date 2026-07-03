# Current PRD Boundary

Active sprint: S08 — RESTful API and Cloud Source Sync.

Current priority:

1. Design RESTful API contract and local skeleton (S08-T01, S08-T05).
2. Configure GitHub Obsidian source adapter and configure local hardcoded paths (S08-T02).
3. Ensure source records provide stable chunk id & graph metadata for future S14 embeddings and LLM agents.
4. Keep private tokens strictly on the server/local backend; never expose them to the browser.
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
| S08 | Phase 7: API & Cloud Source Sync | RESTful API 与 GitHub Obsidian_vault 云端真源同步 | `prds/json/S08-api-source-sync.json` (Active) |
| S09 | Phase 8: Two-End Product Implementation | Admin/User 双端核心功能 | `prds/json/S09-two-end-implementation.json` |
| S10 | Phase 9: Preview Pipeline & Resume Studio | 多格式预览、Typst/LaTeX 与简历工作台 | `prds/json/S10-preview-resume-studio.json` |
| S11 | Phase 10: Quality & CI | 测试体系、缺陷管理与 CI 验证 | `prds/json/S11-quality-ci.json` |
| S12 | Phase 11: Public Deployment & Release Operations | 公网部署、发布门禁与回滚演练 | `prds/json/S12-public-deployment.json` |
| S13 | Phase 12: Documentation & Handoff | 用户/管理员/开发者文档与最终交接 | `prds/json/S13-documentation-handoff.json` |
| S14 | Phase 13: Semantic Intelligence & Embodied Lab | Embedding、聚类、LLM Agent、3D 图谱、WebGPU 与手势识别 | `prds/json/S14-semantic-intelligence-lab.json` |
