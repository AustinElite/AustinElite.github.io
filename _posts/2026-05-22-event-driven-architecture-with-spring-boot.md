---
title: "Spring Boot 事件驱动架构实践"
title_en: "Event-Driven Architecture with Spring Boot"
description: "使用 Kafka、Outbox Pattern 和幂等消费构建更可靠的异步业务链路。"
description_en: "Reliable asynchronous workflows with Kafka, the Outbox Pattern and idempotent consumers."
date: 2026-05-22 09:00:00 +0800
lang: zh
tags: [Java, Spring Boot, Kafka, Architecture]
cover: /assets/articles/event-driven/cover.svg
featured: false
published: true
read_time: 7
---

事件驱动架构能够降低服务间的直接耦合，但也会引入重复消费、消息丢失、顺序和最终一致性问题。

## 从业务事件开始

事件应该描述已经发生的事实，例如 `OrderPaid`，而不是命令式的 `SendCouponNow`。事实事件更稳定，也允许多个消费者独立演进。

## Outbox Pattern

业务数据与 Outbox 记录写入同一个数据库事务，再由独立发布器发送到 Kafka，可以避免数据库提交成功但消息发送失败。

## 幂等消费

消费者必须假设消息可能重复到达。常见方法包括唯一业务键、消费记录表和状态版本号。

## 结论

异步并不自动等于高性能。只有在事件边界、失败处理和可观测性完整时，系统才真正获得弹性。
