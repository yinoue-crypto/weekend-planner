import type { Place } from "./types";
import seedData from "@/data/seed-places-nagoya.json";

const seedPlaces = seedData as Place[];

export function getSeedPlaces(): Place[] {
  return seedPlaces;
}

export function findPlaceById(id: string, extras: Place[] = []): Place | undefined {
  return [...extras, ...seedPlaces].find((p) => p.id === id);
}

export function getAllPlaces(extras: Place[] = []): Place[] {
  const ids = new Set<string>();
  const result: Place[] = [];
  for (const p of [...extras, ...seedPlaces]) {
    if (ids.has(p.id)) continue;
    ids.add(p.id);
    result.push(p);
  }
  return result;
}
