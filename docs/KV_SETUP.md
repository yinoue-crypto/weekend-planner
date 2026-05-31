# 家族共有（Vercel KV）セットアップ — 週末ナビ

お気に入り・「行った！」を**複数のスマホで同じ内容**にするための、**1回だけ**の設定手順です。

本番 URL 例: **https://shuumatsu-navi.vercel.app**

---

## 今の状態を確認

ブラウザで次を開く（ログイン不要）:

```
https://shuumatsu-navi.vercel.app/api/family-sync
```

| 表示 | 意味 |
|------|------|
| `{"error":"クラウド同期が未設定です…"}` など **503** | KV 未接続 → 下の手順へ |
| **404** や JSON | KV 接続済み（同期 API 稼働中） |

アプリ内: **設定 → 📱 家族で共有** の上部に  
「🟢 クラウド同期: 利用可能」が出れば OK です。

---

## 手順（PC のブラウザ推奨・約5分）

### 1. Vercel にログイン

1. https://vercel.com/login を開く  
2. **Continue with GitHub**（リポジトリ `yinoue-crypto/weekend-planner` と同じアカウント）

### 2. プロジェクトを開く

1. https://vercel.com/dashboard  
2. プロジェクト **`shuumatsu-navi`**（または `weekend-planner`）をクリック  
   - 名前が違う場合は、GitHub 連携で `main` ブランチのプロジェクトを選ぶ

### 3. KV（Redis）を作成して接続

1. プロジェクト画面上部の **Storage** タブをクリック  
   - 見つからない場合: 左メニュー **Storage** または **Integrations**
2. **Create Database**（または **Connect Store** / **Create**）
3. **KV** を選択（Upstash Redis ベース）
4. 名前例: `shuumatsu-navi-kv`（任意）
5. Region: **Tokyo (ap-northeast-1)** または **Washington, D.C.**（どちらでも可）
6. **Create** → 作成後 **Connect to Project**（プロジェクトに接続）
7. 接続先プロジェクト: **shuumatsu-navi**、Environment: **Production**（+ Preview も ON 推奨）にチェック
8. **Connect** を押す

これで環境変数が自動追加されます:

- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

確認: プロジェクト → **Settings** → **Environment Variables** に上記2つがあること。

### 4. 再デプロイ（必須）

環境変数は **次のデプロイから** 反映されます。

1. プロジェクト → **Deployments** タブ  
2. 一番上（最新）のデプロイの **⋯**（三点）→ **Redeploy**  
3. **Redeploy** を確認（「Use existing Build Cache」は OFF でも ON でも可）

1〜2 分待つ。

### 5. 接続確認

再度開く:

```
https://shuumatsu-navi.vercel.app/api/family-sync
```

503 ではなくなれば成功（GET 単体は `url required` など別エラーでも OK）。

スマホアプリ: **設定 → 家族で共有 → 「接続を再確認」** → **🟢 利用可能**

---

## 各スマホでの設定（家族全員）

### 1台目（親スマホ）

1. 週末ナビ → **設定** → **📱 家族で共有**
2. **新規発行** をタップ → 8文字のコード（例: `NAGOYA42`）
3. **📋 コピー** → LINE などで家族に送る
4. **コードを保存**（自動で初回同期）

### 2台目以降

1. 同じ **設定 → 家族で共有**
2. 送られてきたコードを貼り付け
3. **コードを保存**
4. **🔄 今すぐ同期**（任意）

以降、お気に入り追加・「行った！」は自動でクラウドに反映され、他端末も開いたときに取り込まれます。

---

## うまくいかないとき

### 「クラウド同期は未設定です」と出る

- 手順 4 の **Redeploy** を忘れていないか確認
- Environment Variables に `KV_REST_API_*` があるか確認
- Production 環境に変数が付いているか確認

### 同期ボタンを押すとエラー

- Wi‑Fi / モバイルデータを確認
- 家族コードが全端末で**完全一致**（大文字）か確認
- 設定 → **🔄 今すぐ同期** を再試行

### 無料枠について

Vercel KV（Upstash）は Hobby でも小規模利用なら無料枠内で足ります。家族数台・お気に入り数十件程度なら問題になりにくいです。

---

## 管理者向け: 手動で環境変数を入れる場合

Storage 接続で自動設定されない rare ケース用:

1. Upstash コンソールで Redis を作成  
2. **REST API** の URL / Token をコピー  
3. Vercel → Settings → Environment Variables に手動追加:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
4. Redeploy

---

## 関連ファイル

- API: [`app/api/family-sync/route.ts`](../app/api/family-sync/route.ts)
- クライアント: [`lib/familySync.ts`](../lib/familySync.ts)
- Redis: [`lib/upstash.ts`](../lib/upstash.ts)
