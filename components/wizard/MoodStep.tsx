"use client";

import Chip from "./Chip";
import type { Mood } from "@/lib/types";
import { MOOD_LABELS } from "@/lib/types";

type Props = {
  selected: Mood[];
  onChange: (moods: Mood[]) => void;
};

const MOOD_ICONS: Record<Mood, string> = {
  relax: "🍵",
  active: "🏃",
  nature: "🌳",
  culture: "⛩️",
  food: "🍜",
  shopping: "🛍️",
  learn: "🔬",
  thrill: "🎢",
};

const MOOD_ORDER: Mood[] = [
  "relax",
  "active",
  "nature",
  "culture",
  "food",
  "shopping",
  "learn",
  "thrill",
];

export default function MoodStep({ selected, onChange }: Props) {
  function toggle(mood: Mood) {
    if (selected.includes(mood)) {
      onChange(selected.filter((m) => m !== mood));
    } else {
      onChange([...selected, mood]);
    }
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {MOOD_ORDER.map((mood) => (
        <Chip
          key={mood}
          selected={selected.includes(mood)}
          onClick={() => toggle(mood)}
          icon={MOOD_ICONS[mood]}
        >
          {MOOD_LABELS[mood]}
        </Chip>
      ))}
    </div>
  );
}
