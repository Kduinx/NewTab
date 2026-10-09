# NewTab

一个基于浏览器新标签页的 Google 搜索页 demo，包含：

- 搜索框
- 搜索建议（通过后端代理 DuckDuckGo 推荐词接口）
- 清除按钮
- 键盘导航支持（上下键 / Enter / Esc）
- 纯前端 + Express 后端代理

## 项目结构

```text
newTabDemo/
├── assets/
│   ├── css/
│   │   ├── reset.css
│   │   ├── search_box.css
│   │   └── style.css
│   └── js/
│       └── main.js
├── index.html
├── main.html
├── server.js
├── package.json
├── pnpm-lock.yaml
├── .gitignore
└── README.md
```

## 运行方式

安装依赖：

```bash
npm install
```

启动本地服务：

```bash
node server.js
```

然后在浏览器中访问：

```text
http://localhost:5500/main.html
```

## 说明

- `main.html` 是页面入口。
- `assets/js/main.js` 包含搜索建议和交互逻辑。
- `server.js` 提供 `/api/suggest` 代理接口，绕过浏览器跨域和搜索建议请求限制。

## 技术栈

- HTML
- CSS
- JavaScript
- Express

## License

MIT
