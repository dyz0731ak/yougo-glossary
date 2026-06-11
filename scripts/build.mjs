// 用語ごとの個別HTMLページ・トップページ・固定ページ・sitemap.xml を生成する。
// 実行: `node scripts/build.mjs`（リポジトリルートから）。
// terms.js（用語データ）と content.js（具体例・ポイント・FAQ）をマージして全ページを焼き込む。
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const SITE_URL = "https://yougo.stock-overflow24.com";
const SITE_NAME = "やさしい投資用語辞典";
const GA_VERIFICATION = "2lz7uCWIvf35c3KplsG0EgFgGOry0o3MfbD-lMHtYIg";
const ADSENSE_CLIENT = "ca-pub-8504127793204920";
const CONTACT_EMAIL = "info@stock-overflow24.com";

// --- terms.js / content.js / affiliates.js を読み込む ---
const termsSrc = readFileSync(join(ROOT, "terms.js"), "utf8");
const TERMS = new Function(termsSrc + "; return TERMS;")();

const contentSrc = readFileSync(join(ROOT, "content.js"), "utf8");
const { TERM_CONTENT } = new Function(
  "module",
  contentSrc + "; return module.exports;"
)({ exports: {} });

const affSrc = readFileSync(join(ROOT, "affiliates.js"), "utf8");
const { selectAffiliates } = new Function(
  "module",
  affSrc + "; return module.exports;"
)({ exports: {} });

const DIFF_CLASS = { 初級: "beginner", 中級: "intermediate", 上級: "advanced" };

const CATEGORIES = [
  "基礎知識",
  "投資指標",
  "テクニカル分析",
  "経済・市場",
  "投資信託・商品",
  "取引・注文",
  "制度・税制",
  "相場格言",
];

const CATEGORY_DESC = {
  基礎知識: "株式・配当・優待など、まず最初に知っておきたい基本の用語",
  投資指標: "PER・PBR・ROEなど、割安さや収益力を測るモノサシ",
  テクニカル分析: "チャートの形から売買タイミングを読む分析手法の用語",
  "経済・市場": "金利・物価・株価指数など、相場全体を動かす経済の用語",
  "投資信託・商品": "投資信託・ETF・債券など、金融商品にまつわる用語",
  "取引・注文": "注文方法や売買の実務、損切り・利確などの取引用語",
  "制度・税制": "NISA・iDeCo・特定口座など、制度と税金の用語",
  相場格言: "先人の知恵が詰まった、相場の世界の有名な格言",
};

const PICKUP_IDS = [
  "nisa",
  "per",
  "orukan",
  "sonkiri",
  "haito-rimawari",
  "index-fund",
  "fukuri",
  "golden-cross",
];

const termById = Object.fromEntries(TERMS.map((t) => [t.id, t]));

// --- HTMLエスケープ ---
const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// --- 共通 <head> ---
function headHtml({ title, description, path, ogType = "article", extraLd = [] }) {
  const ldBlocks = extraLd
    .map(
      (ld) => `    <script type="application/ld+json">
${JSON.stringify(ld, null, 2)}
    </script>`
    )
    .join("\n");
  return `    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}" />

    <link rel="canonical" href="${SITE_URL}${path}" />

    <meta property="og:type" content="${ogType}" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:url" content="${SITE_URL}${path}" />
    <meta property="og:site_name" content="${esc(SITE_NAME)}" />
    <meta property="og:locale" content="ja_JP" />
    <meta name="twitter:card" content="summary" />
    <meta name="theme-color" content="#1a2b4a" />

    <meta name="google-site-verification" content="${GA_VERIFICATION}" />

    <!-- Google AdSense -->
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}" crossorigin="anonymous"></script>

${ldBlocks}

    <link rel="stylesheet" href="/style.css" />`;
}

