import type { Place } from "./types";

export type ParsedLocation = {
  name: string;
  lat: number;
  lng: number;
};

/**
 * Generate a Google Maps deep link for a place.
 */
export function googleMapsSearchUrl(place: Pick<Place, "name" | "lat" | "lng">): string {
  const labeled = encodeURIComponent(place.name);
  return `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}(${labeled})`;
}

export function googleMapsDirectionsUrl(
  place: Pick<Place, "lat" | "lng">,
  travelmode: "driving" | "walking" | "transit" | "bicycling" = "driving",
): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}&travelmode=${travelmode}`;
}

function decodePlaceName(raw: string): string {
  try {
    return decodeURIComponent(raw.replace(/\+/g, " ")).replace(/\+/g, " ");
  } catch {
    return raw.replace(/\+/g, " ");
  }
}

function isValidCoord(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

function result(name: string, lat: number, lng: number): ParsedLocation | null {
  if (!isValidCoord(lat, lng)) return null;
  return { name: name.trim() || "登録した場所", lat, lng };
}

/**
 * Parse coordinates from various Google Maps URL formats and plain text.
 * Does NOT resolve short links — use resolveGoogleMapsInput() for that.
 */
export function parseGoogleMapsUrl(input: string): ParsedLocation | null {
  const url = input.trim();
  if (!url) return null;

  // Plain coordinates: "35.1814, 136.9066" or "35.1814 136.9066"
  const plain = url.match(/^(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)$/);
  if (plain) {
    return result("登録した場所", parseFloat(plain[1]), parseFloat(plain[2]));
  }

  // !3dLAT!4dLNG — actual dropped pin (most accurate for Google Maps)
  const dataPin = url.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (dataPin) {
    const placeName = url.match(/\/place\/([^/@?]+)/);
    const name = placeName ? decodePlaceName(placeName[1]) : "登録した場所";
    return result(name, parseFloat(dataPin[1]), parseFloat(dataPin[2]));
  }

  // /place/Name/@lat,lng
  const placeMatch = url.match(/\/place\/([^/@?]+)\/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (placeMatch) {
    return result(
      decodePlaceName(placeMatch[1]),
      parseFloat(placeMatch[2]),
      parseFloat(placeMatch[3]),
    );
  }

  // /place/Name/data=... (without @ in some mobile shares)
  const placeOnly = url.match(/\/place\/([^/@?]+)/);
  if (placeOnly && dataPin) {
    return result(decodePlaceName(placeOnly[1]), parseFloat(dataPin[1]), parseFloat(dataPin[2]));
  }

  // search/?api=1&query=lat,lng
  const queryMatch = url.match(/[?&]query=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (queryMatch) {
    return result("登録した場所", parseFloat(queryMatch[1]), parseFloat(queryMatch[2]));
  }

  // ?q=lat,lng or &q=lat,lng
  const qMatch = url.match(/[?&]q=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (qMatch) {
    return result("登録した場所", parseFloat(qMatch[1]), parseFloat(qMatch[2]));
  }

  // ll= or center=
  const llMatch = url.match(/[?&](?:ll|center)=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (llMatch) {
    return result("登録した場所", parseFloat(llMatch[1]), parseFloat(llMatch[2]));
  }

  // @lat,lng anywhere (map viewport — less accurate than !3d)
  if (!dataPin) {
    const atMatch = url.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
    if (atMatch) {
      const name = placeOnly ? decodePlaceName(placeOnly[1]) : "登録した場所";
      return result(name, parseFloat(atMatch[1]), parseFloat(atMatch[2]));
    }
  }

  return null;
}

export function isShortGoogleMapsUrl(input: string): boolean {
  const url = input.trim();
  return (
    /^https?:\/\/maps\.app\.goo\.gl\//i.test(url) ||
    /^https?:\/\/goo\.gl\/maps\//i.test(url) ||
    /^https?:\/\/maps\.google\.com\/\?/i.test(url)
  );
}

/**
 * Resolve pasted input: plain coords, full Google Maps URL, or short link via API.
 */
export async function resolveGoogleMapsInput(
  input: string,
  fallbackName = "自宅",
): Promise<ParsedLocation | null> {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const direct = parseGoogleMapsUrl(trimmed);
  if (direct) {
    if (direct.name === "登録した場所" && fallbackName) {
      return { ...direct, name: fallbackName };
    }
    return direct;
  }

  if (isShortGoogleMapsUrl(trimmed) || trimmed.includes("google.com/maps") || trimmed.includes("goo.gl")) {
    try {
      const res = await fetch(`/api/resolve-maps-url?url=${encodeURIComponent(trimmed)}`);
      if (res.ok) {
        const data = (await res.json()) as ParsedLocation | null;
        if (data && isValidCoord(data.lat, data.lng)) {
          return {
            ...data,
            name: data.name === "登録した場所" ? fallbackName : data.name,
          };
        }
      }
    } catch {
      // fall through
    }
  }

  return null;
}
