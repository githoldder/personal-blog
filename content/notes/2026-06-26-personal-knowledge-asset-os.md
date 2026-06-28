---
title: "Personal Knowledge Asset OS 架构设计"
date: 2026-06-26
tags: ["架构", "知识管理", "Astro"]
status: "draft"
---

# Personal Knowledge Asset OS 架构设计

## 背景

传统个人博客只能承载文章发布，无法统一管理笔记、简历、项目、演示文稿等多元知识资产。需要一个「操作系统级」的基础设施来统一管理。

## 核心设计

### 内容真源

所有内容统一存放在 `content/` 目录：
- `resume/` — 简历（YAML 数据 + Typst 模板）
- `notes/` — 笔记（Markdown）
- `projects/` — 项目（Markdown）
- `decks/` — 演示文稿（Markdown）

### 构建管线

```
content/ → scripts/ → public/assets/
```

每个内容类型有独立的构建脚本，最终输出到统一的资产目录。

### 多端输出

- Web: Astro 静态站点
- PDF: Typst 简历生成
- Slides: Slidev 演示文稿
- Graph: 语义图谱可视化（Phase 3）

## 技术选型

| 组件 | 选择 | 原因 |
|------|------|------|
| 宿主框架 | Astro | 静态优先，Islands 架构 |
| 交互 | React Islands | 按需交互 |
| 样式 | TailwindCSS | 原子化，快速迭代 |
| 简历 | YAML + Typst | 结构化 + 高质量排版 |

## 第一阶段目标

1. 建立治理结构
2. 初始化工程骨架
3. 建立内容真源目录
4. 定义数据模型与构建约定
5. 建立基础页面

## 下一步

- 完善 Typst 模板编译
- 实现 YAML 数据读取
- 构建笔记/项目内容集合
- 预留语义图谱接口
