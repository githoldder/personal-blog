# 解耦型工作区 Agent 规范与治理系统 (Taste v4.0 Sense)

本规范定义 Agent 在个人工作区、轻量任务、长期软件工程项目和多智能体协作工作台中的目录结构、执行边界、记忆管理、PRD 同步、工具编排、浏览器操作、交付校验与 Git 审计规则。

Taste v4.0 Sense 的核心目标是：在保留 Taste v3.0 的复杂度解耦、PRD 双板和交付门禁基础上，引入 Sense 三层架构，将治理规范、智能体编排和环境操作分离，使长期、持久化、高效、多智能体协作的 vibe coding 工作台变得可追踪、可审计、可恢复、可扩展。

---

## 第一部分：Taste v4.0 的升级边界

### 1. v4.0 继承 v3.0 的内容

Taste v4.0 不推翻 v3.0。以下机制继续作为稳定地基：

- 轻任务 IPO 结构：`01-resource/`、`02-process/`、`03-report/`。
- 长期项目 Agent 结构：`Agent.md`、`.agent/`、`context/`、`prds/`、`docs/`、`scripts/`、`tests/`。
- PRD 双板机制：`prds/json/` 为机器执行单一事实源，`prds/md/` 为人类评审视图。
- context 记忆管理：`context/context.txt` 存短期现场，`context/memory.md` 存长期决策。
- Git 安全工作流：禁止 `git add .`，禁止未授权 push，提交前必须检查工作区。
- 双层交付门禁：构建语法门禁 + 内容专业性门禁。
- walkthrough 审计：每个 Sprint 或阶段性交付后生成审计交接。

### 2. v4.0 新增的核心能力

Taste v4.0 新增 Sense 框架，重点补齐 v3.0 未覆盖的四类问题：

- 多 Agent 协作时，谁负责规划、执行、审核、发布。
- 长期项目中，Agent 如何在不同会话、不同工具、不同机器之间保持任务状态一致。
- 外部网站、已登录浏览器和桌面应用操作如何纳入权限、审计和回滚。
- vibe coding 的高速探索如何不冲垮工程边界和事实源。

### 3. v4.0 的关键原则

治理优先于自动化。任何多智能体编排、浏览器自动化、发布动作，都必须读取并服从 `Agent.md`、`prds/json/`、`.agent/rules/`。

事实源优先于记忆。PRD JSON、源码、内容真源、构建产物校验结果优先级高于 Agent 的上下文记忆。

人类授权优先于环境能力。即使工具能自动点击、登录、发布、删除、付款，也不代表 Agent 可以执行。所有外部副作用动作必须走权限分级。

编排层不得持有产品真相。ruflo、OpenCLI、Claude/Codex 插件或任何外部 harness 都只能作为执行层或协调层，不能替代项目内的 PRD、context 和 audit 记录。

---

## 第二部分：Sense 三层架构

Sense 框架把长期 Agent 工作台拆成三层：治理与记忆层、智能体编排层、环境与执行层。

```text
┌──────────────────────────────────────────┐
│ 治理与记忆层：Taste v4.0                 │
│ Agent.md / prds/json / context / rules   │
└────────────────────┬─────────────────────┘
                     │ 读取任务、边界、门禁
                     ▼
┌──────────────────────────────────────────┐
│ 智能体编排层：Swarm Harness              │
│ ruflo / Codex subagents / Claude agents  │
└────────────────────┬─────────────────────┘
                     │ 分派角色、并行执行、回收结果
                     ▼
┌──────────────────────────────────────────┐
│ 环境与执行层：Tool Bridge                │
│ shell / MCP / OpenCLI / browser / CI     │
└──────────────────────────────────────────┘
```

### 1. 治理与记忆层

治理与记忆层是项目内的稳定事实源，不依赖某个特定 Agent 产品。

核心文件：

- `Agent.md`：Agent 第一入口，说明当前阶段、读取顺序、禁止碰区、常用命令、审计门禁。
- `prds/json/`：Sprint 和 Task 的机器执行单一事实源。
- `prds/md/`：人类评审视图。
- `.agent/rules/`：长期硬约束。
- `.agent/workflows/`：可复用工作流。
- `.agent/skills/`：项目专属技能。
- `context/context.txt`：短期现场。
- `context/memory.md`：长期决策。
- `walkthrough.md` 或 `prds/archive/*-walkthrough.md`：阶段审计。

治理层的职责是定义“该做什么、谁能做、做到什么程度、如何证明完成”。

### 2. 智能体编排层

智能体编排层负责任务拆解、角色分配、并发执行、结果汇总和失败重试。它可以由 ruflo、Codex 多线程、Claude Code 插件、手写脚本或未来的调度器实现。

