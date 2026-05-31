export type Mood =
  | "relax"
  | "active"
  | "nature"
  | "culture"
  | "food"
  | "shopping"
  | "learn"
  | "thrill";

export const MOOD_LABELS: Record<Mood, string> = {
  relax: "のんびり",
  active: "アクティブ",
  nature: "自然",
  culture: "文化・歴史",
  food: "グルメ",
  shopping: "ショッピング",
  learn: "学び・体験",
  thrill: "ワクワク",
};

/** グルメ検索時の料理ジャンル（飲食店のみに付与） */
export type FoodCategory =
  | "miso-katsu"
  | "hitsumabushi"
  | "nagoya-meshi"
  | "ramen"
  | "udon-soba"
  | "sushi"
  | "izakaya"
  | "yakiniku"
  | "chinese"
  | "italian"
  | "cafe"
  | "sweets"
  | "family"
  | "curry"
  | "hamburger"
  | "seafood";

export const FOOD_CATEGORY_LABELS: Record<FoodCategory, string> = {
  "miso-katsu": "味噌カツ",
  hitsumabushi: "ひつまぶし",
  "nagoya-meshi": "きしめん・名古屋めし",
  ramen: "ラーメン",
  "udon-soba": "うどん・そば",
  sushi: "寿司",
  izakaya: "居酒屋",
  yakiniku: "焼肉",
  chinese: "中華",
  italian: "イタリアン",
  cafe: "カフェ",
  sweets: "スイーツ",
  family: "ファミレス",
  curry: "カレー",
  hamburger: "ハンバーガー",
  seafood: "海鮮",
};

export const FOOD_CATEGORY_ORDER: FoodCategory[] = [
  "miso-katsu",
  "hitsumabushi",
  "nagoya-meshi",
  "ramen",
  "udon-soba",
  "sushi",
  "yakiniku",
  "izakaya",
  "chinese",
  "italian",
  "seafood",
  "curry",
  "hamburger",
  "family",
  "cafe",
  "sweets",
];

export const FOOD_CATEGORY_ICONS: Record<FoodCategory, string> = {
  "miso-katsu": "🐷",
  hitsumabushi: "🐟",
  "nagoya-meshi": "🍜",
  ramen: "🍥",
  "udon-soba": "🥢",
  sushi: "🍣",
  izakaya: "🍶",
  yakiniku: "🥩",
  chinese: "🥟",
  italian: "🍝",
  cafe: "☕",
  sweets: "🍰",
  family: "🍽️",
  curry: "🍛",
  hamburger: "🍔",
  seafood: "🦐",
};

export type Duration = "half" | "full";
export type Budget = "free" | "low" | "medium" | "high";
export type Transport = "car" | "train" | "walk";

/** 拠点からの移動時間（分）の探索範囲 */
export type TravelTimeRange = {
  minMinutes: number;
  maxMinutes: number;
};

export const TRAVEL_TIME_LIMITS = {
  min: 0,
  max: 120,
  step: 5,
} as const;

export const DEFAULT_TRAVEL_TIME_RANGE: TravelTimeRange = {
  minMinutes: 0,
  maxMinutes: 60,
};

/** 保存済みセッションなど欠損値を補正（未指定時はフィルタなし相当の 0〜120分） */
export function normalizeTravelTimeRange(
  range: Partial<TravelTimeRange> | undefined,
): TravelTimeRange {
  const { min, max, step } = TRAVEL_TIME_LIMITS;
  if (
    !range ||
    (typeof range.minMinutes !== "number" && typeof range.maxMinutes !== "number")
  ) {
    return { minMinutes: min, maxMinutes: max };
  }
  const snap = (n: number) => Math.round(n / step) * step;
  let minMinutes = snap(
    typeof range.minMinutes === "number" ? range.minMinutes : min,
  );
  let maxMinutes = snap(
    typeof range.maxMinutes === "number" ? range.maxMinutes : max,
  );
  minMinutes = Math.min(Math.max(minMinutes, min), max);
  maxMinutes = Math.min(Math.max(maxMinutes, min), max);
  if (minMinutes > maxMinutes) {
    [minMinutes, maxMinutes] = [maxMinutes, minMinutes];
  }
  return { minMinutes, maxMinutes };
}

