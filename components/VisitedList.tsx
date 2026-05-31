"use client";

import { googleMapsSearchUrl } from "@/lib/googleMapsUrl";
import { formatVisitedAt } from "@/lib/visits";
import type { VisitRecord } from "@/lib/types";

type Props = {
  visits: VisitRecord[];
  onRemove?: (placeId: string) => void;
  compact?: boolean;
};

export default function VisitedList({ visits, onRemove, compact }: Props) {
  if (visits.length === 0) {
    return (
      <p className="text-sm text-stone-500 dark:text-stone-400 py-2">
        まだ記録がありません。候補で「行った！」を押すとここに追加されます。
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {visits.map((v) => (
        <li
          key={v.placeId}
          className={[
            "flex items-center gap-3 rounded-2xl bg-white dark:bg-stone-800 border-2 border-stone-100 dark:border-stone-700",
            compact ? "px-3 py-2.5" : "px-4 py-3",
          ].join(" ")}
        >
          <div className="shrink-0 w-9 h-9 rounded-full bg-green-100 dark:bg-green-950/40 flex items-center justify-center text-lg">
            ✓
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-stone-900 dark:text-stone-100 truncate">
              {v.placeName}
            </div>
            <div className="text-xs text-stone-500 dark:text-stone-400">
              {v.placeArea ? `${v.placeArea} · ` : ""}
              {formatVisitedAt(v.visitedAt)}
            </div>
          </div>
          <div className="flex shrink-0 gap-1">
            {v.lat !== 0 || v.lng !== 0 ? (
              <a
                href={googleMapsSearchUrl({ name: v.placeName, lat: v.lat, lng: v.lng })}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs px-2 py-1 rounded-lg bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-200"
              >
                地図
              </a>
            ) : null}
            {onRemove ? (
              <button
                type="button"
                onClick={() => onRemove(v.placeId)}
                className="text-xs px-2 py-1 rounded-lg text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700"
                aria-label={`${v.placeName}を行ったリストから削除`}
              >
                削除
              </button>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