编排层只允许读取治理层，不允许绕过治理层直接决定范围。

推荐角色：

- Planner-Agent：读取 PRD，拆分任务，生成执行计划。
- Executor-Agent：在 owned_files 范围内实现代码或文档。
- Reviewer-Agent：按门禁审查变更。
- Research-Agent：收集外部资料，必须标注来源和日期。
- Publisher-Agent：执行外部平台发布，仅在授权后使用 OpenCLI 或平台 API。
- Archivist-Agent：更新 context、memory、walkthrough 和 PRD 状态。
- Guard-Agent：检查越权修改、凭据泄漏、危险命令、未授权外部副作用。

### 3. 环境与执行层

环境与执行层负责实际操作：运行命令、读取文件、调用 MCP、控制浏览器、操作已登录网页、部署、发布。

典型工具：

- shell：构建、测试、脚本、Git。
- MCP：GitHub、Figma、数据库、自动化工具。
- OpenCLI：通过已登录浏览器或站点适配器执行网页任务。
- Playwright：可重复的浏览器测试和截图验证。
- CI：构建、测试、静态检查和部署。

环境层必须把所有外部副作用写入审计记录，不允许“静默成功”。

---

## 第三部分：工作区复杂度分层

### 1. 第一层：轻任务 IPO

适用于课程作业、一次性报告、临时数据处理、单份脚本。

```text
task-root/
├── 01-resource/
├── 02-process/
│   ├── prompt/
│   ├── data/
│   ├── script/
│   ├── figure/
│   └── document/
└── 03-report/
```

轻任务不强制创建 `Agent.md`、`.agent/`、`context/`、`prds/`。如果任务中途变成长周期工程，应迁移到第二层或第三层。

`03-report/*.txt` 默认禁止 Markdown 结构标记，便于复制到 Word、PDF 或课程平台。

### 2. 第二层：长期单 Agent 工程项目

适用于普通软件项目、文档工程、个人网站、课程大项目。

```text
project-root/
├── Agent.md
├── README.md
├── .agent/
│   ├── rules/
│   ├── workflows/
│   └── skills/
├── context/
│   ├── project-brief.md
│   ├── directory-map.md
│   ├── context.txt
│   └── memory.md
├── prds/
│   ├── README.md
│   ├── current/
│   ├── md/
│   ├── json/
│   ├── machine/
│   ├── sprints/
│   └── archive/
├── docs/
├── analysis/
├── drafts/
├── prompts/
├── templates/
├── output/
├── scripts/
├── tests/
└── source-code-folders/
```

第二层强调单项目边界、PRD 双板、构建门禁和 Git 审计。

### 3. 第三层：Sense 多智能体工作台

适用于长期、持久化、多 Agent、跨平台操作和自动化发布的项目。

在第二层基础上新增：

```text
project-root/
├── .agent/
│   ├── roles/
│   ├── permissions/
│   ├── adapters/
│   ├── swarms/
│   ├── tools/
│   └── audit/
├── sense/
│   ├── registry/
│   ├── runs/
│   ├── queues/
│   ├── state/
│   └── reports/
└── prds/
    ├── current/
    ├── json/
    ├── md/
    └── archive/
```

新增目录说明：

- `.agent/roles/`：定义 Agent 角色、职责、输入输出和禁止事项。
- `.agent/permissions/`：定义权限等级、外部副作用审批规则。
- `.agent/adapters/`：定义 OpenCLI、MCP、CI、平台 API 等适配器规范。
- `.agent/swarms/`：定义多 Agent 拓扑、调度策略、失败处理。
- `.agent/tools/`：定义项目允许使用的工具清单和命令契约。
- `.agent/audit/`：定义审计模板、发布日志、风险清单。
- `sense/registry/`：记录可用 Agent、工具、平台、技能注册表。
- `sense/runs/`：记录每次多 Agent run 的任务、输入、输出、状态。
- `sense/queues/`：记录待处理任务队列，如发布队列、审核队列。
- `sense/state/`：存储机器可读状态快照，不存密钥。
- `sense/reports/`：存储执行报告、失败分析和复盘。

---

## 第四部分：PRD 双板与任务协议

### 1. PRD 双板基本规则

`prds/json/` 是 Agent 执行状态的单一事实源。`prds/md/` 是人类评审视图。

Agent 执行任务时只更新 JSON 中的任务状态、步骤状态、验证结果和 handoff_notes。人类修改 MD 需求语义后，Agent 需要同步 JSON，不能让两板长期漂移。

