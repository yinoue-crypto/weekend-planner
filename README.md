# 週末ナビ (Weekend Planner)

家族で土日に「どこ行く？」を悩む時間をゼロにする、名古屋圏向けスマホPWA。
気分・天気・家族構成をタップするだけで、3〜5件の行き先を提案します。

- 月額0円（Open-Meteo 天気 + Google Maps ディープリンク + Vercel Hobby）
- スマホPWA。ホーム画面に追加してネイティブアプリのように使える
- 個人データは全て端末内localStorage（リポジトリには入らない）

## 使い方（家族向け）

1. ホームで「今日のお出かけを決める」をタップ
2. 家族構成 → 気分 → 時間/予算/移動手段 → 天気確認 の順にタップで回答
3. 3〜5件の候補から選び、Google Mapsで開く

## スマホに「アプリ」として追加する

### iPhone (Safari)
1. Vercel の URL を Safari で開く
2. 共有ボタン → 「ホーム画面に追加」

### Android (Chrome)
1. Vercel の URL を Chrome で開く
2. メニュー → 「アプリをインストール」

## スマホから Cursor で改修する

このリポジトリは **Cursor Cloud Agents** に対応しています。スマホから指示するだけでコードが書き換わり、PRが立ち、マージすれば Vercel が自動デプロイします。

### 初回セットアップ（スマホ）

1. スマホで [cursor.com/agents](https://cursor.com/agents) を開く
2. ホーム画面に追加（iOS: 共有 → ホーム画面に追加 / Android: メニュー → アプリをインストール）
3. GitHubでログイン

### 改修の流れ

```
スマホでプロンプト
    ↓
Cursor Cloud Agent が VM で実行
    ↓
ブランチを切って PR を作成
    ↓
GitHub モバイルでマージ
    ↓
Vercel が自動デプロイ
    ↓
スマホPWAをリロードして確認
```

### プロンプト例

- 「気分カテゴリに『映え』を追加して、対応する seed の `moods` も更新して」
- 「家族構成ステップに『おじいちゃん・おばあちゃん』を追加して」
- 「結果カードの『ここにする』ボタンをもう少し大きく」
- 「seed-places-nagoya.json に碧南海浜水族館を追加（雨OK・子どもOK・水族館タグ）」

Agent は [`AGENTS.md`](AGENTS.md) と [`.cursor/rules/conventions.mdc`](.cursor/rules/conventions.mdc) を読んでから作業します。よく触る場所のマップ、UI規約（44pxタップ高さなど）、コミット規約はそこに書いてあります。

## ローカル開発

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # 本番ビルドの確認
```

スマホで試す場合は同一LAN内から `http://<PC-IP>:3000` でアクセス可能。

## 技術スタック

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS 4
- [Open-Meteo](https://open-meteo.com/) (天気・APIキー不要)
- localStorage (家族デフォルト、お気に入り、訪問履歴)
- PWA (manifest + Service Worker)

## デプロイ

`main` ブランチへの push で Vercel が自動デプロイします。

手動デプロイする場合:

```bash
npx vercel --prod
```
