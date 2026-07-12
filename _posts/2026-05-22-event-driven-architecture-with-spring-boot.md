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
read_time: 10
---

事件驱动架构能够降低服务间的直接耦合，但也会引入重复消费、消息丢失、顺序和最终一致性问题。它不是把同步调用全部换成 Kafka 就结束了，而是要围绕业务事实、事务边界、消费幂等和可观测性重新设计链路。

在 Spring Boot 项目里，事件驱动最适合用于“某件事已经发生，多个下游系统需要各自响应”的场景，例如订单支付成功后发放权益、推送通知、更新统计、触发风控复核。它不适合用来隐藏复杂的强一致事务，也不应该成为服务之间的黑盒管道。

## 从业务事件开始

事件应该描述已经发生的事实，例如 `OrderPaid`，而不是命令式的 `SendCouponNow`。事实事件更稳定，也允许多个消费者独立演进。

一个好的事件通常包含：

- 全局唯一事件 ID。
- 业务聚合 ID，例如订单 ID、用户 ID。
- 事件类型和版本。
- 发生时间。
- 必要的业务快照，而不是完整数据库对象。
- Trace ID，方便串联日志和链路追踪。

```java
public record DomainEvent(
    String eventId,
    String aggregateId,
    String eventType,
    int version,
    Instant occurredAt,
    Map<String, Object> payload
) {}
```

事件字段不要一次塞满。字段越多，消费者越容易依赖发布方的内部模型，后续演进也越困难。推荐先发布稳定事实，再让消费者根据自己的需求查询扩展数据。

## Outbox Pattern

业务数据与 Outbox 记录写入同一个数据库事务，再由独立发布器发送到 Kafka，可以避免数据库提交成功但消息发送失败。

常见流程是：

1. 在业务事务里写入订单表。
2. 同一事务写入 `outbox_event` 表。
3. 后台发布器扫描未发送事件。
4. 发布到 Kafka 后更新发送状态。
5. 如果发布失败，等待下一轮扫描重试。

这样做的代价是多了一张表和一个发布器，但换来的是清晰的故障恢复路径。即使 Kafka 短暂不可用，业务事务也不会丢失“应该发布的事件”。

## Kafka Topic 设计

Topic 不建议按照技术动作命名，而应该围绕业务领域命名。例如 `order-events`、`payment-events`、`member-events`。如果同一个 Topic 中存在多个事件类型，需要通过 `eventType` 和 `version` 区分。

分区键通常选择业务聚合 ID，例如订单 ID。这样同一个订单相关的事件可以保持局部顺序。不要为了追求全局顺序只使用一个分区，那会把吞吐和可用性都压到最低。

## 幂等消费

消费者必须假设消息可能重复到达。常见方法包括唯一业务键、消费记录表和状态版本号。

例如发放优惠券时，可以使用 `eventId + consumerName` 作为消费记录的唯一键。消费者先尝试插入消费记录，如果唯一键冲突，说明这条消息已经处理过，可以直接跳过。

```java
@Transactional
public void handle(OrderPaid event) {
    if (consumeLogRepository.exists(event.eventId(), "coupon-service")) {
        return;
    }
    couponService.grant(event.userId(), event.orderId());
    consumeLogRepository.markConsumed(event.eventId(), "coupon-service");
}
```

幂等不是可选项。Kafka 至少一次投递、消费者重启、超时重试、人工补偿都会制造重复消息。

## 最终一致性与补偿

事件驱动系统需要接受短暂的不一致。例如订单已经支付，但积分可能几秒后才到账。关键是让系统能解释这种状态，并提供补偿能力。

可以增加一个后台对账任务，定期比较主业务表和下游结果。如果发现订单已支付但积分未发放，就重新投递事件或触发补偿命令。补偿任务要同样遵守幂等规则，否则修复问题时会制造新的问题。

## 可观测性

每个事件链路至少要能回答三个问题：

- 事件是否被发布。
- 哪些消费者处理成功，哪些失败。
- 失败是否还在重试，还是已经进入死信队列。

建议为 Outbox 发布器、Kafka 消费延迟、消费失败率和死信队列数量建立指标。日志中保留 `eventId`、`aggregateId` 和 `traceId`，排查时会轻松很多。

## 结论

异步并不自动等于高性能。只有在事件边界、失败处理、幂等消费和可观测性完整时，系统才真正获得弹性。Spring Boot + Kafka 可以提供很好的基础设施，但架构质量最终取决于业务事件是否清晰、事务边界是否稳固，以及团队是否能看见每一条消息的生命周期。
