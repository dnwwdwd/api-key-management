# R28 V2 i18n 与错误展示规范

- Status: done
- Phase: 2-5
- Depends on: R20

## Goal

补齐 V2.0 所需的中英文文案、交互提示和异常文案。

## Scope

- `zh.json` 与 `en.json` 新增 ping / balance / snippets / analytics 文案。
- 保留厂商原始错误内容，不做机翻。
- 应用自身提示保持双语一致。

## Acceptance Criteria

- 新增界面无缺失 key 报错。
- 原始错误在失败场景可见。
- 本地化排障提示随 locale 切换。
