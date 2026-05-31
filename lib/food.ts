import type { FoodCategory, Place, SessionChoices } from "./types";
import { FOOD_CATEGORY_LABELS, isRestaurantPlace } from "./types";

export function sessionWantsFood(choices: SessionChoices): boolean {
  return choices.moods.includes("food");
}

/** 飲食店（グルメ気分を選んだときだけ提案する） */
export function isFoodVenue(place: Place): boolean {
  if (isRestaurantPlace(place)) return true;
  return place.moods.length > 0 && place.moods.every((m) => m === "food");
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
