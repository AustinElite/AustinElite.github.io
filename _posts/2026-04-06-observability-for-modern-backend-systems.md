---
title: "现代后端系统的可观测性"
title_en: "Observability for Modern Backend Systems"
description: "统一日志、指标与链路追踪，让复杂系统中的问题变得可定位。"
description_en: "Unifying logs, metrics and traces to make complex systems diagnosable."
date: 2026-04-06 09:00:00 +0800
lang: zh
tags: [Observability, Java, System Design]
cover: /assets/articles/observability/cover.svg
featured: false
published: true
read_time: 6
---

可观测性不是多装几个监控面板，而是让团队能够从系统输出推断内部状态。

## Logs

日志需要结构化字段、请求标识和明确的错误上下文，避免只记录一段无法聚合的自然语言。

## Metrics

从延迟、流量、错误和饱和度开始，再加入业务指标。

## Traces

跨服务链路追踪可以帮助判断延迟发生在哪一跳，但必须控制采样和敏感数据。

## 最小闭环

告警应该链接到对应仪表板、日志查询和处理手册，让值班人员能够快速进入定位流程。
