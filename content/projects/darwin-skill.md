---
title: "达尔文技能进化插件 (darwin-skill)"
description: "面向 AI Agent 的本地 Skills 进化与整理插件，支持自动化扫描、审查、蒸馏和演化归档。"
status: "done"
date: 2026-04-01
tech: ["Python","Prompt Engineering","Agents","Obsidian"]
---

<p align="center">
  <img src="assets/logo.png" alt="Darwin Skill logo" width="360">
</p>

<h1 align="center">达尔文.skill</h1>

<p align="center">
  让你的本地 Skills 像生物一样进化：有用的留下，重复的脚本化，过时的归档，强壮的进入常驻位。
</p>

<p align="center">
  <strong>v1.0.0</strong> · Full / Pure 双发行版 · 本地 Skills 进化插件
</p>

---

`darwin-skill` 是一个面向 AI Agent 的本地 Skills 进化插件。它不是“又一个提示词合集”，而是一只拿着放大镜的进化管理员：扫描你的 skills / prompts / SOP，观察它们在真实任务里的表现，然后决定谁该繁衍成常驻 skill，谁该退化成 reference，谁该进化成脚本，谁该安静地进入归档层。

换句话说，它给本地知识库装上了一套小型自然选择机制。

## 用途

当你的本地 skills、提示词、工作流和项目 SOP 越积越多时，知识库会慢慢变成一片过度繁殖的生态系统。Agent 很容易陷入两种浪费：

- 把所有内容都塞进上下文，导致注意力稀释。
- 反复重新解释同一套工作流，导致 token 和时间浪费。

达尔文.skill 的目标是让 Agent 像观察物种一样观察技能资产：

- 哪些资产应该变成常驻 skill。
- 哪些长文只适合留在 `library/` 作为 reference。
- 哪些重复任务应该脚本化。
- 哪些资产需要拆分、合并、补触发描述或归档。
- 哪些 skill 真的有使用价值，哪些只是历史沉淀。

核心原则：

<p align="center">
  <strong>用进废退，适者生存，减少上下文浪费。</strong>
</p>

## 发行版本

本项目从 `v1.0.0` 开始整理为插件包，提供两个发行形态。

### Full 版

路径：仓库根目录

Full 版包含：

- 达尔文机制核心 skills
- 作者提供的个人工作流 skills
- 本地扫描、分桶、文本转换脚本
- `library/` 原始资产参考库
- `registry/` 索引、候选清单和演化记录

适合想直接复用本仓库中技能资产的用户。

### Pure 版

路径：`packages/pure`

Pure 版只包含达尔文机制，不包含作者个人具体 skills。用户可以让智能体拉取后，用它扫描和维护自己的本机 skills 仓库。

适合：

- 已经有自己的 skills / prompts 仓库。
- 不想引入作者个人工作流。
- 只需要“扫描、蒸馏、审查、归档”机制。

## 快速使用

扫描一个本地 skills 目录：

```bash
python3 scripts/scan_skills.py "/path/to/skills" --output registry/skills_index.json
```

同时扫描 skills 与提示词工程：

```bash
python3 scripts/scan_skills.py "/path/to/skills" "/path/to/prompts" --output registry/skills_index.json
```

在 Agent 中可以这样说：

> 读取我的本地 skills 仓库，并用达尔文机制管理、蒸馏、优化和归档 skills。

## 核心机制 Skills

这些是达尔文机制本身，Pure 版也会保留：

- `darwin-skill-manager`：总控，判断何时 skill 化、脚本化、归档或追问。
- `darwin-skill-distiller`：从真实任务中蒸馏可复用 skill。
- `darwin-skill-auditor`：审查 skill 质量、粒度、冗余和维护风险。
- `darwin-skill-archivist`：处理归档、合并、拆分和退役建议。

## 作者提供的 Skills

以下 skills 来自作者本人的 Obsidian skills 仓库与真实工作流沉淀，Full 版包含，Pure 版不包含：

- `think-before-execute`
- `project-three-layer-discipline`
- `cli-token-saving-pattern`
- `vibe-skill-pipeline`
- `harness-iteration-engineering`
- `industry-source-research`
- `vibe-git-version-management`
- `ai-figma-vector-production`
- `requirement-alignment-log`
- `okrts-root-cause-analysis`
- `solo-scrum-vibe-workflow`
- `paper-research-workflow`
- `paper-expansion-assistant`
- `document-lifecycle-governance`
- `document-naming-versioning`
- `document-quality-audit`
- `standards-monitoring-task-bank`
- `requirements-doc-update-pipeline`

这些 skills 的原始长文参考资料位于 `library/`。`library/` 中的原始资产副本采用 `01-...` 编号命名方式维护。

## 工具脚本

- `scripts/scan_skills.py`：扫描 Markdown skills / prompts，生成结构化索引。
- `scripts/bucket_phase3_assets.py`：将剩余资产分成继续 skill 化、reference、scriptable、archive 四类。
- `scripts/text_transform.py`：确定性文本转换脚本族，目前支持：
  - `remove-urls`
  - `markdown-toc`
  - `normalize-whitespace`
- `scripts/score_skills.py`：基础 survival score 计算。
- `scripts/suggest_refactor.py`：基础重构建议。
- `scripts/archive_stale_skills.py`：归档辅助脚本占位。

## 仓库结构

```text
darwin-skill/
├── .codex-plugin/              # Full 版 Codex 插件描述
├── assets/                     # Logo 与插件视觉资产
├── docs/                       # 机制、阶段计划、打包说明
├── library/                    # 原始资产参考库，按四层结构保存
├── packages/pure/              # Pure 版插件描述
├── registry/                   # 索引、候选清单、演化记录
├── scripts/                    # 扫描、分桶、文本转换脚本
├── skills/                     # Full 版可加载 skills
├── templates/                  # 审查、演化、skill 模板
└── VERSION                     # 当前版本号
```

## 四层知识结构

- `library/principles`：底层原则、判断红线、工程守则。
- `library/models`：可迁移的分析模型和任务前判断框架。
- `library/methods`：可执行 SOP、工作流、检查清单。
- `library/cases`：具体案例、工程样例和场景化经验。

## 打包建议

Full 版打包仓库根目录即可。Pure 版已经整理为可独立拷走的目录：

- `packages/pure/.codex-plugin/plugin.json`
- `packages/pure/skills/`
- `packages/pure/scripts/`
- `packages/pure/templates/`
- `packages/pure/docs/mechanism.md`
- `packages/pure/assets/logo.png`
- `packages/pure/README.md`

更完整的打包说明见 `docs/package.md`。

