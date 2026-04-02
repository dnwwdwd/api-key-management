"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";
import { cn } from "@/lib/utils";

export type ChartConfig = Record<
  string,
  {
    label: string;
    color: string;
  }
>;

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) {
    throw new Error("useChart must be used inside ChartContainer");
  }

  return context;
}

export function ChartContainer({
  id,
  className,
  children,
  config,
}: React.ComponentProps<"div"> & {
  config: ChartConfig;
  children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"];
}) {
  const style = React.useMemo(() => {
    return Object.entries(config).reduce<Record<string, string>>((acc, [key, value]) => {
      acc[`--color-${key}`] = value.color;
      return acc;
    }, {});
  }, [config]);

  return (
    <ChartContext.Provider value={{ config }}>
      <div id={id} className={cn("h-[300px] w-full", className)} style={style as React.CSSProperties}>
        <RechartsPrimitive.ResponsiveContainer>{children}</RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

export const ChartTooltip = RechartsPrimitive.Tooltip;

export function ChartTooltipContent({
  active,
  payload,
  className,
}: {
  active?: boolean;
  payload?: Array<{
    dataKey?: string | number;
    value?: string | number | null;
  }>;
  className?: string;
}) {
  const { config } = useChart();

  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className={cn("rounded-md border border-zinc-200 bg-white p-2 text-xs shadow-sm", className)}>
      {payload.map((entry) => {
        const key = String(entry.dataKey ?? "");
        const label = config[key]?.label ?? key;
        const value = entry.value;

        return (
          <div key={`${key}-${entry.value}`} className="flex items-center justify-between gap-3">
            <span className="text-zinc-500">{label}</span>
            <span className="font-medium text-zinc-950">{value ?? "-"}</span>
          </div>
        );
      })}
    </div>
  );
}

export const ChartLegend = RechartsPrimitive.Legend;
