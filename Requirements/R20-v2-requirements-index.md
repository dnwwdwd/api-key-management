# R20 V2.0 需求总索引

- Status: done
- Source: `AGENTS.md`, `产品需求文档2.0.md`
- Goal: 将 V2.0 资产洞察功能拆分为可并行和可回归的小需求，并完成状态追踪。

## Scope

- 建立 R20-R29 的需求卡体系。
- 明确数据库迁移、后端代理 API、核心 UI、分析看板、i18n 的依赖关系。
- 统一约束：`providers` 不可删除；所有第三方请求必须走后端 Route Handlers。

## Acceptance Criteria

- `Requirements/README.md` 已新增 R20-R29 索引。
- 每张需求卡均包含 Goal、Scope、Acceptance Criteria。
- 需求卡与当前实现一致，可用于后续快速迭代。
