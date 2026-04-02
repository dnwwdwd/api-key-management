# R21 Provider Base URL 迁移

- Status: done
- Phase: 2
- Depends on: R20

## Goal

完成数据库模型升级：将 `Base URL` 从 `api_keys` 迁移到 `providers`。

## Scope

- `providers` 表新增 `base_url` 字段。
- `api_keys` 表移除 `base_url` 字段。
- 迁移脚本按同厂商“最常用值优先”回填 `providers.base_url`。
- 内置厂商初始化默认 `base_url`。

## Acceptance Criteria

- 迁移后数据可用，历史 `base_url` 不丢失。
- 同厂商多个历史 `base_url` 时按频次优先回填。
- 新建 API Key 不再填写 `base_url`。
