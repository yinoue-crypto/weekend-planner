import { NextResponse } from "next/server";
import { isKvConfigured, kvGet, kvSet } from "@/lib/upstash";
import { parseSyncPayload } from "@/lib/syncPayload";

function normalizeCode(raw: string | null): string | null {
  if (!raw) return null;
  const code = raw.trim().toUpperCase();
  if (!/^[A-Z0-9]{6,12}$/.test(code)) return null;
  return code;
}

function storageKey(code: string): string {
  return `family-sync:${code}`;
}

export async function HEAD() {
  if (!isKvConfigured()) {
    return new NextResponse(null, { status: 503 });
  }
  return new NextResponse(null, { status: 200 });
}

export async function GET(request: Request) {
  if (!isKvConfigured()) {
    return NextResponse.json(
      { error: "クラウド同期が未設定です（Upstash Redis を接続してください）" },
      { status: 503 },
    );
  }

  const code = normalizeCode(new URL(request.url).searchParams.get("code"));
  if (!code) {
    return NextResponse.json({ error: "家族コードが不正です" }, { status: 400 });
  }

  const raw = await kvGet(storageKey(code));
  if (!raw) {
    return NextResponse.json(null, { status: 404 });
  }

  try {
    const payload = parseSyncPayload(JSON.parse(raw));
    if (!payload) {
      return NextResponse.json({ error: "保存データが壊れています" }, { status: 500 });
    }
    return NextResponse.json(payload);
  } catch {
    return NextResponse.json({ error: "保存データが壊れています" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!isKvConfigured()) {
    return NextResponse.json(
      { error: "クラウド同期が未設定です（Upstash Redis を接続してください）" },
      { status: 503 },
    );
  }

  let body: { code?: string; payload?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSONが不正です" }, { status: 400 });
  }

  const code = normalizeCode(body.code ?? null);
  if (!code) {
    return NextResponse.json({ error: "家族コードが不正です" }, { status: 400 });
  }

  const payload = parseSyncPayload(body.payload);
  if (!payload) {
    return NextResponse.json({ error: "同期データの形式が不正です" }, { status: 400 });
  }

  const json = JSON.stringify(payload);
  if (json.length > 512_000) {
    return NextResponse.json({ error: "データが大きすぎます" }, { status: 413 });
  }

  const ok = await kvSet(storageKey(code), json);
  if (!ok) {
    return NextResponse.json({ error: "保存に失敗しました" }, { status: 502 });
  }

  return NextResponse.json({ ok: true, updatedAt: payload.updatedAt });
}
