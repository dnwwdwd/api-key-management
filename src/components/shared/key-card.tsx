"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { ApiKeyView } from "@/lib/actions/api-keys";

type KeyCardProps = {
  item: ApiKeyView;
  selected: boolean;
  onSelect: (item: ApiKeyView) => void;
};

export function KeyCard({ item, selected, onSelect }: KeyCardProps) {
  const maskedPreview = useMemo(() => {
    if (!item.apiKey) {
      return "--";
    }

    if (item.apiKey.length <= 10) {
      return `${item.apiKey.slice(0, 2)}***${item.apiKey.slice(-2)}`;
    }

    return `${item.apiKey.slice(0, 6)}...${item.apiKey.slice(-4)}`;
  }, [item.apiKey]);

  const updatedAt = new Intl.DateTimeFormat(undefined, {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(item.updatedAt));

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className={cn(
        "group w-full border-b border-gray-100 px-5 py-4 text-left transition-colors",
        "hover:bg-zinc-50",
        selected
          ? "border-l-4 border-l-black bg-zinc-50 pl-4"
          : "border-l-4 border-l-transparent",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-zinc-900">{item.name}</h3>
          <p className="mt-1 inline-flex rounded border border-gray-200 bg-white px-2 py-0.5 text-xs text-gray-500 shadow-sm">
            {item.providerName}
          </p>
          <p className="mt-2 truncate font-mono text-xs text-zinc-700/80">{maskedPreview}</p>
        </div>
        <span className="shrink-0 text-xs text-zinc-400">{updatedAt}</span>
      </div>
    </button>
  );
}
