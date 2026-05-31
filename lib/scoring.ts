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

function distanceKm(a: HomeBase, b: Pick<Place, "lat" | "lng">): number {
  const R = 6371;
  const toRad = (n: number) => (n * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
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
): boolean {
  if (!place.duration.includes(choices.duration)) return false;

  if (BUDGET_RANK[place.budget] > BUDGET_RANK[choices.budget]) return false;

  if (!place.transport.includes(choices.transport)) return false;

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
  visits: VisitRecord[],
  favoriteIds: Set<string>,
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

  if (favoriteIds.has(place.id)) {
    score += 2;
    reasons.push("お気に入り");
  }

  const recentVisit = visits.find((v) => v.placeId === place.id);
  if (recentVisit) {
    const daysAgo =
      (Date.now() - new Date(recentVisit.visitedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysAgo < 30) {
      score -= 8;
      reasons.push(`行った！済み (${Math.floor(daysAgo)}日前)`);
    } else if (daysAgo < 90) {
      score -= 4;
      reasons.push("最近行った");
    }
  }

  const km = distanceKm(home, place);
  if (km < 5) {
    score += 2;
    reasons.push(`${home.label}から近い (約${Math.round(km)}km)`);
  } else if (km < 15) {
    score += 1;
  } else if (km > 50) {
    score -= 2;
  }

  if (place.budget === "free" && choices.budget !== "high") {
    score += 1;
    reasons.push("入場無料");
  }

  if (place.source === "favorite") {
    score += 1;
  }

  return { place, score, reasons };
}

export type RankOptions = {
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
  options: RankOptions = {},
): ScoredPlace[] {
  const { limit = 5, jitter = true } = options;
  const filtered = places.filter((p) => passesHardFilter(p, choices, weather));
  const scored = filtered.map((p) =>
    scorePlace(p, choices, weather, home, visits, favoriteIds),
  );

  scored.sort((a, b) => {
    const aScore = a.score + (jitter ? Math.random() * 0.5 : 0);
    const bScore = b.score + (jitter ? Math.random() * 0.5 : 0);
    return bScore - aScore;
  });

  return scored.slice(0, limit);
}