// --- 共通フッター ---
function footerHtml({ sisterLead } = {}) {
  const sister = sisterLead
    ? `      <p class="sister-site">
        📊 ${sisterLead}
        <a href="https://dashboard.stock-overflow24.com/" rel="noopener">『投資の砦』</a>
        へ。日本株・米国株を一画面で確認できます。
      </p>\n`
    : "";
  return `    <footer class="site-footer">
${sister}      <nav class="footer-nav" aria-label="サイト情報">
        <a href="/">用語一覧</a>
        <a href="/about/">運営者情報</a>
        <a href="/privacy/">プライバシーポリシー</a>
        <a href="/contact/">お問い合わせ</a>
      </nav>
      <p class="footer-family">
        姉妹サイト：<a href="https://stock-overflow24.com/" rel="noopener">投資の名著レビュー</a> ／
        <a href="https://dashboard.stock-overflow24.com/" rel="noopener">投資の砦（市況ダッシュボード）</a>
      </p>
      <p>${esc(SITE_NAME)} — 投資初心者のための用語解説サイト</p>
      <p class="disclaimer">※本サイトは用語解説を目的としたもので、特定の銘柄や投資の推奨を行うものではありません。投資の最終判断はご自身の責任でお願いします。</p>
    </footer>`;
}

// --- コンパクトヘッダー（下層ページ用） ---
const compactHeader = `    <header class="site-header site-header-compact">
      <div class="header-inner">
        <a href="/" class="site-title-link">
          <span class="site-title-small">${esc(SITE_NAME)}</span>
        </a>
      </div>
    </header>`;

