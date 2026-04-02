# Api Key管理 (Api Key Management)

本项目是一个本地优先的 API Key 管理工具，技术栈：

- Next.js App Router + React + TypeScript (strict)
- TailwindCSS + shadcn 风格组件
- next-intl (`zh-CN` / `en-US`)
- Auth.js v5 (Credentials Provider)
- SQLite + Drizzle ORM
- AES-256-GCM (`ENCRYPTION_KEY`)

## 快速开始

1. 安装依赖

```bash
npm install
```

2. 配置环境变量

```bash
cp .env.example .env.local
```

推荐配置：

- `AUTH_SECRET`
- `ENCRYPTION_KEY`（解码后 32 字节）
- `DATABASE_FILE`
- `SEED_ADMIN_USERNAME`
- `SEED_ADMIN_PASSWORD`

说明：

- 本地开发环境下，如果没有配置 `AUTH_SECRET` 和 `ENCRYPTION_KEY`，代码会使用开发默认值，方便先把项目跑起来。
- 正式部署时仍然应该显式配置真实的 `AUTH_SECRET` 和 `ENCRYPTION_KEY`，不要依赖开发默认值。
- 如果不配置 `DATABASE_FILE`，默认使用 `./data/app.db`。
- 如果不配置种子账号，默认会创建 `admin / admin123456`。

3. 初始化数据库

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

默认会创建管理员账号：

- username: `admin`
- password: `admin123456`

可通过 `SEED_ADMIN_USERNAME` / `SEED_ADMIN_PASSWORD` 覆盖。

如果开发服务已经启动，后面又执行了 `db:migrate` 或 `db:seed`，当前项目会自动检测数据库文件变化并重新加载，无需手动重启 `npm run dev`。

4. 启动开发环境

```bash
npm run dev
```

访问：

- `http://localhost:3000/zh-CN/login`
- `http://localhost:3000/en-US/login`

## 常用命令

- `npm run typecheck`
- `npm run lint`
- `npm run build`

## 安全约束

- `api_keys.api_key` 入库前必须加密，读取后服务端解密再返回前端。
- 登录仅支持 Credentials Provider，会话有效期固定 48 小时。
- Providers 只支持查/增/改，严格禁止删除。

## 模型发现说明

- 模型拉取优先走厂商官方接口。
- Anthropic 使用官方 `GET /v1/models` 接口获取模型。
- 如果厂商接口不可用、鉴权失败，或返回内容为空，系统会回退到内置的厂商推荐模型列表，避免代码生成弹窗出现空白。
