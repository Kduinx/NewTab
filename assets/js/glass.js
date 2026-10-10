import { LiquidGlass } from "https://cdn.jsdelivr.net/npm/@ybouane/liquidglass/dist/index.js";

const root = document.querySelector("#root");
const glassEl = document.querySelector("#search-glass");
const bgImage = document.querySelector(".stage__bg");

/** 等待背景图加载完成，否则折射采样到的会是空图 */
function whenImageReady(img) {
  if (!img || img.complete) return Promise.resolve();
  return new Promise((resolve) => {
    img.addEventListener("load", resolve, { once: true });
    img.addEventListener("error", resolve, { once: true });
  });
}

if (root && glassEl) {
  // darkGlass 预设（取自官方 demo）：brightness -0.3 / blur 0.25
  // cornerRadius 取胶囊半径，保证是标准胶囊形
  const cornerRadius =
    Math.round(glassEl.getBoundingClientRect().height / 2) || 14;

  glassEl.dataset.config = JSON.stringify({
    brightness: +0.05,
    blurAmount: 0.25,
    cornerRadius,
    zRadius: 12,
  });

  try {
    await whenImageReady(bgImage);
    await LiquidGlass.init({ root, glassElements: [glassEl] });
    document.documentElement.classList.add("lg-ready");

    requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
  } catch (err) {
    console.warn("LiquidGlass 初始化失败，保留 CSS 降级样式：", err);
  }
}
