# やさしい投資用語辞典

株式投資の専門用語を初心者向けにやさしく解説する辞典サイト。

🔗 **公開URL**: https://yougo.stock-overflow24.com/

## 機能

- 用語検索（キーワードでの絞り込み・ハイライト）
- カテゴリ分類（基礎知識・投資指標・テクニカル分析・経済市場・投資信託商品・取引注文・制度税制・相場格言）
- 関連用語リンク
- 難易度表示（初級・中級・上級）
- よく見られる用語のピックアップ表示

## 構成

静的サイト（HTML / CSS / JavaScript、ビルド不要）。

| ファイル | 役割 |
|----------|------|
| `index.html` | メインページ |
| `style.css` | スタイル |
| `terms.js` | 用語データ |
| `app.js` | 検索・絞り込み・表示ロジック |
| `.htaccess` | HTTPS強制リダイレクト（ConoHa WING） |
| `robots.txt` / `sitemap.xml` | SEO |

## ローカルで見る

サーバー不要。`index.html` をブラウザで開くだけで動作する。

## デプロイ

`main` ブランチに push すると GitHub Actions（`.github/workflows/deploy.yml`）が
ConoHa WING へ自動でFTPデプロイする。あわせて GitHub Pages へもミラーされる。

FTPパスワードはリポジトリの Secret `FTP_PASSWORD` に登録する。
