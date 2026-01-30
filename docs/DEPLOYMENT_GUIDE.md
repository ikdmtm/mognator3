# iOSデプロイガイド

## 前提条件

- ✅ アプリアイコンとスプラッシュスクリーンの作成
- ✅ app.json の設定完了
- ✅ EAS CLI のインストール
- ✅ eas.json の作成

## 次のステップ

### ステップ1: プライバシーポリシーとサポートページのホスティング

App Store提出には、**プライバシーポリシーURL**と**サポートURL**（オプションだが推奨）が必要です。

#### オプション1: GitHub Pages（無料・推奨）

1. GitHubリポジトリの Settings → Pages を開く
2. Source を `main` ブランチの `/docs` フォルダに設定
3. 以下のURLが利用可能になります：
   - プライバシーポリシー: `https://[username].github.io/[repo]/PRIVACY_POLICY`
   - サポート: `https://[username].github.io/[repo]/SUPPORT`

#### オプション2: Vercel/Netlify（無料）

1. `docs/` フォルダを別リポジトリに配置
2. Vercel または Netlify にデプロイ
3. カスタムドメインの設定も可能

#### 必要な修正

プライバシーポリシーとサポートページの以下を実際の値に置き換えてください：

- `privacy@mognator.example.com` → 実際のメールアドレス
- `support@mognator.example.com` → 実際のメールアドレス
- `https://mognator.example.com/privacy` → 実際のURL
- `https://mognator.example.com/support` → 実際のURL

### ステップ2: Apple Developer アカウント

#### 登録（未登録の場合）

1. https://developer.apple.com/ にアクセス
2. Apple Developer Program に登録（年間 ¥12,980）
3. 登録完了まで24-48時間かかる場合があります

#### 確認事項

- Apple ID
- 支払い方法の登録
- 2ファクタ認証の有効化

### ステップ3: EAS アカウント作成とログイン

```bash
cd /home/ikdmtm/app/mognator3/apps/mobile

# Expoアカウントにログイン（未登録の場合は作成）
eas login

# プロジェクトの設定
eas build:configure
```

### ステップ4: iOS証明書の設定

EASが自動的に証明書を管理してくれます：

```bash
# 初回ビルド時に証明書を自動生成
# Apple Developer アカウント情報を入力
```

### ステップ5: テストビルド (Preview)

まずは内部テスト用のビルドを作成：

```bash
# Previewビルド（TestFlight用）
eas build --platform ios --profile preview

# ビルド完了まで15-30分かかります
# 完了後、.ipaファイルがダウンロード可能になります
```

### ステップ6: TestFlight での内部テスト

1. App Store Connect (https://appstoreconnect.apple.com/) にログイン
2. 「マイApp」→「+」→「新規App」
3. アプリ情報を入力：
   - **名前**: モグネイター
   - **プラットフォーム**: iOS
   - **プライマリ言語**: 日本語
   - **バンドルID**: com.mognator.mobile
   - **SKU**: mognator-mobile-001
4. TestFlight タブ → ビルドをアップロード
5. 内部テスターを招待してテスト

### ステップ7: 本番ビルド (Production)

テストが完了したら本番ビルドを作成：

```bash
# Productionビルド
eas build --platform ios --profile production

# 自動的にビルド番号がインクリメントされます
```

### ステップ8: App Store提出準備

#### App Store Connect での設定

1. アプリ情報
   - **カテゴリ**: フード＆ドリンク
   - **サブカテゴリ**: レストラン
   - **コンテンツレーティング**: 4+

2. プライバシー情報
   - **位置情報を収集**: はい
   - **使用目的**: 近くの飲食店検索
   - **プライバシーポリシーURL**: [実際のURL]

3. App情報
   - **説明**: 「AIが最適な飲食店を提案。質問に答えるだけで、今の気分にぴったりな店舗が見つかります。独自のスコアリングアルゴリズムで、評価・距離・営業状況などから最適な店舗をランキング。」
   - **キーワード**: レストラン,飲食店,グルメ,検索,AI,おすすめ
   - **サポートURL**: [実際のURL]
   - **マーケティングURL**: (オプション)

4. スクリーンショット（必須）
   - 6.7インチ (iPhone 15 Pro Max): 5枚
   - 5.5インチ (iPhone 8 Plus): 5枚

#### スクリーンショット作成

実機またはシミュレーターでアプリを起動し、以下の画面をキャプチャ：

1. ホーム画面
2. 質問画面
3. 結果画面（ジャンル提案）
4. 店舗リスト
5. 店舗詳細

```bash
# シミュレーターで起動
npx expo run:ios

# Cmd + S でスクリーンショット
```

### ステップ9: App Store提出

1. App Store Connect で「審査に提出」をクリック
2. 輸出コンプライアンス: 「いいえ」を選択（暗号化を使用していないため）
3. 広告識別子: 「いいえ」を選択
4. 提出

#### 審査期間

- 通常1-3日
- 却下された場合は修正して再提出

### ステップ10: リリース

審査が承認されたら：

1. 「自動リリース」または「手動リリース」を選択
2. リリース日時を設定（手動の場合）
3. リリース実行

## チェックリスト

デプロイ前に以下を確認：

### 必須項目
- [ ] プライバシーポリシーURLがホスティング済み
- [ ] サポートURLがホスティング済み
- [ ] Apple Developer アカウント登録済み
- [ ] app.json の bundleIdentifier が正しい
- [ ] アプリアイコンとスプラッシュが設定済み
- [ ] 位置情報パーミッションの説明文が適切

### 推奨項目
- [ ] 実機でテスト済み
- [ ] TestFlight で内部テスト実施
- [ ] スクリーンショット5枚準備
- [ ] App説明文を日本語と英語で用意
- [ ] キーワード選定完了

### オプション
- [ ] カスタムドメインの取得
- [ ] マーケティングウェブサイトの作成
- [ ] プレスリリースの準備

## トラブルシューティング

### ビルドが失敗する

```bash
# キャッシュをクリア
eas build:cancel
rm -rf node_modules
npm install
eas build --platform ios --profile preview --clear-cache
```

### 証明書エラー

```bash
# 証明書を再生成
eas credentials
# iOS → Distribution Certificate → Remove → Create new
```

### App Store 却下の一般的な理由

1. **プライバシーポリシー不備**: URLが動作しない、内容が不十分
2. **位置情報の説明不足**: infoPlist の説明文が不明確
3. **クラッシュ**: 審査中にアプリがクラッシュ
4. **不完全な機能**: ダミーデータや未実装機能がある

### サポート

問題が解決しない場合：
- Expo Forums: https://forums.expo.dev/
- EAS Build Docs: https://docs.expo.dev/build/introduction/
- Apple Developer Support: https://developer.apple.com/support/

## 更新のワークフロー

バージョン更新時：

1. `app.json` の `version` を更新（例: 1.0.0 → 1.1.0）
2. 変更内容を記録
3. ビルドを実行
4. TestFlight でテスト
5. App Store Connect で「新しいバージョン」を作成
6. 更新内容を記入して提出

```bash
# 更新ビルド
eas build --platform ios --profile production --auto-submit
```

## コスト概算

- Apple Developer Program: ¥12,980/年
- EAS Build: 無料プランで月10ビルドまで
- ホスティング（GitHub Pages）: 無料
- カスタムドメイン（オプション）: ¥1,000-3,000/年

---

**次のアクション**: プライバシーポリシーとサポートページをホスティングして、実際のURLを取得してください。
