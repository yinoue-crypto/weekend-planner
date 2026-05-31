# 家族共有（Upstash Redis）セットアップ — 週末ナビ

お気に入り・「行った！」を**複数のスマホで同じ内容**にするための、**1回だけ**の設定手順です。

> **「KV」という項目はありません（2024年末で Vercel KV は廃止）。**  
> 代わりに Marketplace の **Upstash** → **Redis** を選びます。

本番 URL: **https://shuumatsu-navi.vercel.app**

---

## 今の状態を確認

```
https://shuumatsu-navi.vercel.app/api/family-sync
```

| 結果 | 意味 |
|------|------|
| **503** + 「未設定」 | Redis 未接続 → 下へ |
| それ以外 | 接続済み |

---

## 手順（PC・約5分）

### 1. Vercel ダッシュボード

https://vercel.com/dashboard → プロジェクト **shuumatsu-navi**

### 2. Storage を開く

画面上部 **Storage** → **Create Database**（または **Browse Storage**）

表示例:
- Edge Config / Blob（これは**選ばない**）
- **Marketplace Database Providers**
  - **Upstash** ← **これを選ぶ**
  - Redis（Official Redis for Vercel）← Upstash でうまくいかない場合の代替

### 3. Upstash で Redis を作成

1. **Upstash** をクリック
2. **Redis** を選択
3. 名前: `shuumatsu-navi-redis`（任意）
4. Region: **Tokyo** または **US East**（どちらでも可）
5. **Create** / **Continue**
6. **Connect to shuumatsu-navi**（自分のプロジェクト名）
7. Environment: **Production**（+ Preview 推奨）→ **Connect**

自動で環境変数が入ります（どちらか）:
- `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`（新規）
- `KV_REST_API_URL` + `KV_REST_API_TOKEN`（旧 KV 移行分）

確認: **Settings → Environment Variables**

### 4. Redeploy（必須）

**Deployments** → 最新 → **⋯** → **Redeploy** → 1〜2分待つ

### 5. 確認

- ブラウザ: `/api/family-sync` が 503 でなくなる
- スマホ: **設定 → 家族で共有 → 接続を再確認** → 🟢 利用可能

---

## 各スマホ

| 端末 | 操作 |
|------|------|
| 1台目 | **新規発行** → コードを LINE で共有 → **コードを保存** |
| 2台目以降 | コードを貼る → **コードを保存** → **今すぐ同期** |

---

## トラブルシュート

### Upstash がない / 作成できない

- **Integrations** タブ → Marketplace で「Upstash」を検索して追加
- または一覧の **Redis**（Official Redis for Vercel）を試す

### Redeploy 後も 503

- Environment Variables に `UPSTASH_REDIS_REST_*` または `KV_REST_API_*` があるか
- **Production** 環境に付いているか
- もう一度 Redeploy

### 「Redis」か「Upstash」か迷ったら

**Upstash** を選べば OK（週末ナビは Upstash REST API 互換で動きます）。
