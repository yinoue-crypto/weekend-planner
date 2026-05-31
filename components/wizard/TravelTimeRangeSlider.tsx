"use client";

import { formatTravelMinutes } from "@/lib/distance";
import type { Transport, TravelTimeRange } from "@/lib/types";
import { TRAVEL_TIME_LIMITS } from "@/lib/types";

type Props = {
  transport: Transport;
  value: TravelTimeRange;
  onChange: (range: TravelTimeRange) => void;
};

const TRANSPORT_LABEL: Record<Transport, string> = {
  car: "車で",
  train: "電車で",
  walk: "徒歩で",
};

function clampRange(minMinutes: number, maxMinutes: number): TravelTimeRange {
  const { min, max, step } = TRAVEL_TIME_LIMITS;
  const snap = (n: number) => Math.round(Math.min(Math.max(n, min), max) / step) * step;
  let lo = snap(minMinutes);
  let hi = snap(maxMinutes);
  if (lo > hi) [lo, hi] = [hi, lo];
  return { minMinutes: lo, maxMinutes: hi };
}

export default function TravelTimeRangeSlider({ transport, value, onChange }: Props) {
  const { min, max, step } = TRAVEL_TIME_LIMITS;
  const { minMinutes, maxMinutes } = value;
  const span = max - min || 1;
  const minPct = ((minMinutes - min) / span) * 100;
  const maxPct = ((maxMinutes - min) / span) * 100;

  function setMin(next: number) {
    onChange(clampRange(next, maxMinutes));
  }

  function setMax(next: number) {
    onChange(clampRange(minMinutes, next));
  }

  const label = TRANSPORT_LABEL[transport];
  const isWideOpen = minMinutes <= min && maxMinutes >= max;

  return (
    <div className="rounded-2xl border-2 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-4 py-4">
      <div className="flex items-baseline justify-between gap-2 mb-4">
        <p className="text-sm font-bold text-stone-700 dark:text-stone-200">
          📍 {label}何分くらいまで？
        </p>
        <p className="text-sm font-bold text-orange-600 dark:text-orange-400 tabular-nums text-right">
          {isWideOpen ? (
            "制限なし"
          ) : minMinutes === maxMinutes ? (
            formatTravelMinutes(minMinutes)
          ) : (
            <>
              {formatTravelMinutes(minMinutes)}
              <span className="text-stone-400 dark:text-stone-500 font-normal mx-0.5">
                〜
              </span>
              {formatTravelMinutes(maxMinutes)}
            </>
          )}
        </p>
      </div>

      <div className="relative h-10 mx-1">
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-2 rounded-full bg-stone-200 dark:bg-stone-700" />
        <div
          className="absolute top-1/2 -translate-y-1/2 h-2 rounded-full bg-orange-400 dark:bg-orange-500"
          style={{
            left: `${minPct}%`,
            width: `${Math.max(maxPct - minPct, 0)}%`,
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={minMinutes}
          onChange={(e) => setMin(Number(e.target.value))}
          className="travel-time-range absolute inset-x-0 w-full h-10 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto z-20"
          aria-label="最短の移動時間"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={maxMinutes}
          onChange={(e) => setMax(Number(e.target.value))}
          className="travel-time-range absolute inset-x-0 w-full h-10 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto z-30"
          aria-label="最長の移動時間"
        />
      </div>

      <div className="flex justify-between text-xs text-stone-500 dark:text-stone-400 mt-1 tabular-nums">
        <span>{min}分</span>
        <span>{max}分</span>
      </div>

      <p className="mt-3 text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
        拠点（設定のホーム）からの直線距離を{label}の目安時間に換算して絞り込みます。左のつまみが最短、右が最長です。
      </p>
    </div>
  );
}
