# AI Agent Working Guide (Api-key Manage)

## 1. 文档目的

本文件提供给参与本仓库的 AI 助手和开发者使用。目标是让后续修改能与当前项目实现保持一致，减少文档和代码之间的偏差。

工作时请遵守以下原则：

- 先阅读现有代码，再开始修改，不要把项目当成空白模板处理。
- 以当前仓库真实实现为准；如果历史文档和代码冲突，优先核对代码，再向用户确认。
- 输出方式保持通俗、客观、专业，不使用夸张或口号式表达。
- 涉及边界不清的问题，先暂停并询问用户，不要自行扩大范围。

## 2. 项目定位

“Api-Key 管理”是一个本地优先的 API Key 管理工具，面向需要管理多家 AI 服务密钥的个人开发者和小团队。

核心目标：

- 安全保存 API Key，数据库中不出现明文密钥。
- 用尽量简单的界面完成录入、查看、复制、测试和日常管理。
- 通过统一的后端代理能力，提供测活、余额或用量查询、模型发现和调用代码生成。
- 同时支持 `zh-CN` 与 `en-US` 两种语言。

## 3. 当前项目状态

当前仓库已经不是初始化阶段，主要能力已具备：

- 登录鉴权：使用 Auth.js / NextAuth Credentials Provider。
- 会话时长：固定 48 小时。
- 国际化：已接入 `next-intl`，主语言为 `zh-CN`，同时支持 `en-US`。
- 数据库：SQLite + Drizzle ORM。
- 密钥加密：`api_keys.api_key` 使用 AES-256-GCM 加密存储。
- Provider 管理：支持预置厂商、自定义厂商、新增、编辑、删除空厂商。
- API Key 管理：支持新增、编辑、删除、复制、显隐、列表展示。
- 服务端代理接口：已提供测活、余额或用量查询、模型发现接口。
- 分析页：已提供 `/[locale]/analytics` 页面。
- 代码片段：已支持按语言生成调用示例，并在弹窗中复制。

如果后续继续开发，请把工作理解为“在现有实现上迭代”，而不是重新搭骨架。

## 4. 技术栈与实现基线

请优先沿用仓库当前技术方案，不要在未确认的情况下替换核心库。

- Framework: Next.js App Router
- React: React 19
- Language: TypeScript 严格模式
- Styling: Tailwind CSS
- UI: shadcn/ui + Radix UI + Lucide React
- Database: SQLite
- ORM: Drizzle ORM
- Auth: Auth.js / NextAuth v5 beta，且仅使用 Credentials Provider
- i18n: next-intl
- Toast: sonner
- Charts: Recharts
- Encryption: Node.js `crypto`，算法为 AES-256-GCM

## 5. 目录约定

当前项目主要目录如下：

```text
src/
├── app/
│   ├── [locale]/
│   │   ├── (auth)/login
│   │   ├── (dashboard)/
│   │   │   ├── page.tsx
│   │   │   └── analytics/page.tsx
│   │   └── layout.tsx
│   └── api/
│       ├── auth/[...nextauth]
│       ├── test-key
│       ├── check-balance
│       └── fetch-models
├── components/
│   ├── ui/
│   └── shared/
├── lib/
│   ├── actions/
│   ├── constants/
│   ├── db/
│   ├── integrations/
│   └── utils/
└── messages/
```

新增代码时尽量放在现有分层中：

- 数据读写与表结构放在 `src/lib/db`
- Server Actions 放在 `src/lib/actions`
- 第三方服务交互放在 `src/lib/integrations`
- 可复用业务组件放在 `src/components/shared`

## 6. 数据模型约束

当前数据库设计以 `src/lib/db/schema.ts` 为准，关键点如下：

- `users`
  - `id`
  - `username`
  - `password_hash`
  - `preferred_locale`
  - `created_at`
- `providers`
  - `id`
  - `name`
  - `base_url`
  - `is_custom`
- `api_keys`
  - `id`
  - `provider_id`
  - `name`
  - `api_key`
  - `notes`
  - `created_at`
  - `updated_at`

注意：

- `base_url` 当前在 `providers` 表上，不在 `api_keys` 表上。
- Provider 纯文本展示，不设计图标字段。
- 任何新增字段都需要同时考虑 Drizzle schema、迁移脚本、类型、表单和多语言文案。

## 7. 安全规则

以下规则不能被绕开：

- 严禁明文存储 API Key。写入数据库前必须加密，读取后只在服务端解密再返回前端。
- 加密密钥来自 `ENCRYPTION_KEY`，需要满足 AES-256-GCM 所需的 32 字节要求。
- 登录只允许 Credentials Provider。
- 受保护页面未登录时必须重定向到 `/{locale}/login`。
- 所有第三方请求必须经过 Next.js 后端接口，不允许浏览器直接请求外部 AI 服务。
- Provider 删除仅在其名下没有 API Key 时才允许执行。

