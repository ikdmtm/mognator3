# アプリアセット作成ガイド

## 必要なアセット

### 1. アプリアイコン (icon.png)
- **サイズ**: 1024x1024px
- **フォーマット**: PNG（透過なし）
- **内容**: モグネイターのロゴ
- **推奨デザイン**:
  - シンプルで認識しやすいデザイン
  - 背景色: オレンジ系 (#FF6B35 推奨)
  - 中央に「モグ」「食」などの文字、または食べ物アイコン

### 2. スプラッシュスクリーン (splash.png)
- **サイズ**: 2048x2732px (縦長推奨)
- **フォーマット**: PNG
- **内容**: アプリ起動時の画面
- **推奨デザイン**:
  - 背景色: 白 (#FFFFFF)
  - 中央にアプリロゴ
  - 下部に「モグネイター」テキスト

### 3. Adaptive Icon (Android用、将来的に必要)
- **サイズ**: 1024x1024px
- **フォーマット**: PNG（透過あり）
- **内容**: アイコンの前景部分
- **注意**: 中央の安全領域（直径660px）にロゴを配置

## 簡易作成方法

### オンラインツール
1. **Canva** (https://www.canva.com/)
   - テンプレートから作成可能
   - 1024x1024pxのカスタムサイズを選択

2. **Figma** (https://www.figma.com/)
   - プロフェッショナルなデザインツール
   - 無料プランで使用可能

### プレースホルダー作成（開発用）
開発段階では、以下のコマンドでシンプルなプレースホルダーを生成できます：

```bash
# ImageMagick を使用（要インストール）
convert -size 1024x1024 xc:#FF6B35 -gravity center -pointsize 200 -fill white -annotate +0+0 "モグ" icon.png
convert -size 2048x2732 xc:white -gravity center -pointsize 300 -fill #FF6B35 -annotate +0+0 "モグネイター" splash.png
```

## 配置場所

作成したアセットを以下に配置：
```
apps/mobile/assets/
  ├── icon.png (1024x1024)
  ├── splash.png (2048x2732)
  └── adaptive-icon.png (1024x1024, Android用)
```

## 確認事項

- [ ] icon.png を作成
- [ ] splash.png を作成
- [ ] app.json でパスを設定
- [ ] Expo Go で表示確認

## 次のステップ

アセット作成後、`app.json` を更新：
```json
{
  "expo": {
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    }
  }
}
```
