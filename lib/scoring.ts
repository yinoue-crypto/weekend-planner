import { distanceKm, estimateTravelMinutes, formatTravelMinutes } from "./distance";
import { placeMatchesFoodCategories, sessionWantsFood } from "./food";
import { getUniqueVisits } from "./visits";
import { FOOD_CATEGORY_LABELS } from "./types";
import type {
  AgeGroup,
  FamilyProfile,
  HomeBase,
  Place,
  ScoredPlace,
  SessionChoices,
  VisitRecord,
  WeatherSnapshot,
} from "./types";

const AGE_ORDER: AgeGroup[] = ["baby", "toddler", "elementary", "teen", "adult"];

function ageIndex(age: AgeGroup): number {
  return AGE_ORDER.indexOf(age);
}

function youngestAge(family: FamilyProfile): AgeGroup {
  if (family.members.length === 0) return "adult";
  return family.members.reduce<AgeGroup>((min, m) => {
    return ageIndex(m.ageGroup) < ageIndex(min) ? m.ageGroup : min;
  }, "adult");
}

function hasBaby(family: FamilyProfile): boolean {
  return family.members.some((m) => m.ageGroup === "baby" || m.ageGroup === "toddler");
}

const BUDGET_RANK: Record<Place["budget"], number> = {
  free: 0,
  low: 1,
  medium: 2,
  high: 3,
};

function passesHardFilter(
  place: Place,
  choices: SessionChoices,
  weather: WeatherSnapshot | null,
  home: HomeBase,
): boolean {
  if (!place.duration.includes(choices.duration)) return false;

  if (BUDGET_RANK[place.budget] > BUDGET_RANK[choices.budget]) return false;

  if (!place.transport.includes(choices.transport)) return false;

  const { minMinutes, maxMinutes } = choices.travelTimeRange;
  const travelMinutes = estimateTravelMinutes(
    distanceKm(home, place),
    choices.transport,
  );
  if (travelMinutes < minMinutes || travelMinutes > maxMinutes) return false;

  const youngest = youngestAge(choices.family);
  if (place.ageMin && ageIndex(youngest) < ageIndex(place.ageMin)) return false;

  if (
    weather &&
    (weather.condition === "rain" || weather.condition === "snow") &&
    !place.tags.includes("indoor") &&
    !place.tags.includes("rainy-day")
  ) {
    return false;
  }

  if (choices.preferIndoor && !place.tags.includes("indoor") && !place.tags.includes("rainy-day")) {
    return false;
  }

  if (sessionWantsFood(choices)) {
    if (!placeMatchesFoodCategories(place, choices.foodCategories)) {
      return false;
    }
  }

  return true;
}

function scorePlace(
  place: Place,
  choices: SessionChoices,
  weather: WeatherSnapshot | null,
  home: HomeBase,
): ScoredPlace {
  let score = 0;
  const reasons: string[] = [];

  const moodMatches = place.moods.filter((m) => choices.moods.includes(m));
  if (moodMatches.length > 0) {
    score += moodMatches.length * 3;
    reasons.push(`気分にぴったり (${moodMatches.length}つ一致)`);
  }

  if (sessionWantsFood(choices) && place.foodCategories) {
    const foodMatches = place.foodCategories.filter((c) =>
      choices.foodCategories.includes(c),
    );
    if (foodMatches.length > 0) {
      score += foodMatches.length * 4;
      const labels = foodMatches.map((c) => FOOD_CATEGORY_LABELS[c]).slice(0, 2);
      reasons.push(`食べたいジャンル: ${labels.join("・")}`);
    }
  }

  if (weather) {
    if (
      (weather.condition === "rain" || weather.condition === "snow") &&
      (place.tags.includes("indoor") || place.tags.includes("rainy-day"))
    ) {
      score += 5;
      reasons.push("雨の日OK");
    }
    if (weather.condition === "clear" && place.tags.includes("outdoor")) {
      score += 3;
      reasons.push("晴れ日に気持ちいい屋外");
    }
  }

  if (hasBaby(choices.family)) {
    if (place.tags.includes("stroller-ok")) {
      score += 4;
      reasons.push("ベビーカーOK");
    }
    if (place.tags.includes("kids-ok")) {
      score += 2;
    }
  }

  const km = distanceKm(home, place);
  const travelMinutes = estimateTravelMinutes(km, choices.transport);
  if (travelMinutes <= 20) {
    score += 2;
    reasons.push(`${home.label}から${formatTravelMinutes(travelMinutes)}`);
  } else if (travelMinutes <= 45) {
    score += 1;
  } else if (travelMinutes > 90) {
    score -= 2;
  }

  if (place.budget === "free" && choices.budget !== "high") {
    score += 1;
    reasons.push("入場無料");
  }

  return { place, score, reasons };
}

function isExcludedFromSuggestions(
  placeId: string,
  visitedIds: Set<string>,
  favoriteIds: Set<string>,
  excludedIds: Set<string>,
): boolean {
  return (
    visitedIds.has(placeId) ||
    favoriteIds.has(placeId) ||
    excludedIds.has(placeId)
  );
}

export type RankOptions = {
  /** 省略時は条件に合う候補をすべて返す */
  limit?: number;
  jitter?: boolean;
};

export function rankPlaces(
  places: Place[],
  choices: SessionChoices,
  weather: WeatherSnapshot | null,
  home: HomeBase,
  visits: VisitRecord[],
  favoriteIds: Set<string>,
  excludedIds: Set<string> = new Set(),
  options: RankOptions = {},
): ScoredPlace[] {
  const { limit, jitter = true } = options;
  const visitedIds = new Set(getUniqueVisits(visits).map((v) => v.placeId));
  const filtered = places.filter(
    (p) =>
      passesHardFilter(p, choices, weather, home) &&
      !isExcludedFromSuggestions(p.id, visitedIds, favoriteIds, excludedIds),
  );
  const scored = filtered.map((p) => scorePlace(p, choices, weather, home));

  scored.sort((a, b) => {
    const aScore = a.score + (jitter ? Math.random() * 0.5 : 0);
    const bScore = b.score + (jitter ? Math.random() * 0.5 : 0);
    return bScore - aScore;
  });

  return limit !== undefined ? scored.slice(0, limit) : scored;
}
