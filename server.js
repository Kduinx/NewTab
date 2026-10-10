const express = require("express");
const path = require("path");
const app = express();

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

app.use(express.static(path.join(__dirname, "./")));

app.get("/api/suggest", async (req, res) => {
  const q = req.query.q;
  if (!q) return res.json([q, []]);

  try {
    const url = `https://www.google.com.hk/complete/search?client=gws-wiz&q=${encodeURIComponent(q)}&hl=zh-CN&cp=${q.length}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "*/*",
        Referer: "https://www.google.com.hk/",
        "Accept-Language": "zh-CN,zh;q=0.9",
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`Google 请求失败: HTTP ${response.status}`);
      return res.json([q, []]);
    }

    const text = await response.text();
    const start = text.indexOf("[");
    const end = text.lastIndexOf("]");

    if (start === -1 || end <= start) return res.json([q, []]);

    const data = JSON.parse(text.substring(start, end + 1));

    if (Array.isArray(data) && Array.isArray(data[0])) {
      const suggestions = data[0]
        .slice(0, 10)
        .map((item) => (Array.isArray(item) ? item[0] : item));
      res.json([q, suggestions]);
    } else {
      res.json([q, []]);
    }
  } catch (err) {
    console.error("Google 建议获取失败:", err.message);
    res.json([q, []]);
  }
});

app.listen(5500, "0.0.0.0", () => {
  console.log("服务器已启动: http://localhost:5500");
});
