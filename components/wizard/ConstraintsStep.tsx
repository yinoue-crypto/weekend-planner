"use client";

import Chip from "./Chip";
import TravelTimeRangeSlider from "./TravelTimeRangeSlider";
import type { Budget, Duration, Transport, TravelTimeRange } from "@/lib/types";

type Props = {
  duration: Duration;
  budget: Budget;
  transport: Transport;
  travelTimeRange: TravelTimeRange;
  onChange: (next: {
    duration?: Duration;
    budget?: Budget;
    transport?: Transport;
    travelTimeRange?: TravelTimeRange;
  }) => void;
};

const DURATION_OPTS: { value: Duration; label: string; icon: string }[] = [
  { value: "half", label: "半日（〜4時間）", icon: "🕐" },
  { value: "full", label: "1日たっぷり", icon: "🕘" },
];

const BUDGET_OPTS: { value: Budget; label: string; icon: string }[] = [
  { value: "free", label: "無料中心", icon: "🆓" },
  { value: "low", label: "〜3,000円/人", icon: "💴" },
  { value: "medium", label: "〜6,000円/人", icon: "💰" },
  { value: "high", label: "気にしない", icon: "💎" },
];

const TRANSPORT_OPTS: { value: Transport; label: string; icon: string }[] = [
  { value: "car", label: "車で行く", icon: "🚗" },
  { value: "train", label: "電車で行く", icon: "🚃" },
  { value: "walk", label: "徒歩・自転車", icon: "🚶" },
];

export default function ConstraintsStep({
  duration,
  budget,
  transport,
  travelTimeRange,
  onChange,
}: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-bold text-stone-500 dark:text-stone-400 mb-2">
          ⏱ どれくらいの時間？
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {DURATION_OPTS.map((opt) => (
            <Chip
              key={opt.value}
              selected={duration === opt.value}
              onClick={() => onChange({ duration: opt.value })}
              icon={opt.icon}
            >
              {opt.label}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-bold text-stone-500 dark:text-stone-400 mb-2">
          💴 予算は？
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {BUDGET_OPTS.map((opt) => (
            <Chip
              key={opt.value}
              selected={budget === opt.value}
              onClick={() => onChange({ budget: opt.value })}
              icon={opt.icon}
            >
              {opt.label}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-bold text-stone-500 dark:text-stone-400 mb-2">
          🚗 移動手段は？
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {TRANSPORT_OPTS.map((opt) => (
            <Chip
              key={opt.value}
              selected={transport === opt.value}
              onClick={() => onChange({ transport: opt.value })}
              icon={opt.icon}
            >
              {opt.label}
            </Chip>
          ))}
        </div>
      </div>

      <TravelTimeRangeSlider
        transport={transport}
        value={travelTimeRange}
        onChange={(travelTimeRange) => onChange({ travelTimeRange })}
      />
    </div>
  );
}
