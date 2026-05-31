"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import FamilySyncSetupGuide from "@/components/FamilySyncSetupGuide";
import FamilyStep from "@/components/wizard/FamilyStep";
import {
  checkSyncAvailable,
  generateFamilyCode,
  isValidFamilyCode,
  pullAndMerge,
} from "@/lib/familySync";
import {
  DEFAULT_FAMILY,
  NAGOYA_DEFAULT,
  clearExcluded,
  clearSyncCode,
  clearVisits,
  exportAll,
  importAll,
  loadExcluded,
  loadFamily,
  loadHome,
  loadSyncCode,
  loadSyncMeta,
  saveFamily,
  saveHome,
  saveSyncCode,
} from "@/lib/storage";
import { resolveGoogleMapsInput } from "@/lib/googleMapsUrl";
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
  const [homeLabel, setHomeLabel] = useState("自宅");
  const [homeInput, setHomeInput] = useState("");
  const [homeAddress, setHomeAddress] = useState("");
  const [homeLat, setHomeLat] = useState("");
  const [homeLng, setHomeLng] = useState("");
  const [homeSaving, setHomeSaving] = useState(false);
  const [importJson, setImportJson] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [syncCodeInput, setSyncCodeInput] = useState("");
  const [syncAvailable, setSyncAvailable] = useState<boolean | null>(null);
  const [syncBusy, setSyncBusy] = useState(false);
  const [syncRechecking, setSyncRechecking] = useState(false);
  const [syncMeta, setSyncMeta] = useState(loadSyncMeta());

  useEffect(() => {
    setFamily(loadFamily());
    const saved = loadHome();
    setHome(saved);
    if (saved.label !== NAGOYA_DEFAULT.label || saved.lat !== NAGOYA_DEFAULT.lat) {
      setHomeLabel(saved.label);
    }
    const code = loadSyncCode();
    if (code) setSyncCodeInput(code);
    void checkSyncAvailable().then(setSyncAvailable);
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

  function saveHomeBase(next: HomeBase, successMsg?: string) {
    setHome(next);
    saveHome(next);
    setHomeLabel(next.label);
    flash(successMsg ?? `拠点を「${next.label}」に保存しました`);
  }

  async function handleCustomHome() {
    setHomeSaving(true);
    try {
      const label = homeLabel.trim() || "自宅";

      if (homeInput.trim()) {
        const parsed = await resolveGoogleMapsInput(homeInput, label);
        if (parsed) {
          saveHomeBase(
            { label: homeLabel.trim() || parsed.name || "自宅", lat: parsed.lat, lng: parsed.lng },
            `自宅を保存しました（${parsed.lat.toFixed(4)}, ${parsed.lng.toFixed(4)}）`,
          );
          setHomeInput("");
          return;
        }
        flash("URL/座標を読み取れませんでした。下の手順を確認してください");
        return;
      }

      const lat = parseFloat(homeLat);
      const lng = parseFloat(homeLng);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        saveHomeBase({ label, lat, lng }, "自宅を保存しました");
        setHomeLat("");
        setHomeLng("");
        return;
      }

      flash("Google Maps URL、座標、または緯度・経度を入力してください");
    } finally {
      setHomeSaving(false);
    }
  }

  async function handleGeocodeHome() {
    const address = homeAddress.trim();
    if (!address) return;
    setHomeSaving(true);
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(address)}`);
      if (!res.ok) {
        flash("住所が見つかりませんでした。表記を変えて試してください");
        return;
      }
      const data = (await res.json()) as { name: string; lat: number; lng: number };
      const label = homeLabel.trim() || "自宅";
      saveHomeBase(
        { label, lat: data.lat, lng: data.lng },
        `自宅を保存しました（${data.lat.toFixed(4)}, ${data.lng.toFixed(4)}）`,
      );
      setHomeAddress("");
    } catch {
      flash("住所の検索に失敗しました");
    } finally {
      setHomeSaving(false);
    }
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
      if (loadSyncCode()) {
        void pullAndMerge().then(() => refreshSyncMeta());
      }
      flash("インポートしました");
    } else {
      flash("JSONの形式が不正です");
    }
  }

  function handleClearHistory() {
    if (confirm("「行った！」リストをすべて削除しますか？")) {
      clearVisits();
      flash("行った！リストを削除しました");
    }
  }

  function handleClearExcluded() {
    const count = loadExcluded().length;
    if (count === 0) {
      flash("除外リストは空です");
      return;
    }
    if (confirm(`除外リスト（${count}件）をすべて戻しますか？`)) {
      clearExcluded();
      flash("除外リストを空にしました");
    }
  }

  function refreshSyncMeta() {
    setSyncMeta(loadSyncMeta());
  }

  async function handleRecheckSync() {
    setSyncRechecking(true);
    try {
      const ok = await checkSyncAvailable();
      setSyncAvailable(ok);
      if (ok) flash("クラウド同期が使えるようになりました！");
      else flash("まだ未設定です。Vercel で KV を接続して Redeploy してください");
    } finally {
      setSyncRechecking(false);
    }
  }

  function handleSaveSyncCode() {
    const code = syncCodeInput.trim().toUpperCase();
    if (!isValidFamilyCode(code)) {
      flash("家族コードは英数字6〜12文字です");
      return;
    }
    saveSyncCode(code);
    void pullAndMerge().then((r) => {
      refreshSyncMeta();
      if (r === "ok") flash("家族コードを保存して同期しました");
      else if (r === "error") flash(loadSyncMeta().lastError ?? "同期に失敗しました");
      else flash("家族コードを保存しました");
    });
  }

  function handleNewSyncCode() {
    const code = generateFamilyCode();
    setSyncCodeInput(code);
    saveSyncCode(code);
    void pullAndMerge().then(() => {
      refreshSyncMeta();
      flash(`新しいコードを発行: ${code}`);
    });
  }

  async function handleSyncNow() {
    setSyncBusy(true);
    try {
      const result = await pullAndMerge();
      refreshSyncMeta();
      if (result === "no-code") flash("先に家族コードを保存してください");
      else if (result === "error") flash(loadSyncMeta().lastError ?? "同期に失敗しました");
      else flash("家族のデータを同期しました");
    } finally {
      setSyncBusy(false);
    }
  }

  function handleCopySyncCode() {
    const code = syncCodeInput.trim().toUpperCase();
    if (!code) return;
    navigator.clipboard?.writeText(code).then(() => flash("家族コードをコピーしました"));
  }

  function handleClearSyncCode() {
    if (!confirm("家族コードをこの端末から削除しますか？（クラウドのデータは残ります）")) return;
    clearSyncCode();
    setSyncCodeInput("");
    refreshSyncMeta();
    flash("家族コードを解除しました");
  }

  return (
    <div className="flex flex-col min-h-screen px-5 pt-6 pb-10 safe-top safe-bottom">
      <header className="mb-6">
        <Link href="/" className="text-xs text-stone-500 dark:text-stone-400">
          ← ホームへ
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-stone-900 dark:text-stone-100">設定</h1>
      </header>

      <section className="rounded-3xl bg-orange-50 dark:bg-stone-800 border-2 border-orange-100 dark:border-stone-700 px-4 py-5 shadow-sm">
        <h2 className="font-bold text-stone-800 dark:text-stone-100">
          📱 家族で共有（複数のスマホ）
        </h2>
        <p className="mt-1 text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
          同じ「家族コード」を入れた端末で、お気に入り・行った！・除外リスト・自宅・家族構成が自動で揃います。
          コードは家族だけに共有してください。
        </p>

        <FamilySyncSetupGuide
          syncAvailable={syncAvailable}
          onRecheck={handleRecheckSync}
          rechecking={syncRechecking}
        />

        <label className="mt-4 block text-xs font-medium text-stone-600 dark:text-stone-300">
          家族コード
        </label>
        <input
          type="text"
          value={syncCodeInput}
          onChange={(e) => setSyncCodeInput(e.target.value.toUpperCase())}
          placeholder="例: NAGOYA42"
          autoCapitalize="characters"
          className="mt-1 w-full rounded-xl border-2 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-3 text-base font-mono tracking-wider"
        />
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleSaveSyncCode}
            className="rounded-xl bg-orange-500 text-white font-bold py-3 active:scale-[0.98] min-h-11"
          >
            コードを保存
          </button>
          <button
            type="button"
            onClick={handleNewSyncCode}
            className="rounded-xl border-2 border-stone-200 dark:border-stone-700 font-bold py-3 text-stone-700 dark:text-stone-200 active:scale-[0.98] min-h-11"
          >
            新規発行
          </button>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleCopySyncCode}
            disabled={!syncCodeInput.trim()}
            className="rounded-xl border-2 border-stone-200 dark:border-stone-700 py-2 text-sm font-medium disabled:opacity-50 min-h-11"
          >
            📋 コピー
          </button>
          <button
            type="button"
            onClick={handleSyncNow}
            disabled={syncBusy || syncAvailable === false}
            className="rounded-xl bg-green-600 text-white font-bold py-2 text-sm disabled:opacity-50 active:scale-[0.98] min-h-11"
          >
            {syncBusy ? "同期中…" : "🔄 今すぐ同期"}
          </button>
        </div>
        {syncMeta.lastSyncedAt ? (
          <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
            最終同期:{" "}
            {new Date(syncMeta.lastSyncedAt).toLocaleString("ja-JP", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        ) : null}
        {syncMeta.lastError ? (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{syncMeta.lastError}</p>
        ) : null}
        <button
          type="button"
          onClick={handleClearSyncCode}
          className="mt-3 w-full text-xs text-stone-500 dark:text-stone-400 underline"
        >
          この端末の家族コードを解除
        </button>
      </section>

      <section className="mt-5 rounded-3xl bg-white dark:bg-stone-800 px-4 py-5 shadow-sm">
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
        <h2 className="font-bold text-stone-800 dark:text-stone-100">自宅・拠点</h2>
        <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
          現在: {home.label}（{home.lat.toFixed(4)}, {home.lng.toFixed(4)}）
        </p>

        <div className="mt-4 space-y-3">
          <div>
            <label className="text-xs font-medium text-stone-600 dark:text-stone-300">
              表示名
            </label>
            <input
              type="text"
              value={homeLabel}
              onChange={(e) => setHomeLabel(e.target.value)}
              placeholder="自宅"
              className="mt-1 w-full rounded-xl border-2 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-base"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-stone-600 dark:text-stone-300">
              Google Maps から（おすすめ）
            </label>
            <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              iPhone: Google Mapsで自宅を長押し → 共有 → リンクをコピー → 下に貼り付け
              <br />
              ※ maps.app.goo.gl の短いURLも使えます
            </p>
            <input
              type="text"
              value={homeInput}
              onChange={(e) => setHomeInput(e.target.value)}
              placeholder="https://maps.app.goo.gl/... または 35.1814, 136.9066"
              className="mt-1 w-full rounded-xl border-2 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-base"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-stone-600 dark:text-stone-300">
              住所から検索
            </label>
            <div className="mt-1 flex gap-2">
              <input
                type="text"
                value={homeAddress}
                onChange={(e) => setHomeAddress(e.target.value)}
                placeholder="例: 愛知県名古屋市千種区..."
                className="flex-1 rounded-xl border-2 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-base"
              />
              <button
                type="button"
                onClick={handleGeocodeHome}
                disabled={!homeAddress.trim() || homeSaving}
                className="shrink-0 rounded-xl bg-stone-200 dark:bg-stone-700 px-4 py-2 text-sm font-bold disabled:opacity-50"
              >
                検索
              </button>
            </div>
          </div>

          <details className="text-xs text-stone-500 dark:text-stone-400">
            <summary className="cursor-pointer font-medium text-stone-600 dark:text-stone-300">
              緯度・経度を直接入力
            </summary>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <input
                type="text"
                inputMode="decimal"
                value={homeLat}
                onChange={(e) => setHomeLat(e.target.value)}
                placeholder="緯度 35.1814"
                className="rounded-xl border-2 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-base"
              />
              <input
                type="text"
                inputMode="decimal"
                value={homeLng}
                onChange={(e) => setHomeLng(e.target.value)}
                placeholder="経度 136.9066"
                className="rounded-xl border-2 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-base"
              />
            </div>
          </details>

          <button
            type="button"
            onClick={handleCustomHome}
            disabled={homeSaving || (!homeInput.trim() && (!homeLat.trim() || !homeLng.trim()))}
            className="w-full rounded-xl bg-orange-500 text-white font-bold py-3 active:scale-[0.98] disabled:opacity-50"
          >
            {homeSaving ? "読み込み中…" : "自宅として保存"}
          </button>
        </div>

        <p className="mt-4 text-xs font-medium text-stone-600 dark:text-stone-300">
          よく使う駅（プリセット）
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2">
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
      </section>

      <section className="mt-5 rounded-3xl bg-white dark:bg-stone-800 px-4 py-5 shadow-sm">
        <h2 className="font-bold text-stone-800 dark:text-stone-100">除外リスト</h2>
        <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
          提案結果から外したスポットを確認・復元できます
        </p>
        <Link
          href="/excluded"
          className="mt-3 block w-full rounded-xl border-2 border-stone-200 dark:border-stone-700 py-3 text-center text-sm font-bold text-stone-700 dark:text-stone-200 active:scale-[0.98]"
        >
          🚫 除外リストを開く
        </Link>
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
            🗑 行った！を削除
          </button>
          <button
            type="button"
            onClick={handleClearExcluded}
            className="col-span-2 rounded-xl border-2 border-red-200 dark:border-red-900 py-2 text-sm font-medium text-red-700 dark:text-red-300"
          >
            🚫 除外リストをすべて戻す
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

      <p className="mt-6 text-center text-[11px] text-stone-400 dark:text-stone-500 leading-relaxed">
        スポットデータの一部は{" "}
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          OpenStreetMap
        </a>{" "}
        コントリビューターによる © OpenStreetMap（ODbL）
      </p>

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
