# GitHub Pagesホスティングガイド

## プライベートリポジトリで公開ドキュメントをホスティングする方法

このガイドでは、メインのアプリリポジトリをプライベートに保ちながら、プライバシーポリシーとサポートページだけを公開する方法を説明します。

## 方法1: 別の公開リポジトリを作成（推奨）

### ステップ1: 新しい公開リポジトリを作成

1. GitHubで新しいリポジトリを作成
   - リポジトリ名: `mognator-docs` (または任意の名前)
   - **Public**に設定
   - READMEは不要（後で追加）

### ステップ2: ドキュメントファイルをコピー

```bash
# 新しいリポジトリをクローン
git clone https://github.com/YOUR_USERNAME/mognator-docs.git
cd mognator-docs

# このプロジェクトのdocsフォルダから必要なファイルをコピー
cp /path/to/mognator3/docs/index.html .
cp /path/to/mognator3/docs/privacy.html .
cp /path/to/mognator3/docs/support.html .

# コミット
git add .
git commit -m "Initial commit: Add privacy and support pages"
git push origin main
```

### ステップ3: GitHub Pagesを有効化

1. リポジトリの **Settings** → **Pages** へ移動
2. **Source** で `main` ブランチを選択
3. ルートディレクトリ (`/` または `/root`) を選択
4. **Save** をクリック

数分後、以下のURLで公開されます:
```
https://YOUR_USERNAME.github.io/mognator-docs/
```

### ステップ4: カスタムドメイン（オプション）

独自ドメインを使用する場合:

1. Settings → Pages → Custom domain
2. `mognator.example.com` などを入力
3. DNSレコードを設定:
   ```
   Type: CNAME
   Name: mognator (またはサブドメイン)
   Value: YOUR_USERNAME.github.io
   ```

## 方法2: Vercel / Netlifyを使用（代替案）

GitHub Pagesよりも高機能で、デプロイが簡単です。

### Vercelの場合

1. [Vercel](https://vercel.com)にサインアップ
2. 公開リポジトリ `mognator-docs` を接続
3. 自動デプロイが開始される
4. カスタムドメインを簡単に設定可能

### Netlifyの場合

1. [Netlify](https://netlify.com)にサインアップ
2. **New site from Git** で公開リポジトリを接続
3. 自動デプロイが開始される
4. 無料のHTTPS付きカスタムドメイン

## 方法3: GitHub Pro（有料）

GitHub Proアカウント ($4/月) を使用すれば:
- プライベートリポジトリでもGitHub Pagesを公開可能
- この方法の場合、別リポジトリは不要

## メンテナンス

ドキュメントを更新する際は:

1. メインリポジトリで編集
2. 公開リポジトリにコピー:
   ```bash
   # 手動コピー
   cp /path/to/mognator3/docs/*.html /path/to/mognator-docs/
   
   # または、自動化スクリプトを作成
   ```

3. コミット & プッシュ:
   ```bash
   cd mognator-docs
   git add .
   git commit -m "Update documentation"
   git push origin main
   ```

## 自動化（上級）

GitHub Actionsで自動同期も可能:

```yaml
# .github/workflows/sync-docs.yml (メインリポジトリ)
name: Sync Docs
on:
  push:
    paths:
      - 'docs/*.html'
jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Push to docs repo
        run: |
          # 公開リポジトリにプッシュするスクリプト
```

## まとめ

**推奨アプローチ**: 方法1（別の公開リポジトリ）
- ✅ 無料
- ✅ シンプル
- ✅ セキュア（アプリコードは非公開のまま）
- ✅ 簡単にメンテナンス可能

## 現在のファイル構成

```
docs/
├── index.html           # トップページ（アプリ紹介）
├── privacy.html         # プライバシーポリシー（日英両対応）
├── support.html         # サポートページ（FAQ、日英両対応）
├── PRIVACY_POLICY.md    # Markdown版（参考用）
├── SUPPORT.md           # Markdown版（参考用）
└── HOSTING_GUIDE.md     # このファイル
```

**公開リポジトリに必要なファイル**:
- `index.html`
- `privacy.html`
- `support.html`

これら3つのHTMLファイルをコピーするだけでOKです！
