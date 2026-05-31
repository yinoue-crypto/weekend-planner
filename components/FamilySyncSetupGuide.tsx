"use client";

type Props = {
  syncAvailable: boolean | null;
  onRecheck: () => void;
  rechecking: boolean;
};

const PRODUCTION_HOST = "shuumatsu-navi.vercel.app";

export default function FamilySyncSetupGuide({
  syncAvailable,
  onRecheck,
  rechecking,
}: Props) {
  if (syncAvailable === true) {
    return (
      <div className="mt-3 rounded-xl bg-green-100 dark:bg-green-950/40 border border-green-200 dark:border-green-800 px-3 py-2.5">
        <p className="text-sm font-bold text-green-800 dark:text-green-200">
          🟢 クラウド同期: 利用可能
        </p>
        <p className="mt-0.5 text-xs text-green-700 dark:text-green-300">
          下で家族コードを設定すれば、複数スマホでデータが揃います。
        </p>
      </div>
    );
  }

  if (syncAvailable === null) {
    return (
      <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
        クラウド同期の状態を確認中…
      </p>
    );
  }

  return (
    <div className="mt-3 space-y-3">
      <div className="rounded-xl bg-amber-100 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-3 py-2.5">
        <p className="text-sm font-bold text-amber-900 dark:text-amber-100">
          🟡 クラウド同期: 未設定（1回だけ設定が必要）
        </p>
        <p className="mt-1 text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
          今は各スマホにデータが別々に保存されています。下の手順は
          <strong> 管理者が PC で1回</strong>
          やれば、家族全員のスマホで共有できます。
        </p>
      </div>

      <ol className="text-xs text-stone-700 dark:text-stone-300 space-y-2.5 list-decimal list-inside leading-relaxed">
        <li>
          PC で{" "}
          <a
            href="https://vercel.com/login"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-orange-600 dark:text-orange-400 underline"
          >
            vercel.com
          </a>
          に GitHub でログイン
        </li>
        <li>
          プロジェクト{" "}
          <span className="font-mono font-bold">shuumatsu-navi</span> を開く
        </li>
        <li>
          上部 <strong>Storage</strong> → <strong>Create Database</strong> →{" "}
          <strong>KV</strong> を選んで作成
        </li>
        <li>
          <strong>Connect to Project</strong> → Production にチェック → Connect
        </li>
        <li>
          <strong>Deployments</strong> → 最新の ⋯ → <strong>Redeploy</strong>
          （1〜2分待つ）
        </li>
        <li>この画面で下の「接続を再確認」をタップ</li>
      </ol>

      <div className="flex flex-col gap-2">
        <a
          href="https://vercel.com/dashboard"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full rounded-xl bg-stone-800 dark:bg-stone-700 text-white text-center font-bold py-3 text-sm active:scale-[0.98] min-h-11 flex items-center justify-center"
        >
          Vercel ダッシュボードを開く ↗
        </a>
        <button
          type="button"
          onClick={onRecheck}
          disabled={rechecking}
          className="w-full rounded-xl border-2 border-orange-400 dark:border-orange-600 text-orange-700 dark:text-orange-300 font-bold py-3 text-sm disabled:opacity-50 active:scale-[0.98] min-h-11"
        >
          {rechecking ? "確認中…" : "🔄 接続を再確認"}
        </button>
      </div>

      <details className="text-xs text-stone-500 dark:text-stone-400">
        <summary className="cursor-pointer font-medium text-stone-600 dark:text-stone-300">
          詳しい手順（Markdown）
        </summary>
        <p className="mt-2 leading-relaxed">
          リポジトリの{" "}
          <code className="bg-stone-100 dark:bg-stone-900 px-1 rounded">
            docs/KV_SETUP.md
          </code>{" "}
          にスクショ付き相当の全文があります。管理者向け。
        </p>
        <p className="mt-2">
          診断 URL:{" "}
          <a
            href={`https://${PRODUCTION_HOST}/api/family-sync`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-600 dark:text-orange-400 break-all"
          >
            {PRODUCTION_HOST}/api/family-sync
          </a>
          <br />
          <span className="text-stone-400">503 → 未設定 / それ以外 → 接続済みの目安</span>
        </p>
      </details>
    </div>
  );
}
