"use client";

import type { AgeGroup, FamilyProfile } from "@/lib/types";
import { AGE_LABELS } from "@/lib/types";

type Props = {
  family: FamilyProfile;
  onChange: (family: FamilyProfile) => void;
};

const AGE_ICONS: Record<AgeGroup, string> = {
  baby: "👶",
  toddler: "🧒",
  elementary: "🎒",
  teen: "🧑",
  adult: "🧑‍🦱",
};

const AGE_OPTIONS: AgeGroup[] = ["adult", "teen", "elementary", "toddler", "baby"];

export default function FamilyStep({ family, onChange }: Props) {
  const counts: Record<AgeGroup, number> = {
    adult: 0,
    teen: 0,
    elementary: 0,
    toddler: 0,
    baby: 0,
  };
  for (const m of family.members) counts[m.ageGroup]++;

  function setCount(age: AgeGroup, delta: number) {
    const next = Math.max(0, Math.min(9, counts[age] + delta));
    const members: FamilyProfile["members"] = [];
    for (const a of AGE_OPTIONS) {
      const c = a === age ? next : counts[a];
      for (let i = 0; i < c; i++) members.push({ ageGroup: a });
    }
    onChange({ members });
  }

  return (
    <div className="space-y-3">
      {AGE_OPTIONS.map((age) => (
        <div
          key={age}
          className="flex items-center gap-3 rounded-2xl border-2 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-4 py-3"
        >
          <span className="text-3xl" aria-hidden>
            {AGE_ICONS[age]}
          </span>
          <div className="flex-1">
            <div className="font-semibold text-stone-800 dark:text-stone-100">
              {AGE_LABELS[age]}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCount(age, -1)}
              disabled={counts[age] === 0}
              className="w-10 h-10 rounded-full bg-stone-100 dark:bg-stone-700 disabled:opacity-30 text-xl font-bold active:scale-95"
              aria-label={`${AGE_LABELS[age]}を1人減らす`}
            >
              −
            </button>
            <span className="w-6 text-center text-xl font-bold text-stone-900 dark:text-stone-100">
              {counts[age]}
            </span>
            <button
              type="button"
              onClick={() => setCount(age, +1)}
              className="w-10 h-10 rounded-full bg-orange-500 text-white text-xl font-bold active:scale-95"
              aria-label={`${AGE_LABELS[age]}を1人増やす`}
            >
              +
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
