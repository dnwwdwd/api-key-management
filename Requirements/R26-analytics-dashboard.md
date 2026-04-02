# R26 Analytics 看板页面

- Status: done
- Phase: 5
- Depends on: R25

## Goal

新增独立 Analytics 路由，提供全局 API 资产洞察。

## Scope

- 新增 `[locale]/analytics` 页面。
- 进入页面并发拉取所有 key 的余额/用量数据。
- 顶部指标卡、中部图表、底部明细表。
- 加载期间展示 Skeleton/Loading。

## Acceptance Criteria

- 看板支持桌面双列图表与移动端堆叠布局。
- 图表基于 shadcn/ui Charts（Recharts）。
- 不支持查询的厂商在表格统一显示 `-`。
