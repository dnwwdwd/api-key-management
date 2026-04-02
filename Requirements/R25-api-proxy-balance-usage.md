# R25 余额与用量查询代理 API

- Status: done
- Phase: 3/5
- Depends on: R23

## Goal

为白名单厂商提供余额/用量查询能力，并实现优雅降级。

## Scope

- 新增 `POST /api/check-balance`。
- 白名单支持：DeepSeek、Moonshot、OpenAI。
- 非白名单厂商不直接查询 API，而是展示提示文案；若已配置官方账单或用量入口，则显示跳转链接。
- 查询失败时展示厂商原始错误 + 本地化排障提示。

## Acceptance Criteria

- 详情页仅在支持厂商显示查询按钮。
- 接口结果返回 metric type + value（可为空）。
- 不支持厂商在详情页明确提示“不支持”。
- 已知厂商在不支持 API 查询时，可直接跳转到对应官方账单或用量页面。
