---
title: "Beamer 讲座/汇报演示文稿 LaTeX 模板"
description: "支持中文排版的 LaTeX Beamer 演示文稿模板，支持自动编译 PDF 与一键转换 PPTX 功能。"
status: "done"
date: 2025-11-20
tech: ["LaTeX","Beamer","Python","Makefile","poppler"]
---

# SDU Beamer 讲座演示模板

基于 LaTeX Beamer 的山东大学演示文稿模板，支持中文排版，可编译为 PDF 或通过脚本转换为 PPTX 格式。

## 📁 仓库结构

```
lecture-beamer-latex/
├── beamersapienza.tex      # 主文档（示例内容）
├── beamerthemesintef.sty    # Beamer 主题样式文件
├── sintefcolor.sty          # 颜色定义文件
├── assets/                  # 资源文件夹
│   ├── sdu_logo.png        # SDU logo（正色）
│   ├── sdu_logo_negative.png  # SDU logo（反色）
│   ├── sdubackground.jpeg  # 背景图
│   └── sduview.jpg         # 侧边图片
├── Makefile                 # 编译脚本
├── make_pptx.py            # PDF → PPTX 转换脚本
├── .vscode/
│   └── settings.json       # VSCode LaTeX Workshop 配置
├── .gitignore              # Git 忽略规则
└── LICENSE                 # GPL-3.0 许可证
```

## 🎯 功能特性

- ✅ **中文支持**：使用 `xeCJK` 包，完美支持中文排版
- ✅ **自动编译**：VSCode 保存时自动触发编译（`Cmd+S`）
- ✅ **多格式输出**：可生成 PDF 或 PPTX 格式
- ✅ **Beamer 主题**：基于 SINTEF 主题定制的 SDU 风格
- ✅ **丰富组件**：章节页、侧图页、彩色区块等

## 🔧 环境要求

### 必需
- **TeX Live 2025** 或更高版本（需包含 `xelatex`、`latexmk`）
- **Python 3.8+**（用于 PPTX 转换）

### 可选
- **VSCode** + **LaTeX Workshop** 插件（推荐）
- **python-pptx** 包：`pip3 install python-pptx pdf2image`
- **poppler**（PDF 转图片）：`brew install poppler`

## 🚀 使用方法

### 1. 编译为 PDF

#### 方式一：使用 Makefile
```bash
make build        # 编译生成 PDF
make clean        # 清理辅助文件
make watch        # 持续监视模式（自动重新编译）
```

#### 方式二：使用 latexmk 命令
```bash
latexmk -xelatex -interaction=nonstopmode beamersapienza.tex
```

#### 方式三：VSCode 自动编译
安装 LaTeX Workshop 插件后，编辑 `.tex` 文件并保存（`Cmd+S`），插件会自动编译。

### 2. 预览 PDF

- **VSCode 内置预览**：`Cmd+Shift+P` → `View LaTeX PDF` → `View in VS Code tab`
- **系统预览**：`open beamersapienza.pdf`

### 3. 转换为 PPTX

```bash
make build        # 先编译 PDF
make pptx         # 转换为 PPTX
open beamersapienza.pptx
```

或直接运行：
```bash
python3 make_pptx.py
```

### 4. 自定义内容

编辑 `beamersapienza.tex`：

```latex
\title{你的标题}
\subtitle{副标题}
\author{作者姓名}
\date{\today}

\begin{document}
\maketitle

% 添加你的幻灯片内容
\begin{frame}{标题}
内容...
\end{frame}

\end{document}
```

## ⚙️ 配置说明

### VSCode LaTeX Workshop 配置（`.vscode/settings.json`）

已配置以下功能：
- **自动编译**：保存时自动运行 `latexmk`
- **编译链**：使用 `xelatex` 引擎（支持中文）
- **PDF 预览**：在 VSCode 标签页中预览
- **文件清理**：自动清理辅助文件

### Makefile 命令

| 命令 | 说明 |
|------|------|
| `make` 或 `make build` | 编译生成 PDF |
| `make pptx` | 编译并转换为 PPTX |
| `make clean` | 清理所有辅助文件 |
| `make watch` | 监视模式（保存即编译） |

## 📝 主题使用

### 基本结构
```latex
\documentclass{beamer}
\usetheme{sintef}    % 使用 SDU 主题
\usepackage{xeCJK}   % 中文支持

\titlebackground*{assets/sdubackground}  % 设置标题页背景

\begin{document}
\maketitle           % 生成标题页

\section{章节名}
\begin{frame}{幻灯片标题}
内容...
\end{frame}

\backmatter          % 生成结束页
\end{document}
```

### 特殊页面类型

- **章节页**：`\begin{chapter}[背景图]{颜色}{标题}...\end{chapter}`
- **侧图页**：`\begin{sidepic}{图片路径}{标题}...\end{sidepic}`
- **彩色区块**：`\begin{colorblock}[文字色]{背景色}{标题}...\end{colorblock}`

## 📄 许可证

本项目基于 **GPL-3.0** 许可证开源。

## 📧 联系方式

如有问题或建议，请联系：2861126078@qq.com

---

**致谢**：本模板基于 [THU-beamer-template](https://github.com/FangWHao/THU-beamer-template) 修改而来，原版来自 SINTEF Presentation 模板。

