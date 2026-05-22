(function () {
  "use strict";

  const listEl = document.getElementById("term-list");
  const searchEl = document.getElementById("search-input");
  const filtersEl = document.getElementById("category-filters");
  const countEl = document.getElementById("result-count");
  const noResultEl = document.getElementById("no-result");

  const CATEGORIES = [
    "すべて",
    "基礎知識",
    "投資指標",
    "テクニカル分析",
    "経済・市場",
    "投資信託・商品",
    "取引・注文",
    "制度・税制",
    "相場格言",
  ];
  const DIFF_CLASS = { 初級: "beginner", 中級: "intermediate", 上級: "advanced" };
  const PICKUP_IDS = [
    "per",
    "haito-rimawari",
    "nisa",
    "golden-cross",
    "nikkei",
    "index-fund",
    "fukuri",
    "tamago-kago",
  ];

  const termById = {};
  TERMS.forEach((t) => (termById[t.id] = t));

  let activeCategory = "すべて";
  let query = "";
  const openIds = new Set();

  // ----- カテゴリ絞り込みチップ -----
  CATEGORIES.forEach((cat) => {
    const chip = document.createElement("button");
    chip.className = "filter-chip" + (cat === activeCategory ? " active" : "");
    chip.textContent = cat;
    chip.addEventListener("click", () => {
      activeCategory = cat;
      filtersEl
        .querySelectorAll(".filter-chip")
        .forEach((c) => c.classList.toggle("active", c.textContent === cat));
      render();
    });
    filtersEl.appendChild(chip);
  });

  // ----- よく見られる用語（ピックアップ） -----
  const pickupEl = document.getElementById("pickup-chips");
  PICKUP_IDS.forEach((id) => {
    const t = termById[id];
    if (!t) return;
    const chip = document.createElement("button");
    chip.className = "pickup-chip";
    chip.textContent = t.term;
    chip.addEventListener("click", () => goToTerm(id));
    pickupEl.appendChild(chip);
  });

  // ----- 検索 -----
  searchEl.addEventListener("input", () => {
    query = searchEl.value;
    render();
  });

  function matchesQuery(t, q) {
    if (!q) return true;
    const hay = [t.term, t.reading, t.fullName, t.short, t.description]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  }

  // 検索語にマッチした部分を <mark> で強調したフラグメントを返す
  function highlight(text, q) {
    const frag = document.createDocumentFragment();
    if (!q) {
      frag.appendChild(document.createTextNode(text));
      return frag;
    }
    const lower = text.toLowerCase();
    let from = 0;
    let idx;
    while ((idx = lower.indexOf(q, from)) !== -1) {
      if (idx > from) {
        frag.appendChild(document.createTextNode(text.slice(from, idx)));
      }
      const mark = document.createElement("mark");
      mark.textContent = text.slice(idx, idx + q.length);
      frag.appendChild(mark);
      from = idx + q.length;
    }
    if (from < text.length) {
      frag.appendChild(document.createTextNode(text.slice(from)));
    }
    return frag;
  }

  function createCard(t, q) {
    const card = document.createElement("article");
    card.className = "term-card";
    card.id = "term-" + t.id;
    const isOpen = openIds.has(t.id);
    if (isOpen) card.classList.add("open");

    // ヘッダー（クリックで開閉）
    const header = document.createElement("button");
    header.className = "term-header";
    header.setAttribute("aria-expanded", String(isOpen));

    const main = document.createElement("div");
    main.className = "term-header-main";

    const titleRow = document.createElement("div");
    titleRow.className = "term-title-row";
    const name = document.createElement("span");
    name.className = "term-name";
    name.appendChild(highlight(t.term, q));
    const reading = document.createElement("span");
    reading.className = "term-reading";
    reading.textContent = t.reading;
    titleRow.append(name, reading);

    const short = document.createElement("p");
    short.className = "term-short";
    short.textContent = t.short;
    main.append(titleRow, short);

    const side = document.createElement("div");
    side.className = "term-side";
    const badges = document.createElement("div");
    badges.className = "badges";
    const catBadge = document.createElement("span");
    catBadge.className = "badge badge-category";
    catBadge.textContent = t.category;
    const diffBadge = document.createElement("span");
    diffBadge.className = "badge badge-difficulty " + DIFF_CLASS[t.difficulty];
    diffBadge.textContent = t.difficulty;
    badges.append(catBadge, diffBadge);
    const toggle = document.createElement("span");
    toggle.className = "toggle-icon";
    toggle.textContent = "+";
    toggle.setAttribute("aria-hidden", "true");
    side.append(badges, toggle);

    header.append(main, side);
    header.addEventListener("click", () => toggleCard(t.id));

    // 詳細
    const detail = document.createElement("div");
    detail.className = "term-detail";
    detail.hidden = !isOpen;

    if (t.fullName) {
      const fullName = document.createElement("p");
      fullName.className = "term-fullname";
      fullName.textContent = "正式名称：" + t.fullName;
      detail.appendChild(fullName);
    }

    const desc = document.createElement("p");
    desc.className = "term-description";
    desc.textContent = t.description;
    detail.appendChild(desc);

    const related = (t.related || []).filter((id) => termById[id]);
    if (related.length) {
      const block = document.createElement("div");
      block.className = "related-block";
      const label = document.createElement("p");
      label.className = "related-label";
      label.textContent = "関連用語";
      const links = document.createElement("div");
      links.className = "related-links";
      related.forEach((id) => {
        const link = document.createElement("button");
        link.className = "related-link";
        link.textContent = termById[id].term;
        link.addEventListener("click", () => goToTerm(id));
        links.appendChild(link);
      });
      block.append(label, links);
      detail.appendChild(block);
    }

    card.append(header, detail);
    return card;
  }

  function toggleCard(id) {
    if (openIds.has(id)) openIds.delete(id);
    else openIds.add(id);
    render();
  }

  // 関連用語へジャンプ：絞り込みを解除して対象を開き、その位置までスクロール
  function goToTerm(id) {
    activeCategory = "すべて";
    query = "";
    searchEl.value = "";
    filtersEl
      .querySelectorAll(".filter-chip")
      .forEach((c) => c.classList.toggle("active", c.textContent === "すべて"));
    openIds.add(id);
    render();

    const card = document.getElementById("term-" + id);
    if (!card) return;
    card.scrollIntoView({ behavior: "smooth", block: "center" });
    card.classList.add("flash");
    card.addEventListener(
      "animationend",
      () => card.classList.remove("flash"),
      { once: true }
    );
  }

  function render() {
    const q = query.trim().toLowerCase();
    listEl.textContent = "";
    let count = 0;
    TERMS.forEach((t) => {
      if (activeCategory !== "すべて" && t.category !== activeCategory) return;
      if (!matchesQuery(t, q)) return;
      listEl.appendChild(createCard(t, q));
      count++;
    });
    countEl.textContent = count + "件の用語";
    noResultEl.hidden = count !== 0;
  }

  render();
})();
