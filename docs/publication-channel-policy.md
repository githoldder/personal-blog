# Publication Channel Policy - 外部发布渠道政策

为了确保 Personal Knowledge Asset OS 的外部副作用（Side Effects）完全受控，并遵循 L4 级人类授权门禁，特制定本外部发布渠道政策。

---

## 1. 外部渠道分类 (Channel Classification)

本系统对所有可能改变外部（本仓库之外）状态的路径执行以下分类限制：

### 允许的外部写入渠道 (Allowed Channels)
在遵循 L4 权限前置校验与人类授权（USER Approval）前提下，允许通过以下渠道同步资产：
1. **静态托管服务 (Production Site Hosting)**：
   - *Cloudflare Pages (首选)* / *Vercel (备选)*。
   - 目的：用于发布静态 Astro 站点、Decks 及相关已生成的物理资产。
2. **对象存储服务 (Object Storage & CDN)**：
   - *Cloudflare R2 / CDN (assets.caolei.dev)*。
   - 目的：上传 PDF 简历、大图片和文稿 PDF 资产，减轻仓库体积。
3. **内容同步通道 (Content Repository Sync)**：
   - *Obsidian Git Push*。
   - 目的：本地 `content/` 数据源同步至远端托管 GitHub 仓库。

### 绝对禁止的外部渠道 (Prohibited Channels)
在任何时候，严禁 Agent 自动、半自动或使用外部脚本触发以下操作：
1. **自动化社交/营销平台发布**：禁止通过 API 或无头浏览器向微信公众号、知乎、X/Twitter、小红书等平台发布推文、文章或动态。
2. **云服务全局配置修改**：禁止 Agent 静默修改 DNS 记录、安全组配置、存储桶访问策略等基础设施配置。
3. **外部账号静默变更**：禁止执行任何静默的平台账户登录、密钥轮转、删除部署等高危行为。

---

## 2. 核心渠道审批与回滚矩阵 (Approval & Rollback Matrix)

对于所有允许的写入渠道，必须严格遵循下表的审批及灾备回滚规范：

| 渠道路径 | 前置门禁校验 (Gate) | 人类审批凭证 (Approval) | 回滚与灾备路径 (Rollback) |
|----------|-------------------|----------------------|--------------------------|
| **Cloudflare Pages / Vercel 静态站部署** | 1. `npm run verify` 通过<br>2. 人工 `npm run preview` 视觉走查<br>3. 检查 [release-checklist.md](file:///Users/caolei/Desktop/personal-blog/docs/release-checklist.md) | 需在 Walkthrough 中呈现构建版本，并在获得人类明确的 **"Proceed" 或部署指令** 后方可执行。 | 1. **Pages 控制台**：一键点击历史 Deployment 的 `Rollback` 瞬间切回上个版本。<br>2. **Vercel CLI**：执行 `vercel alias set <healthy_id> caolei.net` 进行快速指向。 |
| **Cloudflare R2 资产上传** | 1. 本地校验 PDF/图片 文件完整性<br>2. 走查 `content-quality-checklist.md` 规范 | 必须获得人类对特定资产（如 resume.pdf）的**上传授权确认**。 | 1. **物理删除**：通过 S3 API 或 R2 仪表板手动删除已上传文件。<br>2. **路径降级**：将本站内容引用退化为指向本地物理路径 `/assets/`。 |
| **GitHub 远程同步 (Git Push)** | 1. `validate-pipeline` 校验全绿<br>2. 确认无未处理的构建时间戳等杂音 | 本地单元测试与回归校验全绿通过即可进行代码级同步。 | 1. **指针回滚**：本地及远端执行 `git reset --hard HEAD~1` 或 `git revert` 并强推（需要人类最终确认）。 |

---

## 3. L4 门禁行为红线

- **禁止静默操作**：任何静默的 `git push`、`picgo upload`、`wrangler pages deploy` 或外部 API 请求均属于严重越权违规。
- **报告审计义务**：所有外部写入操作的触发时间、提交哈希（Commit Hash）、部署 URL 必须白纸黑字记录在最新一轮的 `walkthrough.md` 报告中供人类审计。