### 2. Sprint JSON 推荐结构

```json
{
  "sprint_id": "S02",
  "version": "0.1",
  "status": "ready",
  "last_updated": "2026-06-27 12:00",
  "objective": "完成可验证目标",
  "key_results": [
    "KR-1: 可验证结果"
  ],
  "tasks": [
    {
      "id": "S02-T01",
      "status": "todo",
      "role": "Executor-Agent",
      "priority": "P1",
      "target_dir": "src/",
      "owned_files": [
        "允许修改的文件"
      ],
      "out_of_scope": [
        "禁止顺手修改的范围"
      ],
      "inputs": [
        "需要读取的资料或文件"
      ],
      "tools": [
        "允许使用的工具"
      ],
      "permission_level": "L1",
      "external_side_effects": false,
      "steps": [
        {
          "step_id": "S02-T01-STEP01",
          "status": "todo",
          "action": "具体动作",
          "expected_output": "步骤产物"
        }
      ],
      "acceptance_criteria": [
        "验收标准"
      ],
      "verification": [
        "验证命令或人工检查"
      ],
      "handoff_notes": ""
    }
  ]
}
```

### 3. 多 Agent Run 记录

每次多智能体执行都必须生成 run 记录。

推荐路径：

```text
sense/runs/YYYYMMDD-HHMM-<task-id>.json
```

推荐字段：

```json
{
  "run_id": "20260627-1400-S02-T01",
  "task_id": "S02-T01",
  "planner": "Planner-Agent",
  "agents": [
    "Executor-Agent",
    "Reviewer-Agent"
  ],
  "inputs": [],
  "owned_files": [],
  "tools_used": [],
  "external_side_effects": [],
  "status": "done",
  "verification": [],
  "risks": [],
  "handoff": ""
}
```

---

## 第五部分：权限分级与副作用控制

### 1. 权限等级

所有任务必须标注 permission_level。

| 等级 | 名称 | 允许行为 | 人类授权 |
|---|---|---|---|
| L0 | Read Only | 读取文件、分析代码、生成建议 | 不需要 |
| L1 | Local Edit | 修改项目内 owned_files，运行本地测试 | 通常不需要 |
| L2 | Local State | Git commit、生成本地缓存、启动本地服务 | 需要遵守项目规则 |
| L3 | External Read | 访问外部网页、读取已登录页面、拉取远程信息 | 需要记录来源 |
| L4 | External Write | 发帖、评论、上传、部署、修改远程配置 | 必须明确授权 |
| L5 | Sensitive Action | 删除远程资源、付款、改密码、授权 OAuth、泄露风险操作 | 默认禁止，除非逐项授权 |

### 2. 外部副作用规则

以下动作一律视为外部副作用：

- 发布文章、评论、私信、点赞、关注、取消关注。
- 上传文件到云端、图床、网盘、对象存储。
- 部署生产站点、修改 DNS、修改云平台配置。
- 修改 GitHub issue、PR、release、repo 设置。
- 操作已登录账号的个人资料、账单、权限、Token。

外部副作用任务必须满足：

- PRD JSON 中 `external_side_effects: true`。
- 标注 permission_level 为 L4 或 L5。
- 写清目标平台、账号、URL、动作、回滚方式。
- 执行前获得人类明确确认。
- 执行后生成 `sense/reports/*` 或 walkthrough 记录。

---

## 第六部分：OpenCLI 集成规范

OpenCLI 适合作为环境与执行层，不适合作为治理层。它可以把网站、浏览器会话、Electron 应用和本地工具变成 CLI 操作面，也可以让 Agent 通过已登录 Chrome 执行导航、点击、填写、提取和发布等动作。

### 1. 适用场景

OpenCLI 适合：

- 读取已登录网站中的个人数据。
- 在平台没有稳定开放 API 时，用浏览器桥接完成网页操作。
- 将重复网页流程封装成 adapter。
- 操作 Xiaohongshu、Zhihu、Twitter/X、LinkedIn、GitHub、Vercel、Cloudflare 等平台时进行辅助。
- 为发布流程提供半自动化执行。

### 2. 不适用场景

OpenCLI 不应用于：

- 未经授权的自动发布、点赞、评论、私信。
- 绕过平台限制、风控或验证码。
- 处理支付、账单、密码、OAuth 授权等敏感动作。
- 在没有审计记录的情况下静默操作生产账号。
- 替代稳定 API 或 CI 流程。

### 3. 项目内适配器目录

```text
.agent/adapters/opencli/
├── README.md
├── permission-policy.md
├── site-map/
│   ├── juejin.md
│   ├── xiaohongshu.md
│   └── github.md
├── commands/
│   ├── publish-note.md
│   ├── fetch-stats.md
│   └── verify-login.md
└── audit-template.md
```

