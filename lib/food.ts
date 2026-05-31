import type { FoodCategory, Place, SessionChoices } from "./types";
import { FOOD_CATEGORY_LABELS, isRestaurantPlace } from "./types";

export function sessionWantsFood(choices: SessionChoices): boolean {
  return choices.moods.includes("food");
}

export function placeMatchesFoodCategories(
  place: Place,
  selected: FoodCategory[],
): boolean {
  if (!isRestaurantPlace(place)) return false;
  if (selected.length === 0) return false;
  return place.foodCategories!.some((c) => selected.includes(c));
}

export function formatFoodCategoryLabels(categories: FoodCategory[]): string {
  return categories.map((c) => FOOD_CATEGORY_LABELS[c]).join("・");
}
