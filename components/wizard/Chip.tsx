"use client";

import type { ReactNode } from "react";

type Props = {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  icon?: string;
  fullWidth?: boolean;
};

export default function Chip({ selected, onClick, children, icon, fullWidth }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-2xl border-2 px-4 py-3 text-left font-medium transition-all active:scale-[0.97]",
        fullWidth ? "w-full" : "",
        selected
          ? "border-orange-500 bg-orange-50 dark:bg-orange-950/40 text-orange-900 dark:text-orange-100 shadow-md chip-selected"
          : "border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200",
      ].join(" ")}
    >
      <span className="flex items-center gap-2">
        {icon ? (
          <span className="text-2xl" aria-hidden>
            {icon}
          </span>
        ) : null}
        <span className="flex-1">{children}</span>
        {selected ? (
          <span className="text-orange-500 text-lg" aria-hidden>
            ✓
          </span>
        ) : null}
      </span>
    </button>
  );
}