// --- 用語1個分のHTMLを生成 ---
function renderTermPage(t) {
  const c = TERM_CONTENT[t.id] || {};
  const related = (t.related || []).map((id) => termById[id]).filter(Boolean);

  const pageTitle = `${t.term}とは？意味と使い方をやさしく解説 | ${SITE_NAME}`;
  const descMeta = `${t.short} ${t.term}の意味を具体例とよくある質問つきで、投資初心者にもわかる言葉で解説します。`.slice(0, 160);

  const fullNameHtml = t.fullName
    ? `<p class="term-fullname-large">正式名称：${esc(t.fullName)}</p>`
    : "";

  // --- 目次（ページ内リンク） ---
  const tocItems = [
    ["summary", "ひとことで言うと"],
    ["kaisetsu", "解説"],
    ...(c.example ? [["example", "具体例で理解する"]] : []),
    ...(c.points?.length ? [["points", "押さえておきたいポイント"]] : []),
    ...(c.faq?.length ? [["faq", "よくある質問"]] : []),
    ...(related.length ? [["related", "関連する用語"]] : []),
  ];
  const tocHtml = `
        <nav class="term-toc" aria-label="目次">
          <p class="term-toc-label">目次</p>
          <ol>
${tocItems.map(([id, label]) => `            <li><a href="#${id}">${esc(label)}</a></li>`).join("\n")}
          </ol>
        </nav>`;

  // --- 具体例 ---
  const exampleHtml = c.example
    ? `
        <section class="term-example" id="example">
          <h2>具体例で理解する</h2>
          <p>${esc(c.example)}</p>
        </section>`
    : "";

  // --- ポイント ---
  const pointsHtml = c.points?.length
    ? `
        <section class="term-points" id="points">
          <h2>押さえておきたいポイント</h2>
          <ul class="points-list">
${c.points.map((p) => `            <li>${esc(p)}</li>`).join("\n")}
          </ul>
        </section>`
    : "";

  // --- よくある質問 ---
  const faqHtml = c.faq?.length
    ? `
        <section class="term-faq" id="faq">
          <h2>よくある質問</h2>
${c.faq
  .map(
    (f) => `          <details class="faq-item">
            <summary>${esc(f.q)}</summary>
            <p>${esc(f.a)}</p>
          </details>`
  )
  .join("\n")}
        </section>`
    : "";

  const relatedHtml = related.length
    ? `
        <section class="related-terms" id="related">
          <h2>関連する用語</h2>
          <div class="related-cards">
${related
  .map(
    (r) => `            <a href="/${esc(r.id)}/" class="related-card">
              <span class="related-card-name">${esc(r.term)}</span>
              <span class="related-card-short">${esc(r.short)}</span>
            </a>`
  )
  .join("\n")}
          </div>
        </section>`
    : "";

  // --- アフィリエイト（証券会社）ブロック ---
  const aff = selectAffiliates(t);
  const affiliateHtml = `
        <aside class="affiliate-block" aria-label="関連する証券会社（PR）">
          <p class="affiliate-label">
            <span class="affiliate-tag">PR</span>${esc(t.term)}を活かすための証券会社
          </p>
          <p class="affiliate-lead">${esc(aff.lead)}</p>
          <div class="affiliate-cards">
${aff.brokers
  .map(
    (b) => `            <div class="affiliate-card">
              <div class="affiliate-card-body">
                <h3 class="affiliate-name">${esc(b.name)}</h3>
                <p class="affiliate-strength">${esc(b.strength)}</p>
              </div>
              <a href="${esc(b.href)}" class="affiliate-cta" rel="sponsored nofollow noopener" target="_blank" referrerpolicy="no-referrer-when-downgrade">${esc(b.cta)}</a>${b.tracker ? `\n              <img src="${esc(b.tracker)}" width="1" height="1" alt="" style="border:0;position:absolute;left:-9999px" />` : ""}
            </div>`
  )
  .join("\n")}
          </div>
          <p class="affiliate-note">※当サイトはアフィリエイトプログラムを利用しています。リンク経由でのお申し込みで運営者に紹介料が支払われる場合があります。掲載内容は予告なく変更される場合があります。</p>
        </aside>`;

  // --- 構造化データ ---
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: t.term,
    ...(t.fullName ? { alternateName: t.fullName } : {}),
    description: t.description,
    inDefinedTermSet: `${SITE_URL}/`,
    url: `${SITE_URL}/${t.id}/`,
    termCode: t.id,
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "用語一覧", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: t.category },
      { "@type": "ListItem", position: 3, name: t.term },
    ],
  };

  const extraLd = [jsonLd, breadcrumbLd];
  if (c.faq?.length) {
    extraLd.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: c.faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    });
  }

  return `<!DOCTYPE html>
<html lang="ja">
  <head>
${headHtml({ title: pageTitle, description: descMeta, path: `/${t.id}/`, extraLd })}
  </head>
  <body class="page-term">
${compactHeader}

    <nav class="breadcrumb" aria-label="パンくず">
      <a href="/">用語一覧</a>
      <span class="breadcrumb-sep">›</span>
      <span>${esc(t.category)}</span>
      <span class="breadcrumb-sep">›</span>
      <span class="breadcrumb-current">${esc(t.term)}</span>
    </nav>

    <main class="container term-page">
      <article class="term-detail-page">
        <div class="badges-row">
          <span class="badge badge-category">${esc(t.category)}</span>
          <span class="badge badge-difficulty ${DIFF_CLASS[t.difficulty] || ""}">${esc(t.difficulty)}</span>
        </div>

        <h1 class="term-title">${esc(t.term)}</h1>
        <p class="term-reading-large">${esc(t.reading)}</p>
        ${fullNameHtml}
${tocHtml}

        <section class="term-summary" id="summary">
          <h2>ひとことで言うと</h2>
          <p class="term-short-large">${esc(t.short)}</p>
        </section>

        <section class="term-description-section" id="kaisetsu">
          <h2>解説</h2>
          <p class="term-description-large">${esc(t.description)}</p>
        </section>
${exampleHtml}
${pointsHtml}
${affiliateHtml}
${faqHtml}
${relatedHtml}

        <nav class="bottom-nav">
          <a href="/" class="back-link">← 用語一覧に戻る</a>
        </nav>
      </article>
    </main>

${footerHtml({ sisterLead: `${esc(t.term)}の値動きを実際に見るなら、ストップ高・急騰銘柄をリアルタイム監視できる` })}
  </body>
</html>
`;
}