### 4. OpenCLI 执行前检查

Publisher-Agent 使用 OpenCLI 前必须检查：

- 当前任务是否在 PRD JSON 中声明。
- permission_level 是否为 L4 或 L5。
- 人类是否明确授权本次平台和动作。
- 是否已经生成本地预览。
- 是否已通过内容审核。
- 是否有回滚或撤回方案。
- 是否会暴露隐私、Token、Cookie、手机号、邮箱或未公开资料。

### 5. OpenCLI 审计记录

每次 OpenCLI 外部写操作后必须记录：

```text
平台：
账号：
目标 URL：
动作：
输入文件：
执行时间：
执行 Agent：
是否人工授权：
结果：
回滚方式：
截图或导出证据：
风险备注：
```

---

## 第七部分：ruflo 与 Swarm Harness 集成规范

ruflo 适合作为智能体编排层或外部 harness。它可以提供 agents、swarm coordination、memory、hooks、MCP server、plugins 和 guardrails。Taste v4.0 对 ruflo 的定位是：可插拔调度器，而不是项目事实源。

### 1. 接入原则

- 先让项目本身符合 Taste v4.0，再接入 ruflo。
- ruflo 初始化前必须阅读其安装会写入的目录和配置。
- ruflo 生成的 `.claude/`、`.claude-flow/`、`CLAUDE.md` 等文件必须纳入 directory-map。
- ruflo 的 memory 不替代 `context/`。
- ruflo 的 goals 不替代 `prds/json/`。
- ruflo 的 agents 不绕过 `.agent/permissions/`。

### 2. 推荐接入方式

第一阶段推荐轻接入：

- 只创建 `.agent/swarms/` 和 `.agent/roles/` 规范。
- 用 Codex 或现有 Agent 手动模拟 Planner、Executor、Reviewer、Publisher。
- 不立即运行 `npx ruflo init`，避免引入大量隐藏配置和 workspace churn。

第二阶段试点接入：

- 在独立分支或临时副本中运行 ruflo 初始化。
- 记录新增文件、MCP 配置、hooks、daemon 行为。
- 生成 `docs/ruflo-integration-audit.md`。
- 审核通过后再合入主项目。

第三阶段正式接入：

- 将 ruflo 作为 Swarm Harness。
- 每个 swarm run 都同步到 `sense/runs/`。
- 每个跨 Agent 结果都经过 Reviewer-Agent 和 Guard-Agent。

### 3. Swarm 拓扑

默认使用层级拓扑：

```text
Human
  ↓
Planner-Agent
  ├── Executor-Agent
  ├── Research-Agent
  ├── Publisher-Agent
  └── Reviewer-Agent
        ↓
      Guard-Agent
```

复杂任务可使用双审拓扑：

```text
Executor-Agent → Reviewer-Agent → Adversarial-Auditor → Human Walkthrough
```

禁止在没有 Guard-Agent 或人工审批的情况下让 Publisher-Agent 执行外部写操作。

---

## 第八部分：Sense 工作流

### 1. 标准 Sprint 工作流

1. Human 更新或批准 `prds/md/`。
2. Planner-Agent 同步 `prds/json/`。
3. Guard-Agent 检查 owned_files、permission_level、out_of_scope。
4. Executor-Agent 执行本地修改。
5. Executor-Agent 运行验证命令。
6. Reviewer-Agent 审查功能、文档、测试、格式和风险。
7. Archivist-Agent 更新 context、PRD 状态和 walkthrough。
8. Human 审核是否 commit 或 push。

### 2. Vibe Coding 探索工作流

vibe coding 允许快速探索，但必须隔离风险。

推荐目录：

```text
analysis/vibe/YYYYMMDD-topic/
├── prompt.md
├── experiment-notes.md
├── patches/
├── screenshots/
└── decision.md
```

规则：

- 探索阶段可以快，但不得直接改生产路径。
- 有价值的探索结果必须沉淀为 PRD task。
- 未经批准的实验代码不得进入主线。
- 失败实验应记录失败原因，避免后续 Agent 重复踩坑。

### 3. 发布工作流

发布工作流适用于博客、社区文章、简历、Slidev、PDF、社交平台同步。

```text
content source
  ↓
build preview
  ↓
content review
  ↓
privacy review
  ↓
human approval
  ↓
OpenCLI/API publish
  ↓
audit record
```

Publisher-Agent 不负责改正文内容，只负责执行发布动作。内容修改必须回到 Executor-Agent 或 Editor-Agent。

