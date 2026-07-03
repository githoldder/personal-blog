# Directory Map — Personal Knowledge Asset OS

> 本文件声明每个目录的角色与用途，防止文件乱放。

## 根目录

| 目录 | 角色 | 允许内容 | 禁止内容 |
|------|------|----------|----------|
| `Agent.md` | Agent 入口 | 状态指示牌、禁止碰区、常用命令 | — |
| `README.md` | 人类入口 | 项目介绍、目录结构 | — |
| `package.json` | 依赖声明 | Node.js 依赖 | — |
| `astro.config.mjs` | Astro 配置 | Astro 配置项 | — |
| `tsconfig.json` | TS 配置 | TypeScript 编译选项 | — |
| `tailwind.config.mjs` | Tailwind 配置 | 样式配置 | — |
| `.gitignore` | Git 忽略 | 忽略规则 | — |

## 治理结构

| 目录 | 角色 | 允许内容 |
|------|------|----------|
| `.agent/rules/` | 持久化规则 | 命名规范、架构规则等 `.md` 文件 |
| `.agent/workflows/` | 复用工作流 | 编译部署、自动化迁移脚本 |
| `.agent/skills/` | 专属工具包 | 项目专用 skill 定义 |
| `.agent/roles/` | Agent 角色 | Planner/Executor/Reviewer/Guard 等职责 |
| `.agent/permissions/` | 权限说明 | L0-L5 权限模型索引 |
| `.agent/adapters/` | 工具桥 | OpenCLI、OfficeCLI 等适配器契约 |
| `.agent/swarms/` | 编排策略 | ruflo/Codex 多 Agent 拓扑与约束 |
| `.agent/tools/` | 工具契约 | CLI 工具使用边界 |
| `.agent/audit/` | 审计模板 | walkthrough、发布审计、风险检查 |

## 项目记忆

| 目录 | 角色 | 允许内容 |
|------|------|----------|
| `context/project-brief.md` | 项目简介 | 产品定位、核心闭环、非目标 |
| `context/directory-map.md` | 目录地图 | 本文件 |
| `context/context.txt` | 短期记忆 | 决策、状态变更、关键命令结果 |
| `context/memory.md` | 长期记忆 | 关键决策归档 |

## PRD 双板

| 目录 | 角色 | 允许内容 |
|------|------|----------|
| `prds/README.md` | 同步协议 | PRD 双板规则 |
| `prds/project-charter.md` | 项目章程 | 初心、OKR、里程碑、范围、治理约束 |
| `prds/master-prd.md` | Master PRD | 标准 PRD、史诗、用户故事、功能/非功能需求 |
| `prds/current/` | 当前边界 | 活跃 Sprint、非目标、开放问题 |
| `prds/json/` | 机器事实源 | Sprint/Task JSON 文件 |
| `prds/md/` | 人类评审视图 | Sprint/Task Markdown 文件 |
| `prds/archive/` | 历史归档 | 过期 PRD 与 walkthrough |
| `prds/machine/` | 机器摘要 | 兼容工具的简化摘要 |

## Sense 运行态

| 目录 | 角色 | 允许内容 |
|------|------|----------|
| `sense/registry/` | 注册表 | agents/tools/platforms JSON |
| `sense/runs/` | 执行记录 | 多 Agent run JSON |
| `sense/queues/` | 队列 | publish/review 队列 |
| `sense/state/` | 状态快照 | 非敏感 current state |
| `sense/reports/` | 报告 | 审计、发布、集成评估 |

## 内容真源

| 目录 | 角色 | 允许内容 |
|------|------|----------|
| `content/resume/` | 简历数据 | `resume.yaml` + `template.typ` |
| `content/notes/` | 笔记 | `*.md` 文件，含 frontmatter |
| `content/projects/` | 项目 | `*.md` 文件，含 frontmatter |
| `content/decks/` | 演示文稿 | `*.md` 文件（Slidev 风格） |

## 源码

| 目录 | 角色 | 允许内容 |
|------|------|----------|
| `src/components/` | 组件 | `.astro` / `.tsx` / `.jsx` 组件 |
| `src/components/layout/` | 布局组件 | Header、Footer、Nav 等 |
| `src/components/resume/` | 简历组件 | 简历展示相关组件 |
| `src/components/content/` | 内容组件 | 笔记卡片、项目列表等 |
| `src/layouts/` | 页面布局 | BaseLayout.astro 等 |
| `src/pages/` | 页面路由 | `.astro` 页面文件 |
| `src/styles/` | 样式 | `global.css` 等 |
| `src/lib/` | 工具库 | 内容读取、简历处理、语义工具 |

## 静态资源

| 目录 | 角色 | 允许内容 |
|------|------|----------|
| `public/` | 静态文件 | 直接访问的静态资源 |
| `public/assets/` | 生成资产 | 构建管线输出的 PDF/JSON 等 |
| `public/assets/generated/` | 自动生成 | 脚本生成的资产（不入 Git） |

## 工程支撑

| 目录 | 角色 | 允许内容 |
|------|------|----------|
| `scripts/` | 构建脚本 | `.js` / `.sh` 构建与工具脚本 |
| `docs/` | 工程文档 | 部署规划、技术规范 |
| `drafts/` | 草稿 | Prompt 草稿、临时想法 |
| `prompts/` | 指令模板 | 子 Agent 可复用 prompt |
| `templates/` | 格式模板 | 报告/任务格式模板 |
| `output/` | 生成物 | 编译产出（不入 Git） |
| `tests/` | 测试 | 校验脚本与测试用例 |

## 已有目录（保留不动）

| 目录 | 状态 | 说明 |
|------|------|------|
| `doc/` | 保留 | 原项目残留，后续归档 |
| `reveal/` | 保留 | 原项目 reveal.js 依赖 |
| `node_modules/` | 保留 | 已有依赖（pdfjs-dist） |
