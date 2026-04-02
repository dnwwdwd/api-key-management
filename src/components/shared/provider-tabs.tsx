"use client";

import { cn } from "@/lib/utils";

export type ProviderItem = {
  id: number;
  name: string;
  baseUrl: string | null;
  isCustom: boolean;
};

type ProviderTabsProps = {
  providers: ProviderItem[];
  selectedProviderId: number | null;
  onSelect: (providerId: number | null) => void;
  allLabel: string;
  orientation?: "horizontal" | "vertical";
};

export function ProviderTabs({
  providers,
  selectedProviderId,
  onSelect,
  allLabel,
  orientation = "horizontal",
}: ProviderTabsProps) {
  const isVertical = orientation === "vertical";

  return (
    <div className={cn("w-full", !isVertical && "overflow-x-auto pb-1")}>
      <div
        className={cn(
          "gap-2",
          isVertical ? "flex flex-col" : "flex min-w-max",
        )}
      >
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={cn(
            "text-sm font-medium transition-colors",
            isVertical
              ? "h-9 rounded-lg border px-4 text-left"
              : "h-9 rounded-full border px-4",
            selectedProviderId === null
              ? "border-zinc-950 bg-zinc-950 text-zinc-50"
              : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-100",
          )}
        >
          {allLabel}
        </button>
        {providers.map((provider) => (
          <button
            key={provider.id}
            type="button"
            onClick={() => onSelect(provider.id)}
            className={cn(
              "text-sm font-medium transition-colors",
              isVertical
                ? "h-9 rounded-lg border px-4 text-left"
                : "h-9 max-w-52 rounded-full border px-4",
              selectedProviderId === provider.id
                ? "border-zinc-950 bg-zinc-950 text-zinc-50"
                : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-100",
            )}
          >
            <span className="block truncate">{provider.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
