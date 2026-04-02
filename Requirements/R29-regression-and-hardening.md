# R29 回归与加固

- Status: done
- Phase: 5
- Depends on: R21-R28

## Goal

完成 V2.0 主要能力的回归验证，确保安全和行为一致性。

## Scope

- 校验 API Key 仍为密文存储。
- 校验所有第三方调用只经 `/api/*`。
- 校验登录保护、移动端抽屉、桌面双栏、复制与 Toast 交互。
- 校验迁移后的历史数据可读可用。

## Acceptance Criteria

- `npm run typecheck` 通过。
- 关键路径无编译错误与运行时关键阻断。
- 需求卡状态可反映当前实现完成度。
