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

必须配置：

- `AUTH_SECRET`
- `ENCRYPTION_KEY`（解码后 32 字节）

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
