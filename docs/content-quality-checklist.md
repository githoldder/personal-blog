# Content Quality Checklist - 内容品控走查清单

本清单是一份专为人类（项目维护者）设计的**人工内容审核走查规范**。
在任何笔记、项目、幻灯片或简历的内容合流，或者在将其发布状态（status）变更为公开（`published` / `done`）并加入检索索引及 Feeds 前，必须依照此清单逐项手动确认，确保公开资产的安全与质量。

---

## 1. 元数据审核防区 (Metadata Audit)

- [ ] **Frontmatter 格式合法性**：
  - YAML 格式正确，所有属性（例如 `title`, `date`, `tags`）不带有未闭合的单双引号或非法缩进。
- [ ] **显式状态声明 (无缺省公开)**：
  - 笔记类：若公开发布，`status` 属性必须显式声明为 `"published"`。
  - 项目类：若公开发布，`status` 属性必须显式声明为 `"done"`。
  - **拦截规则**：若 `status` 缺省（未配置）、为 `"draft"`、`"todo"`、`"in_progress"` 或 `"archived"`，视为私有内容，确保其无法被前台页面展示、搜索引擎和 Feeds 检索到。
- [ ] **日期完整性**：
  - `date` 属性格式为 `YYYY-MM-DD`（如 `2026-07-01`），无拼写错误且时间点合乎逻辑。

---

## 2. 内容超链接审核防区 (Link Integrity)

- [ ] **本地 Wiki-Links 完整性**：
  - 走查所有的双括号链接 `[[note-slug]]`。确保指向的目标 Markdown 文件真实存在，没有因文件名变更或拼写导致死链。
- [ ] **UI 路由锚点完整性**：
  - 凡是跨页面的锚点定位链接（如 `/notes#my-note-anchor` 或 `/projects#my-project-slug`），必须确认对应的宿主页面内存在与该 slug/ID 对应的物理元素或 slug 锚点。
- [ ] **外部链接安全审查 (Sanitization)**：
  - 所有外部 URL 必须使用安全的 `https://` 或 `http://` 协议，无乱码，无恶意推广，杜绝安全脚本注入。

---

## 3. 语义图谱一致性防区 (Semantic Graph Alignment)

依据 `docs/semantic-graph-contract.md` 契约，对语义关联进行人工对账：

- [ ] **节点注册 (Node Registration)**：
  - 确认当前文章在 `public/assets/semantic_graph.json` 中的 `nodes` 列表下拥有与之对应的唯一节点声明。
- [ ] **唯一性冲突审查**：
  - 确认图谱中没有与其他节点重复的 `id` 值。
- [ ] **悬空边防护 (No Dangling Edges)**：
  - 检查图谱中声明的所有 `edges`，确认它们所连接的 `source` 与 `target` 节点均在物理上存在于节点列表中，绝不产生悬空连线。

---

## 4. 就绪度与隐私防护防区 (Public Readiness & Privacy Guard)

- [ ] **隐私与机密泄漏排查 (DLP Check)**：
  - 仔细全文检索并确认没有遗留敏感个人信息（手机号、私人邮箱）、本地内网 IP 或特定物理文件路径、API Keys/Secrets、OAuth Tokens、密码或数据库连接串。
- [ ] **私有笔记与公开资产物理判定**：
  - **私有笔记 (Private Notes)**：含有敏感心智模型草稿、工作日志摘录或未脱敏数据的内容，**严禁**标注为 `published` / `done`，其 Frontmatter status 必须保持为 `draft` / `todo`。
  - **公开资产 (Publishable Assets)**：仅当文本达到结构化公开水准、完成内容脱敏、且满足以上所有品控指标时，方可提升为发布状态。
