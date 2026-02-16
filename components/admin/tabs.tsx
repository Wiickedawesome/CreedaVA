"use client";

import { useState } from "react";

export interface Tab {
  label: string;
  value: string;
  badge?: number;
  disabled?: boolean;
}

interface AdminTabsProps {
  tabs: Tab[];
  defaultValue?: string;
  activeTab?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export function AdminTabs({ tabs, defaultValue, activeTab, onChange, className = "" }: AdminTabsProps) {
  const [internalActive, setInternalActive] = useState(defaultValue || tabs[0]?.value || "");
  
  // Allow controlled or uncontrolled mode
  const current = activeTab !== undefined ? activeTab : internalActive;

  function handleChange(value: string) {
    if (activeTab === undefined) {
      setInternalActive(value);
    }
    onChange?.(value);
  }

  return (
    <div className={`w-full border-b border-border ${className}`}>
      <div className="flex w-full gap-2 overflow-x-auto no-scrollbar -mb-px">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            disabled={tab.disabled}
            onClick={() => !tab.disabled && handleChange(tab.value)}
            className={`
              flex items-center justify-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-medium tracking-wide transition-colors border-b-2
              ${
                current === tab.value
                  ? "border-primary text-primary"
                  : tab.disabled
                    ? "border-transparent text-gray-40 cursor-not-allowed"
                    : "border-transparent text-gray-70 hover:text-gray-90 hover:border-gray-30"
              }
            `}
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
