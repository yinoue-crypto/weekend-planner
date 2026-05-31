import type {
  ExcludedPlace,
  FamilyProfile,
  HomeBase,
  Place,
  VisitRecord,
} from "./types";
import { normalizeVisits } from "./visits";

const KEYS = {
  family: "weekend-planner/family",
  home: "weekend-planner/home",
  favorites: "weekend-planner/favorites",
  visits: "weekend-planner/visits",
  excluded: "weekend-planner/excluded",
  syncCode: "weekend-planner/sync-code",
  syncMeta: "weekend-planner/sync-meta",
  lastSession: "weekend-planner/last-session",
};

export const NAGOYA_DEFAULT: HomeBase = {
  label: "名古屋駅",
  lat: 35.1709,
  lng: 136.8815,
};

export const DEFAULT_FAMILY: FamilyProfile = {
  members: [{ ageGroup: "adult" }, { ageGroup: "adult" }],
};

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readJSON<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota errors
  }
}

export function loadFamily(): FamilyProfile {
  return readJSON<FamilyProfile>(KEYS.family, DEFAULT_FAMILY);
}

export function saveFamily(profile: FamilyProfile): void {
  writeJSON(KEYS.family, profile);
  notifyDataChangedIfBrowser();
}

export function loadHome(): HomeBase {
  return readJSON<HomeBase>(KEYS.home, NAGOYA_DEFAULT);
}

export function saveHome(home: HomeBase): void {
  writeJSON(KEYS.home, home);
  notifyDataChangedIfBrowser();
}

export function loadFavorites(): Place[] {
  return readJSON<Place[]>(KEYS.favorites, []);
}

export function saveFavorites(places: Place[]): void {
  writeJSON(KEYS.favorites, places);
  notifyDataChangedIfBrowser();
}

export function addFavorite(place: Place): Place[] {
  const current = loadFavorites();
  if (current.find((p) => p.id === place.id)) return current;
  const next = [...current, place];
  saveFavorites(next);
  return next;
}

export function removeFavorite(id: string): Place[] {
  const next = loadFavorites().filter((p) => p.id !== id);
  saveFavorites(next);
  return next;
}

export function loadVisits(): VisitRecord[] {
  const raw = readJSON<unknown[]>(KEYS.visits, []);
  return normalizeVisits(raw);
}

export function recordVisit(place: Pick<Place, "id" | "name" | "area" | "lat" | "lng">): VisitRecord[] {
  const visits = loadVisits();
  const next: VisitRecord[] = [
    {
      placeId: place.id,
      placeName: place.name,
      placeArea: place.area,
      lat: place.lat,
      lng: place.lng,
      visitedAt: new Date().toISOString(),
    },
    ...visits,
  ].slice(0, 100);
  writeJSON(KEYS.visits, next);
  notifyDataChangedIfBrowser();
  return next;
}

export function removeVisit(placeId: string): VisitRecord[] {
  const next = loadVisits().filter((v) => v.placeId !== placeId);
  writeJSON(KEYS.visits, next);
  notifyDataChangedIfBrowser();
  return next;
}

export function clearVisits(): void {
  writeJSON(KEYS.visits, []);
  notifyDataChanged();
}

export function saveVisits(visits: VisitRecord[]): void {
  writeJSON(KEYS.visits, visits);
  notifyDataChanged();
}

export function loadSyncCode(): string | null {
  const code = readJSON<string | null>(KEYS.syncCode, null);
  if (!code || typeof code !== "string") return null;
  return code.trim().toUpperCase() || null;
}

export function saveSyncCode(code: string): void {
  writeJSON(KEYS.syncCode, code.trim().toUpperCase());
}

export function clearSyncCode(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(KEYS.syncCode);
    window.localStorage.removeItem(KEYS.syncMeta);
  } catch {
    // ignore
  }
}

export type SyncMeta = {
  lastSyncedAt: string | null;
  lastError: string | null;
};

export function loadSyncMeta(): SyncMeta {
  return readJSON<SyncMeta>(KEYS.syncMeta, { lastSyncedAt: null, lastError: null });
}

export function saveSyncMeta(meta: SyncMeta): void {
  writeJSON(KEYS.syncMeta, meta);
}

let dataChangeListeners: Array<() => void> = [];

/** 同期・UI更新用（localStorage 変更の通知） */
export function onDataChanged(listener: () => void): () => void {
  dataChangeListeners.push(listener);
  return () => {
    dataChangeListeners = dataChangeListeners.filter((l) => l !== listener);
  };
}

export function notifyDataChanged(): void {
  if (!isBrowser()) return;
  dataChangeListeners.forEach((l) => {
    try {
      l();
    } catch {
      // ignore
    }
  });
  window.dispatchEvent(new CustomEvent("weekend-planner-data-changed"));
}

function notifyDataChangedIfBrowser(): void {
  notifyDataChanged();
}

export function loadExcluded(): ExcludedPlace[] {
  return readJSON<ExcludedPlace[]>(KEYS.excluded, []);
}

export function addExcluded(
  place: Pick<Place, "id" | "name" | "area">,
): ExcludedPlace[] {
  const current = loadExcluded();
  if (current.some((e) => e.placeId === place.id)) return current;
  const next: ExcludedPlace[] = [
    {
      placeId: place.id,
      placeName: place.name,
      placeArea: place.area,
      excludedAt: new Date().toISOString(),
    },
    ...current,
  ];
  writeJSON(KEYS.excluded, next);
  notifyDataChangedIfBrowser();
  return next;
}

export function removeExcluded(placeId: string): ExcludedPlace[] {
  const next = loadExcluded().filter((e) => e.placeId !== placeId);
  writeJSON(KEYS.excluded, next);
  notifyDataChangedIfBrowser();
  return next;
}

export function clearExcluded(): void {
  writeJSON(KEYS.excluded, []);
  notifyDataChangedIfBrowser();
}

export function saveExcluded(excluded: ExcludedPlace[]): void {
  writeJSON(KEYS.excluded, excluded);
  notifyDataChangedIfBrowser();
}

export function saveLastSession<T>(session: T): void {
  writeJSON(KEYS.lastSession, session);
}

export function loadLastSession<T>(): T | null {
  return readJSON<T | null>(KEYS.lastSession, null);
}

export function exportAll(): string {
  const syncCode = loadSyncCode();
  return JSON.stringify(
    {
      family: loadFamily(),
      home: loadHome(),
      favorites: loadFavorites(),
      visits: loadVisits(),
      excluded: loadExcluded(),
      ...(syncCode ? { syncCode } : {}),
    },
    null,
    2,
  );
}

export function importAll(json: string): boolean {
  try {
    const data = JSON.parse(json);
    if (data.family) saveFamily(data.family);
    if (data.home) saveHome(data.home);
    if (data.favorites) saveFavorites(data.favorites);
    if (data.visits) saveVisits(normalizeVisits(data.visits));
    if (data.excluded) saveExcluded(data.excluded);
    if (typeof data.syncCode === "string" && data.syncCode.trim()) {
      saveSyncCode(data.syncCode);
    }
    notifyDataChangedIfBrowser();
    return true;
  } catch {
    return false;
  }
}
