---
title: "Personal Knowledge Asset OS (personal-blog)"
description: "静态优先的个人能力证明、知识投影与语义漫游系统，打通 Obsidian 物理库投影与编译管线。"
status: "done"
date: 2026-07-03
tech: ["Astro","React","TailwindCSS","Node.js","Typst","D3.js"]
---

# Personal Knowledge Asset OS (个人知识资产系统)

<p align="center">
  <img src="https://img.shields.io/badge/version-v1.2.0--stable-blue" alt="Version">
  <img src="https://img.shields.io/badge/Astro-5.10+-green" alt="Astro">
  <img src="https://img.shields.io/badge/React-19.0+-green" alt="React">
  <img src="https://img.shields.io/badge/Node.js-20+-green" alt="Node">
  <img src="https://img.shields.io/badge/D3.js-7.8+-green" alt="D3">
</p>

> 静态优先的个人知识资产管理与能力证明平台。以内容真源（Source of Truth）为核心，将 Obsidian 笔记、Canvas 拓扑、Excalidraw 绘图、Reveal.js/Slidev 演示及 Typst 结构化简历统一编排发布。

## 架构演进与核心亮点

### 1. Wiki-link 静态路由重写与多键冲突判定
- **问题**：在没有 Obsidian 运行时环境的情况下，需要将双链 `[[Target]]` 及其别名改写为符合前端路由的静态页面 URL，并要处理不同目录下相同标题的重名冲突。
- **解决方案**：在构建脚本中对整个 Obsidian 目录执行深度优先扫描，针对文件名、首行一级标题构建多键 lookup map 字典。解析 wiki-link 时，根据多键字典动态生成无歧义的相对静态链接；若发生冲突，则按照相对路径邻近度层级匹配逻辑自动解决歧义，并将改写结果持久化。

### 2. Obsidian Canvas & Excalidraw 静态解析与渲染组件
- **问题**：Canvas 拓扑图（`.canvas`）和 Excalidraw 手绘图纸（`.excalidraw.md`）本质为大块被混淆的 JSON 块，在没有插件支持的公开 Web 端无法直接阅读。
- **解决方案**：
  - **CanvasViewer**：开发了定制的 React `<CanvasViewer>` 组件，解析 Canvas 的 JSON 拓扑中各卡片节点的物理坐标（`x`, `y`）、尺寸和边缘关系。在 Web 端渲染 React 绝对定位卡片，并通过底层 `<svg>` 画布和动态 Marker 绘制连接导向线。
  - **ExcalidrawViewer**：编写行级状态机提取器，剥离 Excalidraw 原生前端冗余 JSON 标记，将内部的矩形、椭圆、直线、文字等手绘 primitives 转换为轻量级响应式 SVG Primitives。对于不支持或过于复杂的自由笔迹元素，设计了安全的降级预览与跳转机制。

### 3. 海量语义图谱 D3-force 与 folded PARA 算法优化
- **问题**：当知识节点达到数千个、关系连线达到上万条时，前端直接运行 D3 物理力导向图会引起严重的帧率降低和内存膨胀。
- **解决方案**：
  - **折叠 PARA 算法**：在 `build-semantic-graph.js` 的编译阶段引入 folded PARA 分类主题算法，按照 Obsidian 的物理二级目录进行节点聚合归类，将庞杂的节点折叠，单独输出轻量级 `para.json`。
  - **帧渲染性能控制**：在前端 React 组件中，引入 `requestAnimationFrame` 驱动节点坐标更新并直接设置 DOM 的 `style.transform` 属性，规避了高频触发 React state diff 带来的巨大重绘性能损耗。同时增加了 HUD 控制面板，支持“全量细节网”和“PARA 聚焦版图”的多级漫游。

### 4. 多格式文档编译与安全投影管线
- **多通道构建**：项目构建流水线（`build-assets.js`）统一编排了简历 YAML-to-Typst PDF、PPTX-to-PDF（借助 Keynote AppleScript 自动化转换）、Slidev 演示文稿静态化、搜索索引生成等任务。
- **发布哨兵与隐私防泄露**：构建时执行本地路径、敏感 tokens 以及私有 `obsidian://` url 过滤，确保公开静态资源库完全脱敏。

## 系统工程金字塔

```
Personal Knowledge Asset OS
├── 📦 构建管线 (Build Pipeline)
│   ├── scripts/build-notes-index.js     # wiki-link 重写与 notes 数据提取
│   ├── scripts/build-decks.js           # slidev/pptx 编译与 manifest 生成
│   ├── scripts/build-resume.js          # Typst 简历渲染与 macOS AppleScript pptx 转换
│   └── scripts/build-semantic-graph.js  # 全量图谱构建与 folded PARA 计算
│
├── 🖼️ 核心组件 (Core Viewers)
│   ├── src/components/CanvasViewer.jsx     # Canvas 拓扑图解析渲染器
│   ├── src/components/ExcalidrawViewer.jsx # Excalidraw 手绘图形 SVG 解析器
│   └── src/components/ParchmentStack.astro  # 演示文稿卡片交互组件
│
└── 🌐 本地 Cockpit 服务
    └── server/local-api.js              # 提供源目录树读取、在线 Markdown 保存及热编译 API
```
