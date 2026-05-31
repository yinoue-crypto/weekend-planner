/**
 * OpenStreetMap 要素 → Place 変換（import スクリプト用）
 */
import type {
  AgeGroup,
  Budget,
  FoodCategory,
  Mood,
  Place,
  PlaceTag,
} from "./types";

/** 名古屋圏の取得範囲（南,西,北,東） */
export const NAGOYA_REGION_BBOX = {
  south: 34.92,
  west: 136.72,
  north: 35.38,
  east: 137.15,
} as const;

export type OsmElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

const NAME_BLOCK =
  /^(.*)(コンビニ|ATM|ＡＴＭ|駐車場|トイレ|更衣室|券売機|自販機|コインランドリー|ガソリンスタンド|ENEOS|セブン|ローソン|ファミリーマート|ミニストップ|デイリーヤマザキ)(.*)$/i;

/** 分割クエリ（Overpass タイムアウト・接続切れ対策） */
export function buildOverpassQueries(bbox = NAGOYA_REGION_BBOX): string[] {
  const { south, west, north, east } = bbox;
  const box = `(${south},${west},${north},${east})`;
  return [
    `[out:json][timeout:90];(nwr["tourism"~"^(museum|attraction|zoo|aquarium|theme_park|gallery|viewpoint)$"]["name"]${box};);out center tags;`,
    `[out:json][timeout:90];(nwr["leisure"~"^(garden|playground|nature_reserve|water_park)$"]["name"]${box};);out center tags;`,
    `[out:json][timeout:90];(nwr["leisure"="park"]["name"]["wikipedia"]${box};);out center tags;`,
    `[out:json][timeout:90];(nwr["leisure"="park"]["name"]["website"]${box};);out center tags;`,
    `[out:json][timeout:90];(nwr["historic"~"^(castle|monument|archaeological_site|ruins|temple|shrine)$"]["name"]${box};);out center tags;`,
    `[out:json][timeout:90];(nwr["amenity"~"^(restaurant|cafe)$"]["cuisine"]["name"]${box};);out center tags;`,
  ];
}

const HISTORIC_ALLOW = new Set([
  "castle",
  "monument",
  "archaeological_site",
  "ruins",
  "temple",
  "shrine",
]);

/** 取り込み対象か（Overpass 後の追加フィルタ） */
export function shouldIncludeOsmTags(tags: Record<string, string>): boolean {
  if (tags.leisure === "park") {
    return Boolean(tags.wikipedia || tags.wikidata || tags.website);
  }
  if (tags.historic) {
    return HISTORIC_ALLOW.has(tags.historic);
  }
  if (tags.amenity === "restaurant" || tags.amenity === "cafe") {
    return Boolean(tags.cuisine?.trim());
  }
  if (tags.amenity === "fast_food") return false;
  if (tags.tourism === "artwork") return false;
  return true;
}

function pickName(tags: Record<string, string>): string | null {
  const name =
    tags["name:ja"]?.trim() ||
    tags.name?.trim() ||
    tags["name:en"]?.trim() ||
    null;
  if (!name || name.length < 2) return null;
  if (NAME_BLOCK.test(name)) return null;
  return name.slice(0, 80);
}

function coords(el: OsmElement): { lat: number; lng: number } | null {
  if (el.lat != null && el.lon != null) {
    return { lat: el.lat, lng: el.lon };
  }
  if (el.center) {
    return { lat: el.center.lat, lng: el.center.lon };
  }
  return null;
}

function pickArea(tags: Record<string, string>): string {
  return (
    tags["addr:suburb"]?.trim() ||
    tags["addr:city"]?.trim() ||
    tags["addr:quarter"]?.trim() ||
    "名古屋圏"
  ).slice(0, 24);
}

function osmId(el: OsmElement): string {
  return `osm-${el.type}-${el.id}`;
}

function inferFromTourism(
  tourism: string,
): { tags: PlaceTag[]; moods: Mood[]; ageMin?: AgeGroup } {
  switch (tourism) {
    case "museum":
    case "gallery":
      return {
        tags: ["indoor", "museum", "rainy-day", "kids-ok", "teens-ok"],
        moods: ["culture", "learn"],
        ageMin: "toddler",
      };
    case "zoo":
      return {
        tags: ["outdoor", "zoo", "nature", "kids-ok", "stroller-ok"],
        moods: ["nature", "active"],
        ageMin: "baby",
      };
    case "aquarium":
      return {
        tags: ["indoor", "aquarium", "rainy-day", "kids-ok"],
        moods: ["nature", "learn"],
        ageMin: "toddler",
      };
    case "theme_park":
      return {
        tags: ["outdoor", "kids-ok", "teens-ok"],
        moods: ["thrill", "active"],
        ageMin: "toddler",
      };
    case "viewpoint":
    case "artwork":
      return {
        tags: ["outdoor", "view", "teens-ok"],
        moods: ["relax", "culture"],
        ageMin: "elementary",
      };
    default:
      return {
        tags: ["outdoor", "kids-ok", "teens-ok"],
        moods: ["culture", "relax"],
        ageMin: "toddler",
      };
  }
}

function inferFromLeisure(
  leisure: string,
): { tags: PlaceTag[]; moods: Mood[]; ageMin?: AgeGroup } {
  switch (leisure) {
    case "playground":
      return {
        tags: ["outdoor", "playground", "kids-ok", "stroller-ok", "free"],
        moods: ["active", "relax"],
        ageMin: "baby",
      };
    case "nature_reserve":
      return {
        tags: ["outdoor", "nature", "park"],
        moods: ["nature", "relax"],
        ageMin: "toddler",
      };
    case "water_park":
      return {
        tags: ["outdoor", "kids-ok", "teens-ok"],
        moods: ["active", "thrill"],
        ageMin: "elementary",
      };
    case "garden":
      return {
        tags: ["outdoor", "park", "nature", "view"],
        moods: ["relax", "nature"],
        ageMin: "toddler",
      };
    default:
      return {
        tags: ["outdoor", "park", "nature", "kids-ok", "free"],
        moods: ["nature", "relax"],
        ageMin: "baby",
      };
  }
}

