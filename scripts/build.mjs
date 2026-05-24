// 用語ごとの個別HTMLページと sitemap.xml を生成する。
// 実行: `node scripts/build.mjs`（リポジトリルートから）。
// terms.js を読み込み、`<id>/index.html` を全用語分生成する。
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const SITE_URL = "https://yougo.stock-overflow24.com";
const SITE_NAME = "やさしい投資用語辞典";
const GA_VERIFICATION = "2lz7uCWIvf35c3KplsG0EgFgGOry0o3MfbD-lMHtYIg";
const ADSENSE_CLIENT = "ca-pub-8504127793204920";

// --- terms.js を読み込んで TERMS 配列を取り出す ---
const termsSrc = readFileSync(join(ROOT, "terms.js"), "utf8");
const TERMS = new Function(termsSrc + "; return TERMS;")();

const DIFF_CLASS = { 初級: "beginner", 中級: "intermediate", 上級: "advanced" };

const termById = Object.fromEntries(TERMS.map((t) => [t.id, t]));

// --- HTMLエスケープ ---
const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// --- 用語1個分のHTMLを生成 ---
function renderTermPage(t) {
  const related = (t.related || [])
    .map((id) => termById[id])
    .filter(Boolean);

  const pageTitle = `${t.term}とは？意味と使い方をやさしく解説 | ${SITE_NAME}`;
  const descMeta = `${t.short} ${t.term}の意味を投資初心者にもわかる言葉で解説します。`.slice(0, 160);

  const fullNameHtml = t.fullName
    ? `<p class="term-fullname-large">正式名称：${esc(t.fullName)}</p>`
    : "";

  const relatedHtml = related.length
    ? `
        <section class="related-terms">
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

  return `<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${esc(pageTitle)}</title>
    <meta name="description" content="${esc(descMeta)}" />

    <link rel="canonical" href="${SITE_URL}/${t.id}/" />

    <meta property="og:type" content="article" />
    <meta property="og:title" content="${esc(t.term + "とは | " + SITE_NAME)}" />
    <meta property="og:description" content="${esc(t.short)}" />
    <meta property="og:url" content="${SITE_URL}/${t.id}/" />
    <meta property="og:site_name" content="${esc(SITE_NAME)}" />

    <meta name="google-site-verification" content="${GA_VERIFICATION}" />

    <!-- Google AdSense -->
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}" crossorigin="anonymous"></script>

    <script type="application/ld+json">
${JSON.stringify(jsonLd, null, 2)}
    </script>
    <script type="application/ld+json">
${JSON.stringify(breadcrumbLd, null, 2)}
    </script>

    <link rel="stylesheet" href="/style.css" />
  </head>
  <body class="page-term">
    <header class="site-header site-header-compact">
      <div class="header-inner">
        <a href="/" class="site-title-link">
          <span class="site-title-small">${esc(SITE_NAME)}</span>
        </a>
      </div>
    </header>

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

        <section class="term-summary">
          <h2>ひとことで言うと</h2>
          <p class="term-short-large">${esc(t.short)}</p>
        </section>

        <section class="term-description-section">
          <h2>解説</h2>
          <p class="term-description-large">${esc(t.description)}</p>
        </section>
${relatedHtml}

        <nav class="bottom-nav">
          <a href="/" class="back-link">← 用語一覧に戻る</a>
        </nav>
      </article>
    </main>

    <footer class="site-footer">
      <p>${esc(SITE_NAME)} — 投資初心者のための用語解説サイト</p>
      <p class="disclaimer">※本サイトは用語解説を目的としたもので、特定の銘柄や投資の推奨を行うものではありません。</p>
    </footer>
  </body>
</html>
`;
}

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

writeFileSync(join(ROOT, "sitemap.xml"), renderSitemap(), "utf8");

console.log(`✓ Generated ${count} term pages`);
console.log(`✓ Regenerated sitemap.xml with ${TERMS.length + 1} URLs`);
