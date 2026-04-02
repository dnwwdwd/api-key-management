"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ProviderPickerOption = {
  id: number;
  name: string;
};

type ProviderPickerProps = {
  options: ProviderPickerOption[];
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder: string;
  searchPlaceholder: string;
  allLabel?: string;
  className?: string;
};

export function ProviderPicker({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  allLabel,
  className,
}: ProviderPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!rootRef.current) {
        return;
      }

      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel =
    value === null
      ? allLabel ?? placeholder
      : options.find((item) => item.id === value)?.name ?? placeholder;

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) {
      return options;
    }

    return options.filter((item) => item.name.toLowerCase().includes(keyword));
  }, [options, search]);

  return (
    <div className={cn("relative w-full", className)} ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-10 w-full items-center justify-between rounded-md border border-zinc-200 bg-white px-3 text-left text-sm text-zinc-700 transition-colors hover:bg-zinc-50"
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown className="ml-2 h-4 w-4 text-zinc-400" />
      </button>

      {open ? (
        <div className="absolute left-0 right-0 top-11 z-30 rounded-md border border-zinc-200 bg-white p-2 shadow-sm">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-10"
          />
          <div className="mt-2 max-h-60 overflow-y-auto">
            {allLabel ? (
              <button
                type="button"
                onClick={() => {
                  onChange(null);
                  setOpen(false);
                }}
                className={cn(
                  "w-full rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-zinc-50",
                  value === null ? "bg-zinc-50 text-zinc-950" : "text-zinc-700",
                )}
              >
                {allLabel}
              </button>
            ) : null}
            {filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onChange(item.id);
                  setOpen(false);
                }}
                className={cn(
                  "w-full rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-zinc-50",
                  item.id === value ? "bg-zinc-50 text-zinc-950" : "text-zinc-700",
                )}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
