# Rollback Plan - 灾备回滚方案

本方案规定了 Personal Knowledge Asset OS 在发布、运行或资产构建出现故障时的应急响应规范与一键回撤步骤，保障系统可用性的高稳定性。

## 1. 本地代码与配置回滚 (Repository Rollback)

若最新提交或修改的代码引入了严重运行时缺陷、Astro 构建中断或门禁崩溃，执行以下步骤回退代码：

- **非物理提交代码回撤**（未执行 `git commit`）：
  ```bash
  # 丢弃工作区中所有未提交的改动
  git reset --hard HEAD
  git clean -fd
  ```
- **已 commit 版本的回滚**：
  若缺陷已提交进本地 Git 历史，我们需要将 HEAD 退回至上一个绝对健康的 Commit 节点：
  ```bash
  # 1. 查找上一个确定健康的 Commit ID (如 58f6db9)
  git log --oneline -n 10
  
  # 2. 执行硬回滚重置本地指针
  git reset --hard <LAST_HEALTHY_COMMIT_ID>
  ```
  *警告：`git reset --hard` 会清除此提交之后工作区的一切改动，请在备份重要草稿后再执行。*

## 2. 构建产物与生成资产重置 (Asset Rollback)

由于本项目在本地构建时会重写 `public/assets/` 目录中的 json、pdf、xml 文件，若在构建中发生数据损坏、解析错误或生成了脏数据：

- **一键重置资产生成文件**：
  ```bash
  # 仅撤销 public 资产目录及 sitemaps/feeds 的本地变动
  git restore public/assets/
  git restore public/rss.xml public/atom.xml public/robots.txt public/sitemap.xml
  ```
- **全量重新跑编译验证**：
  在恢复干净资产后，重新调用正确的数据真源重新全量生成：
  ```bash
  npm run build:assets && npm run verify
  ```

## 3. 云端托管服务一键回滚 (Hosting Platform Rollback)

根据部署决策 `docs/deployment-plan.md`，若已将系统发布至云端静态托管服务（如 Cloudflare Pages 或 Vercel），当生产环境页面因配置泄露、SSL 故障或静态逻辑错乱崩溃时，执行以下托管端应急避险措施：

### 方案 A：Cloudflare Pages 应急回滚
Cloudflare Pages 具备极其强大的 Deployment 历史回滚与一键激活能力：
1. **控制面板一键指向**：
   - 登录 Cloudflare 控制台，进入 `Pages` 选项卡，选择本项目。
   - 点击 `Deployments` 选项，找到上一个确定健康的部署版本（以时间戳或 Git Commit 哈希为准）。
   - 选择该 Deployment，点击右侧的 `...` 菜单，点击 **`Rollback to this deployment`**。
   - 此操作可在 5 秒内将生产环境的静态边缘路由重定向到该历史健康快照上，完全无感且不依赖本地代码的重新推送。

### 方案 B：Vercel 应急回撤
1. **命令行快捷回撤**：
   若安装了 Vercel CLI，可直接在本地命令行回撤生产环境的 Aliases（别名）：
   ```bash
   # 查看当前部署历史，找到健康版本的 Deployment ID (如 dpl_xxxx)
   vercel deployments
   
   # 将生产域名一键指向该历史健康部署
   vercel alias set <HEALTHY_DEPLOYMENT_ID> caolei.net
   ```
2. **控制台可视化操作**：
   - 登录 Vercel Dashboard，点击项目页面。
   - 选择 `Deployments` 页签。
   - 选择健康版本右侧的菜单，点击 **`Promote to Production`**，即可瞬间回滚。
