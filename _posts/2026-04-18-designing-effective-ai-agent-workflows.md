---
title: "如何设计有效的 AI Agent 工作流"
title_en: "Designing Effective AI Agent Workflows"
description: "从规划、执行、观察到重试，为 Agent 建立可控制的工作流闭环。"
description_en: "A controlled agent loop for planning, action, observation and retry."
date: 2026-04-18 09:00:00 +0800
lang: zh
tags: [AI Agent, LLM, Workflow]
cover: /assets/articles/agent-workflows/cover.svg
featured: false
published: true
read_time: 8
---

优秀的 Agent 工作流不是让模型无限思考，而是在每个阶段提供清晰的输入、输出和停止条件。

## Plan

规划阶段只负责拆分目标和识别依赖，不执行外部副作用。

## Act

执行阶段调用白名单工具，并在服务端校验参数。

## Observe

观察阶段将工具结果转换成模型可理解的结构，同时保留原始数据用于审计。

## Reflect

重试必须设置次数、预算和失败分类。没有边界的反思循环只会浪费 Token。
