# Multi Account Browser

基于 Electron + React 的多账号浏览器，支持隔离登录、JS 脚本执行和书签脚本。

## 功能特性

- **多账号隔离登录** — 每个账号独立的 Cookie/LocalStorage，互不影响
- **会话持久化** — 登录状态自动保存，重启应用后保持登录
- **JS 脚本控制台** — 支持实时执行 JavaScript 脚本
- **脚本自动执行** — 标记为 Auto 的脚本会在页面加载后自动运行
- **可编辑书签栏** — 支持添加、编辑、删除书签脚本，兼容 bookmarklet 格式
- **账号管理** — 添加、编辑、删除账号，可自定义名称和网址

## 安装与运行

### 环境要求

- Node.js >= 18
- npm >= 8

### 安装依赖

```bash
npm install
```

### 开发模式运行

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

## 使用方法

### 添加账号

1. 点击侧边栏左上角的 **"+"** 按钮
2. 输入账号名称（如"工作"、"个人"、"测试1"）
3. 输入网站 URL（默认为龙腾出行订单中心）
4. 点击 **Add** 确认

### 切换账号

点击侧边栏中的账号卡片即可切换，每个账号拥有独立的浏览器会话。

### 编辑账号

将鼠标悬停在账号卡片上，点击 **edit** 按钮，可修改账号名称和网址。

### 使用地址栏

选中账号后，顶部会显示地址栏，支持：
- 手动输入 URL 并回车跳转
- 前进 / 后退 / 刷新按钮

### 使用书签栏

地址栏下方为书签栏：

- **点击书签** — 执行对应的 JS 脚本
- **悬停书签** — 显示 `edit`（编辑）和 `del`（删除）按钮
- **点击 "+ Add"** — 添加新书签，支持输入名称、图标（emoji）和 JavaScript 代码
- 支持粘贴标准 bookmarklet 格式的脚本（带 `javascript:` 前缀和 URL 编码）

### 使用 JS 控制台

1. 点击侧边栏底部的 **Console** 按钮打开控制台
2. 在代码编辑器中输入 JavaScript 代码
3. 点击 **Run** 执行，结果显示在 Output 区域
4. 点击 **Save** 保存脚本，可设置：
   - **On** — 启用/禁用脚本
   - **Auto** — 页面加载后自动执行

### 关闭对话框

添加账号、编辑书签等对话框打开时，背后的网页会自动隐藏，关闭对话框后恢复显示。

## 修改指南

### 项目结构

```
src/
├── main/
│   └── index.ts              # Electron 主进程：窗口管理、会话、IPC
├── preload/
│   └── index.ts              # 预加载脚本：IPC 桥接
└── renderer/
    ├── index.html            # 入口 HTML
    └── src/
        ├── main.tsx          # React 入口
        ├── App.tsx           # 根组件，状态管理
        ├── types.ts          # TypeScript 类型定义
        ├── styles.css        # 全局样式
        └── components/
            ├── Sidebar.tsx          # 侧边栏（账号列表）
            ├── UrlBar.tsx           # 地址栏
            ├── BookmarksBar.tsx     # 书签栏
            ├── BookmarkDialog.tsx   # 添加/编辑书签对话框
            ├── AddAccountDialog.tsx # 添加/编辑账号对话框
            └── ScriptConsole.tsx    # JS 脚本控制台
```

### 修改默认网址

编辑 `src/renderer/src/components/AddAccountDialog.tsx`，修改 `useState` 中的默认 URL：

```tsx
const [url, setUrl] = useState('https://h5-quanyi.dragonpass.com.cn/#/personalCenter')
```

### 修改样式

所有样式定义在 `src/renderer/src/styles.css` 中，使用 CSS 变量统一管理颜色：

```css
:root {
  --bg-dark: #1e1e2e;       /* 主背景色 */
  --bg-sidebar: #181825;    /* 侧边栏背景 */
  --accent: #89b4fa;        /* 主题色 */
  --text-primary: #cdd6f4;  /* 主文字颜色 */
  /* ... 更多变量见 styles.css */
}
```

### 添加新的 IPC 通道

1. 在 `src/main/index.ts` 的 `setupIPC()` 中添加 handler：

```ts
ipcMain.handle('my-channel', (_event, arg) => {
  // 处理逻辑
  return result
})
```

2. 在 `src/preload/index.ts` 中添加桥接：

```ts
myMethod: (arg: string) => ipcRenderer.invoke('my-channel', arg),
```

3. 在 `src/renderer/src/types.ts` 中添加类型声明：

```ts
myMethod: (arg: string) => Promise<ResultType>
```

### 修改 BrowserView 布局

主进程中的布局常量定义在 `src/main/index.ts` 顶部：

```ts
const SIDEBAR_WIDTH = 260      // 侧边栏宽度
const URL_BAR_HEIGHT = 44      // 地址栏高度
const BOOKMARKS_BAR_HEIGHT = 36 // 书签栏高度
const CONSOLE_HEIGHT = 340     // 控制台面板高度
```

### 预装书签脚本

在 `src/renderer/src/components/bookmarks.ts`（如果存在）中定义预置书签，或通过应用内的 "+ Add" 按钮手动添加。

### 自动执行脚本

在 JS 控制台中保存脚本后，勾选 **Auto** 复选框即可在页面加载时自动执行。适合用于：
- 自动注入页面增强功能
- 拦截网络请求
- 自动填充表单

## 技术栈

- **Electron** — 桌面应用框架
- **React 18** — UI 框架
- **TypeScript** — 类型安全
- **Vite** — 构建工具（通过 electron-vite）
- **Electron WebContentsView** — 嵌入式浏览器视图
- **session.fromPartition** — 会话隔离

## License

MIT