---

## 第九部分：目录规范补充

### 1. Agent.md 最小内容

`Agent.md` 至少包含：

- 项目定位。
- 当前 Sprint。
- 必读文件顺序。
- 禁止碰区。
- 当前 PRD 入口。
- 常用命令。
- 目录放置规则。
- 权限分级摘要。
- 外部副作用规则。
- 交付门禁。
- Git 规则。
- 当前最高优先级任务。

`Agent.md` 不应膨胀成知识库。细节链接到 `.agent/rules/`、`.agent/workflows/`、`.agent/skills/`、`context/` 和 `prds/`。

### 2. .agent/rules 推荐文件

```text
.agent/rules/
├── agent-ops-governance.md
├── sense-permissions.md
├── project-map.md
├── security.md
├── mvp-scope.md
├── external-side-effects.md
├── browser-automation.md
├── coding-standards.md
├── doc-standards.md
├── adversarial-audit.md
└── git-safety.md
```

### 3. .agent/workflows 推荐文件

```text
.agent/workflows/
├── sprint-execution.md
├── prototype-vibe-coding.md
├── technical-research.md
├── content-publishing.md
├── opencli-publish.md
├── ruflo-swarm-run.md
├── devops-smoke-test.md
└── release-walkthrough.md
```

### 4. .agent/skills 推荐文件

```text
.agent/skills/
├── typst-builder/
│   └── SKILL.md
├── slidev-packager/
│   └── SKILL.md
├── astro-content-engine/
│   └── SKILL.md
├── semantic-indexer/
│   └── SKILL.md
├── opencli-bridge/
│   └── SKILL.md
├── swarm-planner/
│   └── SKILL.md
└── project-docs-standard/
    └── SKILL.md
```

### 5. sense/ 推荐结构

```text
sense/
├── registry/
│   ├── agents.json
│   ├── tools.json
│   └── platforms.json
├── queues/
│   ├── publish-queue.json
│   └── review-queue.json
├── runs/
├── state/
│   └── current.json
└── reports/
```

`sense/state/` 不得存放密钥、Cookie、Token、浏览器 profile 路径或个人隐私原文。

---

## 第十部分：交付门禁

### 1. 第一层：机械门禁

检查构建、格式、脚本和文件结构。

常见检查：

- `npm run build`
- `npm run validate:prd`
- `npm run build:assets`
- LaTeX/Typst/Slidev 编译
- JSON 可解析
- Markdown 链接有效
- PDF/截图可打开
- Anti-MD 检查
- 禁止本地绝对路径泄漏
- 禁止密钥泄漏

### 2. 第二层：内容门禁

检查内容是否可信、可追踪、可复现。

常见检查：

- 需求是否追踪到 PRD。
- 架构说明是否符合源码。
- 数据是否有来源。
- 引用是否真实可检索。
- 结论是否区分事实、推断和计划。
- 发布内容是否泄露隐私。
- 外部平台操作是否有授权和记录。

### 3. 第三层：多 Agent 门禁

Sense 项目新增多 Agent 门禁：

- 每个 Agent 是否只改 owned_files。
- 是否存在互相覆盖的并行修改。
- 是否有 run 记录。
- 是否有 Reviewer-Agent 审核。
- 是否有 Guard-Agent 检查权限。
- 外部副作用是否经过人类授权。
- ruflo/OpenCLI 等外部 harness 是否留下审计记录。

---

## 第十一部分：Git 与版本审计

### 1. 基本规则

提交前必须运行 `git status`。

禁止：

```bash
git add .
git push
git reset --hard
git checkout -- .
```

除非人类明确授权。

允许：

```bash
git add path/to/file1 path/to/file2
git commit -m "S02-T01: complete target description"
```

### 2. 多 Agent 变更隔离

并行 Agent 必须按 task owned_files 隔离修改范围。出现同一文件争用时：

1. 标记相关 task 为 blocked。
2. 记录冲突文件和 Agent。
3. 由 Planner-Agent 或 Human 决定合并顺序。
4. 不允许任一 Agent 自行覆盖另一个 Agent 的工作。

### 3. Commit 消息

推荐格式：

```text
S02-T01: implement resume build placeholder
S02-T02: add opencli permission policy
S02-T03: document ruflo integration audit
```

commit 用于本地审计。Sprint walkthrough 未通过前禁止自动 push。

---

## 第十二部分：安全与隐私红线

任何 Agent、workflow、OpenCLI adapter、ruflo plugin 都不得：

