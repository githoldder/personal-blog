---
title: "thuthesis Manual 写作辅助包"
description: "已配置好本地模板、字体、图片、参考文献和编译脚本的极简 LaTeX 毕业论文写作环境。"
status: "done"
date: 2026-02-10
tech: ["LaTeX","BibTeX","Makefile","thuthesis"]
---

# thuthesis Manual 写作包

这是一个已经配好本地模板、字体、图片、参考文献和编译脚本的 LaTeX 写作包。你不需要先理解 LaTeX 的所有细节，先跑起来，再慢慢改内容。

## 30 秒开始

在项目根目录运行：

```bash
make -C scripts
```

成功后会生成：

```text
templates/thuthesis-example.pdf
```

如果你更喜欢脚本：

```bash
./scripts/build_manual.sh
```

## 你最常改哪里

```text
templates/thusetup.tex           # 标题、作者、日期等信息
templates/data/chap01.tex        # 第 1 章
templates/data/chap02.tex        # 第 2 章
templates/data/chap03.tex        # 第 3 章
templates/figures/               # 图片和图表
templates/ref/refs.bib           # 参考文献
```

一般不要改：

```text
templates/cls/                   # thuthesis 模板底层
templates/fonts/                 # 本地字体
```

## 新手读文档的顺序

1. [快速开始](docs/01-quick-start.md)
2. [修改正文、图片和参考文献](docs/02-edit-content.md)
3. [编译系统说明](docs/03-build-system.md)
4. [常见问题排查](docs/04-troubleshooting.md)
5. [Overleaf 使用说明](docs/05-overleaf.md)

AI 协作和归档参考放在更深层：

- [AI 协作说明](docs/06-ai-collaboration.md)
- [thuthesis 归档参考](docs/90-thuthesis-reference/README.md)
- [GB/T 7714 归档参考](docs/91-gbt7714-reference/README.md)

## 这个项目的核心原则

- `templates/` 是唯一源目录。
- `templates/thuthesis-example.tex` 是编译入口。
- 编译脚本会强制使用 `templates/cls/` 里的本地模板。
- 字体已经放在 `templates/fonts/`，避免不同电脑缺字体。
- 能先用就先用；遇到问题再看排错文档。

