import type { ParsedLocation } from "./googleMapsUrl";

const NOMINATIM = "https://nominatim.openstreetmap.org/search";

/** 全角数字・ハイフンを半角にそろえる */
export function normalizeJapaneseAddress(input: string): string {
  const tr: Record<string, string> = {
    "０": "0",
    "１": "1",
    "２": "2",
    "３": "3",
    "４": "4",
    "５": "5",
    "６": "6",
    "７": "7",
    "８": "8",
    "９": "9",
    "－": "-",
    "−": "-",
    "ー": "-",
  };
  let s = input.trim();
  for (const [from, to] of Object.entries(tr)) {
    s = s.split(from).join(to);
  }
  return s.replace(/〒/g, "").replace(/\s+/g, " ").trim();
}

export function extractPostalCode(address: string): string | null {
  const m = address.match(/\d{3}-\d{4}/);
  return m ? m[0] : null;
}

/** maps?q= の住所文字列から表示名らしき部分を拾う */
export function labelFromMapsQuery(raw: string): string {
  const q = normalizeJapaneseAddress(raw);
  const parts = q.split(/[\s+]+/).filter(Boolean);
  const last = parts[parts.length - 1];
  if (
    last &&
    last.length <= 40 &&
    !/[都道府県市区町村丁目番地号]/.test(last) &&
    !/^\d{3}-\d{4}$/.test(last)
  ) {
    return last;
  }
  const withoutPostal = parts.filter((p) => !/^\d{3}-\d{4}$/.test(p));
  if (withoutPostal.length > 0) {
    return withoutPostal[withoutPostal.length - 1].slice(0, 40);
  }
  return "登録した場所";
}

function isCoordQuery(q: string): boolean {
  return /^-?\d+(?:\.\d+)?[,\s]+-?\d+(?:\.\d+)?$/.test(q.trim());
}

/** Google Maps URL の q= が座標でなければ住所文字列を返す */
export function extractAddressQueryFromMapsUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const q = u.searchParams.get("q")?.trim();
    if (!q || isCoordQuery(q)) return null;
    return q;
  } catch {
    return null;
  }
}

async function nominatimSearch(q: string): Promise<ParsedLocation | null> {
  const params = new URLSearchParams({
    q,
    format: "json",
    limit: "1",
    countrycodes: "jp",
  });
  const res = await fetch(`${NOMINATIM}?${params}`, {
    headers: {
      "User-Agent":
        "WeekendPlanner/1.0 (https://github.com/yinoue-crypto/weekend-planner)",
    },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { lat: string; lon: string; display_name: string }[];
  if (!data.length) return null;
  const hit = data[0];
  const lat = parseFloat(hit.lat);
  const lng = parseFloat(hit.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const shortName = hit.display_name.split(",").slice(0, 2).join(",").trim();
  return { name: shortName, lat, lng };
}

/**
 * 日本の住所文字列をジオコーディング（郵便番号へのフォールバックあり）
 */
export async function geocodeJapaneseAddress(
  raw: string,
  fallbackName = "登録した場所",
): Promise<ParsedLocation | null> {
  const normalized = normalizeJapaneseAddress(raw);
  if (!normalized) return null;

  const label = labelFromMapsQuery(raw);
  const queries: string[] = [normalized];
  const postal = extractPostalCode(normalized);
  if (postal && !queries.includes(postal)) {
    queries.push(postal);
  }

  for (const q of queries) {
    const hit = await nominatimSearch(q);
    if (hit) {
      return {
        lat: hit.lat,
        lng: hit.lng,
        name: label !== "登録した場所" ? label : hit.name || fallbackName,
      };
    }
  }

  return null;
}
