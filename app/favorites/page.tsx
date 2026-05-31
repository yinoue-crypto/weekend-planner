"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  addFavorite,
  loadFavorites,
  removeFavorite,
} from "@/lib/storage";
import { googleMapsSearchUrl, resolveGoogleMapsInput } from "@/lib/googleMapsUrl";
import type { Place } from "@/lib/types";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Place[]>([]);
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFavorites(loadFavorites());
  }, []);

  async function handleAdd() {
    setSaving(true);
    try {
      const parsed = await resolveGoogleMapsInput(url, name.trim() || "登録した場所");
      if (!parsed) {
        setMessage(
          "URLから座標を読み取れませんでした。Google Mapsで場所を開いて「共有→リンクをコピー」したURLを貼ってください。",
        );
        return;
      }
      const finalName = name.trim() || parsed.name;
      const id = `custom-${Date.now()}`;
      const place: Place = {
        id,
        name: finalName,
        area: "登録地",
        lat: parsed.lat,
        lng: parsed.lng,
        tags: ["indoor", "outdoor"],
        moods: ["relax"],
        duration: ["half", "full"],
        budget: "low",
        transport: ["car", "train", "walk"],
        description: "Google Mapsから登録したお気に入り",
        source: "favorite",
      };
      setFavorites(addFavorite(place));
      setUrl("");
      setName("");
      setMessage(`「${finalName}」を追加しました`);
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setSaving(false);
    }
  }

  function handleRemove(id: string) {
    setFavorites(removeFavorite(id));
  }

  return (
    <div className="flex flex-col min-h-screen px-5 pt-6 pb-10 safe-top safe-bottom">
      <header className="mb-6">
        <Link href="/" className="text-xs text-stone-500 dark:text-stone-400">
          ← ホームへ
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-stone-900 dark:text-stone-100">
          お気に入り
        </h1>
        <p className="text-sm text-stone-600 dark:text-stone-300">
          Google Mapsで見つけた場所を追加できます
        </p>
      </header>

      <section className="rounded-3xl bg-white dark:bg-stone-800 px-4 py-5 shadow-sm">
        <h2 className="font-bold text-stone-800 dark:text-stone-100">
          Google Maps から追加
        </h2>
        <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
          1. Google Mapsで場所を長押し → 「共有」→「リンクをコピー」<br />
          2. 下のフォームに貼り付け
        </p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="場所の名前（任意）"
          className="mt-3 w-full rounded-xl border-2 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-base"
        />
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.google.com/maps/..."
          className="mt-2 w-full rounded-xl border-2 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-base"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!url.trim() || saving}
          className="mt-3 w-full rounded-xl bg-orange-500 disabled:bg-stone-300 dark:disabled:bg-stone-700 text-white font-bold py-3 active:scale-[0.98]"
        >
          {saving ? "読み込み中…" : "＋ お気に入りに追加"}
        </button>
        {message ? (
          <p className="mt-2 text-xs text-orange-700 dark:text-orange-300">{message}</p>
        ) : null}
      </section>

      <section className="mt-6 space-y-3">
        {favorites.length === 0 ? (
          <p className="text-center text-sm text-stone-500 dark:text-stone-400 py-8">
            まだお気に入りがありません
          </p>
        ) : (
          favorites.map((p) => (
            <div
              key={p.id}
              className="rounded-2xl bg-white dark:bg-stone-800 px-4 py-3 flex items-center gap-3 shadow-sm"
            >
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-stone-900 dark:text-stone-100 truncate">
                  {p.name}
                </div>
                <div className="text-xs text-stone-500 dark:text-stone-400">{p.area}</div>
              </div>
              <a
                href={googleMapsSearchUrl(p)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-200"
              >
                地図
              </a>
              <button
                type="button"
                onClick={() => handleRemove(p.id)}
                className="text-sm px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300"
              >
                削除
              </button>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
