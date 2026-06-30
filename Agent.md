# Agent.md — Personal Knowledge Asset OS

> 本文件是所有 Agent 进入项目的第一入口。进入项目后，请先阅读此文件。

## 项目定位

**Personal Knowledge Asset OS**（个人知识资产操作系统）

这不是一个普通个人博客。博客只是公开展示层，背后是统一的数据与资产底座。系统以「内容真源 → 构建管线 → 多端输出」为核心闭环，将笔记、简历、项目、演示文稿、语义图谱统一管理。

## 必读顺序

1. `Agent.md`
2. `context/project-brief.md`
3. `context/directory-map.md`
4. `prds/current/README.md`
5. Active PRD JSON: `prds/json/S06-launch-ops.json`
6. Relevant `.agent/rules/`, `.agent/workflows/`, `.agent/skills/`

## 当前阶段

**S06 — Launch & Operations**

当前 Sprint 目标：在 S05 发布就绪基础上建立可控发布、内容运营与轻量反馈闭环，让 Personal Knowledge Asset OS 可以长期维护而不引入外部副作用失控风险。

S01 至 S05 已全部完成，包括地基、治理、管线、语义实验室与公开展示层发布就绪收口。S06 聚焦发布检查、回滚计划、发布渠道边界、内容运营节奏、反馈入口与维护 runbook。

**不做的事情（禁止碰区）：**
- 违反 `docs/lab-input-policy.md` 准入规则的 3D 图谱、MediaPipe 手势、WebGPU 语义计算实验性功能
- 营销型大首页、紫蓝渐变、发光球等装饰性视觉
- 多云容灾、复杂 CI/CD
- 生产部署或远程账号操作
- ruflo 初始化或安装
- OpenCLI 外部发布
- OfficeCLI 真实文档改写
- hosted search、hosted slide service 或外部发布平台接入

## 禁止碰区

| 区域 | 原因 |
|------|------|
| `doc/` | 已有存量资料，勿删勿移 |
| `public/.DS_Store` 等系统文件 | 系统生成，勿处理 |
| `reveal/node_modules/` | 已有依赖，第一阶段不动 |
| `node_modules/pdfjs-dist/` | 已有依赖，第一阶段不动 |

## 常用命令

```bash
# 安装依赖
npm install

# 本地开发
npm run dev

# 构建
npm run build

# 预览
npm run preview

# 校验 PRD 结构
node scripts/validate-prd.js

# 构建简历（占位）
node scripts/build-resume.js

# 构建演示文稿（占位）
node scripts/build-decks.js

# 构建语义图谱占位数据
node scripts/build-semantic-graph.js
```

## 目录放置规则

| 目录 | 用途 | 备注 |
|------|------|------|
| `content/` | 内容真源（Markdown/YAML/Typst） | 所有内容从此处生成 |
| `src/` | Astro 源码 | 组件、页面、布局、样式 |
| `public/` | 静态资源 & 构建产物 | 包含 `assets/` 子目录 |
| `scripts/` | 构建脚本与工具 | 必须有输入/输出约定 |
| `prds/` | PRD 双板（JSON + MD） | JSON 为单一事实源 |
| `context/` | 项目记忆 | context.txt + memory.md |
| `.agent/` | Agent 治理配置 | rules/workflows/skills |
| `sense/` | Sense 运行态 | registry/runs/queues/state/reports |
| `docs/` | 工程文档 | 部署规划、技术规范 |
| `drafts/` | Prompt 草稿与临时想法 | 不进入构建管线 |
| `prompts/` | 子 Agent 指令模板 | 可复用 prompt 模板 |
| `templates/` | 报告/任务格式模板 | 可复用格式定义 |
| `output/` | 编译生成物与阶段产出 | 不进入 Git |
| `tests/` | 测试文件 | 校验脚本与测试用例 |

## PRD 双板规则

