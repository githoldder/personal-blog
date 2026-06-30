# Feed Contract - RSS & Atom Feeds

本文件定义了 Personal Knowledge Asset OS 在本地生成的 RSS 2.0 (`public/rss.xml`) 和 Atom 1.0 (`public/atom.xml`) 订阅源的数据契约和编译规范。

## 1. 订阅源定位与发现

- **发现机制**：全局导航页脚 (Footer) 中包含两个独立的超链接，分别指向主域根目录的 `/rss.xml` 与 `/atom.xml`。
- **稳定性声明**：订阅源中所有的文章 / 项目 URL 都是绝对稳定的，使用形式为 `<site_url>/<collection>#<slug>` 的物理锚点（例如 `https://caolei.net/notes#2026-06-26-personal-knowledge-asset-os`），防止重定位或列表展开失效。

## 2. 节点及字段定义契约

### RSS 2.0 (`public/rss.xml`)

| 元素层级 | 契约字段 | 来源 / 规范 |
|----------|----------|-------------|
| `/rss/channel/title` | `siteTitle` | `${authorName}的个人知识资产操作系统` |
| `/rss/channel/link` | `siteUrl` | 取自 `public/assets/resume.json` 中的 `basics.url`，兜底 `https://caolei.net` |
| `/rss/channel/description` | `siteDescription` | 取自简历 Basics 概要说明 |
| `/rss/channel/lastBuildDate` | - | 本地资产构建时的系统时刻 (RFC 822 规范) |
| `/rss/channel/item/title` | `item.title` | 文章或项目的 `frontmatter.title` |
| `/rss/channel/item/link` | `item.link` | 物理锚点 URL (如 `<site_url>/notes#<slug>`) |
| `/rss/channel/item/guid` | `item.link` | 与 `link` 一致以保证唯一可标识性 |
| `/rss/channel/item/pubDate` | `item.date` | 东八区早上 8:00 稳定解析后的 RFC 822 日期 |
| `/rss/channel/item/description` | `item.description` | 优先使用 `summary`，兜底剥离 markdown 的 200 字正文 (CDATA 保护) |

### Atom 1.0 (`public/atom.xml`)

| 元素层级 | 契约字段 | 来源 / 规范 |
|----------|----------|-------------|
| `/feed/title` | `siteTitle` | 与 RSS title 一致 |
| `/feed/subtitle` | `siteDescription` | 与 RSS description 一致 |
| `/feed/link[@rel="self"]` | `/atom.xml` | feed 节点自身的 URL |
| `/feed/updated` | - | 本地资产构建时的系统时刻 (ISO 8601/RFC 3339 规范) |
| `/feed/id` | `siteUrl` | 主站唯一标识符 |
| `/feed/author/name` | `authorName` | 取自简历basics中的姓名 |
| `/feed/entry/title` | `item.title` | 文章或项目的 title |
| `/feed/entry/link` | `item.link` | 物理锚点 URL |
| `/feed/entry/published` | `item.date` | ISO 8601 格式的发布日期 |
| `/feed/entry/updated` | `item.date` | 与 published 相同，用于阅读器增量触发 |
| `/feed/entry/summary` | `item.description` | 200字纯文本段落 (CDATA 保护，设置 `type="html"`) |

## 3. 日期时区安全性

由于 JS 在解析本地纯日期字符（如 `2026-06-30`）时，在某些时区会被解析为前一天的 GMT 时刻导致显示错位，本管线采用了以下安全转换规则：
- 解析阶段：提取 YYYY, MM, DD 并构造 `new Date(Date.UTC(YYYY, MM - 1, DD, 0, 0, 0))` (对应东八区 08:00 早上，以 UTC 为基准实现环境/时区无关)。
- 格式化输出：将 Date 在 UTC 轴上平移 8 小时偏置，全部采用 `getUTC*` API 提取时间数值，彻底消除宿主机器本地时区的物理差异。

## 4. 公开状态边界

Feed 只收录明确可公开的内容。当前允许的 `status` 白名单为：
- 未设置 `status`
- `published`
- `done`

`draft`、`todo`、`in_progress`、`archived` 等状态不进入 RSS 或 Atom。仍在建设但已经适合作为公开项目展示的条目，应先在项目 schema 中定义独立公开态；在当前 schema 下，只有完成且公开的项目使用 `done` 入 feed。
