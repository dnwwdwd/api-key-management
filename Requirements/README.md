# Requirements Tracker

本目录用于把 `AGENTS.md` 与产品需求文档拆成可逐项完成的小需求，并持续维护状态。

状态约定：

- `todo`: 尚未开始
- `in_progress`: 正在开发
- `done`: 已完成
- `blocked`: 被阻塞

更新规则：

- 每完成一个小需求，同时更新本文件和对应需求卡的状态为 `done`。
- 若实现过程中发现需求边界不清，先暂停并记录问题，再向用户确认。
- 涉及 `providers` 的需求严禁设计任何删除能力。

## Requirement Index

| ID | 名称 | 状态 | 依赖 |
| --- | --- | --- | --- |
| R00 | 需求拆分与追踪机制 | done | - |
| R01 | 工程初始化与目录骨架 | done | R00 |
| R02 | 国际化与黑白设计基线 | done | R01 |
| R03 | 数据库 Schema 与 Drizzle 初始化 | done | R01 |
| R04 | AES-256-GCM 加解密能力 | done | R03 |
| R05 | Auth.js 凭证登录与路由保护 | done | R03 |
| R06 | Providers 服务端能力与预置数据 | done | R03, R05 |
| R07 | API Keys 服务端 CRUD 与密文存储 | done | R04, R05, R06 |
| R08 | 登录页与受保护应用布局 | done | R02, R05 |
| R09 | 系统设置弹窗与密码修改/厂商管理 | done | R06, R08 |
| R10 | 厂商 Tabs、搜索过滤与列表联动 | done | R06, R08 |
| R11 | 密钥详情面板、复制与显隐交互 | done | R07, R08, R10 |
| R12 | 新建/编辑 API Key 表单与校验 | done | R07, R08, R10 |
| R20 | V2.0 需求总索引 | done | R12 |
| R21 | Provider Base URL 迁移 | done | R20 |
| R22 | 厂商管理 V2 | done | R21 |
| R23 | API Key CRUD 适配厂商级 Base URL | done | R21 |
| R24 | 网络测活代理 API | done | R23 |
| R25 | 余额与用量查询代理 API | done | R23 |
| R26 | Analytics 看板页面 | done | R25 |
| R27 | 模型发现与代码脚手架弹窗 | done | R24, R25 |
| R28 | V2 i18n 与错误展示规范 | done | R20 |
| R29 | 回归与加固 | done | R21-R28 |

## Current Execution Order

1. R01 工程初始化与目录骨架
2. R02 国际化与黑白设计基线
3. R03 数据库 Schema 与 Drizzle 初始化
4. R04 AES-256-GCM 加解密能力
5. R05 Auth.js 凭证登录与路由保护
6. R06 Providers 服务端能力与预置数据
7. R07 API Keys 服务端 CRUD 与密文存储
8. R08 登录页与受保护应用布局
9. R09 系统设置弹窗与密码修改/厂商管理
10. R10 厂商 Tabs、搜索过滤与列表联动
11. R11 密钥详情面板、复制与显隐交互
12. R12 新建/编辑 API Key 表单与校验
13. R20 V2.0 需求总索引
14. R21 Provider Base URL 迁移
15. R22 厂商管理 V2
16. R23 API Key CRUD 适配厂商级 Base URL
17. R24 网络测活代理 API
18. R25 余额与用量查询代理 API
19. R26 Analytics 看板页面
20. R27 模型发现与代码脚手架弹窗
21. R28 V2 i18n 与错误展示规范
22. R29 回归与加固
