/**
 * Overpass API から名古屋圏 POI を取得し data/seed-places-osm.json を生成する。
 * 実行: npm run import:osm
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildOverpassQueries,
  dedupePlaces,
  filterNearSeed,
  mapOsmElementToPlace,
  type OsmElement,
} from "../lib/osmMapping";
import type { Place } from "../lib/types";

/** 飲食店は件数が膨らみやすいため上限 */
function capFoodPlaces(places: Place[], maxFood: number): Place[] {
  const food: Place[] = [];
  const other: Place[] = [];
  for (const p of places) {
    if (p.foodCategories?.length) food.push(p);
    else other.push(p);
  }
  return [...other, ...food.slice(0, maxFood)];
}

const OVERPASS_ENDPOINTS = [
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass-api.de/api/interpreter",
];
const OUT_PATH = join(process.cwd(), "data", "seed-places-osm.json");
const SEED_PATH = join(process.cwd(), "data", "seed-places-nagoya.json");

async function fetchOverpass(query: string): Promise<OsmElement[]> {
  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    "User-Agent":
      "WeekendPlanner/1.0 (osm-import; +https://github.com/yinoue-crypto/weekend-planner)",
  };
  const body = new URLSearchParams({ data: query }).toString();
  let lastError: unknown;

  for (const url of OVERPASS_ENDPOINTS) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        console.log(`  trying ${url} (attempt ${attempt + 1})…`);
        const res = await fetch(url, { method: "POST", headers, body });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
        }
        const json = (await res.json()) as { elements?: OsmElement[] };
        return json.elements ?? [];
      } catch (err) {
        lastError = err;
        await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
      }
    }
  }

  throw lastError;
}

function main() {
  return (async () => {
    console.log("Fetching OSM data from Overpass API…");
    const queries = buildOverpassQueries();
    const elements: OsmElement[] = [];
    for (let i = 0; i < queries.length; i += 1) {
      console.log(`  batch ${i + 1}/${queries.length}`);
      const batch = await fetchOverpass(queries[i]);
      elements.push(...batch);
      if (i < queries.length - 1) {
        await new Promise((r) => setTimeout(r, 1500));
      }
    }
    console.log(`  raw elements: ${elements.length}`);

    const mapped: Place[] = [];
    for (const el of elements) {
      const place = mapOsmElementToPlace(el);
      if (place) mapped.push(place);
    }
    console.log(`  mapped places: ${mapped.length}`);

    const deduped = dedupePlaces(mapped);
    console.log(`  after dedupe: ${deduped.length}`);

    const seed = JSON.parse(readFileSync(SEED_PATH, "utf8")) as Place[];
    const filtered = filterNearSeed(deduped, seed);
    console.log(`  after seed proximity filter: ${filtered.length}`);

    const capped = capFoodPlaces(filtered, 120);
    console.log(`  after food cap: ${capped.length}`);

    capped.sort((a, b) => a.name.localeCompare(b.name, "ja"));

    writeFileSync(OUT_PATH, `${JSON.stringify(capped, null, 2)}\n`, "utf8");
    console.log(`Wrote ${capped.length} places to ${OUT_PATH}`);
  })();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