// --- トップページ（全用語をHTMLに焼き込み＝SSG） ---
function renderIndexPage() {
  const totalCount = TERMS.length;
  const title = `${SITE_NAME}｜株式投資の専門用語${totalCount}語を初心者向けに解説`;
  const description = `PER・NISA・損切り・オルカンなど、株式投資の専門用語${totalCount}語を初心者にもわかる言葉で解説。具体例・よくある質問つきの投資用語辞典です。`;

  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    description,
    inLanguage: "ja",
  };

  const termSetLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    hasDefinedTerm: TERMS.map((t) => ({
      "@type": "DefinedTerm",
      name: t.term,
      url: `${SITE_URL}/${t.id}/`,
    })),
  };

  const filterChips = ["すべて", ...CATEGORIES]
    .map(
      (cat, i) =>
        `          <button class="filter-chip${i === 0 ? " active" : ""}" data-category="${esc(cat)}">${esc(cat)}</button>`
    )
    .join("\n");

  const pickupChips = PICKUP_IDS.map((id) => termById[id])
    .filter(Boolean)
    .map(
      (t) =>
        `          <a class="pickup-chip" href="/${esc(t.id)}/">${esc(t.term)}</a>`
    )
    .join("\n");

  const card = (t) => {
    const haystack = [t.term, t.reading, t.fullName, t.short, t.description]
      .join(" ")
      .toLowerCase();
    return `          <a class="term-card" href="/${esc(t.id)}/" data-category="${esc(t.category)}" data-search="${esc(haystack)}">
            <div class="term-header-main">
              <div class="term-title-row">
                <span class="term-name">${esc(t.term)}</span>
                <span class="term-reading">${esc(t.reading)}</span>
              </div>
              <p class="term-short">${esc(t.short)}</p>
            </div>
            <div class="term-side">
              <div class="badges">
                <span class="badge badge-category">${esc(t.category)}</span>
                <span class="badge badge-difficulty ${DIFF_CLASS[t.difficulty] || ""}">${esc(t.difficulty)}</span>
              </div>
              <span class="card-arrow" aria-hidden="true">→</span>
            </div>
          </a>`;
  };

  const sections = CATEGORIES.map((cat) => {
    const terms = TERMS.filter((t) => t.category === cat);
    if (!terms.length) return "";
    return `      <section class="cat-section" data-category="${esc(cat)}">
        <h2 class="cat-heading">${esc(cat)}<span class="cat-count">${terms.length}語</span></h2>
        <p class="cat-desc">${esc(CATEGORY_DESC[cat] || "")}</p>
        <div class="term-list">
${terms.map(card).join("\n")}
        </div>
      </section>`;
  }).join("\n\n");

  return `<!DOCTYPE html>
<html lang="ja">
  <head>
${headHtml({ title, description, path: "/", ogType: "website", extraLd: [websiteLd, termSetLd] })}
  </head>
  <body>
    <header class="site-header">
      <div class="header-inner">
        <h1 class="site-title">${esc(SITE_NAME)}</h1>
        <p class="site-tagline">
          PER・NISA・損切り・オルカン…株式投資の専門用語${totalCount}語を、初心者にもわかる言葉で解説します。
        </p>
      </div>
    </header>

    <main class="container">
      <section class="controls" aria-label="検索と絞り込み">
        <div class="search-box">
          <span class="search-icon" aria-hidden="true">🔍</span>
          <input
            type="search"
            id="search-input"
            class="search-input"
            placeholder="用語を検索（例：PER、損切り、NISA）"
            autocomplete="off"
          />
        </div>
        <div class="category-filters" id="category-filters" role="group" aria-label="カテゴリで絞り込み">
${filterChips}
        </div>
      </section>

      <section class="pickup" id="pickup" aria-label="よく見られる用語">
        <p class="pickup-label">よく見られる用語</p>
        <div class="pickup-chips" id="pickup-chips">
${pickupChips}
        </div>
      </section>

      <p class="result-count" id="result-count">${totalCount}件の用語</p>

      <div id="term-sections">
${sections}
      </div>

      <p class="no-result" id="no-result" hidden>
        該当する用語が見つかりませんでした。別のキーワードでお試しください。
      </p>
    </main>

${footerHtml({ sisterLead: "ストップ高・急騰銘柄のリアルタイム監視は、無料の市況ダッシュボード" })}

    <script src="/app.js" defer></script>
  </body>
</html>
`;
}