- 读取或打印 `.env`、Token、Cookie、浏览器 profile 密钥。
- 将私有路径、身份证、手机号、邮箱、账号截图泄漏到公开内容。
- 未授权操作生产账号。
- 未授权发布、删除、修改远程内容。
- 在日志中保存完整登录态、Cookie、Authorization header。
- 绕过验证码、风控、访问限制或平台条款。
- 把临时实验结果伪装成已验证事实。

如果任务需要敏感信息，Agent 应请求人类手动完成或提供最小化输入。

---

## 第十三部分：Personal Knowledge Asset OS 的 Sense 落地建议

对于 Personal Knowledge Asset OS，推荐分三阶段接入 Sense：

### Phase 1：硬化治理层

目标：让项目真正符合 Taste v4.0，而不只是有空目录。

任务：

- 补齐 `.agent/rules/`。
- 补齐 `.agent/workflows/`。
- 补齐 `.agent/skills/`。
- 创建 `.agent/permissions/sense-permissions.md`。
- 创建 `sense/registry/`、`sense/runs/`、`sense/queues/`、`sense/state/`、`sense/reports/`。
- 更新 `Agent.md`，加入权限分级和外部副作用规则。
- 修正 PRD 状态与 Agent.md 当前优先级不一致的问题。

### Phase 2：OpenCLI 半自动发布试点

目标：先做外部读取和草稿填充，不直接静默发布。

任务：

- 创建 `.agent/adapters/opencli/`。
- 写 `opencli-bridge/SKILL.md`。
- 建立 `publish-queue.json`。
- 选择一个低风险平台做草稿发布试点。
- 先让 OpenCLI 打开页面和填草稿，最后发布按钮由人类确认。

### Phase 3：ruflo Swarm 试点

目标：验证多 Agent 编排是否提高效率，而不是增加复杂度。

任务：

- 在临时分支或副本中运行 ruflo 初始化。
- 审计新增文件和 hooks。
- 将 ruflo memory 与项目 context 分离。
- 用一个小 Sprint 测试 Planner、Executor、Reviewer 三角色协作。
- 生成 `docs/ruflo-integration-audit.md`。

---

## 第十四部分：v4.0 反模式清单

以下做法应被视为治理失败：

- 把 ruflo 当成 PRD 和项目记忆的替代品。
- 让 OpenCLI 在没有授权和审计的情况下自动发帖。
- 多个 Agent 同时修改同一文件，事后靠运气合并。
- 任务没有 owned_files，却让 Agent 自由探索整个仓库。
- context.txt 变成命令流水账。
- PRD JSON 和 MD 长期不一致。
- 实验功能直接进入主线，缺少 analysis/vibe 记录。
- 生成了漂亮的工作台，但构建、发布、回滚不可复现。
- 用“vibe coding”作为跳过测试、审计和边界的理由。

---

## 第十五部分：v4.0 最小落地检查表

一个项目只有满足以下条件，才算进入 Taste v4.0 Sense 状态：

- `Agent.md` 明确当前 PRD、权限分级、外部副作用规则。
- `prds/json/` 中每个任务有 owned_files、out_of_scope、permission_level、verification。
- `.agent/rules/` 至少包含 governance、security、permissions、git-safety。
- `.agent/workflows/` 至少包含 sprint-execution、release-walkthrough。
- `.agent/skills/` 至少包含项目核心技能说明。
- `sense/runs/` 能记录多 Agent 执行。
- `sense/queues/` 能记录发布或审核队列。
- OpenCLI 只在 L3 以上任务中使用，外部写操作必须 L4 以上且人工授权。
- ruflo 只作为 swarm harness，不替代项目事实源。
- walkthrough 能说明完成任务、验证结果、风险、是否允许 push。

---

## 第十六部分：第三层工具层优化

第三层工具层不是“多装几个 CLI”。它的目标是把高频动作从 Agent 推理中剥离出来，沉淀为可复用、可测试、可审计的工具桥、脚本和 Skill。AI 负责首次理解、抽象和生成；CLI、脚本、OfficeCLI、Playwright、OpenCLI、CI 负责长期低成本执行。

### 1. 工具层核心原则

工具层遵循四个原则：

- CLI 优先：优先选择能通过 stdin/stdout、JSON、退出码和文件产物交互的工具。
- 结构化输出优先：优先使用 `--json`、schema、固定路径和可解析日志，避免让 Agent 解析人类花哨输出。
- 渲染闭环优先：凡是视觉交付物，必须能生成截图、HTML、PDF 或预览页，进入“render -> look -> fix”闭环。
- 蒸馏优先：同类任务重复三次以上，应从 prompt 执行升级为 Skill、脚本或 workflow。

