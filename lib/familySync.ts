import {
  buildSyncPayload,
  mergeSyncPayload,
  parseSyncPayload,
  applySyncPayload,
} from "./syncPayload";
import type { FamilySyncPayload } from "./types";
import {
  loadSyncCode,
  loadSyncMeta,
  notifyDataChanged,
  saveSyncMeta,
} from "./storage";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 8;
const PUSH_DEBOUNCE_MS = 1500;

let pushTimer: ReturnType<typeof setTimeout> | null = null;
let pushInFlight = false;

export function generateFamilyCode(): string {
  let code = "";
  const bytes = new Uint8Array(CODE_LENGTH);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
    for (let i = 0; i < CODE_LENGTH; i++) {
      code += CODE_CHARS[bytes[i] % CODE_CHARS.length];
    }
  } else {
    for (let i = 0; i < CODE_LENGTH; i++) {
      code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    }
  }
  return code;
}

export function isValidFamilyCode(code: string): boolean {
  return /^[A-Z0-9]{6,12}$/.test(code.trim().toUpperCase());
}

export async function fetchRemotePayload(code: string): Promise<FamilySyncPayload | null> {
  const res = await fetch(`/api/family-sync?code=${encodeURIComponent(code)}`, {
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? `同期の取得に失敗 (${res.status})`);
  }
  const data = await res.json();
  return parseSyncPayload(data);
}

export async function pushPayload(code: string, payload: FamilySyncPayload): Promise<void> {
  const res = await fetch("/api/family-sync", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, payload }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? `同期の保存に失敗 (${res.status})`);
  }
}

export async function pullAndMerge(): Promise<"ok" | "no-code" | "error"> {
  const code = loadSyncCode();
  if (!code) return "no-code";

  try {
    const local = buildSyncPayload();
    const remote = await fetchRemotePayload(code);
    let merged = local;
    if (remote) {
      merged = mergeSyncPayload(local, remote);
    }
    applySyncPayload(merged);
    await pushPayload(code, merged);
    saveSyncMeta({ lastSyncedAt: new Date().toISOString(), lastError: null });
    return "ok";
  } catch (e) {
    const message = e instanceof Error ? e.message : "同期に失敗しました";
    saveSyncMeta({ ...loadSyncMeta(), lastError: message });
    return "error";
  }
}

export async function pushLocalNow(): Promise<"ok" | "no-code" | "error"> {
  const code = loadSyncCode();
  if (!code) return "no-code";

  if (pushInFlight) return "ok";
  pushInFlight = true;
  try {
    const payload = buildSyncPayload();
    await pushPayload(code, payload);
    saveSyncMeta({ lastSyncedAt: new Date().toISOString(), lastError: null });
    return "ok";
  } catch (e) {
    const message = e instanceof Error ? e.message : "同期に失敗しました";
    saveSyncMeta({ ...loadSyncMeta(), lastError: message });
    return "error";
  } finally {
    pushInFlight = false;
  }
}

/** データ変更後にクラウドへ反映（デバウンス） */
export function scheduleSyncPush(): void {
  const code = loadSyncCode();
  if (!code) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    void pushLocalNow();
  }, PUSH_DEBOUNCE_MS);
}

export async function checkSyncAvailable(): Promise<boolean> {
  try {
    const res = await fetch("/api/family-sync", { method: "HEAD", cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}
