"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import VisitedList from "@/components/VisitedList";
import WeatherBanner from "@/components/WeatherBanner";
import { getUniqueVisits } from "@/lib/visits";
import { NAGOYA_DEFAULT, loadHome, loadVisits } from "@/lib/storage";
import type { HomeBase, VisitRecord } from "@/lib/types";

function isWeekend(d: Date = new Date()): boolean {
  const day = d.getDay();
  return day === 0 || day === 6;
}

function weekendLabel(d: Date = new Date()): string {
  const day = d.getDay();
  if (day === 6) return "今日は土曜日";
  if (day === 0) return "今日は日曜日";
  const daysUntilSat = (6 - day + 7) % 7 || 7;
  return `次の土曜まであと${daysUntilSat}日`;
}

export default function HomePage() {
  const [home, setHome] = useState<HomeBase>(NAGOYA_DEFAULT);
  const [visited, setVisited] = useState<VisitRecord[]>([]);
  const [visitedOpen, setVisitedOpen] = useState(false);
  const weekend = isWeekend();
  const label = weekendLabel();

  useEffect(() => {
    setHome(loadHome());
    setVisited(getUniqueVisits(loadVisits()));
  }, []);

  useEffect(() => {
    function onFocus() {
      setVisited(getUniqueVisits(loadVisits()));
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  return (
    <div className="flex flex-col min-h-screen px-5 pt-6 pb-10 safe-top safe-bottom">
      <header className="mb-6">
        <div className="text-sm text-stone-500 dark:text-stone-400">{label}</div>
        <h1 className="mt-1 text-3xl font-bold text-stone-900 dark:text-stone-100">
          週末ナビ
        </h1>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">
          家族でどこ行く？ をタップで決める
        </p>
      </header>

      <div className="mb-6">
        <WeatherBanner home={home} />
      </div>

      <Link
        href="/decide"
        className={[
          "block rounded-3xl px-6 py-8 text-center shadow-lg transition-all active:scale-[0.98]",
          weekend
            ? "bg-gradient-to-br from-orange-500 to-amber-500 text-white"
            : "bg-gradient-to-br from-orange-400 to-amber-400 text-white",
        ].join(" ")}
      >
        <div className="text-5xl" aria-hidden>
          🗺️
        </div>
        <div className="mt-3 text-xl font-bold">
          {weekend ? "今日のお出かけを決める" : "次の週末を計画する"}
        </div>
        <div className="mt-1 text-sm opacity-90">
          {weekend ? "5分以内・タップだけで完了" : "天気と気分で3〜5件提案"}
        </div>
      </Link>

      <section className="mt-6 rounded-3xl bg-green-50/80 dark:bg-stone-800/80 border-2 border-green-100 dark:border-stone-700 px-4 py-4">
        <button
          type="button"
          onClick={() => setVisitedOpen((o) => !o)}
          className="w-full flex items-center justify-between gap-3 min-h-11 text-left active:scale-[0.99] transition-transform"
          aria-expanded={visitedOpen}
          aria-controls="visited-list-panel"
        >
          <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
            行った！
          </h2>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-medium text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-950/50 px-2 py-1 rounded-full">
              {visited.length}件
            </span>
            <span
              className="text-stone-400 dark:text-stone-500 text-sm"
              aria-hidden
            >
              {visitedOpen ? "▲" : "▼"}
            </span>
          </div>
        </button>
        {!visitedOpen && visited.length > 0 ? (
          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
            タップして地域別の一覧を表示
          </p>
        ) : null}
        {visitedOpen ? (
          <div id="visited-list-panel" className="mt-3">
            <VisitedList visits={visited} compact grouped />
          </div>
        ) : null}
      </section>

      <nav className="mt-6 grid grid-cols-2 gap-3">
        <Link
          href="/favorites"
          className="rounded-2xl bg-white dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-700 px-4 py-5 text-center font-bold text-stone-700 dark:text-stone-200 active:scale-[0.98]"
        >
          <div className="text-3xl mb-1" aria-hidden>⭐</div>
          お気に入り
        </Link>
        <Link
          href="/settings"
          className="rounded-2xl bg-white dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-700 px-4 py-5 text-center font-bold text-stone-700 dark:text-stone-200 active:scale-[0.98]"
        >
          <div className="text-3xl mb-1" aria-hidden>⚙️</div>
          設定
        </Link>
      </nav>

      <div className="mt-auto pt-8 text-center text-xs text-stone-400 dark:text-stone-500">
        天気: Open-Meteo / 地図: Google Maps
      </div>
    </div>
  );
}
