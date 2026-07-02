# Feedback Intake Model Design

本文档针对 Personal Knowledge Asset OS 设计低侵入、零隐私风险的轻量反馈收集方案。

## 1. 方案评估与对比

为保证静态站点的高性能与无隐私泄露风险，评估以下四类反馈收集方案：

| 方案 | 外部依赖 | 隐私风险 | 审核/防刷网关 | 静态契合度 | 推荐指数 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **A. 静态邮件/PR (Local & Mailto)** | 零依赖 | 极低 (用户自控) | 客户端防刷 | 极高 (纯 HTML) | ★★★★★ (默认推荐) |
| **B. 代码仓库 (GitHub Issues/Discussions)** | GitHub 平台 | 低 (需 GitHub 账号) | GitHub 官方防刷 | 高 (外链跳转) | ★★★★☆ (默认备选) |
| **C. 轻量评论插件 (Giscus/Utterances)** | 客户端加载第三方 JS | 中 (依赖 GitHub App) | 需要 GitHub 登录审核 | 中 (需要客户端渲染) | ★★☆☆☆ (需显式审批) |
| **D. 托管表单与第三方评论 (Disqus/Google Forms)**| 极重 (加载大量广告追踪) | 极高 (第三方追踪/Cookie) | 依赖第三方过滤 | 低 (影响首屏性能) | ☆☆☆☆☆ (禁止引入) |

## 2. 隐私与内容审核风险分析

### 2.1 隐私风险 (Privacy Risks)
- **第三方追踪**：Disqus 等托管服务会在客户端植入第三方追踪 Cookie，收集读者指纹并进行跨站广告定位，违反「无缺省公开，无隐私侵犯」的底层原则。
- **动态 JS 注入**：任何引入第三方 script 标签的系统（如外部表单或分析）都有可能成为 XSS 攻击的向量，破坏静态站点的防注入设计（如 `search.astro` 中的静态净化保护）。

### 2.2 内容审核风险 (Moderation & Spam Risks)
- **匿名垃圾信息 (SPAM)**：开放的匿名表单容易被爬虫利用，灌入垃圾广告或恶意代码，且缺乏低成本的客户端验证网关（引入 CAPTCHA 将增加页面负担）。
- **言论合规性**：如果将评论直接渲染在静态页面上（如 Waline/Giscus 动态拉取并展示），未审核的用户评论可能会导致展示违法或不合规信息。

## 3. 默认推荐方案设计

本系统默认采用 **双轨本地反馈机制 (Dual Local Feedback)**，完全不引入外部动态脚本：

### 3.1 预填邮件反馈 (Mailto Route)
在页面底部提供静态邮件链接，通过预填 `Subject` 和 `Body` 指引用户提供结构化反馈，避免被动收集用户信息。
- **格式示例**：
  ```html
  <a href="mailto:feedback@caolei.dev?subject=[Feedback]%20PageTitle&body=反馈页面：%20[URL]%0A您的建议：%0A">通过邮件反馈 ✉️</a>
  ```
- **优势**：零 JS，完全由用户客户端代理发送，隐私 100% 受保护，完全没有服务器溢出与 Spam 灌库风险。

### 3.2 引导仓库反馈 (Repository-based Route)
在页面合适位置（如文章末尾或 Lab 侧边栏）提供指向公开仓库的 Issues 或 Discussions 链接。
- **设计**：
  - 问题反馈：引导至 `https://github.com/githoldder/personal-blog/issues/new?title=[Feedback]+PageTitle`
  - 讨论交流：引导至 `https://github.com/githoldder/personal-blog/discussions`
- **优势**：利用 GitHub 现成的账号体系与防御机制，天然防刷且内容由发布者主导，不需要引入动态第三方评论组件。

## 4. 外部评论组件准入阀门 (Approval Gates)

如果后续确实需要将评论直接嵌入页面（例如引入 **Giscus**），必须满足以下准入条件：
1. **显式 Sense L4 审批**：必须在 `Agent.md` 决策记录中增加人类书面授权凭证。
2. **Opt-in 机制**：必须提供用户开关（例如 `Disable Comments` 按钮），且在用户主动点击加载前，禁止加载任何 Giscus/GitHub 的 iframe 或脚本。
3. **CSP 策略硬化**：更新 Content Security Policy，仅允许 `giscus.app` 与 `github.com` 的受控连接。
