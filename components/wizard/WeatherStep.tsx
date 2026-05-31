"use client";

import { useEffect, useState } from "react";
import Chip from "./Chip";
import { fetchWeather, shouldPreferIndoor, weatherIcon } from "@/lib/weather";
import type { HomeBase, WeatherSnapshot } from "@/lib/types";

type Props = {
  home: HomeBase;
  preferIndoor: boolean;
  onChange: (next: { preferIndoor: boolean; weather: WeatherSnapshot | null }) => void;
};

export default function WeatherStep({ home, preferIndoor, onChange }: Props) {
  const [snapshot, setSnapshot] = useState<WeatherSnapshot | null>(null);
  const [autoApplied, setAutoApplied] = useState(false);

  useEffect(() => {
    const ac = new AbortController();
    fetchWeather(home.lat, home.lng, ac.signal)
      .then((w) => {
        setSnapshot(w);
        if (!autoApplied) {
          const suggested = shouldPreferIndoor(w);
          onChange({ preferIndoor: suggested, weather: w });
          setAutoApplied(true);
        } else {
          onChange({ preferIndoor, weather: w });
        }
      })
      .catch(() => {
        onChange({ preferIndoor, weather: null });
      });
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [home.lat, home.lng]);

  return (
    <div className="space-y-5">
      {snapshot ? (
        <div className="rounded-3xl bg-gradient-to-br from-orange-100 to-amber-50 dark:from-stone-800 dark:to-stone-900 px-5 py-6 text-center shadow-sm">
          <div className="text-6xl" aria-hidden>
            {weatherIcon(snapshot.condition)}
          </div>
          <div className="mt-3 text-xl font-bold text-stone-900 dark:text-stone-100">
            {snapshot.description}
          </div>
          <div className="mt-1 text-stone-700 dark:text-stone-300">
            {snapshot.temperatureC}℃ ・ 降水確率 {snapshot.precipitationProbability}%
          </div>
          <div className="mt-1 text-xs text-stone-500 dark:text-stone-400">
            {home.label} 周辺
          </div>
        </div>
      ) : (
        <div className="rounded-3xl bg-white dark:bg-stone-800 px-5 py-8 text-center text-stone-500 animate-pulse">
          天気を取得中…
        </div>
      )}

      <div>
        <h2 className="text-sm font-bold text-stone-500 dark:text-stone-400 mb-2">
          🏠 室内に絞る？
        </h2>
        <div className="grid grid-cols-2 gap-2">
          <Chip
            selected={!preferIndoor}
            onClick={() => onChange({ preferIndoor: false, weather: snapshot })}
            icon="🌤️"
          >
            屋内外こだわらない
          </Chip>
          <Chip
            selected={preferIndoor}
            onClick={() => onChange({ preferIndoor: true, weather: snapshot })}
            icon="🏛️"
          >
            室内中心がいい
          </Chip>
        </div>
        {snapshot && shouldPreferIndoor(snapshot) ? (
          <p className="mt-2 text-xs text-orange-700 dark:text-orange-300">
            ※ 天気から「室内中心」を自動で選びました
          </p>
        ) : null}
      </div>
    </div>
  );
}
