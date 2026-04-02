# R24 网络测活代理 API

- Status: done
- Phase: 3/5
- Depends on: R23

## Goal

提供 API Key 一键测活能力，强制通过后端代理调用第三方接口。

## Scope

- 新增 `POST /api/test-key`。
- 详情页新增“网络测活”按钮。
- 未配置 `Base URL` 时阻断并提示。
- 失败时优先展示厂商原始错误，随后展示本地化排障提示。

## Acceptance Criteria

- 前端不直接请求第三方厂商域名。
- 成功可展示 HTTP 状态与延迟毫秒。
- 失败可展示原始报错内容。
