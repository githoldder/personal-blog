# Deployment Plan — Personal Knowledge Asset OS

> 本文档描述 Personal Knowledge Asset OS 的部署规划。第一阶段只保留规划，不实现多云容灾。

## 1. Astro 静态构建

Astro 生成纯静态 HTML/CSS/JS，可部署到任何静态托管服务。

```bash
# 构建
npm run build

# 输出
dist/          # 静态文件
```

**构建产物：**
- `dist/index.html` — 首页
- `dist/resume/index.html` — 简历页
- `dist/notes/index.html` — 笔记列表
- `dist/projects/index.html` — 项目列表
- `dist/decks/index.html` — 演示文稿列表
- `dist/lab/graph/index.html` — 语义图谱实验室

## 2. Typst 简历预构建

在 Astro 构建前，先运行 Typst 生成简历 PDF。

```bash
# 1. 构建简历 PDF
npm run build:resume

# 2. 确保 PDF 在 public/assets/ 中
ls public/assets/resume.pdf

# 3. 构建 Astro
npm run build
```

**依赖：**
- Typst CLI: `brew install typst` 或 `cargo install typst-cli`

**管线：**
```
content/resume/resume.yaml + content/resume/template.typ
  → build-resume.js
  → public/assets/resume.pdf
  → Astro 构建时复制到 dist/assets/resume.pdf
```

## 3. Slidev HTML/PDF 预构建

演示文稿使用 Slidev 构建为静态 HTML，可选导出 PDF。

```bash
# 1. 构建演示文稿
npm run build:decks

# 2. 输出
ls public/slides/          # HTML 演示文稿
ls public/assets/*.pdf     # PDF 导出

# 3. 构建 Astro
npm run build
```

**依赖：**
- Slidev CLI: `npm install -g @slidev/cli`

**管线：**
```
content/decks/*.md
  → build-decks.js
  → public/slides/<slug>/    (HTML)
  → public/assets/<slug>.pdf  (PDF)
  → Astro 构建时复制到 dist/
```

## 4. Obsidian Git 同步设想

内容真源（content/）可通过 Obsidian Git 插件与 Obsidian 库同步。

**方案：**
1. Obsidian 库中维护笔记/项目/简历内容
2. 使用 Obsidian Git 插件自动提交到 Git 仓库
3. CI/CD 监听 Git 变更，自动构建部署

**同步路径：**
```
Obsidian Vault (本地)
  → Obsidian Git 插件
  → Git Push (content/)
  → CI/CD 监听
  → npm run build
  → 部署
```

**注意事项：**
- 需要统一 Obsidian Markdown 格式与 Astro 内容集合格式
- frontmatter 字段需要映射
- 图片资源需要统一管理

## 5. PicGo + Cloudflare R2 资产方案

生成的资产文件（PDF、图片等）存储到 Cloudflare R2，通过 CDN 加速。

**方案：**
1. 使用 PicGo 上传资产到 R2
2. 获取公开 URL
3. 在内容中引用 R2 URL

**上传脚本（规划）：**
```bash
# 上传简历 PDF
picgo upload public/assets/resume.pdf

# 上传演示文稿 PDF
picgo upload public/assets/*.pdf
```

**R2 Bucket 结构：**
```
personal-blog-assets/
  ├── resume/
  │   └── resume.pdf
  ├── decks/
  │   ├── pk-asset-os-roadmap.pdf
  │   └── ...
  └── images/
      └── ...
```

**CDN 域名：**
- `assets.caolei.dev` → R2 Bucket

## 6. Cloudflare Pages / Vercel 部署路径

### Cloudflare Pages（推荐）

1. 连接 GitHub 仓库
2. 构建命令: `npm run build`
3. 输出目录: `dist`
4. 环境变量: 无需（静态站点）

**优势：**
- 免费额度充足
- 全球 CDN
- 自动 HTTPS
- 与 R2 同平台，便于资产管理

### Vercel（备选）

1. 连接 GitHub 仓库
2. 框架预设: Astro
3. 构建命令: `npm run build`
4. 输出目录: `dist`

**优势：**
- 部署速度快
- 预览部署
- 边缘函数（未来可选）

## 7. CI/CD 流水线（规划）

```yaml
# .github/workflows/deploy.yml (规划)
name: Deploy

on:
  push:
    branches: [main]
    paths:
      - 'content/**'
      - 'src/**'
      - 'scripts/**'
      - 'package.json'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build:assets    # 构建资产
      - run: npm run build           # 构建 Astro
      - uses: cloudflare/wrangler-action@v3
        with:
          command: pages deploy dist
```

## 8. 第一阶段不实现

| 功能 | 原因 |
|------|------|
| 多云容灾 | 第一阶段单平台即可 |
| 自动回滚 | 手动部署足够 |
| 预览环境 | 静态站点风险低 |
| 监控告警 | 第一阶段流量小 |
| 边缘函数 | 静态站点无需 |

## 9. 部署检查清单

在部署前确认：

- [ ] `npm run build` 成功
- [ ] `npm run build:resume` 成功（如有）
- [ ] `npm run build:decks` 成功（如有）
- [ ] `npm run build:semantic` 成功
- [ ] 本地 `npm run preview` 正常
- [ ] 所有页面路由正常
- [ ] 资产文件可访问
- [ ] 无控制台错误
