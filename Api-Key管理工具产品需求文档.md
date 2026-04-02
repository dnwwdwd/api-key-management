# 产品需求文档 (PRD)：Api-Key管理 (Api-key Management)

## 1. 产品概述

**产品名称：** Api-Key管理 (英文名：Api-key Management) **产品定位：** 一款专为开发者和 AI 极客打造的、体验类似 1Password 的轻量级 AI API Key 管理 Web 服务。

**核心价值：** 集中、安全、高效地管理各种 AI 大模型及中转站的 API 密钥，提供极致的复制调用体验。

## 2. 技术栈架构

- **全栈框架：** Next.js (App Router) + React。
- **UI 组件库与样式：** **shadcn/ui** + TailwindCSS。严格遵循极简黑白配色 (Monochrome)。
- **国际化 (i18n)：** 采用 `next-intl` 方案，原生支持中文 (zh-CN) 和英文 (en-US) 双语无缝切换。
- **数据库与 ORM：** SQLite + Drizzle ORM。轻量、极速且具备完善的 TypeScript 类型安全。

## 3. 核心功能需求

### 3.1 预置厂商池 (Provider Pool) 及检索

系统初始化时内置常见的主流 AI 厂商及知名中转站平台。

- **海外大厂：** OpenAI, Anthropic (Claude), Google (Gemini), xAI (Grok).
- **国内大厂：** 阿里 (千问), 百度 (文心), 字节 (豆包), 腾讯 (混元).
- **明星独角兽：** 智谱 AI (Zhipu), 月之暗面 (Kimi/Moonshot), 零一万物 (01.AI), MiniMax, DeepSeek 等。
- **聚合/中转站：** 允许用户自定义名称和 Base URL。
- **厂商快速检索 (Tabs 过滤)：\**采用\**横向滚动的 Tabs 标签页**展示，并在 Tabs 上方提供独立的搜索框，支持根据名称过滤隐藏特定的厂商 Tab，组件不要以弹窗、抽屉的形式蹦出来。

### 3.2 密钥管理 (Key Management)

- **一对多关系：** 一个厂商下可以绑定多个 API Key。
- **字段定义：**
  - `Key Name` (自定义名称，必填，如：Kimi-Web端测试)
  - `Provider` (所属厂商，必填，从预置列表选择，纯文本展示)
  - `API Key` (密钥本体，必填，明文/掩码切换显示)
  - `Base URL` (非必填。针对中转站或特定代理地址。若为空，前端界面统一展示为“--”，但必须允许用户随时进入编辑模式修改或添加该地址)
  - `Notes` (备注说明，非必填)
- **增删改查：** 支持添加新 Key、修改已有 Key 信息、删除废弃 Key。

### 3.3 设置与偏好 (Settings & Preferences)

为了提供更完善的个人管理体验，系统需提供全局“设置”面板：

- **安全设置 (Security)：** 支持用户**修改主密码**（需输入旧密码验证身份）。
- **厂商管理 (Provider Management)：** * 允许用户**新增自定义厂商**（可配置名称与 Base URL）。
  - 允许用户**修改已有厂商的名称与 Base URL**。
  - 允许用户**删除空厂商**：仅当该厂商下关联 API Key 数量为 0 时可删除；若存在关联 Key，必须拦截并提示“请先删除或转移该厂商下的所有 API Key！”。

## 4. 界面与用户体验 (UI/UX)

- **视觉风格：** 纯黑白极简配色 (Monochrome)，圆角适中。文字排版清晰。
- **多端适配：**
  - **PC 端：** 使用 shadcn/ui 构建左侧菜单（API Key 展示、用量统计、设置、退出）+ AI 提供商列表 + API Key 主列表内容区。
  - **移动端：** 单栏列表展示，保留同等操作能力。
- **单列表展示原则：** API Key 页面不再拆分“列表 + 独立详情”组件；改为**一个列表组件**展示每条 Key 的完整字段（名称、厂商、API Key、Base URL、备注、时间等）和全部操作按钮（显隐、复制、测活、额度查询、代码片段、编辑、删除）。
- **账号上拉菜单：** 语言切换、系统设置、退出登录必须合并到一个上拉菜单中，菜单触发器显示当前登录账号。
- **时间展示规范：** API Key 列表仅展示更新时间值，不展示 `Updated At` 文本标签。
- **展示规范：** API Key 默认明文展示。
- **缺省值统一：** 任意缺失字段统一显示 `--`。
- **厂商操作入口：** 厂商编辑/删除必须收纳在“更多”面板，不直接平铺。
- **搜索框宽度：** 搜索框宽度应与 API Key 列表内容区一致。

## 5. 数据库模型设计 (基于 Drizzle ORM)

- **`users` (用户表):** `id`, `username`, `password_hash`, `created_at`
- **`providers` (厂商表):** `id`, `name`, `is_custom`
- **`api_keys` (密钥表):** `id`, `provider_id` (FK 关联 providers), `name`, `api_key` (加密存储), `base_url`, `notes`, `created_at`, `updated_at`

## 6. 性能与安全考量

- **安全登录：** 采用 NextAuth.js (Credentials Provider) 进行账号密码登录保护。
- **登录态维系：** Cookie 时效固定设置为 **2 天 (48小时)**。
- **数据加密：** 数据库存入的 `api_key` 必须使用 Node.js `crypto` 模块 (AES-256-GCM) 加密存储，服务端读取时解密。

## 7. UI 规范同步要求

- 任何涉及 UI 布局、交互、组件结构的需求变更或实现改动，必须同步更新以下两份文档：
  - `AGENTS.md`
  - `Api-Key管理工具产品需求文档.md`
