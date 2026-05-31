import type { VisitRecord, VisitRegionGroup } from "./types";

/** 名古屋市16区（seed の area が区名のみのもの） */
export const NAGOYA_WARDS = [
  "千種区",
  "東区",
  "北区",
  "西区",
  "中村区",
  "中区",
  "昭和区",
  "瑞穂区",
  "熱田区",
  "中川区",
  "港区",
  "南区",
  "守山区",
  "緑区",
  "名東区",
  "天白区",
] as const;

const NAGOYA_WARD_SET = new Set<string>(NAGOYA_WARDS);

function normalizeVisit(raw: unknown): VisitRecord | null {
  if (!raw || typeof raw !== "object") return null;
  const v = raw as Partial<VisitRecord> & { placeId?: string; visitedAt?: string };
  if (!v.placeId || !v.visitedAt) return null;
  return {
    placeId: v.placeId,
    placeName: v.placeName ?? "不明な場所",
    placeArea: v.placeArea ?? "",
    lat: typeof v.lat === "number" ? v.lat : 0,
    lng: typeof v.lng === "number" ? v.lng : 0,
    visitedAt: v.visitedAt,
  };
}

export function normalizeVisits(raw: unknown[]): VisitRecord[] {
  return raw.map(normalizeVisit).filter((v): v is VisitRecord => v !== null);
}

/** Latest visit per place, newest first. */
export function getUniqueVisits(visits: VisitRecord[]): VisitRecord[] {
  const map = new Map<string, VisitRecord>();
  for (const v of visits) {
    const existing = map.get(v.placeId);
    if (!existing || new Date(v.visitedAt) > new Date(existing.visitedAt)) {
      map.set(v.placeId, v);
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.visitedAt).getTime() - new Date(a.visitedAt).getTime(),
  );
}

/** 一覧の地域ラベル（名古屋は区、それ以外は市名など） */
export function getVisitRegion(area: string): string {
  const trimmed = area.trim();
  if (!trimmed || trimmed === "登録地") return "その他";
  if (NAGOYA_WARD_SET.has(trimmed)) return trimmed;
  if (trimmed.endsWith("市")) return trimmed;
  return trimmed;
}

function compareRegions(a: string, b: string): number {
  const aWard = NAGOYA_WARDS.indexOf(a as (typeof NAGOYA_WARDS)[number]);
  const bWard = NAGOYA_WARDS.indexOf(b as (typeof NAGOYA_WARDS)[number]);
  if (aWard >= 0 && bWard >= 0) return aWard - bWard;
  if (aWard >= 0) return -1;
  if (bWard >= 0) return 1;
  if (a === "その他") return 1;
  if (b === "その他") return -1;
  return a.localeCompare(b, "ja");
}

/** 名古屋は区・その他は市単位でグループ化（区内は訪問日の新しい順） */
export function groupVisitsByRegion(visits: VisitRecord[]): VisitRegionGroup[] {
  const map = new Map<string, VisitRecord[]>();
  for (const v of visits) {
    const region = getVisitRegion(v.placeArea);
    const list = map.get(region) ?? [];
    list.push(v);
    map.set(region, list);
  }

  return Array.from(map.keys())
    .sort(compareRegions)
    .map((region) => ({
      region,
      visits: (map.get(region) ?? []).sort(
        (a, b) => new Date(b.visitedAt).getTime() - new Date(a.visitedAt).getTime(),
      ),
    }));
}

export function formatVisitedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days === 0) return "今日";
  if (days === 1) return "昨日";
  if (days < 7) return `${days}日前`;
  if (days < 30) return `${Math.floor(days / 7)}週間前`;
  return date.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" });
}
