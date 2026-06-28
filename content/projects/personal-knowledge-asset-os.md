---
title: "Personal Knowledge Asset OS"
description: "个人知识资产操作系统"
status: "in_progress"
date: 2026-06-26
tech: ["Astro", "React", "TailwindCSS", "Typst"]
---

# Personal Knowledge Asset OS

## 项目目标

建立一个统一管理个人知识资产的操作系统，将笔记、简历、项目、演示文稿、语义图谱统一管理。

## 核心闭环

内容真源 → 构建管线 → 多端输出

## 当前进展

### S01 — Foundation（进行中）

- [x] Agent 治理结构建立
- [x] Astro 工程骨架初始化
- [x] 内容真源目录建立
- [ ] 简历 Typst 管线可用
- [ ] Slidev 构建管线可用
- [ ] 基础页面完善
- [ ] 部署规划文档

## 技术架构

```
content/
  ├── resume/     → YAML + Typst → PDF
  ├── notes/      → Markdown → Web
  ├── projects/   → Markdown → Web
  └── decks/      → Markdown → Slides + PDF

scripts/
  ├── build-resume.js
  ├── build-decks.js
  └── build-semantic-graph.js

public/assets/    → 构建产物
```

## 非目标（第一阶段）

- 3D 语义图谱渲染
- MediaPipe 手势识别
- WebGPU 语义计算
- 多云容灾