// --- 固定ページ共通レンダラ ---
function renderStaticPage({ path, title, description, heading, bodyHtml }) {
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "用語一覧", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: heading },
    ],
  };
  return `<!DOCTYPE html>
<html lang="ja">
  <head>
${headHtml({ title: `${title} | ${SITE_NAME}`, description, path, extraLd: [breadcrumbLd] })}
  </head>
  <body class="page-term">
${compactHeader}

    <nav class="breadcrumb" aria-label="パンくず">
      <a href="/">用語一覧</a>
      <span class="breadcrumb-sep">›</span>
      <span class="breadcrumb-current">${esc(heading)}</span>
    </nav>

    <main class="container term-page">
      <article class="term-detail-page static-page">
        <h1 class="term-title">${esc(heading)}</h1>
${bodyHtml}
        <nav class="bottom-nav">
          <a href="/" class="back-link">← 用語一覧に戻る</a>
        </nav>
      </article>
    </main>

${footerHtml()}
  </body>
</html>
`;
}

// --- 運営者情報 ---
const aboutBody = `
        <section class="static-section">
          <h2>当サイトについて</h2>
          <p>「${esc(SITE_NAME)}」は、株式投資をこれから始める方・始めたばかりの方に向けて、投資の専門用語を<strong>初心者にもわかる言葉</strong>で解説する用語辞典サイトです。教科書的な定義の説明にとどまらず、「具体例」「押さえておきたいポイント」「よくある質問」まで踏み込み、読んだあとに実際の投資判断で使える知識になることを目指しています。</p>
        </section>
        <section class="static-section">
          <h2>運営者</h2>
          <p>運営：迷える子羊たちの株ノート 編集部</p>
          <p>個人投資家として日本株・米国株・投資信託の運用を実践しながら、投資の名著レビューサイト「<a href="https://stock-overflow24.com/" rel="noopener">迷える子羊たちの株ノート</a>」、市況ダッシュボード「<a href="https://dashboard.stock-overflow24.com/" rel="noopener">投資の砦</a>」、そして当サイトを運営しています。</p>
        </section>
        <section class="static-section">
          <h2>編集方針</h2>
          <ul class="points-list">
            <li>解説はすべてオリジナルで執筆し、制度・税制は公的機関や取引所の一次情報を確認した上で記載します</li>
            <li>専門用語の定義の正確さと、初心者への伝わりやすさの両立を最優先します</li>
            <li>特定の銘柄・商品の購入を推奨することはありません。投資の最終判断はご自身の責任でお願いします</li>
            <li>制度変更などで内容が古くなった場合は、随時更新します</li>
          </ul>
        </section>
        <section class="static-section">
          <h2>広告について</h2>
          <p>当サイトは Google AdSense およびアフィリエイトプログラムを利用しており、広告経由のお申し込みで運営者に報酬が支払われる場合があります。詳細は<a href="/privacy/">プライバシーポリシー</a>をご覧ください。</p>
        </section>`;

// --- プライバシーポリシー ---
const privacyBody = `
        <section class="static-section">
          <h2>個人情報の取り扱いについて</h2>
          <p>当サイト（${esc(SITE_NAME)}）では、お問い合わせの際にメールアドレス等の個人情報をいただく場合があります。取得した個人情報はお問い合わせへの回答にのみ利用し、法令に基づく場合を除き第三者に開示することはありません。</p>
        </section>
        <section class="static-section">
          <h2>広告の配信について（Google AdSense）</h2>
          <p>当サイトは第三者配信の広告サービス「Google AdSense」を利用しています。Googleなどの第三者配信事業者は Cookie を使用し、ユーザーの当サイトや他サイトへの過去のアクセス情報に基づいて広告を配信します。</p>
          <p>パーソナライズ広告に使われる Cookie は、<a href="https://adssettings.google.com/" rel="noopener nofollow" target="_blank">広告設定</a>で無効にできます。詳しくは <a href="https://policies.google.com/technologies/ads?hl=ja" rel="noopener nofollow" target="_blank">Google のポリシーと規約</a>をご確認ください。</p>
        </section>
        <section class="static-section">
          <h2>アフィリエイトプログラムについて</h2>
          <p>当サイトは、アフィリエイトプログラムを利用して商品・サービスを紹介しています。リンク経由でのお申し込み等により、運営者に紹介料が支払われる場合があります。掲載内容（手数料・サービス内容等）は変更される場合がありますので、最新の情報は必ず各公式サイトでご確認ください。</p>
        </section>
        <section class="static-section">
          <h2>アクセス解析について</h2>
          <p>当サイトでは、サイト改善のためにアクセス状況の計測を行う場合があります。計測データは匿名で収集されており、個人を特定するものではありません。</p>
        </section>
        <section class="static-section">
          <h2>免責事項</h2>
          <p>当サイトのコンテンツは、投資用語の解説・情報提供を目的としたものであり、特定の銘柄・金融商品の購入や売却を推奨・勧誘するものではありません。掲載内容の正確性には万全を期していますが、その完全性・正確性・有用性を保証するものではありません。当サイトの情報を利用した投資判断によって生じたいかなる損害についても、運営者は責任を負いかねます。投資の最終決定は、ご自身の判断と責任で行ってください。</p>
        </section>
        <section class="static-section">
          <h2>制定日・改定</h2>
          <p>2026年6月11日 制定。本ポリシーは予告なく改定される場合があります。</p>
        </section>`;

