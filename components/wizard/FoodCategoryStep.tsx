"use client";

import Chip from "./Chip";
import type { FoodCategory } from "@/lib/types";
import { FOOD_CATEGORY_ICONS, FOOD_CATEGORY_LABELS, FOOD_CATEGORY_ORDER } from "@/lib/types";

type Props = {
  selected: FoodCategory[];
  onChange: (categories: FoodCategory[]) => void;
};

export default function FoodCategoryStep({ selected, onChange }: Props) {
  function toggle(category: FoodCategory) {
    if (selected.includes(category)) {
      onChange(selected.filter((c) => c !== category));
    } else {
      onChange([...selected, category]);
    }
  }

  return (
    <div className="mt-6 pt-6 border-t border-stone-200 dark:border-stone-700">
      <h2 className="text-sm font-bold text-stone-500 dark:text-stone-400 mb-1">
        🍽️ 何が食べたい？
      </h2>
      <p className="text-xs text-stone-500 dark:text-stone-400 mb-3">
        複数選べます（最低1つ）。選んだジャンルのお店だけ提案します
      </p>
      <div className="grid grid-cols-2 gap-2">
        {FOOD_CATEGORY_ORDER.map((category) => (
          <Chip
            key={category}
            selected={selected.includes(category)}
            onClick={() => toggle(category)}
            icon={FOOD_CATEGORY_ICONS[category]}
          >
            {FOOD_CATEGORY_LABELS[category]}
          </Chip>
        ))}
      </div>
    </div>
  );
}
