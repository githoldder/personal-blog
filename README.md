# Personal Knowledge Asset OS

个人知识资产操作系统 — 统一管理笔记、简历、项目、演示文稿与语义图谱的知识基础设施。

## 项目简介

本项目不是普通个人博客。博客只是公开展示层，背后是统一的数据与资产底座。

**核心闭环：** 内容真源 → 构建管线 → 多端输出

## 技术栈

- **宿主框架：** Astro
- **交互岛：** React Islands
- **样式：** TailwindCSS
- **内容真源：** `content/` 目录（Markdown / YAML / Typst）
- **简历生成：** Typst（从 YAML 数据源生成 PDF）
- **演示文稿：** Slidev 风格 Markdown
- **治理框架：** Taste v4.0 Sense

## 目录结构

```
personal-blog/
├── Agent.md              # Agent 入口（状态指示牌、禁止碰区、提效路径）
├── README.md             # 本文件
├── package.json          # Node.js 依赖
├── astro.config.mjs      # Astro 配置
├── tsconfig.json         # TypeScript 配置
├── tailwind.config.mjs   # TailwindCSS 配置
├── .gitignore
│
├── .agent/               # Agent 治理配置
│   ├── rules/            # 项目持久化规则
│   ├── workflows/        # 复用工作流
│   ├── skills/           # 专属工具包
│   ├── roles/            # 多 Agent 角色
│   ├── permissions/      # 权限说明
│   ├── adapters/         # OpenCLI / OfficeCLI 等工具桥
│   ├── swarms/           # 多智能体编排策略
│   ├── tools/            # 工具契约说明
│   └── audit/            # 审计模板
│
├── sense/                # Sense 运行态
│   ├── registry/         # agents/tools/platforms 注册表
│   ├── runs/             # 多 Agent 执行记录
│   ├── queues/           # 发布/审核队列
│   ├── state/            # 非敏感状态快照
│   └── reports/          # 审计报告
│
├── context/              # 项目记忆
│   ├── project-brief.md  # 项目简介
│   ├── directory-map.md  # 目录地图
│   ├── context.txt       # 短期记忆（决策与状态变更）
│   └── memory.md         # 长期记忆（关键决策归档）
│
├── prds/                 # PRD 双板
│   ├── README.md         # PRD 同步协议
│   ├── json/             # 机器执行单一事实源
│   └── md/               # 人类评审视图
│
├── content/              # 内容真源
│   ├── resume/           # 简历数据（YAML + Typst 模板）
│   ├── notes/            # 笔记（Markdown）
│   ├── projects/         # 项目（Markdown）
│   └── decks/            # 演示文稿（Markdown）
│
├── src/                  # Astro 源码
│   ├── components/       # 组件
│   ├── layouts/          # 布局
│   ├── pages/            # 页面路由
│   ├── styles/           # 样式
│   └── lib/              # 工具库
│
├── public/               # 静态资源 & 构建产物
│   └── assets/           # 生成的资产文件
│
├── scripts/              # 构建脚本
├── docs/                 # 工程文档
├── drafts/               # Prompt 草稿
├── prompts/              # 子 Agent 指令模板
├── templates/            # 格式模板
├── output/               # 编译生成物
├── tests/                # 测试文件
│
├── doc/                  # [已有] 存量资料，勿删勿移
├── reveal/               # [已有] reveal.js 演示框架
└── node_modules/         # [已有] 依赖
```

## 已有目录说明

| 目录 | 状态 | 说明 |
|------|------|------|
| `doc/` | 已有，空 | 原项目残留，第一阶段保留，后续归档 |
| `reveal/` | 已有，含 node_modules | 原项目 reveal.js 依赖，第一阶段保留 |
| `node_modules/` | 已有，含 pdfjs-dist | 原项目依赖，第一阶段保留 |

## 快速开始

```bash
npm install
npm run dev
```

## 相关文档

- [Agent 治理入口](./Agent.md)
- [项目简介](./context/project-brief.md)
- [目录地图](./context/directory-map.md)
- [部署规划](./docs/deployment-plan.md)
- [S01 Foundation PRD](./prds/md/S01-foundation.md)
- [S02 Sense Harness PRD](./prds/md/S02-sense-harness.md)
