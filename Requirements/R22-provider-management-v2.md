# R22 厂商管理 V2

- Status: done
- Phase: 3-4
- Depends on: R21

## Goal

升级厂商管理能力，支持名称与 `Base URL` 编辑，保持安全约束“禁止删除厂商”。

## Scope

- Providers Server Actions 支持查、增、改（名称 + `base_url`）。
- 设置弹窗新增厂商 `base_url` 输入与批量保存。
- 文案明确提示：厂商不可删除。

## Acceptance Criteria

- 可新增自定义厂商并可选填写 `base_url`。
- 可编辑任意厂商名称与 `base_url`。
- 不存在任何 providers 删除入口或删除 SQL。
