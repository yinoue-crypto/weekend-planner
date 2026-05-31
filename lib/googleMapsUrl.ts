import type { Place } from "./types";

/**
 * Generate a Google Maps deep link for a place.
 * Uses the universal search URL — works on web, iOS, and Android (opens app if installed).
 */
export function googleMapsSearchUrl(place: Pick<Place, "name" | "lat" | "lng">): string {
  const params = new URLSearchParams({
    api: "1",
    query: `${place.lat},${place.lng}`,
    query_place_id: "",
  });
  params.delete("query_place_id");
  const labeled = encodeURIComponent(place.name);
  return `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}(${labeled})`;
}

export function googleMapsDirectionsUrl(
  place: Pick<Place, "lat" | "lng">,
  travelmode: "driving" | "walking" | "transit" | "bicycling" = "driving",
): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}&travelmode=${travelmode}`;
}

/**
 * Parse a pasted Google Maps share URL and extract coordinates + (best-effort) name.
 * Supports common formats:
 *   - https://maps.app.goo.gl/XXXX   (short link — returns null; user should expand first)
 *   - https://www.google.com/maps/place/Name/@35.1,136.9,17z/...
 *   - https://www.google.com/maps/?q=35.1,136.9
 *   - https://goo.gl/maps/XXXX
 */
export function parseGoogleMapsUrl(
  input: string,
): { name: string; lat: number; lng: number } | null {
  const url = input.trim();
  if (!url) return null;

  // /place/Name/@lat,lng
  const placeMatch = url.match(/\/place\/([^/]+)\/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (placeMatch) {
    return {
      name: decodeURIComponent(placeMatch[1].replace(/\+/g, " ")),
      lat: parseFloat(placeMatch[2]),
      lng: parseFloat(placeMatch[3]),
    };
  }

  // ?q=lat,lng or &q=lat,lng
  const qMatch = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (qMatch) {
    return {
      name: "登録した場所",
      lat: parseFloat(qMatch[1]),
      lng: parseFloat(qMatch[2]),
    };
  }

  // @lat,lng anywhere
  const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    return {
      name: "登録した場所",
      lat: parseFloat(atMatch[1]),
      lng: parseFloat(atMatch[2]),
    };
  }

  return null;
}
