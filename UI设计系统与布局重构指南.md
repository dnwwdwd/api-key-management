# UI Design System & Layout Refactoring Guide (Api-key Manage)

## 0. 设计灵魂 (The Vibe)

你现在是一个拥有极高审美要求的顶级前端设计工程师 (兼具 Vercel 和 Apple 的设计品味)。

当前应用的 UI 太过丑陋和廉价。你需要**彻底重构** UI 布局。

**核心关键词：** 高级感 (Premium)、极致黑白 (Monochrome)、大留白 (Spacious)、细边框 (Subtle Borders)、无打扰交互 (Seamless Micro-interactions)。

## 1. 全局色彩与视觉基调 (Strict Color Palette)

**绝对禁止使用任何彩色 (如原色蓝、绿、红等)，除非是错误提示 (纯红) 或成功 Toast (纯绿)。**

严格限定 Tailwind CSS 颜色变量：

- **背景色 (Backgrounds):** 全局底层背景使用 `bg-[#F9FAFB]` 或 `bg-zinc-50`。卡片、面板和主内容区必须是纯白 `bg-white`。
- **文字色 (Typography):**
  - 主标题/强调文本：`text-zinc-950` 或 `text-black` (字重 `font-bold` 或 `font-semibold`)。
  - 常规正文：`text-zinc-700`。
  - 辅助/次要信息 (如时间、备注为空的提示、列表说明)：`text-zinc-400` 或 `text-zinc-500` (字重 `text-xs` 或 `text-sm`)。
- **边框与分割线 (Borders):** 必须使用极浅的颜色，如 `border-gray-100` 或 `border-zinc-200`，绝不能用深灰边框。
- **主按钮 (Primary Action):** 必须是纯黑背景白字，如 `bg-[#09090B] text-white hover:bg-zinc-800 transition-colors`。

## 2. 核心布局架构 (Core Layout Architecture)

必须采用完全响应式的**双栏布局 (Dual-Pane Layout)**。

### 2.1 PC 端侧边栏布局 (md 及以上断点)

- **容器结构：** `flex h-screen w-full overflow-hidden bg-zinc-50`
- **左侧边栏 (List Pane)：**
  - 宽度设定 (如 `w-[360px]` 或 `w-[400px]`)，右侧带极浅边框 `border-r border-gray-200`，背景纯白 `bg-white`。
  - **顶部区域：** 包含全局搜索框和**模型厂商的搜索下拉框**。
  - **列表区域：** 内部使用 `flex-1 overflow-y-auto`，确保密钥列表独立垂直滚动。列表必须按照**添加顺序降序排列**。
- **右侧详情面板 (Detail Pane)：**
  - 占据剩余空间 `flex-1 bg-zinc-50/50`。
  - 内容区需设置最大宽度限制或大内边距 (如 `p-8 max-w-4xl`)，确保长文本阅读体验。

### 2.2 移动端布局 (md 以下断点)

必须专为触控屏幕优化，绝不能只是 PC 端的简单缩放或挤压。

- **全局结构**：
  - 左侧的主列表区撑满全屏 `w-full`，成为移动端的主视图。
  - 右侧 PC 详情面板必须彻底**隐藏** (`hidden`)。
- **顶部导航与操作区 (Mobile Header & Actions)**：
  - **吸顶设计 (Sticky Top)**：顶部 Header（包含 Logo/标题 和 设置/多语言/登出等图标）必须固定在上方 (`sticky top-0 z-20 bg-white border-b border-gray-100`)，确保向下滚动列表时操作区始终可见。
  - **触控化搜索与下拉**：紧贴 Header 下方的厂商下拉框和搜索框，必须占满全宽 `w-full`。所有输入框、按钮的高度必须至少为 `h-10` 或 `py-2.5`，确保手指点击不会误触。
- **列表触控优化 (Touch Targets)**：
  - 列表项 (List Item) 必须提供宽裕的点击热区，内边距设置需足够大（如 `py-4 px-5`）。
- **底部抽屉交互 (Bottom Drawer / Sheet)**：
  - 用户点击列表项时，**禁止跳转新页面或路由**，必须从屏幕底部丝滑滑出抽屉展示详情（建议使用 shadcn Drawer 或原生定制动画）。
  - **遮罩层 (Overlay)**：必须有深色背景并带毛玻璃效果 `bg-black/40 backdrop-blur-sm fixed inset-0 z-40`，点击遮罩层可直接关闭抽屉。
  - **抽屉本体**：必须固定在底部 `fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50`，最大高度限制为 `max-h-[90vh]`，以防内容过长超出屏幕。
  - **视觉指示器**：抽屉顶部中央必须有明显的拖拽把手指示器 `w-12 h-1.5 bg-gray-200 rounded-full mx-auto mt-3 mb-1`。
  - **单手操作优化 (巨型按钮)**：抽屉内部需支持独立滚动 `overflow-y-auto`。最关键的“复制 API Key”操作，必须设计成占据整行宽度的超级大按钮（例如 `w-full py-3.5`），方便单手持握时大拇指轻松点击。

