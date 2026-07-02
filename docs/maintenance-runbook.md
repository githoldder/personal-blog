# Maintenance Runbook — Personal Knowledge Asset OS

本文档为系统的日常维护、日常校验与资产更新提供操作指引，确保系统在无自动化 CI/CD 环境下依然具备高度可重复的手工维护性。

## 1. 周期性维护任务

系统维护划分为以下三个周期级别：

### 1.1 内容更新期 (每次内容变更后)
- **动作**：校验 frontmatter 合规性，生成本地静态检索索引与 feeds。
- **校验**：确认只有 explicit `published: true` 或 `status: "published" / "done"` 的内容被包含在 feeds 和搜索索引中。

### 1.2 月度回归期 (每月或发布前)
- **动作**：全资产完整重建、依赖安全性扫描与多端校验。
- **校验**：执行完整 regression suite，确保简历 PDF、Decks 演示文稿及 2D 关系图谱处于最新且不包含 dangling edges。

### 1.3 引擎更新期 (每季度或主要依赖更新)
- **动作**：升级 Astro 主框架及相关 React/TailwindCSS/Slidev 依赖。
- **校验**：锁定 `package-lock.json`，在本地运行 PM2 预览环境并进行多视口走查。

---

## 2. 核心校验与构建命令

| 维护命令 | 作用 | 预期结果 |
| :--- | :--- | :--- |
| `node scripts/validate-prd.js` | 校验 PRD 双板状态与结构 | 输出 `All PRDs are valid`，无格式异常 |
| `npm run verify` | 执行 PRD、内容管线与自动化测试 | 15 项测试通过，Astro 静态构建成功 |
| `npm run build:assets` | 强制触发全量资产预构建 | 生成最新的 `resume.json`/`manifest.json` |
| `npm run build` | 执行资产编译与 Astro 打包 | 输出 `dist/` 静态文件夹 |
| `npm run preview` | 启动本地生产预览 | 监听 `http://localhost:4321`，用于人工审查 |

---

## 3. 环境阻塞项与降级方案 (Environment Blockers & Fallbacks)

### 3.1 Typst CLI 缺失
- **阻塞表现**：`build-resume.js` 执行时无法调用 `typst compile`，抛出命令行未找到错误。
- **降级机制**：构建脚本会自动捕获该异常，输出 Warning 警告。此时，依然会正常校验 `resume.yaml` 的 Schema 并生成 `public/assets/resume.json` 以供 Astro 简历页动态渲染。
- **恢复操作**：
  ```bash
  # macOS
  brew install typst
  # 重新构建
  node scripts/build-resume.js
  ```

### 3.2 Slidev CLI 缺失
- **阻塞表现**：`build-decks.js` 仅输出 `manifest.json`，但 `public/slides/<slug>/` 目录缺失或不更新，导致演示文稿展示页上的「在线预览」指向 fallback。
- **降级机制**：Astro 页面（`src/pages/decks/index.astro`）会自动读取 manifest，并安全渲染为“预览：待构建”状态，不影响其他静态页面的构建与发布。
- **恢复操作**：
  ```bash
  npm install -g @slidev/cli @slidev/theme-default
  node scripts/build-decks.js
  ```

### 3.3 Node.js 版本限制
- **阻塞表现**：较低 Node 版本（< v18）会导致 ES Modules 或顶层 await 解析失败。
- **要求**：运行环境必须锁定 Node.js v20.x 或以上。

---

## 4. 依赖更新与安全硬化规范

1. **依赖升级**：
   - 升级第三方依赖前，必须先建立临时 Git 分支：`git checkout -b chore/dependency-upgrade`
   - 禁止在 `main` 分支上直接执行大版本 `npm update`。
2. **安全核对**：
   - 升级后必须运行 `npm audit`，确保不引入高危（High/Critical）漏洞。
   - 重新运行 `npm run verify`，确保编译管线不被破坏。
