const form = document.querySelector(".search");
const input = document.querySelector("#search-input");
const clearBtn = document.querySelector(".search__clear");
const suggestions = document.querySelector("#search-suggestions");
let activeIndex = -1;
let debounceTimer = null;

// 显示/隐藏清除按钮，并获取建议
input.addEventListener("input", () => {
  const query = input.value.trim();
  clearBtn.hidden = query.length === 0;

  // 清除旧建议
  clearSuggestions();

  if (!query) return;

  // 防抖，200ms 后请求建议
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => fetchSuggestions(query), 200);
});

// 获取 DuckDuckGo 搜索建议
async function fetchSuggestions(query) {
  try {
    const res = await fetch(`/api/suggest?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error("Network error");
    const data = await res.json();
    console.log("后端返回的原始数据:", data);

    // 修复解析逻辑
    let list = [];
    if (Array.isArray(data) && data.length > 1 && Array.isArray(data[1])) {
      // 兼容 DuckDuckGo 和 Google 的格式: ['query', ['建议1', '建议2']]
      list = data[1];
    } else if (Array.isArray(data)) {
      // 兼容 [{phrase: '建议1'}, ...] 的格式
      list = data.map((item) => item.phrase || item);
    }

    console.log("解析后的建议列表:", list);
    renderSuggestions(list);
  } catch (err) {
    console.warn("建议获取失败:", err.message);
  }
}

// 渲染建议列表
function renderSuggestions(list) {
  if (!list.length) {
    clearSuggestions();
    return;
  }

  suggestions.innerHTML = list
    .map(
      (text, i) =>
        `<li role="option" id="suggestion-${i}" aria-selected="false" data-index="${i}">${escapeHtml(text)}</li>`,
    )
    .join("");

  suggestions.hidden = false;
  input.setAttribute("aria-expanded", "true");
  activeIndex = -1;
}

function clearSuggestions() {
  suggestions.innerHTML = "";
  suggestions.hidden = true;
  input.setAttribute("aria-expanded", "false");
  input.removeAttribute("aria-activedescendant");
  activeIndex = -1;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// 清除
clearBtn.addEventListener("click", () => {
  input.value = "";
  clearBtn.hidden = true;
  clearSuggestions();
  input.focus();
});

// 键盘导航
input.addEventListener("keydown", (e) => {
  const options = [...suggestions.querySelectorAll('[role="option"]')];

  // 列表为空且不是 Escape，直接返回
  if (options.length === 0 && e.key !== "Escape") return;

  if (e.key === "ArrowDown") {
    e.preventDefault();
    if (suggestions.hidden) {
      suggestions.hidden = false;
      input.setAttribute("aria-expanded", "true");
    }
    activeIndex = Math.min(activeIndex + 1, options.length - 1);
    updateActive(options);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    activeIndex = Math.max(activeIndex - 1, -1);
    updateActive(options);
  } else if (e.key === "Enter") {
    if (activeIndex >= 0) {
      e.preventDefault();
      input.value = options[activeIndex].textContent;
      suggestions.hidden = true;
      input.setAttribute("aria-expanded", "false");
      form.requestSubmit(); // 选中后直接提交
    }
  } else if (e.key === "Escape") {
    clearSuggestions();
  }
});

// 点击建议
suggestions.addEventListener("mousedown", (e) => {
  const li = e.target.closest('[role="option"]');
  if (!li) return;
  e.preventDefault();
  input.value = li.textContent;
  clearSuggestions();
  form.requestSubmit(); // 点击建议后直接提交
});

// 点击页面其他区域关闭建议
document.addEventListener("click", (e) => {
  if (!form.contains(e.target)) clearSuggestions();
});

// 更新高亮状态
function updateActive(options) {
  options.forEach((opt, i) => {
    opt.setAttribute("aria-selected", i === activeIndex ? "true" : "false");
  });
  if (activeIndex >= 0) {
    input.setAttribute("aria-activedescendant", options[activeIndex].id);
    options[activeIndex].scrollIntoView({ block: "nearest" });
  } else {
    input.removeAttribute("aria-activedescendant");
  }
}
