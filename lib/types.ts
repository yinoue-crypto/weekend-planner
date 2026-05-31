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

export type Duration = "half" | "full";
export type Budget = "free" | "low" | "medium" | "high";
export type Transport = "car" | "train" | "walk";

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
  ageMin?: AgeGroup;
  ageMax?: AgeGroup;
  duration: Duration[];
  budget: Budget;
  transport: Transport[];
  description: string;
  source: "seed" | "favorite" | "osm";
};

export type SessionChoices = {
  family: FamilyProfile;
  moods: Mood[];
  duration: Duration;
  budget: Budget;
  transport: Transport;
  preferIndoor: boolean;
};

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
};
