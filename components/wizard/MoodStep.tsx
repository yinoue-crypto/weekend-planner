"use client";

import Chip from "./Chip";
import FoodCategoryStep from "./FoodCategoryStep";
import type { FoodCategory, Mood } from "@/lib/types";
import { MOOD_LABELS } from "@/lib/types";

type Props = {
  selected: Mood[];
  foodCategories: FoodCategory[];
  onChange: (moods: Mood[]) => void;
  onFoodCategoriesChange: (categories: FoodCategory[]) => void;
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
  onsen: "♨️",
};

const MOOD_ORDER: Mood[] = [
  "relax",
  "active",
  "nature",
  "culture",
  "food",
  "onsen",
  "shopping",
  "learn",
  "thrill",
];

export default function MoodStep({
  selected,
  foodCategories,
  onChange,
  onFoodCategoriesChange,
}: Props) {
  const foodSelected = selected.includes("food");

  function toggle(mood: Mood) {
    if (selected.includes(mood)) {
      const next = selected.filter((m) => m !== mood);
      onChange(next);
      if (mood === "food") onFoodCategoriesChange([]);
    } else {
      onChange([...selected, mood]);
    }
  }

  return (
    <div>
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
      {foodSelected ? (
        <FoodCategoryStep
          selected={foodCategories}
          onChange={onFoodCategoriesChange}
        />
      ) : null}
    </div>
  );
}
