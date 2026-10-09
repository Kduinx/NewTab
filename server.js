const express = require("express");
const path = require("path");
const app = express();

// 允许跨域（本地开发时用）
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

// 1. 托管你的静态文件（main.html、css/、js/ 等）
app.use(express.static(path.join(__dirname, "./")));

// 2. 代理 DuckDuckGo 的搜索建议接口
app.get("/api/suggest", async (req, res) => {
  const q = req.query.q;
  if (!q) return res.json([]);

  try {
    const url = `https://duckduckgo.com/ac/?q=${encodeURIComponent(q)}&type=list`;
    const response = await fetch(url, {
      headers: {
        // 模拟真实浏览器，避免被 Cloudflare 拦截
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/json",
        Referer: "https://duckduckgo.com/",
      },
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("代理请求失败:", err.message);
    res.json([]);
  }
});

app.listen(5500, "0.0.0.0", () => {
  console.log("✅ 开发服务器已启动: http://localhost:5500");
});
