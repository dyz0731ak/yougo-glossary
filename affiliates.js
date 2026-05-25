// 証券会社アフィリエイトのデータと、用語ごとの推奨マッピング。
// build.mjs から require/import して各用語ページに「証券会社カード」を生成する。

const AFFILIATES = {
  monex: {
    name: "マネックス証券",
    href: "https://h.accesstrade.net/sp/cc?rk=010072vk00ntar",
    tracker: "https://h.accesstrade.net/sp/rr?rk=010072vk00ntar",
    strength: "米国株の取扱銘柄数が業界最多級。米国株のスクリーニングや銘柄分析ツールが充実。",
    cta: "マネックス証券で無料口座開設",
  },
  moomoo: {
    name: "moomoo証券",
    href: "https://h.accesstrade.net/sp/cc?rk=0100pd0z00ntar",
    tracker: "https://h.accesstrade.net/sp/rr?rk=0100pd0z00ntar",
    strength: "板情報・気配値がリアルタイムで無料。日米株のチャート・分析ツールが高機能。",
    cta: "moomoo証券を無料でダウンロード",
  },
  matsui: {
    name: "松井証券",
    href: "https://h.accesstrade.net/sp/cc?rk=01000t2p00ntar",
    tracker: "https://h.accesstrade.net/sp/rr?rk=01000t2p00ntar",
    strength: "1日の約定代金50万円までなら日本株の売買手数料が無料。創業100年超の老舗で安心感も高い。",
    cta: "松井証券で無料口座開設",
  },
  rakuten: {
    name: "楽天証券",
    href: "https://ad2.trafficgate.net/t/r/1231/738/312248_389754",
    tracker: null,
    strength: "楽天ポイントが貯まる・使える。NISAやつみたて投資に強く、初心者向けの使いやすいUI。",
    cta: "楽天証券で無料口座開設",
  },
  sbi: {
    name: "SBI証券",
    href: "https://ad2.trafficgate.net/t/r/10/1025/312248_389754",
    tracker: null,
    strength: "口座開設数No.1の総合力。取扱商品が業界最大級で、IPO投資や米国株まで幅広くカバー。",
    cta: "SBI証券で無料口座開設",
  },
};

// オーディエンス別の推奨ペア（2社）と、リード文。
const AUDIENCE_PROFILES = {
  us: {
    brokers: ["monex", "moomoo"],
    lead: (term) =>
      `「${term}」は米国株を見るうえで頻繁に出てくる用語です。実際に米国株を取引・分析するなら、米国株の取扱銘柄数とツールが強い以下の証券会社がよく選ばれています。`,
  },
  technical: {
    brokers: ["moomoo", "sbi"],
    lead: (term) =>
      `「${term}」はチャート分析で頻繁に使う指標・概念です。実際にチャートを見ながら使うなら、ツールや板情報が充実した以下の証券会社が便利です。`,
  },
  dividend: {
    brokers: ["rakuten", "sbi"],
    lead: (term) =>
      `「${term}」は配当や株主還元に関わる用語です。配当や優待を効率よく受け取るなら、ポイント還元やキャンペーンが豊富な以下の証券会社がお得です。`,
  },
  beginner: {
    brokers: ["rakuten", "matsui"],
    lead: (term) =>
      `「${term}」は投資を始めるうえで押さえておきたい基本のひとつです。これから口座を開設するなら、初心者に使いやすいUIと手数料のやさしさで定評のある以下の証券会社がおすすめです。`,
  },
  general: {
    brokers: ["sbi", "rakuten"],
    lead: (term) =>
      `「${term}」を実際に活かすには証券口座が必要です。長く付き合うことになるので、口座開設数・取扱商品ともに定番の以下の証券会社から選ぶのが無難です。`,
  },
};

// 用語IDごとのオーディエンス（個別指定があるものだけ）。
// 指定が無いものはカテゴリで決まる（CATEGORY_AUDIENCE）。
const TERM_AUDIENCE = {
  // 米国株・海外指標
  dow: "us",
  sp500: "us",
  vix: "us",

  // テクニカル分析
  ita: "technical",
  rosokuashi: "technical",
  "idou-heikin": "technical",
  "golden-cross": "technical",
  "dead-cross": "technical",
  dekidaka: "technical",
  trend: "technical",
  "junbari-gyakubari": "technical",
  "stop-daka": "technical",

  // 配当・優待
  haito: "dividend",
  "haito-rimawari": "dividend",
  "income-gain": "dividend",
  "kabunushi-yutai": "dividend",

  // 投信・初心者向け商品
  toushin: "beginner",
  etf: "beginner",
  reit: "beginner",
  "index-fund": "beginner",
  "dollar-cost": "beginner",
  bunsan: "beginner",
  fukuri: "beginner",
  "tangen-miman": "beginner",
  nisa: "beginner",
  ideco: "beginner",
  "tokutei-kouza": "beginner",
};

// カテゴリ単位のフォールバック。
const CATEGORY_AUDIENCE = {
  基礎知識: "beginner",
  投資指標: "general",
  テクニカル分析: "technical",
  "経済・市場": "us",
  "投資信託・商品": "beginner",
  "取引・注文": "technical",
  "制度・税制": "beginner",
  相場格言: "general",
};

// 用語のオーディエンスを決定する。
function audienceFor(term) {
  return (
    TERM_AUDIENCE[term.id] ||
    CATEGORY_AUDIENCE[term.category] ||
    "general"
  );
}

// 用語に対する {lead, brokers[]} を返す。
function selectAffiliates(term) {
  const audience = audienceFor(term);
  const profile = AUDIENCE_PROFILES[audience];
  return {
    audience,
    lead: profile.lead(term.term),
    brokers: profile.brokers.map((id) => ({ id, ...AFFILIATES[id] })),
  };
}

// Node から require/import で使うのと、ブラウザのscriptタグで読むのと両対応。
if (typeof module !== "undefined") {
  module.exports = { AFFILIATES, AUDIENCE_PROFILES, TERM_AUDIENCE, CATEGORY_AUDIENCE, selectAffiliates };
}