第三层工具不直接定义产品目标。产品目标仍由 PRD 管理；工具层只负责更稳定、更便宜地执行。

### 2. 工具分层模型

Sense 第三层工具层采用五级模型：

```text
T0: Human / Manual
    人类判断、账号授权、敏感确认、最终发布按钮

T1: Agent Reasoning
    一次性探索、未知任务拆解、方案生成、异常判断

T2: Skill / SOP
    可复用操作说明、检查清单、命令模板、失败处理

T3: Script / CLI
    Bash/Node/Python/Go 脚本、OfficeCLI、Playwright、gh、jq、pandoc

T4: Workflow / CI / Swarm
    定时任务、发布流水线、多 Agent 编排、自动审计
```

升级规则：

- 第一次做，用 T1。
- 第二次做，补 T2。
- 第三次做，固化为 T3。
- 高频、跨项目、低风险任务，升级到 T4。
- 任何 L4/L5 外部副作用，即使技术上能 T4，也必须保留 T0 人类确认。

### 3. Token 节省范式

vibe coding 的关键节省来自“推理一次，执行多次”。

推荐闭环：

```text
原始复杂任务
  ↓
Agent 试错与理解
  ↓
提炼 SOP / Skill
  ↓
脚本化为 CLI
  ↓
加入验证与日志
  ↓
纳入 workflow / CI
  ↓
下次直接执行
```

Agent 在 Sprint walkthrough 中应记录：

- 哪些任务仍停留在 T1。
- 哪些任务已沉淀为 T2 Skill。
- 哪些任务已脚本化为 T3。
- 哪些脚本进入 T4 自动化。
- 预计节省的重复 token 和人工时间。

### 4. CLI 工具注册表

Sense 项目应维护工具注册表：

```text
sense/registry/tools.json
```

推荐字段：

```json
{
  "id": "officecli",
  "category": "document",
  "permission_level": "L1",
  "install": "manual",
  "commands": ["officecli view", "officecli get", "officecli set"],
  "structured_output": true,
  "supports_json": true,
  "side_effects": "local_file_write",
  "audit_required": true,
  "notes": "Office document read/edit/render bridge"
}
```

工具注册表至少覆盖：

- 开发：`gh`、`git`、`npm`、`pnpm`、`docker`、`pm2`。
- 数据：`jq`、`yq`、`duckdb`、`python`。
- 浏览器：`playwright`、`OpenCLI`。
- 文档：`pandoc`、`typst`、`officecli`。
- 演示：`slidev`、`officecli`。
- 部署：`vercel`、`wrangler`、`tcb`、`tccli`。
- 图表：`mmdc`、`d2`、`dot`。
- 学术：`zot`、`papis`、`valyu`、`perplexity-cli`。

### 5. Skill 蒸馏协议

当一个任务满足以下任一条件，必须考虑蒸馏为 Skill：

- 同类任务预计重复三次以上。
- 任务步骤稳定，但细节容易忘。
- 工具命令复杂，容易因参数错误失败。
- 输出格式有固定门禁。
- 多 Agent 需要共享同一类做法。

Skill 目录结构：

```text
.agent/skills/<skill-name>/
├── SKILL.md
├── checklist.md
├── examples/
├── scripts/
└── fixtures/
```

`SKILL.md` 必须包含：

- 使用场景。
- 输入。
- 输出。
- 禁止事项。
- 工具依赖。
- 执行步骤。
- 验证命令。
- 常见失败与恢复。
- 何时升级为脚本或 workflow。

Skill 不是知识笔记。Skill 是 Agent 执行前必须读取的操作规程。

### 6. OfficeCLI 作为文档工具桥

OfficeCLI 应进入第三层工具层的 document adapter。它适合处理 `.docx`、`.xlsx`、`.pptx` 的读取、创建、修改、结构化提取、格式检查和渲染验证。

推荐定位：

- Word：报告、合同、课程文档、论文式材料、批注和修订。
- Excel：表格、公式、透视表、仪表盘、CSV/TSV 转工作簿。
- PowerPoint：课程汇报、商业演示、项目路演、批量生成幻灯片。

推荐目录：

```text
.agent/adapters/officecli/
├── README.md
├── command-contract.md
├── render-gate.md
├── templates/
└── audit-template.md
```

OfficeCLI 工作流必须采用三层策略：

```text
L1 Read/View: view, get, query, validate
L2 DOM Edit: add, set, remove, move, swap, batch
L3 Raw XML: raw, raw-set, add-part
```

规则：

