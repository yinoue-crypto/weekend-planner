import { NextResponse } from "next/server";
import { geocodeJapaneseAddress } from "@/lib/geocode";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ error: "q required" }, { status: 400 });
  }

  try {
    const result = await geocodeJapaneseAddress(q);
    if (!result) {
      return NextResponse.json(null, { status: 404 });
    }
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "geocode failed" }, { status: 502 });
  }
}
