import type { VisitRecord } from "./types";

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
