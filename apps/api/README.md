# Mognator API - Cloudflare Workers

Google Places API (New) のプロキシサーバー。モバイルアプリから近くの店舗を検索するために使用します。

## セットアップ手順

### 1. Google Cloud Console でAPIを有効化

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. プロジェクトを作成または選択
3. **APIとサービス** → **ライブラリ** に移動
4. 以下のAPIを有効化：
   - **Places API (New)**
5. **APIとサービス** → **認証情報** に移動
6. **認証情報を作成** → **APIキー** を選択
7. APIキーを作成し、コピー

**重要**: 本番運用時は、APIキーに制限を設定してください：
- **アプリケーションの制限**: HTTP リファラー（Cloudflare Workers のURL）
- **APIの制限**: Places API (New)

### 2. Cloudflare アカウントの準備

1. [Cloudflare](https://dash.cloudflare.com/sign-up) でアカウント作成
2. Cloudflare Workers を有効化（無料プランでOK）

### 3. Wrangler CLI のインストール

```bash
# npm でインストール
npm install -g wrangler

# ログイン
wrangler login
```

### 4. 依存関係のインストール

```bash
cd apps/api
npm install
```

### 5. APIキーの設定

```bash
# Google Places API キーをシークレットとして設定
wrangler secret put GOOGLE_PLACES_API_KEY
# プロンプトが表示されたら、APIキーを入力
```

### 6. デプロイ

```bash
# 本番環境にデプロイ
npm run deploy

# または開発環境にデプロイ
wrangler deploy --env dev
```

デプロイ後、以下のようなURLが表示されます：
```
https://mognator-api.YOUR_SUBDOMAIN.workers.dev
```

### 7. モバイルアプリの設定更新

`apps/mobile/src/core/services/PlacesService.ts` を開き、APIのURLを更新：

```typescript
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:8787'  // ローカル開発
  : 'https://mognator-api.YOUR_SUBDOMAIN.workers.dev';  // ← ここを更新
```

## ローカル開発

```bash
# ローカルでWorkerを起動
npm run dev

# 別ターミナルでテスト
curl "http://localhost:8787/health"
curl "http://localhost:8787/places/search?genre=ramen_iekei&lat=35.6812&lng=139.7671"
```

**注意**: ローカル開発時は、環境変数を `.dev.vars` ファイルで設定：

```bash
# apps/api/.dev.vars を作成
echo "GOOGLE_PLACES_API_KEY=your_api_key_here" > .dev.vars
```

`.dev.vars` は `.gitignore` に追加済みです。

## API エンドポイント

### GET /health
ヘルスチェック

**レスポンス**:
```json
{ "status": "ok" }
```

### GET /places/search
近くの店舗を検索

**パラメータ**:
| 名前 | 必須 | 説明 |
|-----|------|-----|
| genre | ✅ | ジャンルID（例: `ramen_iekei`） |
| lat | ✅ | 緯度 |
| lng | ✅ | 経度 |
| radius | - | 検索半径（メートル、デフォルト: 1500） |

**レスポンス**:
```json
{
  "places": [
    {
      "id": "ChIJ...",
      "displayName": { "text": "家系ラーメン 〇〇", "languageCode": "ja" },
      "formattedAddress": "東京都渋谷区...",
      "rating": 4.2,
      "userRatingCount": 156,
      "priceLevel": "PRICE_LEVEL_MODERATE",
      "location": { "latitude": 35.6812, "longitude": 139.7671 },
      "googleMapsUri": "https://maps.google.com/?cid=...",
      "currentOpeningHours": { "openNow": true },
      "photoUrl": "https://places.googleapis.com/v1/..."
    }
  ]
}
```

## 料金について

### Cloudflare Workers
- 無料枠: **10万リクエスト/日**
- 個人アプリなら無料枠で十分

### Google Places API (New)
- 毎月 **$200 の無料クレジット**
- Nearby Search: $0.032/リクエスト
- Text Search: $0.032/リクエスト
- 無料クレジットで約6,000リクエスト/月

**コスト最適化**:
- クライアント側でキャッシュ
- 検索結果を再利用
- 不要なAPIコールを避ける

## トラブルシューティング

### 「API key not valid」エラー
- Google Cloud Console でAPIキーが正しく作成されているか確認
- Places API (New) が有効になっているか確認
- `wrangler secret put GOOGLE_PLACES_API_KEY` でシークレットを再設定

### 「No places found」
- 検索半径を広げる（radius パラメータ）
- ジャンルIDが正しいか確認
- 位置情報（lat/lng）が正しいか確認

### CORSエラー
- Workerは全てのオリジンを許可しています
- モバイルアプリからのリクエストでCORSエラーは発生しません
