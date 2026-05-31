import { NextResponse } from "next/server";
import { parseGoogleMapsUrl } from "@/lib/googleMapsUrl";

export async function GET(request: Request) {
  const url = new URL(request.url).searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "url required" }, { status: 400 });
  }

  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    return NextResponse.json({ error: "invalid url" }, { status: 400 });
  }

  try {
    const res = await fetch(trimmed, {
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; WeekendPlanner/1.0; +https://github.com/yinoue-crypto/weekend-planner)",
      },
    });

    const finalUrl = res.url || trimmed;
    const parsed = parseGoogleMapsUrl(finalUrl);
    if (parsed) {
      return NextResponse.json(parsed);
    }

    // Some redirects land on HTML; try parsing the request URL chain
    const fromOriginal = parseGoogleMapsUrl(trimmed);
    if (fromOriginal) {
      return NextResponse.json(fromOriginal);
    }

    return NextResponse.json(null, { status: 422 });
  } catch {
    return NextResponse.json({ error: "resolve failed" }, { status: 502 });
  }
}