1. **`prds/json/`** 是机器执行的唯一事实源（Single Source of Truth）
2. **`prds/md/`** 是人类评审视图，只做摘要同步
3. Agent 执行过程中只修改 JSON 状态
4. 执行完毕后将 JSON 状态摘要回写到 MD
5. 人类修改 MD 需求时，Agent 需解析并同步至 JSON
6. 当前活跃边界见 `prds/current/README.md`
7. **任务级回滚保障（Task Rollback Rule）**：为确保每个任务可追溯、可回滚，每当完成一个 Task，必须立刻将该 Task 在 PRD（JSON + MD）中的状态更新为 done/Done，执行完整的测试校验，并立即执行 Git Commit 进行版本留档（Commit 消息格式包含 Task ID，禁止把多个任务合并到同一个 commit 里进行批量提交）。


## Sense v4.0 规则

### 三层架构

1. 治理与记忆层：`Agent.md`, `prds/json/`, `context/`, `.agent/rules/`
2. 智能体编排层：`.agent/roles/`, `.agent/swarms/`, `sense/runs/`
3. 环境与执行层：`.agent/adapters/`, `.agent/tools/`, `sense/registry/tools.json`

### 权限分级

| Level | Meaning | Examples |
|------|---------|----------|
| L0 | Read only | 分析、总结、读取文件 |
| L1 | Local edit | 修改 owned files、运行本地构建 |
| L2 | Local state | 本地 commit、启动服务 |
| L3 | External read | 浏览网页、读取远程信息 |
| L4 | External write | 发布、上传、部署、修改远程内容 |
| L5 | Sensitive | 删除、付款、密码、OAuth、Token |

OpenCLI 发布、远程部署、云端上传都属于 L4 或更高，必须有人类明确授权并写审计记录。

### 工具层策略

- 重复三次以上的任务应蒸馏为 Skill 或脚本。
- CLI/stdin/stdout/JSON 优先于 GUI 手工操作。
- Office/PDF/PPT/网页等视觉交付必须走 render gate。
- ruflo 只能作为可插拔 swarm harness，不能替代 `prds/json/` 或 `context/`。

## Git 工作流规则

1. 提交前必须执行 `git status`，确认变更归属
2. **禁止** `git add .`，必须精确 `git add <file>`
3. Commit 消息必须带 Task ID，格式：`type: description (S01-T0X)`
4. **禁止自动 Push**，待 Sprint 结束由人类审计后手动执行
5. 若项目尚未初始化 Git，在 walkthrough 中说明，不伪造 commit。
6. Commit 属于 L2；除非任务或用户明确要求，本项目默认不自动 commit。

## 当前最高优先级任务

1. **S05-T05**: Performance and SEO pass
2. S05-T06 Release readiness check remains queued
3. S06 Launch & Operations remains planning-only until S05 is complete

## 决策记录

- 2026-06-26: 项目重新定义为 Personal Knowledge Asset OS，博客仅为展示层
- 2026-06-26: 第一阶段聚焦地基，不实现 3D/MediaPipe/WebGPU 等实验性功能
- 2026-06-26: 技术栈确定为 Astro + React Islands + TailwindCSS
- 2026-06-26: 内容真源统一放在 `content/` 目录
- 2026-06-27: 采用 Taste v4.0 Sense 作为长期 harness engineering 工作规范
- 2026-06-28: S02 验收门禁完成，依赖安装与 Astro build 通过，项目进入 S03 Pipeline
- 2026-06-28: S03 Pipeline 完成，统一资产构建、内容集合和回归门禁通过，项目进入 S04 Semantic Lab
- 2026-06-30: S04-T04 完成 3D 图谱可行性评估，决定 S04 不实现生产 3D，保留 2D 为主界面
- 2026-06-30: S04-T05 完成实验性功能准入规则制定，明确 Opt-in 机制与外部敏感行为边界，S04 任务全部完成
- 2026-06-30: S05-T01 完成响应式审计与图谱 PointerEvents 触屏拖拽修复，S05-T02 成为当前任务
- 2026-06-30: S05-T02 完成全局导航栏 (BaseLayout) 统一和视觉系统微调，S05-T03 成为当前任务
- 2026-06-30: S05-T03 完成本地搜索索引生成与防注入静态检索页面，S05-T04 成为当前任务
- 2026-06-30: S05-T04 完成 RSS 与 Atom feeds 本地静态生成与管线集成，S05-T05 成为当前任务
