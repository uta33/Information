# InfoWatch

ITマネージャー向け情報・セキュリティ通知アグリゲーター

RSS / CVE (NVD) / JVN フィードを収集し、スマートフォンへWeb Pushで通知。統合インボックスで一括確認できるPWAアプリ。

## 特徴

- **統合インボックス**: RSS・CVE・JVN を1つの受信トレイに集約（Readwise Reader方式）
- **リーダーモード**: クリーンな記事詳細表示（FeedOwn方式）
- **Web Push通知**: HIGH/CRITICAL アラートをスマホへ即時通知（アプリストア不要）
- **重要度自動判定**: CVSSスコアをもとに CRITICAL / HIGH / MEDIUM / LOW に分類
- **ダークモード**: デフォルトON（目に優しい長時間使用向け）
- **保存機能**: 後で読む記事をブックマーク
- **カテゴリタブ**: セキュリティ / AI / IT / 全般

## クイックスタート（ローカル開発）

```bash
# 1. 環境変数を設定
cp .env.example .env
# .env を編集して VAPID キー等を設定

# 2. 起動
docker compose up

# 3. ブラウザで開く
open http://localhost:5173
```

## VAPID キー生成

```bash
pip install py-vapid
python -c "
from py_vapid import Vapid
v = Vapid()
v.generate_keys()
print('VAPID_PRIVATE_KEY=', v.private_key)
print('VAPID_PUBLIC_KEY=', v.public_key)
"
```

## クラウドへのデプロイ（Railway）

1. [Railway](https://railway.app) でプロジェクト作成
2. GitHub リポジトリを接続
3. PostgreSQL プラグインを追加 → `DATABASE_URL` が自動設定される
4. 環境変数を Railway ダッシュボードで設定:
   - `SECRET_KEY`
   - `VAPID_PRIVATE_KEY`
   - `VAPID_PUBLIC_KEY`
   - `VAPID_SUBSCRIBER_EMAIL`
   - `NVD_API_KEY` (オプション)
5. フロントエンドを別サービスとして追加（`frontend/` ディレクトリ）
6. フロントエンドの環境変数に `VITE_API_BASE=https://your-backend.railway.app` を設定

## スマホでの使い方（PWA）

1. スマホの Chrome/Safari でアプリのURLを開く
2. ブラウザメニュー → 「ホーム画面に追加」
3. アプリとして起動 → 設定 → 「通知を有効にする」

### iOS対応
iOS 16.4以上のSafariでWeb Push対応済み。必ずPWAとしてインストールしてから通知を有効にしてください。

## 情報ソースの追加

設定画面からRSSフィードを追加できます。

| カテゴリ | 推奨ソース |
|---|---|
| AI | `https://www.anthropic.com/rss.xml` |
| AI | `https://openai.com/news/rss.xml` |
| Security | `https://feeds.feedburner.com/TheHackersNews` |
| Security | `https://www.bleepingcomputer.com/feed/` |
| IT | `https://feeds.feedburner.com/TechCrunch` |
| JVN | 設定不要（自動取得: jvndb.jvn.jp） |
| CVE | 設定不要（自動取得: NVD API v2） |

## アーキテクチャ

```
RSS / CVE NVD / JVN
        ↓ APScheduler（15〜60分ごと）
  FastAPI Backend
  - 重複排除（SHA-256ハッシュ）
  - CVSS重要度スコアリング
  - PostgreSQL保存
  - VAPID Web Push送信
        ↓ HTTPS
  React PWA（モバイルファースト）
  - ダッシュボード（集計カード）
  - 受信トレイ（タブフィルタ）
  - リーダーモード（記事詳細）
  - Service Worker（プッシュ受信）
```

## 技術スタック

| レイヤー | 技術 |
|---|---|
| Backend | Python 3.12 + FastAPI |
| DB | PostgreSQL (SQLAlchemy async) |
| スケジューラ | APScheduler |
| Push通知 | Web Push VAPID (pywebpush) |
| Frontend | React 18 + Vite + TypeScript |
| UI | Tailwind CSS v3 |
| データ取得 | TanStack Query |
| PWA | vite-plugin-pwa + Service Worker |
