# Food Oracle（仮）— 5択質問で食欲を自己発見するアプリ

## コンセプト
「食べたいものが決まってなくても、質問に答えると今ほしい食が分かる」  
結果として外食ジャンルTop3を提示し、近くの店検索へ導く。学習は端末内のみ。

## 仕様
- 仕様書: docs/spec.md
- マイルストーン: docs/milestones.md
- QAチェック: docs/qa-checklist.md

## 開発環境のセットアップ

### 必要な環境
- Node.js 18以上
- npm または yarn
- Expo Go アプリ（iOS/Android実機でテストする場合）

### インストールと起動

```bash
# 依存関係のインストール
cd apps/mobile
npm install

# 開発サーバーの起動
npx expo start

# または特定のプラットフォームで起動
npx expo start --ios      # iOSシミュレータ
npx expo start --android  # Androidエミュレータ
```

### 実機でのテスト

1. スマートフォンに「Expo Go」アプリをインストール
2. 開発サーバー起動後に表示されるQRコードをスキャン
3. アプリが起動します

## 現在の状態

**M0 (Bootstrap)** - 完了
- ✅ Expo起動
- ✅ 画面遷移（Home/Question/Result/Settings）
- ✅ 基本的なUI実装

次のマイルストーン: **M1 (Question UI)** - 詳細は `docs/milestones.md` を参照
