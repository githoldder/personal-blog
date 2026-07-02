---
title: "“绿果果生鲜”分布式微服务运营系统"
description: "基于 Spring Boot +若依微服务分布式架构承载的生鲜电商后台管理系统，融合 Nacos、RabbitMQ、Gateway、Redis 等中间件。"
status: "done"
date: 2025-12-20
tech: ["Spring Boot","Nacos","RabbitMQ","Gateway","Vue3","Redis"]
---

# springboot-lgg

第五组分布式应用技术课程大作业。

本项目以 Spring Boot 为后端基础，融合若依后台管理框架与绿果果生鲜业务模块，当前演示口径统一为“绿果果生鲜运营系统”。前端管理端使用 RuoYi-Vue3 技术栈，后端使用若依微服务分布式架构（Nacos、Gateway、Redis、MinIO、RabbitMQ）承载业务模块，小程序端保留为用户下单入口。

## 本地运行入口

- 统一 API 网关：`8090`
- 系统管理后台：开发模式 `8082`，本地演示/E2E 预览模式 `8087` (由 PM2 vite preview 托管)
- 后端系统服务 (admin)：`8081`
- 后端业务服务 (business)：`8088`
- 后端支付服务 (pay)：`8085`
- 后端通知服务 (notice)：`8086`
- 微信小程序：`mp-weixin`
- 一键启动：`pm2 start ecosystem.config.cjs`

## 课程交付目录

课程设计报告、个人答辩记录和源码打包清单统一放在 `docs/03-report/第五组`。

## 项目微服务结构目录树

```text
springboot-lgg
├── ecosystem.config.cjs           # PM2 本地一键启动配置
├── ruoyi-vue-lgg-backend          # 后端微服务目录
│   ├── ruoyi-gateway              # API 网关服务 [8090]
│   ├── ruoyi-admin                # 系统管理核心服务 [8081]
│   ├── ruoyi-business             # 绿果果业务核心服务 [8088]
│   ├── ruoyi-pay                  # 模拟支付微服务 [8085]
│   ├── ruoyi-notice               # 消息通知与 WebSocket 推送服务 [8086]
│   ├── ruoyi-common               # 通用工具与 MinIO 集成模块
│   ├── ruoyi-framework            # 系统安全与核心配置模块
│   └── sql                        # 数据库 DDL 与 Sprint 迁移脚本
├── ruoyi-vue-lgg-frontend         # 前端 Vue3 管理后台 [8087]
├── prds                           # 需求规格书双板同步 (md/json)
└── docs                           # 实训文档、答辩记录与报告文本
```

