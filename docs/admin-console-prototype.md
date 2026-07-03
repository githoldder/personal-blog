# Local Admin Console Prototype Specification

This document defines the architecture, design tokens, security boundaries, and future data mutation specs for the Local Admin Console Prototype, as implemented in [src/pages/admin/index.astro](file:///Users/caolei/Desktop/personal-blog/src/pages/admin/index.astro).

---

## 1. Information Architecture & Layout

The Admin Console uses a stark, high-density, multi-panel grid layout designed for high efficiency and validation auditing rather than light aesthetic enjoyment.

```
┌────────────────────────────────────────────────────────┐
│  ⚠️ LOCAL BANNER: Offline Local-First Security Guard   │
├────────────────────────────────────────────────────────┤
│  [左侧栏: 离线真源文件树]    │  [右侧栏: 编译自检与发布队列]  │
│  Obsidian vault structure  │  - Editorial Queue (JSON source)│
│  - content/notes/          │  - DLP Privacy Check Status     │
│  - content/projects/       │  - Broken Links Integrity       │
├────────────────────────────┴───────────────────────────┤
│  [底部栏: 编译触发面板（Mock）]                         │
│  [Run build:assets]  [Run verify]  [Push Remote (Gated)│
└────────────────────────────────────────────────────────┘
```

---

## 2. Design System Tokens (Stark Workbench Mode)

To clearly separate administrative workflows from reading surfaces:

* **Theme**: Defaults to stark Monochrome High-Contrast Slate theme.
* **Palette**: Dark slate backgrounds (`bg-slate-900` or `bg-slate-950`) or crisp clinical light backgrounds (`bg-slate-50` with solid `1px border-slate-300`). No warm parchment gradients.
* **Typography**: Defaults to sans-serif (`Space Grotesk` / `Inter`) and monospace fonts (`JetBrains Mono`) for all values and code blocks. Sans-serif font weights are hard and distinct.
* **Borders**: Sharp 90-degree corners (`rounded-none` or small `rounded-md`) with clear 1px borders. No soft visual shadows.

---

## 3. Security Boundary & Offline Gating

The Admin Console is local-first and strictly restricted:

1. **Routing Protection**: The admin portal must verify it is serving requests from the local loopback interface (`127.0.0.1` or `localhost`).
2. **Read-Only Prototypes**: All buttons (such as "Sync", "Publish", "Trigger Build") are mock actions with console logs or interactive alerts. No write operations to files or database pipelines will occur in this S07 stage.
3. **No External APIs**: It does not import or execute any remote scripts, cookies, or telemetry libraries.
