"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { clearExcluded, loadExcluded, removeExcluded } from "@/lib/storage";
import type { ExcludedPlace } from "@/lib/types";

function formatExcludedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("ja-JP", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

export default function ExcludedPage() {
  const [excluded, setExcluded] = useState<ExcludedPlace[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    function refresh() {
      setExcluded(loadExcluded());
    }
    refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("weekend-planner-data-changed", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("weekend-planner-data-changed", refresh);
    };
  }, []);

  function flash(msg: string) {
    setMessage(msg);
    setTimeout(() => setMessage(null), 2500);
  }

  function handleRestore(placeId: string, name: string) {
    setExcluded(removeExcluded(placeId));
    flash(`「${name}」を提案に戻しました`);
  }

  function handleClearAll() {
    if (!confirm("除外リストをすべて空にしますか？")) return;
    clearExcluded();
    setExcluded([]);
    flash("除外リストを空にしました");
  }

  return (
    <div className="flex flex-col min-h-screen px-5 pt-6 pb-10 safe-top safe-bottom">
      <header className="mb-6">
        <Link href="/" className="text-xs text-stone-500 dark:text-stone-400">
          ← ホームへ
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-stone-900 dark:text-stone-100">
          除外リスト
        </h1>
        <p className="text-sm text-stone-600 dark:text-stone-300">
          提案から外したスポット。戻すとまた候補に出ます
        </p>
      </header>

      {excluded.length === 0 ? (
        <p className="text-center text-sm text-stone-500 dark:text-stone-400 py-12">
          除外したスポットはまだありません
          <br />
          <span className="text-xs mt-2 inline-block">
            結果画面の「提案から除外」で追加できます
          </span>
        </p>
      ) : (
        <>
          <section className="space-y-3">
            {excluded.map((e) => (
              <div
                key={e.placeId}
                className="rounded-2xl bg-white dark:bg-stone-800 px-4 py-3 flex items-center gap-3 shadow-sm"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-stone-900 dark:text-stone-100 truncate">
                    {e.placeName}
                  </div>
                  <div className="text-xs text-stone-500 dark:text-stone-400">
                    {e.placeArea}
                    {formatExcludedAt(e.excludedAt)
                      ? ` · ${formatExcludedAt(e.excludedAt)}`
                      : ""}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRestore(e.placeId, e.placeName)}
                  className="shrink-0 text-sm px-3 py-2 min-h-11 rounded-lg bg-orange-500 text-white font-bold active:scale-[0.98]"
                >
                  戻す
                </button>
              </div>
            ))}
          </section>

          <button
            type="button"
            onClick={handleClearAll}
            className="mt-8 w-full rounded-xl border-2 border-red-200 dark:border-red-900 py-3 text-sm font-medium text-red-700 dark:text-red-300"
          >
            すべて戻す（リストを空にする）
          </button>
        </>
      )}

      {message ? (
        <div className="fixed inset-x-0 bottom-6 mx-auto max-w-md px-5 z-50">
          <div className="rounded-2xl bg-green-500 text-white px-4 py-3 shadow-xl text-center font-bold">
            {message}
          </div>
        </div>
      ) : null}
    </div>
  );
}
