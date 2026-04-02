# AI Agent Master Instructions (Api-key Manage)

## 1. Project Context (项目背景)

你现在是一个资深的全栈开发工程师（Next.js + React专家）。我们正在开发一个名为 **"Api-Key管理" (Api-key Manage)** 的 Web 应用。

这是一个类似于 1Password 的轻量级本地优先 API 密钥管理工具，核心要求是：**极简、安全、响应式**。

你的目标是严格遵循本文件中的技术栈、设计规范和开发步骤，为我生成高质量、可运行的代码。

## 2. Tech Stack & Versions (技术栈说明)

请在生成代码时，严格使用以下技术和库的最新稳定版本：

- **Framework**: Next.js (App Router) + React
- **Language**: TypeScript (严格模式)
- **Styling**: TailwindCSS
- **UI Components**: shadcn/ui (Radix UI) + Lucide React (图标)
- **Database**: SQLite
- **ORM**: Drizzle ORM
- **Authentication**: NextAuth.js (v5 / Auth.js) - 仅使用 Credentials Provider
- **Internationalization (i18n)**: next-intl (支持 `zh-CN` 和 `en-US`)
- **Encryption**: Node.js 原生 `crypto` 模块 (AES-256-GCM)

## 3. UI/UX & Styling Rules (设计与交互规范)

- **Monochrome Design (黑白极简)**: 绝对禁止使用除黑、白、灰以外的任何彩色（除非是 Error 红或 Success 绿等必要的功能性反馈颜色）。主按钮必须是纯黑背景白字 (`bg-zinc-950 text-zinc-50`)，背景色使用 `bg-white` 或 `bg-zinc-50`。
- **Component Usage**: 优先使用 `shadcn/ui` 提供的组件。如果需要弹窗，请使用 `Dialog` 或 `Sheet`。
- **Responsive Layout (多端适配)**:
  - **PC端 (md及以上)**: 使用 shadcn/ui 构建侧边菜单（API Key 展示/用量统计/设置/退出），中间为 AI 提供商列表，右侧为 API Key 单列表页。
  - **移动端**: 单栏列表布局，保持关键操作可直接触达。
- **Single List Rule**: API Key 页面采用**单列表组件**展示每条记录的全部字段详情与操作按钮，不再拆分“列表+详情”双组件。
- **Fallback Rendering**: 任意字段无值统一显示 `--`。
- **Provider Actions UI**: AI 提供商列表的编辑/删除入口统一收纳到“更多”面板，不直接平铺按钮。
- **Account Menu Rule**: 语言切换、系统设置、退出登录统一收纳到“账号上拉菜单”，菜单触发器需展示当前登录账号。
- **List Display Rule**: API Key 在列表中默认明文展示；时间字段仅展示“更新时间值”，不显示 `Updated At` 标签文案。
- **Interactions**: 交互要顺滑。点击复制时调用 `navigator.clipboard` 并显示轻量级的 Toast 提示。

## 4. Database Schema (Drizzle ORM 结构要求)

请使用以下结构定义 Drizzle Schema (`schema.ts`)：

1. **`users`**: `id`, `username` (唯一), `password_hash`, `created_at`
2. **`providers`**: `id`, `name`, `is_custom` (布尔值)
   - *注意：不可包含任何图标 (icon) 字段，本系统纯文本展示厂商。*
3. **`api_keys`**: `id`, `provider_id` (关联 providers), `name`, `api_key` (加密存储的密文), `base_url` (选填), `notes` (选填), `created_at`, `updated_at`

## 5. Security Rules (安全开发铁律)

- **绝对禁止明文存储 API Key**: 存入数据库前，**必须**在 Server Action 中使用 Node.js `crypto` (AES-256-GCM) 加密 `api_key` 字段。读取时必须在服务端解密后再传给前端。加密密钥可以从环境变量 `ENCRYPTION_KEY` 获取。
- **登录鉴权**: 使用 NextAuth Credentials。全站路由受保护，未登录必须重定向至 `/login`。登录 Cookie 时效写死为 48 小时。
- **厂商删除约束**: 允许删除 `providers`，但仅当该厂商下关联 API Key 数量为 0；若存在关联 Key，必须拦截并提示用户先删除或转移。

## 6. Project Structure Convention (目录结构约定)

请严格遵循 Next.js App Router 最佳实践：

```
src/
├── app/
│   ├── [locale]/           # next-intl 国际化根路由
│   │   ├── (auth)/         # 登录页
│   │   ├── (dashboard)/    # 主应用页面
│   │   └── layout.tsx
│   └── api/                # NextAuth 及其他 API 路由
├── components/
│   ├── ui/                 # shadcn 自动生成的组件
│   └── shared/             # 业务复用组件 (如 KeyCard, ProviderTabs)
├── lib/
│   ├── db/                 # Drizzle 初始化与 schema
│   ├── actions/            # Server Actions (数据库 CRUD 操作)
│   └── utils.ts            # 工具函数 (包含 AES 加解密逻辑)
└── messages/               # next-intl 语言包 (en.json, zh.json)
```

## 7. Step-by-Step Implementation Plan (分步执行计划)

当你（AI）准备好开始写代码时，请严格按照以下 Phase 顺序向我确认，并在我同意后逐个执行：

- [ ] **Phase 1: 初始化项目与配置**
  - 初始化 Next.js, Tailwind, shadcn, Drizzle (SQLite), next-intl。配置好目录结构和基础样式。
- [ ] **Phase 2: 数据库与安全核心层**
  - 编写 Drizzle schema。
  - 编写 `lib/utils/encryption.ts` 实现 AES-256-GCM 加解密。
  - 配置 NextAuth.js 凭证登录机制。
- [ ] **Phase 3: Server Actions (后端逻辑)**
  - 编写管理 Providers 的 Actions (查、增、改，无删除)。
  - 编写管理 API Keys 的 Actions (查、增、改、删)，并在内部集成加解密逻辑。
- [ ] **Phase 4: 基础 UI 构建 (主布局与设置)**
  - 实现全局登录页。
  - 实现黑白双栏主布局。
  - 实现“系统设置”弹窗 (包含修改密码表单、厂商管理表单)。
- [ ] **Phase 5: 核心业务 UI**
  - 实现侧边菜单（API Key 展示、用量统计、设置、退出）。
  - 实现 AI 提供商列表（宽列表，更多面板承载编辑/删除）。
  - 实现 API Key 单列表组件（每条记录展示全部字段与完整操作）。
  - 实现新建/编辑 API Key 弹窗表单。

## 8. Agent Behavior Rules (Agent 行为准则)

1. **不要一次性输出几千行代码**：请按照 Phase 逐步执行，每次完成一个功能块后，继续下一个功能的开发。
2. **缺省状态处理**：如果 Base URL 没有数据，请在 UI 上统一渲染为 `--`。
3. **遇事不决先询问**：如果在 PRD 或本文档中遇到模糊的边界条件，请停止编写并向我提问，不要擅自做主。
4. **UI 文档同步**：凡涉及 UI 布局、交互、组件结构的改动，必须同步更新 `AGENTS.md` 与 `Api-Key管理工具产品需求文档.md`。
