# 開発環境セットアップガイド

他のPCにcloneして開発を続けるための手順です。

## 前提条件

- Node.js 18以上
- npm
- Git
- Expo Go アプリ（iOS/Android実機）
- Cloudflare アカウント（API変更時のみ）

## 1. リポジトリのクローン

```bash
git clone git@github.com:ikdmtm/mognator3.git
cd mognator3
```

## 2. devブランチに切り替え

```bash
git checkout dev
```

## 3. モバイルアプリのセットアップ

```bash
cd apps/mobile
npm install
```

### 起動

```bash
npx expo start
```

Expo GoアプリでQRコードをスキャンして実機で確認できます。

## 4. API（Cloudflare Workers）のセットアップ

**注: APIを変更する場合のみ必要です。モバイルアプリの開発のみなら不要。**

### 4.1 Wrangler CLIのインストール

```bash
npm install -g wrangler
```

### 4.2 Cloudflareにログイン

```bash
wrangler login
```

ブラウザが開くので、Cloudflareアカウントで認証します。

### 4.3 依存関係のインストール

```bash
cd apps/api
npm install
```

### 4.4 APIキーの設定（初回のみ）

Google Places APIキーを設定します。

```bash
wrangler secret put GOOGLE_PLACES_API_KEY
# プロンプトでAPIキーを入力
```

**注: APIキーはすでに本番環境に設定済みです。新しいPCでデプロイする場合のみ必要。**

### 4.5 ローカルでのテスト（オプション）

```bash
# ローカル開発用の環境変数ファイルを作成
cp .dev.vars.example .dev.vars
# .dev.vars を編集してAPIキーを設定

# ローカルでWorkerを起動
npm run dev
```

### 4.6 本番へのデプロイ

```bash
npm run deploy
```

## プロジェクト構成

```
mognator3/
├── apps/
│   ├── mobile/          # Expo モバイルアプリ
│   │   ├── src/
│   │   │   ├── screens/      # 画面コンポーネント
│   │   │   ├── components/   # 共通コンポーネント
│   │   │   └── core/         # ビジネスロジック
│   │   │       ├── services/ # サービス層
│   │   │       ├── data/     # シードデータ
│   │   │       └── types/    # 型定義
│   │   └── docs/             # ドキュメント
│   │
│   └── api/             # Cloudflare Workers API
│       └── src/
│           └── index.ts      # APIエンドポイント
│
└── SETUP.md             # このファイル
```

## よく使うコマンド

### モバイルアプリ

```bash
cd apps/mobile

# 開発サーバー起動
npx expo start

# キャッシュクリアして起動
npx expo start -c

# iOSシミュレータで起動
npx expo start --ios

# Androidエミュレータで起動
npx expo start --android
```

### API

```bash
cd apps/api

# ローカル開発
npm run dev

# 本番デプロイ
npm run deploy

# ログ確認
npm run tail
```

### Git

```bash
# 最新を取得
git pull origin dev

# 変更をプッシュ
git add .
git commit -m "メッセージ"
git push origin dev
```

## トラブルシューティング

### Expo Goで接続できない

1. PCとスマホが同じWi-Fiに接続されているか確認
2. ファイアウォールでポート8081が開いているか確認
3. `npx expo start --tunnel` でトンネルモードを試す

### API呼び出しでエラー

1. APIのURL設定を確認: `apps/mobile/src/core/services/PlacesService.ts`
2. Workerがデプロイされているか確認: `curl https://mognator-api.mognator.workers.dev/health`

### node_modulesのエラー

```bash
rm -rf node_modules
rm package-lock.json
npm install
```

## 関連ドキュメント

- 仕様書: `apps/mobile/docs/spec.md`
- マイルストーン: `apps/mobile/docs/milestones.md`
- API詳細: `apps/api/README.md`
