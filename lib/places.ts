import type { Place } from "./types";
import seedData from "@/data/seed-places-nagoya.json";
import osmData from "@/data/seed-places-osm.json";

const curatedSeed = seedData as Place[];
const osmSeed = osmData as Place[];

/** 手入れシード（名古屋圏・高品質） */
export function getCuratedSeedPlaces(): Place[] {
  return curatedSeed;
}

/** 手入れ + OSM 取り込み（id 重複時は手入れ優先） */
export function getSeedPlaces(): Place[] {
  return mergePlacesById([...curatedSeed, ...osmSeed]);
}

function mergePlacesById(places: Place[]): Place[] {
  const ids = new Set<string>();
  const result: Place[] = [];
  for (const p of places) {
    if (ids.has(p.id)) continue;
    ids.add(p.id);
    result.push(p);
  }
  return result;
}

const allSeedPlaces = mergePlacesById([...curatedSeed, ...osmSeed]);

export function findPlaceById(id: string, extras: Place[] = []): Place | undefined {
  return [...extras, ...allSeedPlaces].find((p) => p.id === id);
}

export function getAllPlaces(extras: Place[] = []): Place[] {
  const ids = new Set<string>();
  const result: Place[] = [];
  for (const p of [...extras, ...allSeedPlaces]) {
    if (ids.has(p.id)) continue;
    ids.add(p.id);
    result.push(p);
  }
  return result;
}