export type AgeGroup = "baby" | "toddler" | "elementary" | "teen" | "adult";

export const AGE_LABELS: Record<AgeGroup, string> = {
  baby: "0〜1歳",
  toddler: "2〜5歳",
  elementary: "小学生",
  teen: "中高生",
  adult: "大人",
};

export type FamilyMember = {
  ageGroup: AgeGroup;
};

export type FamilyProfile = {
  members: FamilyMember[];
};

export type WeatherCondition = "clear" | "cloudy" | "rain" | "snow" | "unknown";

export type WeatherSnapshot = {
  condition: WeatherCondition;
  temperatureC: number;
  precipitationProbability: number;
  description: string;
  fetchedAt: string;
};

export type PlaceTag =
  | "indoor"
  | "outdoor"
  | "nature"
  | "museum"
  | "art"
  | "history"
  | "park"
  | "playground"
  | "zoo"
  | "aquarium"
  | "science"
  | "food"
  | "cafe"
  | "shopping"
  | "mall"
  | "onsen"
  | "stroller-ok"
  | "kids-ok"
  | "teens-ok"
  | "adults-only"
  | "rainy-day"
  | "view"
  | "free"
  | "hands-on";

export type Place = {
  id: string;
  name: string;
  area: string;
  lat: number;
  lng: number;
  tags: PlaceTag[];
  moods: Mood[];
  /** 飲食店のみ。グルメ検索のジャンル絞り込みに使用 */
  foodCategories?: FoodCategory[];
  ageMin?: AgeGroup;
  ageMax?: AgeGroup;
  duration: Duration[];
  budget: Budget;
  transport: Transport[];
  description: string;
  source: "seed" | "favorite" | "osm";
};

export function isRestaurantPlace(place: Place): boolean {
  return Array.isArray(place.foodCategories) && place.foodCategories.length > 0;
}

export function normalizeFoodCategories(
  categories: FoodCategory[] | undefined,
): FoodCategory[] {
  if (!categories?.length) return [];
  const valid = new Set<FoodCategory>(FOOD_CATEGORY_ORDER);
  return [...new Set(categories.filter((c) => valid.has(c)))];
}

export type SessionChoices = {
  family: FamilyProfile;
  moods: Mood[];
  /** グルメ選択時に必須。選んだジャンルの飲食店のみ提案 */
  foodCategories: FoodCategory[];
  duration: Duration;
  budget: Budget;
  transport: Transport;
  /** 拠点からの概算移動時間（分）の範囲 */
  travelTimeRange: TravelTimeRange;
  preferIndoor: boolean;
};

export function normalizeSessionChoices(
  choices: SessionChoices & {
    travelTimeRange?: TravelTimeRange;
    foodCategories?: FoodCategory[];
  },
): SessionChoices {
  return {
    ...choices,
    foodCategories: normalizeFoodCategories(choices.foodCategories),
    travelTimeRange: normalizeTravelTimeRange(choices.travelTimeRange),
  };
}

export type ScoredPlace = {
  place: Place;
  score: number;
  reasons: string[];
};

export type VisitRecord = {
  placeId: string;
  placeName: string;
  placeArea: string;
  lat: number;
  lng: number;
  visitedAt: string;
};

/** 「行った！」一覧の地域グループ（名古屋は区、その他は市など） */
export type VisitRegionGroup = {
  region: string;
  visits: VisitRecord[];
};

export type HomeBase = {
  label: string;
  lat: number;
  lng: number;
};

/** 提案から除外したスポット（戻す用に名前を保持） */
export type ExcludedPlace = {
  placeId: string;
  placeName: string;
  placeArea: string;
  excludedAt: string;
};

/** 家族コードで端末間共有するデータ（v1） */
export type FamilySyncPayload = {
  version: 1;
  updatedAt: string;
  family: FamilyProfile;
  home: HomeBase;
  favorites: Place[];
  visits: VisitRecord[];
  excluded: ExcludedPlace[];
};
