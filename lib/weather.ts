import type { WeatherCondition, WeatherSnapshot } from "./types";

/**
 * WMO weather code groupings.
 * https://open-meteo.com/en/docs
 */
function codeToCondition(code: number): WeatherCondition {
  if (code === 0) return "clear";
  if (code >= 1 && code <= 3) return "cloudy";
  if (code >= 45 && code <= 48) return "cloudy";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code === 95)
    return "rain";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  return "unknown";
}

function codeToDescription(code: number): string {
  if (code === 0) return "快晴";
  if (code === 1) return "晴れ";
  if (code === 2) return "晴れ時々曇り";
  if (code === 3) return "曇り";
  if (code >= 45 && code <= 48) return "霧";
  if (code >= 51 && code <= 55) return "霧雨";
  if (code >= 61 && code <= 65) return "雨";
  if (code === 66 || code === 67) return "凍雨";
  if (code >= 71 && code <= 77) return "雪";
  if (code >= 80 && code <= 82) return "にわか雨";
  if (code === 85 || code === 86) return "にわか雪";
  if (code === 95) return "雷雨";
  if (code === 96 || code === 99) return "雷雨(雹)";
  return "不明";
}

export async function fetchWeather(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<WeatherSnapshot> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lng));
  url.searchParams.set("current", "temperature_2m,weather_code,precipitation");
  url.searchParams.set(
    "daily",
    "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
  );
  url.searchParams.set("timezone", "Asia/Tokyo");
  url.searchParams.set("forecast_days", "1");

  const res = await fetch(url.toString(), { signal });
  if (!res.ok) {
    throw new Error(`Open-Meteo error: ${res.status}`);
  }
  const data = await res.json();
  const code: number = data?.daily?.weather_code?.[0] ?? data?.current?.weather_code ?? -1;
  const temperatureC: number =
    data?.daily?.temperature_2m_max?.[0] ?? data?.current?.temperature_2m ?? 0;
  const precipitationProbability: number =
    data?.daily?.precipitation_probability_max?.[0] ?? 0;

  return {
    condition: codeToCondition(code),
    temperatureC: Math.round(temperatureC),
    precipitationProbability,
    description: codeToDescription(code),
    fetchedAt: new Date().toISOString(),
  };
}

export function weatherIcon(condition: WeatherCondition): string {
  switch (condition) {
    case "clear":
      return "☀️";
    case "cloudy":
      return "☁️";
    case "rain":
      return "☔";
    case "snow":
      return "❄️";
    default:
      return "🌤️";
  }
}

export function shouldPreferIndoor(snapshot: WeatherSnapshot | null): boolean {
  if (!snapshot) return false;
  if (snapshot.condition === "rain" || snapshot.condition === "snow") return true;
  if (snapshot.precipitationProbability >= 60) return true;
  return false;
}
