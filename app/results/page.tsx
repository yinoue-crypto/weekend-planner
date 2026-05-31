"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import PlaceCard from "@/components/PlaceCard";
import { getAllPlaces } from "@/lib/places";
import { rankPlaces } from "@/lib/scoring";
import {
  addExcluded,
  addFavorite,
  loadExcluded,
  loadFavorites,
  loadHome,
  loadLastSession,
  loadVisits,
  recordVisit,
  removeFavorite,
} from "@/lib/storage";
import type {
  ExcludedPlace,
  HomeBase,
  Place,
  ScoredPlace,
  SessionChoices,
  VisitRecord,
  WeatherSnapshot,
} from "@/lib/types";

type LastSession = {
  choices: SessionChoices;
  weather: WeatherSnapshot | null;
};

const PAGE_SIZE = 5;

export default function ResultsPage() {
  const router = useRouter();
  const [session, setSession] = useState<LastSession | null>(null);
  const [home, setHome] = useState<HomeBase | null>(null);
  const [favorites, setFavorites] = useState<Place[]>([]);
  const [visits, setVisits] = useState<VisitRecord[]>([]);
  const [excluded, setExcluded] = useState<ExcludedPlace[]>([]);
  const [reshuffleKey, setReshuffleKey] = useState(0);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [excludedToast, setExcludedToast] = useState<string | null>(null);

  useEffect(() => {
    const last = loadLastSession<LastSession>();
    if (!last) {
      router.replace("/decide");
      return;
    }
    setSession(last);
    setHome(loadHome());
    setFavorites(loadFavorites());
    setVisits(loadVisits());
    setExcluded(loadExcluded());
  }, [router]);

  const favoriteIds = useMemo(
    () => new Set(favorites.map((p) => p.id)),
    [favorites],
  );

  const excludedIds = useMemo(
    () => new Set(excluded.map((e) => e.placeId)),
    [excluded],
  );

  const allRanked: ScoredPlace[] = useMemo(() => {
    if (!session || !home) return [];
    const places = getAllPlaces(favorites);
    return rankPlaces(
      places,
      session.choices,
      session.weather,
      home,
      visits,
      favoriteIds,
      excludedIds,
      { jitter: true },
    );
    // reshuffleKey forces re-shuffle when "別の候補" is tapped
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, home, visits, favoriteIds, excludedIds, reshuffleKey, favorites]);

  const ranked = useMemo(
    () => allRanked.slice(0, visibleCount),
    [allRanked, visibleCount],
  );

  const hasMore = visibleCount < allRanked.length;

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [reshuffleKey]);

  function handleToggleFavorite(place: Place) {
    if (favoriteIds.has(place.id)) {
      setFavorites(removeFavorite(place.id));
    } else {
      setFavorites(addFavorite({ ...place, source: place.source ?? "favorite" }));
    }
  }

  function handlePick(place: Place) {
    setVisits(recordVisit(place));
    setPickedId(place.id);
    setTimeout(() => {
      setPickedId(null);
    }, 2500);
  }

  function handleExclude(place: Place) {
    setExcluded(addExcluded(place));
    setExcludedToast(`「${place.name}」を除外しました`);
    setTimeout(() => setExcludedToast(null), 2500);
  }

  if (!session || !home) {
    return (
      <div className="px-5 pt-10 text-center text-stone-500">読み込み中…</div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <header className="px-5 pt-4 safe-top">
        <Link
          href="/"
          className="text-xs text-stone-500 dark:text-stone-400"
        >
          ← ホームへ
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-stone-900 dark:text-stone-100">
          今日のおすすめ
        </h1>
        <p className="text-sm text-stone-600 dark:text-stone-300">
          {allRanked.length === 0
            ? "候補なし"
            : allRanked.length === ranked.length
              ? `${ranked.length}件をスコア順に表示`
              : `${ranked.length}件表示（全${allRanked.length}件中）`}
        </p>
        {excluded.length > 0 ? (
          <Link
            href="/excluded"
            className="inline-block mt-2 text-sm font-medium text-orange-600 dark:text-orange-400"
          >
            除外リスト（{excluded.length}件）→
          </Link>
        ) : null}
      </header>

      <main className="px-5 mt-5 space-y-4">
        {ranked.length === 0 ? (
          <div className="rounded-2xl bg-white dark:bg-stone-800 px-5 py-10 text-center text-stone-600 dark:text-stone-300">
            条件に合う場所が見つかりませんでした。
            <br />
            <span className="text-xs text-stone-500 dark:text-stone-400">
              「行った！」・お気に入り・除外リストは提案に含めていません。
            </span>
            <br />
            <Link
              href="/decide"
              className="inline-block mt-3 text-orange-600 dark:text-orange-400 font-bold"
            >
              条件をやり直す →
            </Link>
          </div>
        ) : (
          ranked.map((scored, i) => (
            <PlaceCard
              key={scored.place.id}
              scored={scored}
              rank={i + 1}
              favorited={favoriteIds.has(scored.place.id)}
              onToggleFavorite={handleToggleFavorite}
              onExclude={handleExclude}
              onPick={handlePick}
            />
          ))
        )}

        {hasMore ? (
          <button
            type="button"
            onClick={() =>
              setVisibleCount((count) =>
                Math.min(count + PAGE_SIZE, allRanked.length),
              )
            }
            className="w-full rounded-2xl bg-orange-500 py-3 font-bold text-white active:scale-[0.98]"
          >
            もっと表示（あと{allRanked.length - visibleCount}件）
          </button>
        ) : null}

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={() => setReshuffleKey((k) => k + 1)}
            className="rounded-2xl bg-white dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-700 py-3 font-bold text-stone-700 dark:text-stone-200 active:scale-[0.98]"
          >
            🔀 別の候補
          </button>
          <Link
            href="/decide"
            className="rounded-2xl bg-white dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-700 py-3 font-bold text-stone-700 dark:text-stone-200 text-center active:scale-[0.98]"
          >
            ↻ 条件変更
          </Link>
        </div>
      </main>

      {pickedId ? (
        <div className="fixed inset-x-0 bottom-6 mx-auto max-w-md px-5 z-50">
          <div className="rounded-2xl bg-green-500 text-white px-4 py-3 shadow-xl text-center font-bold">
            ✓ 行った！に追加しました
          </div>
        </div>
      ) : null}

      {excludedToast ? (
        <div className="fixed inset-x-0 bottom-6 mx-auto max-w-md px-5 z-50">
          <div className="rounded-2xl bg-stone-800 dark:bg-stone-700 text-white px-4 py-3 shadow-xl text-center text-sm font-bold">
            {excludedToast}
            <Link href="/excluded" className="block mt-1 text-orange-300 font-medium">
              除外リストを見る
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
