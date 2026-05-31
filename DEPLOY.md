# デプロイ（Vercel）

`main` ブランチへの push で Vercel が **自動デプロイ** します。

## 初回セットアップ（1回だけ・約2分）

1. 次の URL を開く:  
   https://vercel.com/new/import?s=https%3A%2F%2Fgithub.com%2Fyinoue-crypto%2Fweekend-planner
2. GitHub でログイン（未連携なら Vercel アプリを GitHub にインストール）
3. リポジトリ `yinoue-crypto/weekend-planner` を **Import**
4. Framework: **Next.js**（自動検出）、Root Directory: **./** のまま
5. **Project Name** を `shuumatsu-navi` に変更（`weekend-planner` のままだと名前重複エラーになる場合あり）
6. **Deploy** を押す

これで完了です。以後はコードを `main` に push するだけで本番が更新されます。

```powershell
git add .
git commit -m "feat: 〇〇を追加"
git push origin main
# → Vercel が自動ビルド＆デプロイ（1〜2分）
```

## 本番 URL

デプロイ完了後、Vercel ダッシュボードに表示される URL（例: `https://shuumatsu-navi.vercel.app`）をスマホのホーム画面に追加してください。

Production Branch は **main** になっていることを確認:  
Vercel → Project → Settings → Git → Production Branch

## 環境変数

天気・地図だけなら API キーは **不要** です。

### 家族データの端末間同期（おすすめ）

お気に入り・「行った！」を家族のスマホで共有するには **Vercel KV** を接続します。

**詳細手順（画像付き相当）:** [`docs/KV_SETUP.md`](docs/KV_SETUP.md)

短縮版:

1. https://vercel.com/dashboard → プロジェクト **shuumatsu-navi**
2. **Storage** → **Create Database** → **KV** → プロジェクトに **Connect**
3. **Deployments** → 最新 → **Redeploy**
4. 各スマホ: **設定 → 家族で共有** → 同じ家族コード

接続確認: `https://shuumatsu-navi.vercel.app/api/family-sync` が 503 でなければ OK

※ KV 未接続でもアプリは使えます（データは各端末の localStorage のみ）。

## GitHub Actions（CI）

push / PR 時に `npm run build` が走り、ビルドが通るか確認します（[`.github/workflows/ci.yml`](.github/workflows/ci.yml)）。  
**デプロイ自体は Vercel の GitHub 連携** が担当します。

## 手動デプロイ（任意）

Vercel CLI が使える環境では:

```bash
npx vercel --prod
```

※ PC 名に日本語が含まれると CLI が失敗することがあります。その場合は上記の GitHub 連携を利用してください。

## トラブルシュート

### `Project "weekend-planner" already exists`

Vercel アカウント内に同名プロジェクトが既にあります。**どちらか**で解決できます。

**方法A（おすすめ）: 別名で新規作成**

Import 画面の **Project Name** を `shuumatsu-navi` など未使用の名前に変えてから Deploy。

**方法B: 既存プロジェクトを GitHub に接続**

1. https://vercel.com/dashboard を開く
2. 既存の `weekend-planner` プロジェクトを開く
3. **Settings → Git → Connect Git Repository**
4. `yinoue-crypto/weekend-planner` を選び、Production Branch を **main** に設定
5. **Redeploy** または `main` へ push

方法B では URL は既存プロジェクトのまま（例: `https://weekend-planner-xxx.vercel.app`）です。
