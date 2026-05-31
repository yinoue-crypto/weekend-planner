/**
 * Upstash Redis REST（Vercel Marketplace 経由）
 *
 * 新規: UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
 * 旧 Vercel KV 移行: KV_REST_API_URL / KV_REST_API_TOKEN
 */

function restCredentials(): { url: string; token: string } | null {
  const url =
    process.env.UPSTASH_REDIS_REST_URL?.trim() ||
    process.env.KV_REST_API_URL?.trim() ||
    "";
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN?.trim() ||
    process.env.KV_REST_API_TOKEN?.trim() ||
    "";
  if (!url || !token) return null;
  return { url, token };
}

export function isKvConfigured(): boolean {
  return restCredentials() !== null;
}

export async function kvGet(key: string): Promise<string | null> {
  const creds = restCredentials();
  if (!creds) return null;

  const res = await fetch(`${creds.url}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${creds.token}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { result?: string | null };
  return data.result ?? null;
}

export async function kvSet(key: string, value: string): Promise<boolean> {
  const creds = restCredentials();
  if (!creds) return false;

  const res = await fetch(creds.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${creds.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(["SET", key, value]),
    cache: "no-store",
  });
  return res.ok;
}
