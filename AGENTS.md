# AGENTS.md — 週末ナビ (Weekend Planner)

家族で土日に「どこ行く？」を悩む時間をゼロにする、名古屋圏向けスマホPWA。

## プロジェクト概要

- **フレームワーク**: Next.js 16 (App Router) + React 19 + TypeScript
- **スタイル**: Tailwind CSS 4
- **天気**: Open-Meteo API（APIキー不要・無料）
- **データ保存**: localStorage（家族デフォルト・お気に入り・訪問履歴）
- **地図**: Google Maps ディープリンクのみ（API利用なし）
- **デプロイ**: Vercel（main ブランチへの push で自動デプロイ）

## ディレクトリ構成

```
weekend-planner/
├── app/                       # Next.js App Router ページ
│   ├── page.tsx               # ホーム
│   ├── decide/page.tsx        # 4ステップウィザード
│   ├── results/page.tsx       # 提案結果
│   ├── favorites/page.tsx     # お気に入り管理
│   └── settings/page.tsx      # 拠点・家族デフォルト・データ管理
├── components/
│   ├── PlaceCard.tsx          # 結果カード
│   ├── WeatherBanner.tsx      # ホーム上部の天気表示
│   ├── ServiceWorkerRegister.tsx
│   └── wizard/                # ウィザード各ステップ
├── lib/
│   ├── types.ts               # ★ 全データ型はここに集約
│   ├── storage.ts             # localStorage CRUD
│   ├── places.ts              # シードデータ + 拡張マージ
│   ├── scoring.ts             # フィルタ + スコアリング
│   ├── weather.ts             # Open-Meteo クライアント
│   └── googleMapsUrl.ts       # ディープリンク生成 + 共有URLパース
├── data/
│   └── seed-places-nagoya.json # ★ スポット追加はここ
└── public/
    ├── manifest.json          # PWA
    ├── sw.js                  # Service Worker
    └── icons/
```

## よく触る場所のメモ

| やりたいこと | 触るファイル |
|--------------|--------------|
| スポットを増やす | [`data/seed-places-nagoya.json`](data/seed-places-nagoya.json) — 既存形式に揃え、タグは `PlaceTag` 型の語彙のみ |
| スコアの重みを調整 | [`lib/scoring.ts`](lib/scoring.ts) の `scorePlace` 関数 |
| ウィザードのステップ追加/変更 | [`app/decide/page.tsx`](app/decide/page.tsx) と [`components/wizard/`](components/wizard/) |
| 気分カテゴリの追加 | [`lib/types.ts`](lib/types.ts) の `Mood` 型 + `MOOD_LABELS` + [`components/wizard/MoodStep.tsx`](components/wizard/MoodStep.tsx) |
| 拠点プリセットの追加 | [`app/settings/page.tsx`](app/settings/page.tsx) の `NAGOYA_PRESETS` |
| 天気判定の閾値 | [`lib/weather.ts`](lib/weather.ts) の `shouldPreferIndoor` |
| PWAのアイコン | [`public/icons/`](public/icons/) |

## コマンド

```bash
npm install            # 依存インストール
npm run dev            # 開発サーバ（http://localhost:3000）
npm run build          # 本番ビルド（必ず通すこと）
npm run lint           # Lint
```

## 設計上の制約

- **個人データはリポジトリに入れない**。家族構成・お気に入り・訪問履歴は全て localStorage。
- **API キーを使う機能は追加しない**。Open-Meteo と Google Maps ディープリンクで完結させる方針。どうしても必要なら Vercel の環境変数経由で。
- **スマホファースト**。最小タップ高さ 44px、フォントは最低 14px、コンテナは `max-w-md`。
- **データ型は [`lib/types.ts`](lib/types.ts) に集約**。新規型はここに足してから使う。
- **localStorage アクセスは [`lib/storage.ts`](lib/storage.ts) 経由**。コンポーネントから直接 `localStorage.getItem` を呼ばない。
- **端末間同期**: 設定の家族コード → [`lib/familySync.ts`](lib/familySync.ts) / [`app/api/family-sync/route.ts`](app/api/family-sync/route.ts)（要 `KV_REST_API_*`）

## Cursor Cloud specific instructions

- 起動時に `.cursor/environment.json` が `npm install` を実行し、`next-dev` ターミナルで `npm run dev` がポート3000で立ち上がる。
- 変更を加えたら **必ず `npm run build` を通してからコミット**。型エラーで CI が落ちないように。
- UI 変更時はブラウザツールで http://localhost:3000 を開き、ホーム/ウィザード/結果のスクリーンショットを PR に添付する。
- スポット追加など `data/seed-places-nagoya.json` を編集したら、結果ページで実際に出現することを確認する。
- 大きな機能変更は **小さな PR に分割**。家族がスマホで気軽にマージできるサイズに留める。
- コミットメッセージは日本語OK。1行目に種別プレフィックスを付ける: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`。

## 既知の注意

- Next.js は `next-env.d.ts` を自動生成する。コミットしてもしなくても動くが、現状の `.gitignore` には載せていない。
- Service Worker は本番ビルドのみ登録する（[`components/ServiceWorkerRegister.tsx`](components/ServiceWorkerRegister.tsx) で `NODE_ENV === "production"` をチェック）。dev 中にキャッシュが詰まることはない。
