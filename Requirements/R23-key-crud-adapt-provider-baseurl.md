# R23 API Key CRUD 适配厂商级 Base URL

- Status: done
- Phase: 3
- Depends on: R21

## Goal

让 API Key 读写逻辑全面适配“厂商级 Base URL”。

## Scope

- `ApiKeyView` 使用 `providerBaseUrl`。
- API Key 创建/编辑表单移除 `baseUrl` 输入。
- 列表搜索支持匹配 `providers.base_url`。

## Acceptance Criteria

- 新增与编辑 API Key 时仅处理 name/provider/api_key/notes。
- API Key 详情展示来自厂商的 `Base URL`。
- 空 `Base URL` 在 UI 统一显示为 `--`。
