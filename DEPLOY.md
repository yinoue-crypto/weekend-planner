# デプロイ（Vercel）

`main` ブランチへの push で Vercel が **自動デプロイ** します。

## 初回セットアップ（1回だけ・約2分）

1. 次の URL を開く:  
   https://vercel.com/new/import?s=https%3A%2F%2Fgithub.com%2Fyinoue-crypto%2Fweekend-planner
2. GitHub でログイン（未連携なら Vercel アプリを GitHub にインストール）
3. リポジトリ `yinoue-crypto/weekend-planner` を **Import**
4. Framework: **Next.js**（自動検出）、Root Directory: **./** のまま
5. **Deploy** を押す

これで完了です。以後はコードを `main` に push するだけで本番が更新されます。

```powershell
git add .
git commit -m "feat: 〇〇を追加"
git push origin main
# → Vercel が自動ビルド＆デプロイ（1〜2分）
```

## 本番 URL

デプロイ完了後、Vercel ダッシュボードに表示される URL（例: `https://weekend-planner-xxx.vercel.app`）をスマホのホーム画面に追加してください。

Production Branch は **main** になっていることを確認:  
Vercel → Project → Settings → Git → Production Branch

## 環境変数

このアプリは API キー不要のため、環境変数の設定は **不要** です。

## GitHub Actions（CI）

push / PR 時に `npm run build` が走り、ビルドが通るか確認します（[`.github/workflows/ci.yml`](.github/workflows/ci.yml)）。  
**デプロイ自体は Vercel の GitHub 連携** が担当します。

## 手動デプロイ（任意）

Vercel CLI が使える環境では:

```bash
npx vercel --prod
```

※ PC 名に日本語が含まれると CLI が失敗することがあります。その場合は上記の GitHub 連携を利用してください。