当前后端代理入口：

- `/api/test-key`
- `/api/check-balance`
- `/api/fetch-models`

环境变量约定：

- `AUTH_SECRET`
- `ENCRYPTION_KEY`
- `DATABASE_FILE`
- `SEED_ADMIN_USERNAME`
- `SEED_ADMIN_PASSWORD`

补充说明：

- 本地开发环境允许对 `AUTH_SECRET` 和 `ENCRYPTION_KEY` 使用代码内默认值，便于首次启动。
- 生产环境应显式提供真实密钥，不应依赖开发默认值。
- 仓库根目录提供 `.env.example` 作为本地配置模板。

## 8. UI 与交互规范

界面修改时请保持现有视觉方向和交互原则：

- 保持黑白灰为主的极简风格，功能性成功或失败提示可使用必要的绿色或红色。
- 主按钮使用深色底配浅色文字，背景优先使用 `bg-white` 或 `bg-zinc-50`。
- 优先使用 shadcn/ui 组件；弹窗或抽屉优先使用 `Dialog` 或 `Sheet`。
- PC 端保持三栏结构：
  - 左侧为导航与账号菜单
  - 中间为 Provider 列表
  - 右侧为 API Key 单列表
- 移动端保持单栏可操作，不要引入复杂的多面板切换。
- API Key 页面遵循“单列表展示”，每条记录展示字段和操作，不拆成独立详情页。
- Provider 的编辑与删除入口放在“更多”菜单内，不直接平铺按钮。
- 账号菜单需要展示当前登录账号，并收纳语言切换、系统设置、退出登录。
- 缺省值统一显示 `--`。
- 时间字段只展示具体时间值，不额外显示 “Updated At” 之类的标签。
- 复制操作使用 `navigator.clipboard`，并给出轻量 Toast 反馈。
- 测活成功后，延迟小于 `500ms` 显示绿色，大于等于 `500ms` 显示红色。
- 对暂不支持通过 API 查询余额或用量的 Provider，应展示官方账单或用量页面链接，便于用户直接跳转查看。

## 9. 功能边界

目前文档和代码应保持以下一致：

- Provider 支持预置厂商自动初始化，也支持用户新增自定义厂商。
- API Key 与 Provider 是多对一关系。
- 测活、余额或用量查询、模型发现都依赖当前 Provider 的 `base_url` 和密钥。
- 余额或用量查询不是所有 Provider 都支持，当前实现按白名单判断。
- 模型发现优先走动态接口；Anthropic 使用官方 `/v1/models`，其余厂商在动态拉取失败时回退到内置推荐模型列表。
- 分析页通过逐个请求后端接口聚合数据，不直接访问数据库中的第三方状态缓存。

如果后续要扩展到更多 Provider，请同时更新：

- `src/lib/constants/providers.ts`
- `src/lib/integrations/provider-api.ts`
- 多语言文案
- 相关文档

## 10. 开发方式

建议按下面的顺序开展修改：

1. 先确认需求是否与当前实现冲突。
2. 需要改数据结构时，先改 schema 和迁移，再改 actions 与 UI。
3. 需要改第三方接入时，优先放入 `src/lib/integrations`，不要把请求逻辑散落到组件中。
4. 需要改 UI 时，同时检查桌面端和移动端表现。
5. 修改完成后，尽量运行 `npm run typecheck`、`npm run lint` 或相关验证。
6. 如果需求涉及启动、登录或本地初始化，优先检查 `.env.local`、`data/app.db` 和种子数据是否与当前服务进程一致。

## 11. 文档同步要求

凡是涉及以下内容的改动，都要同步更新文档：

- 页面布局
- 主要交互方式
- 数据模型
- 安全边界
- 新增或删除的核心功能

需要同步的文档至少包括：

- `AGENTS.md`
- `产品需求文档.md`

如果需求拆解目录 `Requirements/` 中存在对应条目，也应一并更新，避免状态说明落后于代码。

## 12. 2026-04 变更补充

- 内置 Provider 已调整：默认不再初始化 `字节（豆包）`、`腾讯（混元）`、`百度（文心）`、`01.AI`。
- 账单链接、余额查询端点、模型回退列表已集中到初始化常量，不再接受散落硬编码。
- 新增 API Key JSON 导入/导出能力（支持按 Provider 选择，支持桌面端与移动端）。
- 导入逻辑要求：
  - 同名 Provider 自动复用；不存在时创建。
  - 同 Provider + 同 Key 名执行更新，否则新增。
  - 任何写库流程都必须保持 API Key 加密存储规则不变。
