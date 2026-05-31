import type {
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
}

export function loadHome(): HomeBase {
  return readJSON<HomeBase>(KEYS.home, NAGOYA_DEFAULT);
}

export function saveHome(home: HomeBase): void {
  writeJSON(KEYS.home, home);
}

export function loadFavorites(): Place[] {
  return readJSON<Place[]>(KEYS.favorites, []);
}

export function saveFavorites(places: Place[]): void {
  writeJSON(KEYS.favorites, places);
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
  return next;
}

export function removeVisit(placeId: string): VisitRecord[] {
  const next = loadVisits().filter((v) => v.placeId !== placeId);
  writeJSON(KEYS.visits, next);
  return next;
}

export function clearVisits(): void {
  writeJSON(KEYS.visits, []);
}

export function saveLastSession<T>(session: T): void {
  writeJSON(KEYS.lastSession, session);
}

export function loadLastSession<T>(): T | null {
  return readJSON<T | null>(KEYS.lastSession, null);
}

export function exportAll(): string {
  return JSON.stringify(
    {
      family: loadFamily(),
      home: loadHome(),
      favorites: loadFavorites(),
      visits: loadVisits(),
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
    if (data.visits) writeJSON(KEYS.visits, data.visits);
    return true;
  } catch {
    return false;
  }
}
