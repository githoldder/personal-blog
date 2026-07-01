# Content Cadence Policy - 内容发布节奏与运营规范

为了维持 Personal Knowledge Asset OS 本地内容运营的严密性与逻辑清晰性，特制定本规范。所有内容生产与维护活动均遵循本地优先、人工审查、零自动化的原则。

---

## 1. 运营维护节奏 (Cadence)

系统的日常运营与资产同步以人工触发的周期性节奏开展：

- **周度回顾与收集 (Weekly Intake)**：
  - 汇总在本地 Obsidian 库中沉淀的阶段性学习笔记和项目档案。
  - 将初步完整的文件物理移入本仓库的对应目录：
    - 笔记类：放置于 `content/notes/`。
    - 项目类：放置于 `content/projects/`。
  - 新导入的文章，默认在 Frontmatter 中标注 `status: "draft"` (Notes) 或 `status: "todo"` / `"in_progress"` (Projects)，作为本地隔离起点。
- **双周打磨与评审 (Bi-weekly Review)**：
  - 对已导入的草稿进行逻辑校验、死链检查以及可访问性审查。
  - 参照 `docs/content-quality-checklist.md` 进行人工逐项走查。
- **月度静态同步 (Monthly Publication)**：
  - 对已通过评审、被判定为可公开发布的内容进行状态提升。
  - 提升方式：将 Frontmatter 里的 `status` 变更为白名单公开状态（Notes 改为 `published`；Projects 改为 `done`）。
  - 执行 `npm run verify` 回归门禁校验，确保构建全绿、草稿排除彻底。
  - 由人类确认后，手动执行推送与静态站部署。

---

## 2. 三阶状态与 Frontmatter 映射机制

为了不破坏 `src/content.config.ts` 中的 Zod Schema 静态契约约束，在工作流中的“三阶状态”逻辑与物理 YAML 属性定义做如下映射对齐：

| 逻辑状态阶梯 | 作用与含义 | YAML Frontmatter `status` 值 | 本地 `editorial-queue.json` 归类 | 公开 Surface (页面/检索/Feeds) 准入 |
|--------------|------------|----------------------------|---------------------------------|-----------------------------------|
| **Draft (草稿)** | 新入库的初始创意、资料摘录或未完结笔记。 | Notes: `draft`<br>Projects: `todo` | `queues.draft` | **强行拦截**（不出现在前台、不索引、不入 Feed） |
| **Review (打磨中)** | 正处于文本打磨、关联图谱建立、待评审状态的篇目。 | Notes: `draft`<br>Projects: `in_progress` | `queues.review` | **强行拦截**（不出现在前台、不索引、不入 Feed） |
| **Publishable (发布)** | 已完成品控校验、达到公开发布级别的资产。 | Notes: `published`<br>Projects: `done` | `queues.publishable` | **放行准入**（全 Surfaces 显示、索引并生成 Feeds） |

---

## 3. 发布防区与人工红线

- **禁止静默自动发布**：严禁引入任何第三方定时脚本或 Git Webhook 触发自动发布与同步。
- **发布必经 Verify 门禁**：每一次在执行发布前，必须在本地终端执行 `npm run verify`，确保所有格式无溢出，防范非公开内容穿透。
