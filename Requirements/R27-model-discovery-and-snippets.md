# R27 模型发现与代码脚手架弹窗

- Status: done
- Phase: 5
- Depends on: R24, R25

## Goal

提供模型拉取能力与多语言代码片段生成弹窗。

## Scope

- 新增 `POST /api/fetch-models`。
- 支持 OpenAI 兼容阵营动态拉取模型。
- Gemini 走特殊接口；Anthropic 优先调用官方 `/v1/models`。
- 若厂商模型接口不可用、鉴权失败或返回空结果，则回退到内置推荐模型列表。
- 详情页新增 `Code Snippets` Dialog，含模型搜索、语言切换、复制按钮。

## Acceptance Criteria

- 所有模型拉取请求均通过后端代理。
- 动态拉取失败时，弹窗仍能显示对应厂商的可用 fallback 模型。
- 模型可不选，不选时代码中使用占位模型名。
- 代码片段支持 cURL / Python / Node.js。
