# Translatar (Chrome/Edge Extension, Manifest V3)

Translatar 是一个纯前端浏览器扩展工程（无后端），用于在网页中对英文文本执行：

- Correct English
- Translate
- Rewrite

所有网络请求仅发送到用户在 Options 中配置的 `apiBaseUrl`。

## 功能说明

### 触发入口
- 右键菜单（仅对选中文本）
- 快捷键 commands
  - `Alt+E` -> Correct English
  - `Alt+T` -> Translate
  - `Alt+R` -> Rewrite
- Popup 中三个按钮

### 文本来源
- 优先使用当前页面选区文本。
- 若无选区，则读取当前聚焦的 `input` / `textarea` / `contenteditable` 内容。

### 结果展示
- 默认在选区附近显示 Shadow DOM 浮层，包含：
  - loading 状态
  - error 状态
  - 结果文本
  - Copy 按钮
  - Replace 按钮（可替换输入框/可编辑区域文本时显示）

### 请求并发控制
- Background Service Worker 使用串行队列；同一时间只发出一个请求。

## API 约定

可在 Options 配置 `apiBaseUrl`，默认：`http://localhost:8787`。

### Correct English
- `POST {base}/english/correct`
- request:
```json
{ "text": "...", "preserveFormatting": true }
```

### Translate
- `POST {base}/translate`
- request:
```json
{ "text": "...", "targetLang": "zh-Hans", "sourceLang": "auto", "preserveFormatting": true }
```

### Rewrite
- `POST {base}/rewrite`
- request:
```json
{ "text": "...", "style": "concise", "preserveFormatting": true }
```

返回统一支持：
```json
{ "ok": true, "resultText": "..." }
```
或
```json
{ "ok": false, "error": { "code": "...", "message": "..." } }
```

## 目录结构

```txt
src/
  background/
  content/
  popup/
  options/
  shared/
manifest.json
vite.config.ts
tsconfig.json
package.json
```

## 本地开发

```bash
npm i
npm run build
```

> 产物输出到 `dist/`。

## 加载到 Chrome/Edge

1. 打开扩展管理页面（Chrome: `chrome://extensions`，Edge: `edge://extensions`）。
2. 开启“开发者模式”。
3. 点击“加载已解压的扩展程序”。
4. 选择本项目的 `dist` 目录。

## Options 配置项

- `apiBaseUrl`: API 基础地址（默认 `http://localhost:8787`）
- `targetLang`: Translate 目标语言（默认 `zh-Hans`）
- `sourceLang`: Translate 源语言（默认 `auto`）
- `rewriteStyleDefault`: Rewrite 默认风格（`concise/formal/casual`）
- `preserveFormatting`: 是否保留格式
- `showFloatingPanel`: 是否显示悬浮结果面板
- `replaceStrategyDefault`: 默认替换策略（`selection/all`）

## 权限说明

- `contextMenus`: 创建右键菜单
- `storage`: 保存用户配置
- `activeTab`: 对当前标签页触发操作
- `scripting`: 扩展脚本能力（MV3 常见权限）
- `clipboardWrite`: 支持 Copy
- `host_permissions (http/https)`: 允许访问用户配置的 API 地址，以及在页面注入 content script

## 隐私说明

- 扩展不内置任何第三方 LLM Key，不调用 OpenAI 或其他模型服务。
- 扩展只会把你选择/触发的文本发送到你在 Options 指定的 `apiBaseUrl`。
- 扩展不上传到其他固定域名。
