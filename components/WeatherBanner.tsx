"use client";

import { useEffect, useState } from "react";
import { fetchWeather, weatherIcon } from "@/lib/weather";
import type { HomeBase, WeatherSnapshot } from "@/lib/types";

type Props = {
  home: HomeBase;
};

export default function WeatherBanner({ home }: Props) {
  const [snapshot, setSnapshot] = useState<WeatherSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    setSnapshot(null);
    setError(null);
    fetchWeather(home.lat, home.lng, ac.signal)
      .then(setSnapshot)
      .catch((err) => {
        if (ac.signal.aborted) return;
        setError(err instanceof Error ? err.message : "天気の取得に失敗");
      });
    return () => ac.abort();
  }, [home.lat, home.lng]);

  if (error) {
    return (
      <div className="rounded-2xl bg-amber-100 dark:bg-amber-900/30 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
        天気を取得できませんでした（{error}）
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="rounded-2xl bg-white/70 dark:bg-stone-800/70 px-4 py-3 text-sm text-stone-500 dark:text-stone-400 animate-pulse">
        天気を取得中…
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-orange-100 to-amber-50 dark:from-stone-800 dark:to-stone-900 px-4 py-3 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="text-3xl" aria-hidden>
          {weatherIcon(snapshot.condition)}
        </span>
        <div className="flex-1">
          <div className="text-sm text-stone-600 dark:text-stone-300">
            {home.label}・今日の天気
          </div>
          <div className="text-base font-semibold text-stone-900 dark:text-stone-100">
            {snapshot.description} ・ {snapshot.temperatureC}℃
          </div>
        </div>
        <div className="text-right text-xs text-stone-600 dark:text-stone-300">
          <div>降水確率</div>
          <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
            {snapshot.precipitationProbability}%
          </div>
        </div>
      </div>
    </div>
  );
}
