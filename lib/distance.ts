import type { HomeBase, Transport } from "./types";

/** 直線距離から移動時間（分）を概算（市街地の平均速度想定） */
const SPEED_KMH: Record<Transport, number> = {
  car: 35,
  train: 25,
  walk: 4,
};

export function estimateTravelMinutes(km: number, transport: Transport): number {
  if (!Number.isFinite(km) || km <= 0) return 0;
  const speed = SPEED_KMH[transport];
  return Math.round((km / speed) * 60);
}

export function formatTravelMinutes(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes < 0) return "";
  if (minutes < 60) return `約${minutes}分`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `約${h}時間${m}分` : `約${h}時間`;
}

/** 2点間の距離（km）— 球面三角法 */
export function distanceKm(
  from: Pick<HomeBase, "lat" | "lng">,
  to: Pick<HomeBase, "lat" | "lng">,
): number {
  const R = 6371;
  const toRad = (n: number) => (n * Math.PI) / 180;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function hasValidCoords(point: { lat: number; lng: number }): boolean {
  return (
    Number.isFinite(point.lat) &&
    Number.isFinite(point.lng) &&
    !(point.lat === 0 && point.lng === 0)
  );
}

export function formatDistanceKm(km: number): string {
  if (!Number.isFinite(km) || km < 0) return "";
  if (km < 1) {
    const rounded = Math.round(km * 10) / 10;
    return `約${rounded < 0.1 ? 0.1 : rounded}km`;
  }
  return `約${Math.round(km)}km`;
}

/** 登録拠点からの距離（表示用）。座標が無効なら null */
export function formatDistanceFromHome(
  home: HomeBase,
  point: { lat: number; lng: number },
): string | null {
  if (!hasValidCoords(point)) return null;
  const km = distanceKm(home, point);
  const label = home.label.trim() || "拠点";
  return `${label}から${formatDistanceKm(km)}`;
}
