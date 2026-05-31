"use client";

import type { Place, ScoredPlace } from "@/lib/types";
import { FOOD_CATEGORY_LABELS } from "@/lib/types";
import {
  googleMapsDirectionsUrl,
  googleMapsSearchUrl,
} from "@/lib/googleMapsUrl";

type Props = {
  scored: ScoredPlace;
  rank: number;
  favorited: boolean;
  onToggleFavorite: (place: Place) => void;
  onExclude: (place: Place) => void;
  onPick: (place: Place) => void;
};

const TAG_LABELS: Record<string, string> = {
  indoor: "屋内",
  outdoor: "屋外",
  "rainy-day": "雨OK",
  "stroller-ok": "ベビーカーOK",
  "kids-ok": "子どもOK",
  free: "無料",
  view: "景色",
  park: "公園",
  museum: "博物館",
  art: "アート",
  history: "歴史",
  nature: "自然",
  food: "グルメ",
  cafe: "カフェ",
  shopping: "ショッピング",
  mall: "モール",
  onsen: "温泉",
  playground: "遊具",
  zoo: "動物園",
  aquarium: "水族館",
  science: "科学",
  "hands-on": "体験",
};

export default function PlaceCard({
  scored,
  rank,
  favorited,
  onToggleFavorite,
  onExclude,
  onPick,
}: Props) {
  const { place, reasons } = scored;
  const mapsUrl = googleMapsSearchUrl(place);
  const directionsUrl = googleMapsDirectionsUrl(place);

  return (
    <div className="rounded-3xl bg-white dark:bg-stone-800 shadow-md overflow-hidden">
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-start gap-3">
          <div
            className={[
              "shrink-0 rounded-full w-10 h-10 flex items-center justify-center text-lg font-bold",
              rank === 1
                ? "bg-orange-500 text-white"
                : "bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300",
            ].join(" ")}
            aria-hidden
          >
            {rank}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 leading-tight">
              {place.name}
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{place.area}</p>
          </div>
          <button
            type="button"
            onClick={() => onToggleFavorite(place)}
            className="shrink-0 text-2xl active:scale-90 transition-transform"
            aria-label={favorited ? "お気に入り解除" : "お気に入り追加"}
          >
            {favorited ? "⭐" : "☆"}
          </button>
        </div>

        <p className="mt-3 text-sm text-stone-700 dark:text-stone-300">{place.description}</p>

        {reasons.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {reasons.slice(0, 3).map((r, i) => (
              <span
                key={i}
                className="text-xs px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200"
              >
                {r}
              </span>
            ))}
          </div>
        ) : null}

        {place.foodCategories && place.foodCategories.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {place.foodCategories.slice(0, 4).map((cat) => (
              <span
                key={cat}
                className="text-xs px-2 py-1 rounded-full bg-orange-100 dark:bg-orange-950/40 text-orange-800 dark:text-orange-200"
              >
                {FOOD_CATEGORY_LABELS[cat]}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-2 flex flex-wrap gap-1.5">
          {place.tags
            .filter((t) => TAG_LABELS[t])
            .slice(0, 5)
            .map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-1 rounded-full bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300"
              >
                {TAG_LABELS[tag]}
              </span>
            ))}
        </div>

        <button
          type="button"
          onClick={() => onExclude(place)}
          className="mt-3 w-full rounded-xl border-2 border-stone-200 dark:border-stone-600 py-2.5 text-sm font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700/50 active:scale-[0.98]"
        >
          🚫 提案から除外
        </button>
      </div>

      <div className="grid grid-cols-3 border-t border-stone-100 dark:border-stone-700">
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="py-3 text-center text-sm font-medium text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-700/50 active:bg-stone-100"
        >
          📍 地図
        </a>
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="py-3 text-center text-sm font-medium text-stone-700 dark:text-stone-200 border-l border-stone-100 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700/50 active:bg-stone-100"
        >
          🧭 ナビ
        </a>
        <button
          type="button"
          onClick={() => onPick(place)}
          className="py-3 text-center text-sm font-bold text-white bg-green-600 hover:bg-green-700 active:scale-[0.98]"
        >
          行った！
        </button>
      </div>
    </div>
  );
}
