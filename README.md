# Api Key 管理

让 API Key 管理从分散、易错、难排查，变成集中、清晰、可控。

Api Key 管理是一款本地优先的 API Key 管理工具，面向同时使用多家 AI 服务的个人开发者和小团队。它把 API Key 的保存、整理、复制、测活、余额或用量查看、模型发现和调用示例生成集中到一个界面里，让日常管理更省时间，也让协作交接更安心。

## 为什么会需要它

当你开始同时使用多家 AI 服务，API Key 往往会很快变得分散：

- 有的放在聊天记录里
- 有的写在文档或便签里
- 有的藏在不同项目的环境变量里
- 有的已经失效，却没人能第一时间发现

结果通常不是“管理”，而是反复查找、重复确认、临时排错和频繁切换后台。

Api Key 管理的价值，就是把这些零散动作收拢成一套更顺手的日常流程。

## 你能得到什么

- 一个入口管理多家 AI 服务商
  无论是常见厂商还是自定义服务，都可以统一录入、查看、编辑和整理。

- 更安心的密钥保存方式
  系统以安全为前提处理 API Key，避免把明文密钥直接留在数据库中。

- 更快的可用性判断
  你可以直接发起网络测活，快速确认某个 Key 是否可用、响应是否正常。

- 更直观的余额或用量视图
  对已支持的服务商，可直接查询余额或用量；暂不支持时，也能快速跳转到官方账单页面继续查看。

- 更省事的接入准备
  系统可帮助发现可用模型，并生成常见语言的调用示例，减少重复整理和试错时间。

- 更方便的备份与迁移
  支持按服务商导入和导出，适合做归档、迁移和团队交接。

## 它适合谁

- 同时使用多家 AI 服务的个人开发者
- 需要统一保存和交接 API Key 的小团队
- 经常测试不同模型、不同账号、不同环境的产品或研发人员

## 核心体验

- 本地优先，数据掌控感更强
- 界面简洁，常用操作集中完成
- 支持中文和英文双语界面
- 兼顾桌面端与移动端使用
- 适合日常管理、排查和准备工作，不替代正式业务流量网关

## 典型使用场景

- 新接入一家 AI 服务时，先录入 Key，再做测活、查看模型、生成调用示例
- 同时维护多个账号时，按服务商清晰归档，减少混用和误复制
- 做资产盘点时，在分析页集中查看可查询 Key 的余额或用量概况
- 团队成员交接时，通过导入和导出快速完成迁移与整理

## 当前版本已支持

- 登录与基础权限控制
- AI 服务商管理与自定义扩展
- API Key 新增、编辑、删除、复制、显隐和备注管理
- 网络测活
- 部分 Provider 的余额或用量查询
- 模型发现与调用示例生成
- 分析页汇总查看
- API Key 文件导入与导出
- `zh-CN` 与 `en-US` 双语支持

## 本地安装与启动

如果你想先在自己电脑上体验项目，可以按照下面的步骤从克隆、安装到启动完整走一遍。

### 1. 克隆项目到本地

如果你使用 SSH：

```bash
git clone git@github.com:dnwwdwd/api-key-management.git
cd api-key-management
```

如果你使用 HTTPS：

```bash
git clone https://github.com/dnwwdwd/api-key-management.git
cd api-key-management
```

### 2. 安装依赖

```bash
npm install
```

这一步会把项目运行所需的依赖下载安装到本地。

### 3. 创建本地环境变量文件

```bash
cp .env.example .env.local
```

项目默认提供了本地开发可用的示例配置，复制后即可继续启动。当前示例变量包括：

- `AUTH_SECRET`
- `ENCRYPTION_KEY`
- `DATABASE_FILE`
- `SEED_ADMIN_USERNAME`
- `SEED_ADMIN_PASSWORD`

如果你只是本地体验，通常不需要立刻修改这些值；如果你准备长期使用或部署到正式环境，再替换成自己的安全配置即可。

### 4. 初始化数据库

首次启动前，执行下面三条命令：

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

执行完成后，系统会初始化数据库并创建默认管理员账号。

默认登录信息：

- 用户名：`admin`
- 密码：`admin123456`

如果你已经在 `.env.local` 中修改了 `SEED_ADMIN_USERNAME` 或 `SEED_ADMIN_PASSWORD`，请以你自己的配置为准。

### 5. 启动本地开发环境

```bash
npm run dev
```

启动成功后，在浏览器打开：

- `http://localhost:3000/zh-CN/login`
- `http://localhost:3000/en-US/login`

登录后就可以开始体验 API Key 管理、网络测活、余额或用量查看、模型发现和分析页等功能。

### 6. 如果你只想快速照抄命令

```bash
git clone git@github.com:dnwwdwd/api-key-management.git
cd api-key-management
npm install
cp .env.example .env.local
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

## 常用命令

- 启动开发环境：`npm run dev`
- 类型检查：`npm run typecheck`
- 代码检查：`npm run lint`
- 生产构建：`npm run build`
- 本地生产方式启动：`npm run start`

## 一句话概括

Api Key 管理不只是把密钥存起来，而是把多家 AI 服务的日常管理流程，收拢成一个更清晰、更可靠、更适合长期使用的工作台。
