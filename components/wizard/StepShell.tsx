"use client";

import type { ReactNode } from "react";

type Props = {
  step: number;
  total: number;
  title: string;
  subtitle?: string;
  children: ReactNode;
  onBack?: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
};

export default function StepShell({
  step,
  total,
  title,
  subtitle,
  children,
  onBack,
  onNext,
  nextDisabled,
  nextLabel = "次へ",
}: Props) {
  const progress = (step / total) * 100;
  return (
    <div className="flex flex-col min-h-screen">
      <div className="px-5 pt-4 safe-top">
        <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
          <button
            type="button"
            onClick={onBack}
            disabled={!onBack}
            className="disabled:opacity-30"
          >
            ← 戻る
          </button>
          <span>
            ステップ {step} / {total}
          </span>
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-stone-200 dark:bg-stone-700 overflow-hidden">
          <div
            className="h-full bg-orange-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex-1 px-5 pt-6 pb-32">
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">{title}</h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">{subtitle}</p>
        ) : null}
        <div className="mt-6">{children}</div>
      </div>

      <div className="fixed inset-x-0 bottom-0 mx-auto max-w-md bg-gradient-to-t from-[var(--background)] via-[var(--background)] to-transparent px-5 pt-6 pb-6 safe-bottom">
        <button
          type="button"
          onClick={onNext}
          disabled={nextDisabled}
          className="w-full rounded-2xl bg-orange-500 hover:bg-orange-600 disabled:bg-stone-300 dark:disabled:bg-stone-700 disabled:text-stone-500 text-white font-bold py-4 text-lg shadow-lg active:scale-[0.98] transition-all"
        >
          {nextLabel}
        </button>
      </div>
    </div>
  );
}