function historicMeta(): { tags: PlaceTag[]; moods: Mood[]; ageMin?: AgeGroup } {
  return {
    tags: ["outdoor", "history", "teens-ok"],
    moods: ["culture", "relax"],
    ageMin: "elementary",
  };
}

function mapCuisine(cuisine: string): FoodCategory[] {
  const c = cuisine.toLowerCase();
  const out: FoodCategory[] = [];
  const add = (cat: FoodCategory) => {
    if (!out.includes(cat)) out.push(cat);
  };
  if (/ramen|ラーメン/.test(c)) add("ramen");
  if (/sushi|寿司/.test(c)) add("sushi");
  if (/italian|pizza|イタリア/.test(c)) add("italian");
  if (/chinese|中華/.test(c)) add("chinese");
  if (/curry|カレー/.test(c)) add("curry");
  if (/burger|ハンバーガ/.test(c)) add("hamburger");
  if (/cafe|coffee|カフェ|コーヒー/.test(c)) add("cafe");
  if (/japanese|和食|うどん|そば/.test(c)) add("udon-soba");
  if (/seafood|魚|海鮮/.test(c)) add("seafood");
  if (/yakiniku|焼肉/.test(c)) add("yakiniku");
  if (/izakaya|居酒屋/.test(c)) add("izakaya");
  if (/miso|味噌/.test(c)) add("miso-katsu");
  if (/unagi|ひつまぶし|あなご/.test(c)) add("hitsumabushi");
  if (/noodle|きしめん|名古屋/.test(c)) add("nagoya-meshi");
  if (/dessert|cake|sweet|スイーツ|甘味/.test(c)) add("sweets");
  if (out.length === 0) add("family");
  return out;
}

function inferRestaurant(
  tags: Record<string, string>,
): { tags: PlaceTag[]; moods: Mood[]; foodCategories: FoodCategory[] } {
  const amenity = tags.amenity ?? "";
  const isCafe = amenity === "cafe" || /cafe|coffee/.test(tags.cuisine ?? "");
  const placeTags: PlaceTag[] = isCafe
    ? ["indoor", "cafe", "food", "rainy-day", "kids-ok"]
    : ["indoor", "food", "rainy-day", "kids-ok"];
  const moods: Mood[] = ["food"];
  const foodCategories = mapCuisine(tags.cuisine ?? (isCafe ? "cafe" : "japanese"));
  return { tags: placeTags, moods, foodCategories };
}

function inferBudget(tags: Record<string, string>): Budget {
  const fee = tags.fee ?? tags.charge ?? "";
  if (/no|free|無料/i.test(fee)) return "free";
  return "low";
}

export function mapOsmElementToPlace(el: OsmElement): Place | null {
  const tags = el.tags;
  if (!tags) return null;
  if (!shouldIncludeOsmTags(tags)) return null;

  const name = pickName(tags);
  if (!name) return null;

  const pos = coords(el);
  if (!pos) return null;

  let meta: {
    tags: PlaceTag[];
    moods: Mood[];
    ageMin?: AgeGroup;
    foodCategories?: FoodCategory[];
  };

  if (tags.tourism) {
    meta = inferFromTourism(tags.tourism);
  } else if (tags.leisure) {
    meta = inferFromLeisure(tags.leisure);
  } else if (tags.historic) {
    meta = historicMeta();
  } else if (
    tags.amenity === "restaurant" ||
    tags.amenity === "cafe" ||
    tags.amenity === "fast_food"
  ) {
    const r = inferRestaurant(tags);
    meta = r;
  } else {
    return null;
  }

  const description =
    tags.description?.trim()?.slice(0, 120) ||
    `OpenStreetMapより（${tags.tourism || tags.leisure || tags.historic || tags.amenity || "スポット"}）`;

  const place: Place = {
    id: osmId(el),
    name,
    area: pickArea(tags),
    lat: pos.lat,
    lng: pos.lng,
    tags: meta.tags,
    moods: meta.moods,
    duration: ["half", "full"],
    budget: inferBudget(tags),
    transport: ["car", "train", "walk"],
    description,
    source: "osm",
  };

  if (meta.ageMin) place.ageMin = meta.ageMin;
  if (meta.foodCategories?.length) place.foodCategories = meta.foodCategories;

  return place;
}

/** 近傍・同名で重複を除く */
export function dedupePlaces(places: Place[], minDistanceM = 80): Place[] {
  const out: Place[] = [];
  for (const p of places) {
    const dup = out.some((q) => {
      if (normalizeName(p.name) !== normalizeName(q.name)) return false;
      return haversineM(p.lat, p.lng, q.lat, q.lng) < minDistanceM;
    });
    if (!dup) out.push(p);
  }
  return out;
}

function normalizeName(name: string): string {
  return name.replace(/\s/g, "").toLowerCase();
}

function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** 手入れシードと近い重複を除外（シード優先） */
export function filterNearSeed(
  osmPlaces: Place[],
  seedPlaces: Place[],
  maxDistanceM = 250,
): Place[] {
  return osmPlaces.filter((p) => {
    const pNorm = normalizeName(p.name);
    return !seedPlaces.some((s) => {
      if (normalizeName(s.name) !== pNorm) return false;
      return haversineM(p.lat, p.lng, s.lat, s.lng) < maxDistanceM;
    });
  });
}
