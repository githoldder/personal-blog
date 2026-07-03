# PRD 双板同步协议

> 本文件定义 PRD 双板（JSON + MD）的同步规则与使用约定。

## 核心原则

**以 JSON 为主，MD 为辅。**

- `prds/json/` 是 Agent 执行的**唯一事实源（Single Source of Truth）**
- `prds/md/` 是人类评审视图，只做摘要同步

## 文件命名规范

```
prds/
├── json/
│   └── S01-foundation.json    # Sprint 01 JSON
└── md/
    └── S01-foundation.md      # Sprint 01 Markdown
```

## 上位产品基准

除 Sprint 双板外，`prds/` 根目录保留两个长期产品基准文件：

- `prds/project-charter.md` — 来自初心文档的项目章程、OKR、里程碑、范围和治理约束。
- `prds/master-prd.md` — 面向产品经理评审的 Master PRD，包含史诗、用户故事、功能需求、非功能需求和风险。

这两个文件不参与 `scripts/validate-prd.js` 的机器校验，但它们是 S08-S14 后续需求拆分和验收标准的上位依据。

## JSON 结构规范

```json
{
  "sprint_id": "S01",
  "title": "Foundation",
  "objective": "建立工程骨架与治理结构",
  "status": "todo",  // todo | in_progress | done
  "created_at": "2026-06-26",
  "milestones": [
    {
      "id": "M01",
      "title": "治理结构建立",
      "status": "todo",
      "tasks": ["S01-T01"]
    }
  ],
  "tasks": [
    {
      "id": "S01-T01",
      "title": "Agent governance scaffold",
      "status": "todo",  // todo | in_progress | done
      "owner": "agent",
      "inputs": ["governance spec"],
      "outputs": ["Agent.md", ".agent/", "context/"],
      "acceptance_criteria": ["Agent.md exists and contains required sections"],
      "notes": ""
    }
  ]
}
```

## Task 状态定义

| 状态 | 含义 | 允许操作 |
|------|------|----------|
| `todo` | 未开始 | 可被认领 |
| `in_progress` | 进行中 | 只能有一个 task 处于此状态 |
| `done` | 已完成 | 需要验证 acceptance_criteria |

## 同步流程

### 场景 1：Agent 执行任务

1. Agent 读取 `prds/json/S0X-xxx.json` 获取任务
2. 将 task 状态从 `todo` 改为 `in_progress`
3. 执行任务，完成工作
4. 将 task 状态从 `in_progress` 改为 `done`
5. 将 JSON 状态摘要回写到 `prds/md/S0X-xxx.md`

### 场景 2：人类修改需求

1. 人类修改 `prds/md/S0X-xxx.md` 的需求
2. Agent 解析 MD 变更，同步至 `prds/json/S0X-xxx.json`
3. 更新 JSON 中的任务状态和 acceptance_criteria

### 场景 3：人类直接修改 JSON

1. 人类直接修改 `prds/json/S0X-xxx.json`
2. Agent 在下次执行时读取最新 JSON
3. 将变更摘要同步到 `prds/md/S0X-xxx.md`

## MD 格式规范

Markdown 文件只做摘要展示，不包含执行细节：

```markdown
# Sprint 01: Foundation

## Objective
建立工程骨架与治理结构

## Milestones
- [ ] M01: 治理结构建立
- [ ] M02: 工程初始化

## Tasks
| ID | Title | Status |
|----|-------|--------|
| S01-T01 | Agent governance scaffold | ✅ Done |
| S01-T02 | Astro project scaffold | 🔄 In Progress |

## Acceptance Criteria
- Agent.md exists
- Astro project builds successfully
```

## 校验规则

`scripts/validate-prd.js` 会检查：

1. JSON 文件结构合法性
2. 每个 task 必须包含 id, title, status, owner, inputs, outputs, acceptance_criteria
3. status 只能是 todo / in_progress / done
4. Sprint 级别 status 与 task status 的一致性
