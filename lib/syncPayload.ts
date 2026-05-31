import type { ExcludedPlace, FamilySyncPayload, Place, VisitRecord } from "./types";
import {
  loadExcluded,
  loadFamily,
  loadFavorites,
  loadHome,
  loadVisits,
  saveExcluded,
  saveFamily,
  saveFavorites,
  saveHome,
  saveVisits,
} from "./storage";
import { normalizeVisits } from "./visits";

export const SYNC_PAYLOAD_VERSION = 1 as const;

export function buildSyncPayload(): FamilySyncPayload {
  return {
    version: SYNC_PAYLOAD_VERSION,
    updatedAt: new Date().toISOString(),
    family: loadFamily(),
    home: loadHome(),
    favorites: loadFavorites(),
    visits: loadVisits(),
    excluded: loadExcluded(),
  };
}

export function mergeVisits(a: VisitRecord[], b: VisitRecord[]): VisitRecord[] {
  const map = new Map<string, VisitRecord>();
  for (const v of [...a, ...b]) {
    const existing = map.get(v.placeId);
    if (!existing || new Date(v.visitedAt) > new Date(existing.visitedAt)) {
      map.set(v.placeId, v);
    }
  }
  return [...map.values()]
    .sort((x, y) => new Date(y.visitedAt).getTime() - new Date(x.visitedAt).getTime())
    .slice(0, 100);
}

export function mergeFavorites(a: Place[], b: Place[]): Place[] {
  const map = new Map<string, Place>();
  for (const p of [...a, ...b]) {
    map.set(p.id, p);
  }
  return [...map.values()];
}

export function mergeExcluded(a: ExcludedPlace[], b: ExcludedPlace[]): ExcludedPlace[] {
  const map = new Map<string, ExcludedPlace>();
  for (const e of [...a, ...b]) {
    const existing = map.get(e.placeId);
    if (!existing || new Date(e.excludedAt) > new Date(existing.excludedAt)) {
      map.set(e.placeId, e);
    }
  }
  return [...map.values()].sort(
    (x, y) => new Date(y.excludedAt).getTime() - new Date(x.excludedAt).getTime(),
  );
}

export function mergeSyncPayload(
  local: FamilySyncPayload,
  remote: FamilySyncPayload,
): FamilySyncPayload {
  const localTime = new Date(local.updatedAt).getTime();
  const remoteTime = new Date(remote.updatedAt).getTime();

  return {
    version: SYNC_PAYLOAD_VERSION,
    updatedAt: new Date(Math.max(localTime, remoteTime)).toISOString(),
    family: remoteTime > localTime ? remote.family : local.family,
    home: remoteTime > localTime ? remote.home : local.home,
    favorites: mergeFavorites(local.favorites, remote.favorites),
    visits: mergeVisits(local.visits, remote.visits),
    excluded: mergeExcluded(local.excluded, remote.excluded),
  };
}

export function applySyncPayload(payload: FamilySyncPayload): void {
  saveFamily(payload.family);
  saveHome(payload.home);
  saveFavorites(payload.favorites);
  saveVisits(normalizeVisits(payload.visits as unknown[]));
  saveExcluded(payload.excluded);
}

export function parseSyncPayload(raw: unknown): FamilySyncPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Partial<FamilySyncPayload>;
  if (p.version !== 1 || !p.updatedAt) return null;
  if (!p.family || !p.home || !Array.isArray(p.favorites) || !Array.isArray(p.visits)) {
    return null;
  }
  return {
    version: 1,
    updatedAt: p.updatedAt,
    family: p.family,
    home: p.home,
    favorites: p.favorites,
    visits: normalizeVisits(p.visits as unknown[]),
    excluded: Array.isArray(p.excluded) ? p.excluded : [],
  };
}
