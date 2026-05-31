/**
 * Vercel KV / Upstash Redis REST（サーバー専用）
 * 環境変数 KV_REST_API_URL / KV_REST_API_TOKEN が未設定のときは null を返す
 */

function configured(): boolean {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

export function isKvConfigured(): boolean {
  return configured();
}

export async function kvGet(key: string): Promise<string | null> {
  const base = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!base || !token) return null;

  const res = await fetch(`${base}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { result?: string | null };
  return data.result ?? null;
}

export async function kvSet(key: string, value: string): Promise<boolean> {
  const base = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!base || !token) return false;

  const res = await fetch(base, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(["SET", key, value]),
    cache: "no-store",
  });
  return res.ok;
}
