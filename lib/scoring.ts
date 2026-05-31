import { distanceKm, estimateTravelMinutes, formatTravelMinutes } from "./distance";
import { getUniqueVisits } from "./visits";
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
import { MAX_SUGGESTION_RESULTS, TRAVEL_TIME_LIMITS } from "./types";

const AGE_ORDER: AgeGroup[] = ["baby", "toddler", "elementary", "teen", "adult"];

type RelaxedCriterion = "travelTime" | "budget" | "duration" | "transport";

const RELAX_TIERS: ReadonlySet<RelaxedCriterion>[] = [
  new Set(),
  new Set(["travelTime"]),
  new Set(["budget"]),
  new Set(["duration"]),
  new Set(["travelTime", "budget"]),
  new Set(["travelTime", "duration"]),
  new Set(["budget", "duration"]),
  new Set(["travelTime", "budget", "duration"]),
  new Set(["travelTime", "budget", "duration", "transport"]),
];

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
  relax: ReadonlySet<RelaxedCriterion> = new Set(),
): boolean {
  if (!relax.has("duration")) {
    if (!place.duration.includes(choices.duration)) return false;
  } else if (place.duration.length === 0) {
    return false;
  }

  const maxBudgetRank = relax.has("budget")
    ? BUDGET_RANK[choices.budget] + 1
    : BUDGET_RANK[choices.budget];
  if (BUDGET_RANK[place.budget] > maxBudgetRank) return false;

  if (!relax.has("transport")) {
    if (!place.transport.includes(choices.transport)) return false;
  }

  const travelMinutes = estimateTravelMinutes(
    distanceKm(home, place),
    choices.transport,
  );
  const { minMinutes, maxMinutes } = choices.travelTimeRange;
  if (!relax.has("travelTime")) {
    if (travelMinutes < minMinutes || travelMinutes > maxMinutes) return false;
  } else {
    if (travelMinutes < minMinutes || travelMinutes > TRAVEL_TIME_LIMITS.max) {
      return false;
    }
  }

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

function applyRelaxAdjustments(
  scored: ScoredPlace,
  choices: SessionChoices,
  home: HomeBase,
  relax: ReadonlySet<RelaxedCriterion>,
): void {
  if (relax.size === 0) return;

  const travelMinutes = estimateTravelMinutes(
    distanceKm(home, scored.place),
    choices.transport,
  );
  const { maxMinutes } = choices.travelTimeRange;

  if (relax.has("travelTime") && travelMinutes > maxMinutes) {
    scored.score -= 3;
    scored.reasons.push(`移動は${formatTravelMinutes(travelMinutes)}（希望より長め）`);
  }

  if (
    relax.has("budget") &&
    BUDGET_RANK[scored.place.budget] > BUDGET_RANK[choices.budget]
  ) {
    scored.score -= 4;
    scored.reasons.push("予算はやや上");
  }

  if (
    relax.has("duration") &&
    !scored.place.duration.includes(choices.duration)
  ) {
    scored.score -= 5;
    scored.reasons.push("1日かけて楽しむ向け");
  }

  if (
    relax.has("transport") &&
    !scored.place.transport.includes(choices.transport)
  ) {
    scored.score -= 4;
    const alt = scored.place.transport.includes("train")
      ? "電車"
      : scored.place.transport.includes("walk")
        ? "徒歩"
        : "車";
    scored.reasons.push(`${alt}向け`);
  }
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
  /** 省略時は MAX_SUGGESTION_RESULTS まで返す */
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
  const { limit = MAX_SUGGESTION_RESULTS, jitter = true } = options;
  const visitedIds = new Set(getUniqueVisits(visits).map((v) => v.placeId));
  const seen = new Set<string>();
  const tiered: { tier: number; scored: ScoredPlace }[] = [];

  for (let tier = 0; tier < RELAX_TIERS.length; tier += 1) {
    if (tiered.length >= limit) break;

    const relax = RELAX_TIERS[tier];
    for (const place of places) {
      if (seen.has(place.id)) continue;
      if (
        !passesHardFilter(place, choices, weather, home, relax) ||
        isExcludedFromSuggestions(place.id, visitedIds, favoriteIds, excludedIds)
      ) {
        continue;
      }

      const scored = scorePlace(place, choices, weather, home);
      applyRelaxAdjustments(scored, choices, home, relax);
      tiered.push({ tier, scored });
      seen.add(place.id);
      if (tiered.length >= limit) break;
    }
  }

  tiered.sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier;
    const aScore = a.scored.score + (jitter ? Math.random() * 0.5 : 0);
    const bScore = b.scored.score + (jitter ? Math.random() * 0.5 : 0);
    return bScore - aScore;
  });

  return tiered.map((entry) => entry.scored);
}
