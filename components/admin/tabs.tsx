"use client";

import { useState } from "react";

interface Tab {
  label: string;
  value: string;
  badge?: number;
  disabled?: boolean;
}

interface AdminTabsProps {
  tabs: Tab[];
  defaultValue?: string;
  onChange?: (value: string) => void;
}

export function AdminTabs({ tabs, defaultValue, onChange }: AdminTabsProps) {
  const [active, setActive] = useState(defaultValue || tabs[0]?.value || "");

  function handleChange(value: string) {
    setActive(value);
    onChange?.(value);
  }

  return (
    <div className="border-b border-border">
      <div className="flex gap-0 overflow-x-auto -mb-px">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => !tab.disabled && handleChange(tab.value)}
            className={`flex items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-medium tracking-wide transition-colors border-b-2 ${
              active === tab.value
                ? "border-primary text-primary"
                : tab.disabled
                  ? "border-transparent text-gray-40 cursor-not-allowed"
                  : "border-transparent text-gray-70 hover:text-gray-90 hover:border-gray-30"
            }`}
          >
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="inline-flex items-center justify-center rounded-full bg-gray-70 px-1.5 py-0.5 text-[10px] leading-none text-white">
                {tab.badge > 99 ? "99+" : tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
