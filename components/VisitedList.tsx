"use client";

import { googleMapsSearchUrl } from "@/lib/googleMapsUrl";
import { formatVisitedAt, groupVisitsByRegion } from "@/lib/visits";
import type { VisitRecord } from "@/lib/types";

type Props = {
  visits: VisitRecord[];
  onRemove?: (placeId: string) => void;
  compact?: boolean;
  grouped?: boolean;
};

function VisitRow({
  v,
  onRemove,
  compact,
}: {
  v: VisitRecord;
  onRemove?: (placeId: string) => void;
  compact?: boolean;
}) {
  return (
    <li
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
          {formatVisitedAt(v.visitedAt)}
        </div>
      </div>
      <div className="flex shrink-0 gap-1">
        {v.lat !== 0 || v.lng !== 0 ? (
          <a
            href={googleMapsSearchUrl({ name: v.placeName, lat: v.lat, lng: v.lng })}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs px-2 py-1 rounded-lg bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-200 min-h-11 flex items-center"
          >
            地図
          </a>
        ) : null}
        {onRemove ? (
          <button
            type="button"
            onClick={() => onRemove(v.placeId)}
            className="text-xs px-2 py-1 rounded-lg text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700 min-h-11"
            aria-label={`${v.placeName}を行ったリストから削除`}
          >
            削除
          </button>
        ) : null}
      </div>
    </li>
  );
}

export default function VisitedList({ visits, onRemove, compact, grouped }: Props) {
  if (visits.length === 0) {
    return (
      <p className="text-sm text-stone-500 dark:text-stone-400 py-2">
        まだ記録がありません。候補で「行った！」を押すとここに追加されます。
      </p>
    );
  }

  if (grouped) {
    const groups = groupVisitsByRegion(visits);
    return (
      <div className="space-y-4">
        {groups.map((g) => (
          <section key={g.region}>
            <h3 className="text-sm font-bold text-stone-700 dark:text-stone-300 mb-2 flex items-center gap-2">
              <span>{g.region}</span>
              <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
                {g.visits.length}件
              </span>
            </h3>
            <ul className="space-y-2">
              {g.visits.map((v) => (
                <VisitRow key={v.placeId} v={v} onRemove={onRemove} compact={compact} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {visits.map((v) => (
        <VisitRow key={v.placeId} v={v} onRemove={onRemove} compact={compact} />
      ))}
    </ul>
  );
}