## 3. 核心组件微观细节与开发原则 (Micro-Component Specs & Strategy)

### 3.1 组件选型底线 (Component Strategy)

**能用 shadcn/ui 组件就用，不能用就果断手搓 (Hand-code)。**

绝对不允许为了实现某个功能而引入其他未经许可的臃肿第三方 UI 组件库。如果 shadcn/ui 默认组件无法完美满足极简交互，**特别是以下几种情况，请直接使用原生 HTML + Tailwind CSS 从零手搓：**

- **下拉框 (Combobox/Select)**

- **带有复杂定制 Icon 的搜索框 (Search box)**

- **定制化的图标和按钮组合 (Icon & Buttons)**

- **整体侧边栏 (Sidebar)**

  务必通过原生 Tailwind 保证最高级别的样式控制力与极致的性能。

### 3.2 厂商过滤下拉框 (Provider Combobox/Select)

*注意：本系统已去除所有厂商 Icon，此处仅限纯文字展示。*

- **位置：** 位于左侧边栏的顶部。
- **数据结构：** 下拉框的第一个默认选项必须固定为 **"全部 (All)"**。
- **UI 表现：** 优先尝试 shadcn `Combobox` (Popover + Command)。如果定制难度太大，请参考原则 3.1 **直接手搓**。点击弹出浮层，浮层内部带有一个搜索框用于过滤厂商名单。未展开时，显示当前选中的厂商名称。

### 3.3 密钥列表卡片 (Key List Item)

- **容器：** 移除卡片四周的独立边框，改为列表项之间的底部细线分割 `border-b border-gray-100`。
- **交互与选中：** - `cursor-pointer transition-colors group`
  - Hover 状态：`hover:bg-zinc-50 border-l-4 border-l-transparent`
  - Active (当前选中) 状态：**必须带有左侧黑色高亮粗边框** `bg-zinc-50 border-l-4 border-l-black`。
- **排版：** 密钥名称使用 `font-semibold text-sm text-zinc-900`；厂商名称使用灰色胶囊背景包裹 `bg-white border border-gray-200 px-2 py-0.5 rounded text-xs text-gray-500 shadow-sm`；密钥预览 (sk-...) 必须使用等宽字体 `font-mono text-xs opacity-70`。

### 3.4 右侧详情与表单展示 (Detail & Forms)

- **大标题：** 密钥名称必须足够醒目 `text-2xl font-bold tracking-tight`。
- **只读代码块 (API Key & Base URL)：**
  - 必须使用等宽字体 `font-mono text-sm`。
  - 容器需要有内阴影和微小圆角：`bg-zinc-50 border border-gray-200 p-3.5 rounded-md overflow-x-auto shadow-inner`。
- **复制按钮：** 紧贴着 API Key 输入框右侧，使用纯黑背景 `bg-[#09090B] text-white px-5 py-3.5 rounded-md font-medium hover:bg-gray-800 flex items-center space-x-2`。

### 3.5 弹窗遮罩 (Modals & Overlays)

- 所有弹窗 (新建 Key、系统设置) 的背景遮罩必须带有毛玻璃模糊效果：`bg-black/40 backdrop-blur-sm`。
- 弹窗本体的出现必须带有丝滑的缩放动画：`animate-in zoom-in-95 duration-200`。

## 4. 绝对禁止的 Anti-Patterns (千万不要这样做)

1. **不要**在卡片上使用过重的 `shadow-md` 或 `shadow-lg`，请仅使用极浅的 `shadow-sm` 或是没有阴影仅用 `border`。
2. **不要**使用默认的 `<select>` 或原生的 `alert()` 弹窗，请使用 shadcn 组件，无法实现时直接手搓原生的极简组件。
3. **不要**让排版变得拥挤。凡是块级元素之间，必须留有足够的间距 (如 `space-y-4` 或 `space-y-6`)。
4. **不要**在厂商展示处添加任何图标 (Icon)，当前 PRD 规定厂商仅为纯文本呈现。

## 5. 执行指令

请确认你已完全理解上述 UI 规范。在接下来的代码生成中，每一行 Tailwind 类名都必须经过上述规范的审视。现在，请开始重构主页面组件。