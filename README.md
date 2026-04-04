# InfoWatch

ITマネージャー向け情報・セキュリティ通知アグリゲーター

**GitHub Actions** が RSS / CVE (NVD) / JVN を自動収集し、**GitHub Pages** でモバイルファーストなPWAとして配信。サーバー不要・完全無料。

## 仕組み

```
GitHub Actions（毎時0分 自動実行）
  ↓ scripts/collect.py
  RSS / CVE(NVD) / JVN を収集・重複排除
  ↓
frontend/public/data/
  ├ notifications.json  （最新500件）
  ├ summary.json        （集計）
  └ sources.json        ← ユーザーが編集する設定ファイル
  ↓ git commit & push
GitHub Pages（静的配信）
  ↓ React PWA
  スマホにインストールして使う
```

## セットアップ手順

### 1. リポジトリの設定

1. このリポジトリをフォーク or クローン
2. GitHub リポジトリの **Settings → Pages** を開く
3. Source を `GitHub Actions` に設定
4. ブランチを `main` に設定

### 2. Actions の有効化

1. **Actions** タブを開く
2. ワークフローを有効化
3. `Collect` ワークフローを手動実行（`Run workflow`）して動作確認

### 3. シークレットの設定（任意）

| シークレット名 | 説明 |
|---|---|
| `NVD_API_KEY` | NVD APIキー（なくても動くが取得推奨）。[こちらで取得](https://nvd.nist.gov/developers/request-an-api-key) |

### 4. GitHub Pages の確認

デプロイ後に `https://<ユーザー名>.github.io/<リポジトリ名>/` でアクセス。

## スマホでの使い方（PWA）

1. スマホの Chrome（Android）または Safari（iOS）でアプリのURLを開く
2. ブラウザのメニュー → **「ホーム画面に追加」**
3. アプリとして起動 → 設定 → **「通知を有効にする」**

### iOS（Safari）
- iOS 16.4以上が必要
- PWAとしてインストール後に通知を許可してください

## 情報ソースのカスタマイズ

`frontend/public/data/sources.json` を編集してコミットするだけ。

```json
[
  {
    "name": "自社セキュリティブログ",
    "url": "https://example.com/rss.xml",
    "type": "rss",
    "category": "security",
    "enabled": true
  }
]
```

| `type` | 説明 |
|---|---|
| `rss` | RSS / Atom フィード全般 |
| `cve` | NVD CVE API（`url` は無視、自動取得） |
| `jvn` | JVN RDFフィード（`url` は省略可） |

| `category` | 表示場所 |
|---|---|
| `security` | 🔐 セキュリティタブ |
| `ai` | 🤖 AI動向タブ |
| `it` | 📰 IT全般タブ |
| `general` | その他 |

## ローカルでの開発・テスト

```bash
# Pythonコレクターを手動実行
pip install -r scripts/requirements.txt
python scripts/collect.py
# → frontend/public/data/notifications.json が更新される

# フロントエンド開発サーバー起動
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

## ファイル構成

```
.github/
  workflows/
    collect.yml     ← 毎時データ収集（メイン処理）
    deploy.yml      ← GitHub Pages デプロイ
scripts/
  collect.py        ← RSS/CVE/JVN 収集スクリプト
  requirements.txt  ← feedparser, httpx のみ
  generate_icons.py ← アイコン生成（初回セットアップ用）
frontend/
  public/
    data/
      sources.json        ← 編集してソースを追加/削除
      notifications.json  ← 自動生成
      summary.json        ← 自動生成
    icons/
      192.png, 512.png    ← PWAアイコン
  src/                    ← React アプリ
backend/               ← サーバー版へ移行する場合の参考用
```

## 制限事項

| 機能 | 対応 |
|---|---|
| データ表示 | ✅ リアルタイム（最新1時間以内） |
| 既読・保存 | ✅（localStorageに保存） |
| PWAインストール | ✅ |
| ブラウザ通知 | ✅ （アプリを開いた時のみ） |
| バックグラウンドプッシュ通知 | ❌ サーバーが必要（[backend/](backend/)参照） |
| 複数デバイスでの同期 | ❌ 各デバイス独立（localStorageのため） |