- 默认从 L1 开始，不直接 raw XML。
- 修改前先 `view`、`get` 或 `query`。
- 多步修改优先用 `batch`，减少反复打开和保存。
- 复杂视觉交付必须生成 HTML、PNG、PDF 或 watch 预览。
- 使用 `--json` 获取结构化输出。
- 不猜属性名，不确定时先运行 help。
- 对需要人类确认的文档修改，先用 mark 或生成审阅稿。

### 7. 文档 Render Gate

凡是 Office、PDF、PPT、网页、图表交付物，都必须进入渲染门禁。

门禁要求：

- 能生成预览：HTML、PNG、PDF、截图或本地 watch。
- 能被 Agent 或人类检查：布局、溢出、遮挡、页眉页脚、表格越界、字体缺失。
- 能记录证据：截图路径、渲染命令、检查结果。
- 能回滚：保留源文件、模板、脚本或 batch JSON。

OfficeCLI 文档推荐检查：

```bash
officecli view report.docx issues --json
officecli view report.docx screenshot -o output/report.png
officecli validate report.docx --json
```

### 8. CLI 与浏览器工具边界

Playwright、OpenCLI 和 OfficeCLI 都属于执行工具，但边界不同：

| 工具 | 主要对象 | 最适合 | 风险 |
|---|---|---|---|
| Playwright | 浏览器页面 | 测试、截图、可重复网页流程 | 登录态、选择器漂移 |
| OpenCLI | 已登录网站和应用 | 半自动发布、网页操作桥接 | 外部副作用、账号安全 |
| OfficeCLI | Office 文档 | 文档读写、渲染、批处理 | 文件覆盖、格式破坏 |

选择规则：

- 要测试网页，用 Playwright。
- 要操作已登录平台，用 OpenCLI，并走 L4/L5 授权。
- 要生成或修改 Office 文档，用 OfficeCLI，并走 render gate。
- 要批量处理纯数据，用 `jq`、`yq`、`duckdb` 或 Python。

### 9. 工具引入审计

新增工具前必须回答：

- 它替代了哪个重复动作？
- 是否支持结构化输出？
- 是否能在 CI 或 headless 环境运行？
- 是否会触发外部副作用？
- 是否需要账号、Token、Cookie 或浏览器 profile？
- 是否能生成可验证产物？
- 是否值得沉淀为 Skill？

新增工具后必须写入：

- `sense/registry/tools.json`
- `.agent/tools/<tool-name>.md` 或 `.agent/adapters/<tool-name>/README.md`
- 相关 PRD task 的 `tools` 字段
- walkthrough 的工具审计记录

### 10. Personal Knowledge Asset OS 的工具层建议

对于 Personal Knowledge Asset OS，第三层工具层建议这样分工：

- Typst：简历 PDF 和高质量排版资产。
- Slidev：开发者风格演示文稿。
- OfficeCLI：需要交给课程、老师、企业或普通用户的 Word/Excel/PowerPoint 交付物。
- Pandoc：Markdown 与 Word/PDF/LaTeX 的通用转换。
- Playwright：本地站点截图、回归测试、PDF 导出验证。
- OpenCLI：社区平台发布和已登录后台操作，只做半自动，最后提交由人类确认。
- ruflo：多 Agent 编排试点，不替代 PRD。
- jq/yq/duckdb：内容索引、frontmatter、JSON 图谱、CSV 分析。

推荐新增 PRD：

```text
S02-T01: Build Sense tool registry
S02-T02: Add Skill distillation workflow
S02-T03: Add OfficeCLI document adapter
S02-T04: Add render gate for document artifacts
S02-T05: Add Playwright/OpenCLI boundary policy
```

---

## 附录：外部工具定位

### OpenCLI 定位

OpenCLI 是环境执行桥。它适合把网站、已登录浏览器、Electron 应用和本地工具转成 CLI 或 Agent 可操作接口。它的优势是处理真实网页和已登录会话，风险是外部副作用和账号安全。因此必须纳入权限分级和审计。

### ruflo 定位

ruflo 是智能体 harness。它适合提供 swarm、memory、hooks、MCP、agents、plugins 和 guardrails。它的优势是多 Agent 协调和长期任务循环，风险是引入大量项目外状态和工具复杂度。因此必须先审计接入，再正式启用。

### Taste v4.0 定位

Taste v4.0 是治理协议。它不追求替代任何工具，而是让所有工具在同一个项目事实源、权限模型和审计框架下工作。

### OfficeCLI 定位

OfficeCLI 是 Office 文档执行桥。它适合让 Agent 以 CLI 和 JSON 方式读写、检查和渲染 `.docx`、`.xlsx`、`.pptx`，将传统 GUI 文档工作纳入可脚本化、可审计、可渲染验证的 Sense 工具层。
