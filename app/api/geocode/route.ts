import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ error: "q required" }, { status: 400 });
  }

  try {
    const params = new URLSearchParams({
      q,
      format: "json",
      limit: "1",
      countrycodes: "jp",
    });
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: {
        "User-Agent":
          "WeekendPlanner/1.0 (https://github.com/yinoue-crypto/weekend-planner)",
      },
    });
    if (!res.ok) {
      return NextResponse.json(null, { status: 502 });
    }
    const data = (await res.json()) as { lat: string; lon: string; display_name: string }[];
    if (!data.length) {
      return NextResponse.json(null, { status: 404 });
    }
    const hit = data[0];
    const shortName = hit.display_name.split(",").slice(0, 2).join(",").trim();
    return NextResponse.json({
      name: shortName,
      lat: parseFloat(hit.lat),
      lng: parseFloat(hit.lon),
    });
  } catch {
    return NextResponse.json({ error: "geocode failed" }, { status: 502 });
  }
}
