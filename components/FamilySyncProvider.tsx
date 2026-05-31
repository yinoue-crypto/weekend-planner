"use client";

import { useEffect } from "react";
import { pullAndMerge, scheduleSyncPush } from "@/lib/familySync";
import { loadSyncCode, onDataChanged } from "@/lib/storage";

const PULL_INTERVAL_MS = 45_000;

export default function FamilySyncProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const code = loadSyncCode();
    if (!code) return;

    void pullAndMerge();

    function onFocus() {
      void pullAndMerge();
    }

    const unsubscribe = onDataChanged(() => {
      scheduleSyncPush();
    });

    window.addEventListener("focus", onFocus);
    const interval = setInterval(() => {
      void pullAndMerge();
    }, PULL_INTERVAL_MS);

    return () => {
      window.removeEventListener("focus", onFocus);
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  return children;
}
