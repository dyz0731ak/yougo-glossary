// トップページの検索・カテゴリ絞り込み。
// 用語カードは build.mjs が index.html に焼き込み済み（SSG）。
// ここでは既存DOMの表示/非表示の切り替えとハイライトだけを行う。
(function () {
  "use strict";

  const searchEl = document.getElementById("search-input");
  const filtersEl = document.getElementById("category-filters");
  const countEl = document.getElementById("result-count");
  const noResultEl = document.getElementById("no-result");
  const pickupEl = document.getElementById("pickup");
  if (!searchEl || !filtersEl) return;

  const cards = Array.from(document.querySelectorAll(".term-card"));
  const sections = Array.from(document.querySelectorAll(".cat-section"));

  // ハイライト用に元テキストを保持
  cards.forEach((card) => {
    const name = card.querySelector(".term-name");
    const short = card.querySelector(".term-short");
    if (name) name.dataset.original = name.textContent;
    if (short) short.dataset.original = short.textContent;
  });

  let activeCategory = "すべて";
  let query = "";

  // ----- カテゴリ絞り込みチップ -----
  filtersEl.querySelectorAll(".filter-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      activeCategory = chip.dataset.category || "すべて";
      filtersEl
        .querySelectorAll(".filter-chip")
        .forEach((c) => c.classList.toggle("active", c === chip));
      render();
    });
  });

  // ----- 検索 -----
  searchEl.addEventListener("input", () => {
    query = searchEl.value;
    render();
  });

  function escapeHtml(s) {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // 検索語にマッチした部分を <mark> で強調したHTMLを返す
  function highlight(text, q) {
    if (!q) return escapeHtml(text);
    const lower = text.toLowerCase();
    let html = "";
    let from = 0;
    let idx;
    while ((idx = lower.indexOf(q, from)) !== -1) {
      html += escapeHtml(text.slice(from, idx));
      html += "<mark>" + escapeHtml(text.slice(idx, idx + q.length)) + "</mark>";
      from = idx + q.length;
    }
    html += escapeHtml(text.slice(from));
    return html;
  }

  function applyHighlight(el, q) {
    if (!el) return;
    const original = el.dataset.original || "";
    el.innerHTML = highlight(original, q);
  }

  function render() {
    const q = query.trim().toLowerCase();
    let count = 0;

    cards.forEach((card) => {
      const inCategory =
        activeCategory === "すべて" || card.dataset.category === activeCategory;
      const matches = !q || (card.dataset.search || "").includes(q);
      const visible = inCategory && matches;
      card.hidden = !visible;
      if (visible) {
        count++;
        applyHighlight(card.querySelector(".term-name"), q);
        applyHighlight(card.querySelector(".term-short"), q);
      }
    });

    // カードが1枚も表示されないカテゴリ見出しは隠す
    sections.forEach((section) => {
      const hasVisible = section.querySelector(".term-card:not([hidden])") !== null;
      section.hidden = !hasVisible;
    });

    // 検索・絞り込み中はピックアップを隠してリストに集中させる
    if (pickupEl) pickupEl.hidden = !!q || activeCategory !== "すべて";

    countEl.textContent = count + "件の用語";
    noResultEl.hidden = count !== 0;
  }
})();