// --- お問い合わせ ---
const contactBody = `
        <section class="static-section">
          <h2>お問い合わせ先</h2>
          <p>当サイトへのご意見・ご質問・誤りのご指摘・掲載に関するご相談は、下記メールアドレスまでお寄せください。</p>
          <p class="contact-email"><a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a></p>
          <p>内容を確認のうえ、必要に応じて数日以内にご返信いたします。お急ぎの場合や行き違いの際はご容赦ください。</p>
        </section>
        <section class="static-section">
          <h2>誤りのご指摘について</h2>
          <p>用語解説の内容に誤りや古くなった情報を見つけられた場合は、該当ページのURLとあわせてご連絡いただけると大変助かります。確認のうえ、速やかに訂正いたします。</p>
        </section>`;

const STATIC_PAGES = [
  {
    dir: "about",
    path: "/about/",
    title: "運営者情報",
    heading: "運営者情報",
    description: `${SITE_NAME}の運営者情報と編集方針のご案内です。`,
    bodyHtml: aboutBody,
  },
  {
    dir: "privacy",
    path: "/privacy/",
    title: "プライバシーポリシー",
    heading: "プライバシーポリシー",
    description: `${SITE_NAME}のプライバシーポリシー・広告配信・免責事項のご案内です。`,
    bodyHtml: privacyBody,
  },
  {
    dir: "contact",
    path: "/contact/",
    title: "お問い合わせ",
    heading: "お問い合わせ",
    description: `${SITE_NAME}へのお問い合わせ方法のご案内です。`,
    bodyHtml: contactBody,
  },
];

// --- sitemap.xml を生成 ---
function renderSitemap() {
  const today = new Date().toISOString().slice(0, 10);
  const urls = [
    { loc: `${SITE_URL}/`, priority: "1.0", changefreq: "weekly" },
    ...TERMS.map((t) => ({
      loc: `${SITE_URL}/${t.id}/`,
      priority: "0.8",
      changefreq: "monthly",
    })),
    ...STATIC_PAGES.map((p) => ({
      loc: `${SITE_URL}${p.path}`,
      priority: "0.3",
      changefreq: "yearly",
    })),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>
`;
}

// --- 実行 ---
let count = 0;
for (const t of TERMS) {
  const dir = join(ROOT, t.id);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), renderTermPage(t), "utf8");
  count++;
}

for (const p of STATIC_PAGES) {
  const dir = join(ROOT, p.dir);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), renderStaticPage(p), "utf8");
}

writeFileSync(join(ROOT, "index.html"), renderIndexPage(), "utf8");
writeFileSync(join(ROOT, "sitemap.xml"), renderSitemap(), "utf8");

console.log(`✓ Generated ${count} term pages`);
console.log(`✓ Generated ${STATIC_PAGES.length} static pages (about / privacy / contact)`);
console.log(`✓ Generated index.html with ${TERMS.length} terms baked in (SSG)`);
console.log(`✓ Regenerated sitemap.xml with ${TERMS.length + STATIC_PAGES.length + 1} URLs`);
