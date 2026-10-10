/**
 * 搜索框交互
 * - 输入防抖请求搜索建议
 * - 键盘导航（↑ ↓ 选择 / Enter 提交 / Esc 关闭）
 * - 中文输入法组字期间不请求
 * - 通过请求序号丢弃过期响应，避免竞态
 */
(() => {
  "use strict";

  const CONFIG = {
    DEBOUNCE_MS: 250,
    MAX_SUGGESTIONS: 10,
  };

  const el = {
    form: document.querySelector(".search"),
    input: document.querySelector("#search-input"),
    submitBtn: document.querySelector(".search__submit"),
    clearBtn: document.querySelector(".search__clear"),
    list: document.querySelector("#search-suggestions"),
  };

  if (!el.form || !el.input || !el.submitBtn || !el.clearBtn || !el.list)
    return;

  const state = {
    activeIndex: -1,
    debounceTimer: null,
    isComposing: false,
    requestId: 0,
  };

  const getQuery = () => el.input.value.trim();

  /** 根据输入框内容同步清除按钮与搜索按钮的状态 */
  function syncControls() {
    const isEmpty = getQuery().length === 0;
    el.clearBtn.hidden = isEmpty;
    el.submitBtn.disabled = isEmpty;
  }

  const getOptions = () => [...el.list.querySelectorAll('[role="option"]')];

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  /* ------------------------------------------------------------------ */
  /* 建议列表渲染                                                        */
  /* ------------------------------------------------------------------ */

  function clearSuggestions() {
    el.list.innerHTML = "";
    el.list.hidden = true;
    el.input.setAttribute("aria-expanded", "false");
    el.input.removeAttribute("aria-activedescendant");
    state.activeIndex = -1;
  }

  function renderSuggestions(list) {
    const items = list.slice(0, CONFIG.MAX_SUGGESTIONS);

    if (items.length === 0) {
      clearSuggestions();
      return;
    }

    el.list.innerHTML = items
      .map(
        (text, i) =>
          `<li role="option" id="suggestion-${i}" aria-selected="false">${escapeHtml(
            text,
          )}</li>`,
      )
      .join("");

    el.list.hidden = false;
    el.input.setAttribute("aria-expanded", "true");
    state.activeIndex = -1;
  }

  function setActive(index) {
    const options = getOptions();
    state.activeIndex = index;

    options.forEach((opt, i) => {
      opt.setAttribute("aria-selected", String(i === index));
    });

    if (index >= 0 && options[index]) {
      el.input.setAttribute("aria-activedescendant", options[index].id);
      options[index].scrollIntoView({ block: "nearest" });
    } else {
      el.input.removeAttribute("aria-activedescendant");
    }
  }

  /* ------------------------------------------------------------------ */
  /* 请求建议                                                            */
  /* ------------------------------------------------------------------ */

  /** 兼容不同后端返回格式，统一成字符串数组 */
  function normalize(data) {
    if (!Array.isArray(data)) return [];
    // [query, [建议, ...]]
    if (Array.isArray(data[1])) return data[1];
    // [{ phrase } | "建议", ...]
    return data.map((item) => item.phrase || item);
  }

  async function fetchSuggestions(query) {
    const id = ++state.requestId;

    try {
      const res = await fetch(`/api/suggest?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      if (id !== state.requestId) return; // 输入已变化，丢弃过期响应

      renderSuggestions(normalize(data));
    } catch (err) {
      if (id !== state.requestId) return;
      console.warn("建议获取失败:", err.message);
    }
  }

  function scheduleFetch() {
    clearTimeout(state.debounceTimer);

    const query = getQuery();
    if (!query || state.isComposing) return;

    state.debounceTimer = setTimeout(
      () => fetchSuggestions(query),
      CONFIG.DEBOUNCE_MS,
    );
  }

  /** 取消待发请求、作废在飞请求并清空列表 */
  function reset() {
    clearTimeout(state.debounceTimer);
    state.requestId++;
    clearSuggestions();
  }

  /* ------------------------------------------------------------------ */
  /* 事件处理                                                            */
  /* ------------------------------------------------------------------ */

  function commit(text) {
    el.input.value = text;
    syncControls();
    clearSuggestions();
    el.form.requestSubmit();
  }

  function onInput() {
    syncControls();
    reset();
    scheduleFetch();
  }

  /** 聚焦或点击输入框时，若已有搜索词且列表未展开，则重新拉取建议 */
  function onShow() {
    const query = getQuery();
    if (query && el.list.hidden) fetchSuggestions(query);
  }

  function onSubmit(e) {
    // 空值时禁止提交（搜索图标与回车都不会生效）
    if (getQuery().length === 0) {
      e.preventDefault();
      return;
    }
    clearSuggestions();
  }

  function onKeydown(e) {
    const options = getOptions();

    if (e.key === "Escape") {
      clearSuggestions();
      return;
    }

    if (options.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (el.list.hidden) {
          el.list.hidden = false;
          el.input.setAttribute("aria-expanded", "true");
        }
        setActive(Math.min(state.activeIndex + 1, options.length - 1));
        break;

      case "ArrowUp":
        e.preventDefault();
        setActive(Math.max(state.activeIndex - 1, -1));
        break;

      case "Enter":
        if (state.activeIndex >= 0) {
          e.preventDefault();
          commit(options[state.activeIndex].textContent);
        }
        break;
    }
  }

  function onCompositionStart() {
    state.isComposing = true;
  }

  function onCompositionEnd() {
    state.isComposing = false;
    scheduleFetch();
  }

  function onClear() {
    el.input.value = "";
    syncControls();
    reset();
    el.input.focus();
  }

  function onSuggestionPick(e) {
    const option = e.target.closest('[role="option"]');
    if (!option) return;

    e.preventDefault();
    commit(option.textContent);
  }

  function onDocumentClick(e) {
    if (!el.form.contains(e.target) && !el.list.contains(e.target)) {
      clearSuggestions();
    }
  }

  /* ------------------------------------------------------------------ */
  /* 绑定                                                                */
  /* ------------------------------------------------------------------ */

  el.input.addEventListener("input", onInput);
  el.input.addEventListener("keydown", onKeydown);
  el.input.addEventListener("focus", onShow);
  el.input.addEventListener("click", onShow);
  el.input.addEventListener("compositionstart", onCompositionStart);
  el.input.addEventListener("compositionend", onCompositionEnd);
  el.clearBtn.addEventListener("click", onClear);
  el.list.addEventListener("mousedown", onSuggestionPick);
  el.form.addEventListener("submit", onSubmit);
  document.addEventListener("click", onDocumentClick);

  syncControls();
})();
