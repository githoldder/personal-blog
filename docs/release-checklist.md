# Release Checklist - 发布操作清单

本文件记录了 Personal Knowledge Asset OS 在执行发布前必须经历的本地全量构建、回归校验、人工视觉评审及发布授权审批清单。

## 1. 前置构建与校验 (L1/L2 Gate)

在做任何发布预览或部署决策前，必须确保本地代码完全通过质量门禁。

- [ ] **执行环境初始化**：
  ```bash
  npm install
  ```
- [ ] **物理资产全量构建**：
  ```bash
  npm run build:assets
  ```
  *确认终端输出包含 Resume (PDF + JSON)、Decks (manifest)、Semantic Graph、Search Index、RSS/Atom Feeds 和 SEO Assets 的全量 Success 报告。*
- [ ] **本地门禁全量校验**：
  ```bash
  npm run verify
  ```
  *必须保证所有单元测试全绿通过，Astro 静态编译完美输出。*

## 2. 本地静态预览与人工视觉评审 (Visual QA Gate)

- [ ] **启动本地静态服务器**：
  ```bash
  npm run preview
  ```
  *访问终端输出的本地端口（如 `http://localhost:4321/`）开始人工评审。*

### 核心功能评审子项：
- [ ] **全局导航栏响应**：在移动端/桌面端视口下，置顶导航条显示正常，横滑流畅，活动页签能准确高亮。
- [ ] **XSS 防注入测试**：访问 `/search` 页面，输入 `<script>alert(1)</script>` 等测试词汇，确认检索结果和 meta 统计处均已被安全实体转义，无弹窗。
- [ ] **本地模糊检索召回**：输入 content 中存在的独特词汇（例如文稿中的 “Phase 4”），验证搜索结果能即时呈现且卡片直达链接有效。
- [ ] **未构建文稿兜底链接**：
  - 若幻灯片物理上未构建，验证 `/search` 直达按钮跳转到了 `/decks#<slug>` 且能精准滚动对齐到目标卡片。
  - 若已构建，点击后能正确在新标签页中打开 `/slides/<slug>/` 预览。
- [ ] **时区无关 Feeds 校验**：本地打开 `http://localhost:4321/rss.xml` 和 `http://localhost:4321/atom.xml`，校验格式合规。**确认 draft 状态的文章/项目没有泄露在 Feed 中。**
- [ ] **PDF 简历下载**：在 `/resume` 页面中，点击 PDF 简历下载按钮，确认可以下载到物理编译生成的 `resume.pdf` 文件且格式整齐。
- [ ] **SEO 元数据检验**：右键查看网页源代码，确认 `<head>` 中 `canonical`、`og:title`、`og:description` 以及 `twitter:` 等元标签均已被正确解析注入。

## 3. 发布授权决策 (L4 Authorization Gate)

> [!IMPORTANT]
> **Sense L4 门禁红线**：根据智能体权限分级，本系统的任何远程部署（Cloudflare Pages 或 Vercel 部署）、DNS 解析更改、生产推送都属于 L4 级（外部写入）或更高权限。
> - [ ] **绝对禁止 Agent 自动执行远程部署或自动推送代码。**
> - [ ] **必须向人类（USER）呈递完整的 Walkthrough 报告。**
> - [ ] **必须获得人类明确的书面授权字串（如 "Proceed" 或者是明确的部署部署指令）后，方可由人类在本地手动执行或 Agent 遵照指令辅助执行推送部署。**
