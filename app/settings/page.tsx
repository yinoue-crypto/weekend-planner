"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import FamilyStep from "@/components/wizard/FamilyStep";
import {
  DEFAULT_FAMILY,
  NAGOYA_DEFAULT,
  clearVisits,
  exportAll,
  importAll,
  loadFamily,
  loadHome,
  saveFamily,
  saveHome,
} from "@/lib/storage";
import { parseGoogleMapsUrl } from "@/lib/googleMapsUrl";
import type { FamilyProfile, HomeBase } from "@/lib/types";

const NAGOYA_PRESETS: HomeBase[] = [
  { label: "名古屋駅", lat: 35.1709, lng: 136.8815 },
  { label: "栄", lat: 35.1707, lng: 136.9085 },
  { label: "金山", lat: 35.1432, lng: 136.9008 },
  { label: "藤が丘", lat: 35.1841, lng: 137.0231 },
  { label: "豊田市駅", lat: 35.0822, lng: 137.1568 },
];

export default function SettingsPage() {
  const [family, setFamily] = useState<FamilyProfile>(DEFAULT_FAMILY);
  const [home, setHome] = useState<HomeBase>(NAGOYA_DEFAULT);
  const [homeUrl, setHomeUrl] = useState("");
  const [importJson, setImportJson] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setFamily(loadFamily());
    setHome(loadHome());
  }, []);

  function flash(msg: string) {
    setMessage(msg);
    setTimeout(() => setMessage(null), 2500);
  }

  function handleSaveFamily() {
    saveFamily(family);
    flash("家族構成を保存しました");
  }

  function handlePreset(preset: HomeBase) {
    setHome(preset);
    saveHome(preset);
    flash(`拠点を「${preset.label}」に変更`);
  }

  function handleCustomHome() {
    const parsed = parseGoogleMapsUrl(homeUrl);
    if (!parsed) {
      flash("URLから座標を読み取れませんでした");
      return;
    }
    const next: HomeBase = { label: parsed.name, lat: parsed.lat, lng: parsed.lng };
    setHome(next);
    saveHome(next);
    setHomeUrl("");
    flash(`拠点を「${next.label}」に変更`);
  }

  function handleExport() {
    const json = exportAll();
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(json).then(() => flash("クリップボードにコピーしました"));
    } else {
      flash("コピーに失敗");
    }
  }

  function handleImport() {
    if (!importJson.trim()) return;
    const ok = importAll(importJson);
    if (ok) {
      setFamily(loadFamily());
      setHome(loadHome());
      setImportJson("");
      flash("インポートしました");
    } else {
      flash("JSONの形式が不正です");
    }
  }

  function handleClearHistory() {
    if (confirm("訪問履歴をすべて削除しますか？")) {
      clearVisits();
      flash("履歴を削除しました");
    }
  }

  return (
    <div className="flex flex-col min-h-screen px-5 pt-6 pb-10 safe-top safe-bottom">
      <header className="mb-6">
        <Link href="/" className="text-xs text-stone-500 dark:text-stone-400">
          ← ホームへ
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-stone-900 dark:text-stone-100">設定</h1>
      </header>

      <section className="rounded-3xl bg-white dark:bg-stone-800 px-4 py-5 shadow-sm">
        <h2 className="font-bold text-stone-800 dark:text-stone-100 mb-3">
          デフォルトの家族構成
        </h2>
        <FamilyStep family={family} onChange={setFamily} />
        <button
          type="button"
          onClick={handleSaveFamily}
          className="mt-4 w-full rounded-xl bg-orange-500 text-white font-bold py-3 active:scale-[0.98]"
        >
          保存
        </button>
      </section>

      <section className="mt-5 rounded-3xl bg-white dark:bg-stone-800 px-4 py-5 shadow-sm">
        <h2 className="font-bold text-stone-800 dark:text-stone-100">拠点エリア</h2>
        <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
          現在: {home.label}（{home.lat.toFixed(3)}, {home.lng.toFixed(3)}）
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {NAGOYA_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => handlePreset(p)}
              className={[
                "rounded-xl border-2 px-3 py-2 text-sm font-medium",
                p.lat === home.lat && p.lng === home.lng
                  ? "border-orange-500 bg-orange-50 dark:bg-orange-950/30 text-orange-900 dark:text-orange-100"
                  : "border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-200",
              ].join(" ")}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="mt-4">
          <label className="text-xs text-stone-500 dark:text-stone-400">
            Google MapsのURLから設定（任意）
          </label>
          <input
            type="url"
            value={homeUrl}
            onChange={(e) => setHomeUrl(e.target.value)}
            placeholder="https://www.google.com/maps/..."
            className="mt-1 w-full rounded-xl border-2 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-base"
          />
          <button
            type="button"
            onClick={handleCustomHome}
            disabled={!homeUrl.trim()}
            className="mt-2 w-full rounded-xl bg-stone-200 dark:bg-stone-700 text-stone-800 dark:text-stone-100 font-bold py-2 disabled:opacity-50"
          >
            この場所を拠点に
          </button>
        </div>
      </section>

      <section className="mt-5 rounded-3xl bg-white dark:bg-stone-800 px-4 py-5 shadow-sm">
        <h2 className="font-bold text-stone-800 dark:text-stone-100">データ管理</h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="rounded-xl border-2 border-stone-200 dark:border-stone-700 py-2 text-sm font-medium text-stone-700 dark:text-stone-200"
          >
            📤 エクスポート
          </button>
          <button
            type="button"
            onClick={handleClearHistory}
            className="rounded-xl border-2 border-red-200 dark:border-red-900 py-2 text-sm font-medium text-red-700 dark:text-red-300"
          >
            🗑 履歴を削除
          </button>
        </div>
        <textarea
          value={importJson}
          onChange={(e) => setImportJson(e.target.value)}
          placeholder="エクスポートしたJSONを貼り付けてインポート"
          rows={3}
          className="mt-3 w-full rounded-xl border-2 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={handleImport}
          disabled={!importJson.trim()}
          className="mt-2 w-full rounded-xl bg-stone-200 dark:bg-stone-700 text-stone-800 dark:text-stone-100 font-bold py-2 disabled:opacity-50"
        >
          インポート
        </button>
      </section>

      <section className="mt-5 rounded-3xl bg-amber-50 dark:bg-stone-800 px-4 py-4 text-xs text-stone-600 dark:text-stone-300">
        <p className="font-bold mb-1">📱 ホーム画面に追加</p>
        <p>iPhone: Safariで開いて 共有 → ホーム画面に追加</p>
        <p>Android: Chromeで開いて メニュー → アプリをインストール</p>
      </section>

      {message ? (
        <div className="fixed inset-x-0 bottom-6 mx-auto max-w-md px-5 z-50">
          <div className="rounded-2xl bg-green-500 text-white px-4 py-3 shadow-xl text-center font-bold">
            {message}
          </div>
        </div>
      ) : null}
    </div>
  );
}
