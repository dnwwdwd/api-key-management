"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";
import { AppSidebar } from "@/components/shared/app-sidebar";
import type { ProviderItem } from "@/components/shared/provider-tabs";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartLegend,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

type AnalyticsKeyItem = {
  id: number;
  name: string;
  providerName: string;
};

type AnalyticsDashboardProps = {
  locale: string;
  username: string;
  providers: ProviderItem[];
  items: AnalyticsKeyItem[];
};

type AnalyticsRow = {
  keyId: number;
  keyName: string;
  providerName: string;
  status: "success" | "unsupported" | "error";
  metricType: "balance" | "usage" | null;
  displayValue: string | null;
  numericValue: number | null;
  rawError: string | null;
};

const chartColors = ["#111827", "#374151", "#6B7280", "#9CA3AF", "#D1D5DB"];

function BalanceTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value?: number | string; dataKey?: string | number }>;
  label?: string;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const value = Number(payload[0]?.value ?? 0);
  return (
    <div className="rounded-md border border-zinc-200 bg-white p-2 text-xs shadow-sm">
      <p className="font-medium text-zinc-900">{label ?? "--"}</p>
      <p className="mt-1 text-zinc-600">{value.toFixed(4)}</p>
    </div>
  );
}

export function AnalyticsDashboard({ locale, username, providers, items }: AnalyticsDashboardProps) {
  const t = useTranslations();
  const [isLoading, setIsLoading] = useState(true);
  const [rows, setRows] = useState<AnalyticsRow[]>([]);

  const loadAnalytics = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    }

    const nextRows = await Promise.all(
      items.map(async (item): Promise<AnalyticsRow> => {
        try {
          const response = await fetch("/api/check-balance", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ keyId: item.id }),
          });

          const payload = (await response.json()) as {
            ok: boolean;
            supported: boolean;
            metricType?: "balance" | "usage";
            displayValue?: string | null;
            numericValue?: number | null;
            rawMessage?: string;
          };

          if (payload.ok && payload.supported) {
            return {
              keyId: item.id,
              keyName: item.name,
              providerName: item.providerName,
              status: "success",
              metricType: payload.metricType ?? null,
              displayValue: payload.displayValue ?? null,
              numericValue: payload.numericValue ?? null,
              rawError: null,
            };
          }

          if (payload.ok && !payload.supported) {
            return {
              keyId: item.id,
              keyName: item.name,
              providerName: item.providerName,
              status: "unsupported",
              metricType: null,
              displayValue: null,
              numericValue: null,
              rawError: null,
            };
          }

          return {
            keyId: item.id,
            keyName: item.name,
            providerName: item.providerName,
            status: "error",
            metricType: payload.metricType ?? null,
            displayValue: null,
            numericValue: null,
            rawError: payload.rawMessage ?? t("dashboard.analyticsErrorFallback"),
          };
        } catch (error) {
          return {
            keyId: item.id,
            keyName: item.name,
            providerName: item.providerName,
            status: "error",
            metricType: null,
            displayValue: null,
            numericValue: null,
            rawError:
              error instanceof Error ? error.message : t("dashboard.analyticsErrorFallback"),
          };
        }
      }),
    );

    setRows(nextRows);
    setIsLoading(false);
  }, [items, t]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void loadAnalytics(false);
  }, [loadAnalytics]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const metrics = useMemo(() => {
    const totalKeys = items.length;
    const supportedKeys = rows.filter((item) => item.status !== "unsupported").length;
    const successKeys = rows.filter((item) => item.status === "success").length;
    const totalBalance = rows.reduce((total, item) => {
      if (item.status !== "success" || item.metricType !== "balance") {
        return total;
      }

      return total + (item.numericValue ?? 0);
    }, 0);

    return {
      totalKeys,
      supportedKeys,
      successKeys,
      totalBalance,
    };
  }, [items.length, rows]);

  const valueChartData = useMemo(() => {
    const grouped = rows.reduce<Record<string, number>>((acc, item) => {
      if (item.status !== "success" || item.metricType !== "balance") {
        return acc;
      }

      acc[item.providerName] = (acc[item.providerName] ?? 0) + (item.numericValue ?? 0);
      return acc;
    }, {});

    return Object.entries(grouped).map(([providerName, value]) => ({
      providerName,
      value,
    }));
  }, [rows]);

  const providerChartData = useMemo(() => {
    const grouped = rows.reduce<Record<string, number>>((acc, item) => {
      acc[item.providerName] = (acc[item.providerName] ?? 0) + 1;
      return acc;
    }, {});

    return Object.entries(grouped).map(([provider, count], index) => ({
      provider,
      count,
      fill: chartColors[index % chartColors.length],
    }));
  }, [rows]);

  const sortedRows = useMemo(() => {
    return [...rows]
      .map((row, index) => ({ row, index }))
      .sort((left, right) => {
        const leftBalance =
          left.row.status === "success" &&
          left.row.metricType === "balance" &&
          typeof left.row.numericValue === "number"
            ? left.row.numericValue
            : null;
        const rightBalance =
          right.row.status === "success" &&
          right.row.metricType === "balance" &&
          typeof right.row.numericValue === "number"
            ? right.row.numericValue
            : null;

        if (leftBalance !== null && rightBalance !== null) {
          if (rightBalance !== leftBalance) {
            return rightBalance - leftBalance;
          }
        } else if (leftBalance !== null || rightBalance !== null) {
          return leftBalance !== null ? -1 : 1;
        }

        return left.index - right.index;
      })
      .map((item) => item.row);
  }, [rows]);

  const chartConfig = {
    value: {
      label: t("dashboard.analyticsMetricValue"),
      color: "#111827",
    },
    count: {
      label: t("dashboard.analyticsMetricKeys"),
      color: "#6B7280",
    },
  };

  return (
    <div className="h-screen w-full bg-zinc-50">
      <div className="h-full w-full p-3 md:p-6">
        <div className="grid h-full grid-cols-1 gap-4 md:grid-cols-[250px_minmax(0,1fr)]">
          <AppSidebar
            locale={locale}
            username={username}
            providers={providers}
            activeMenu="analytics"
            showOnMobile
          />

          <div className="min-h-0 overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-4 md:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-semibold text-zinc-950">{t("dashboard.analytics")}</h1>
                <p className="mt-1 text-sm text-zinc-500">{t("dashboard.analyticsSubtitle")}</p>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  void loadAnalytics(true);
                }}
                disabled={isLoading}
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                {t("dashboard.analyticsRefresh")}
              </Button>
            </div>

            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-zinc-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">{t("dashboard.analyticsTotalKeys")}</p>
                <p className="mt-2 text-2xl font-semibold text-zinc-950">{metrics.totalKeys}</p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">{t("dashboard.analyticsSupportedKeys")}</p>
                <p className="mt-2 text-2xl font-semibold text-zinc-950">{metrics.supportedKeys}</p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">{t("dashboard.analyticsSuccessKeys")}</p>
                <p className="mt-2 text-2xl font-semibold text-zinc-950">{metrics.successKeys}</p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">{t("dashboard.analyticsTotalValue")}</p>
                <p className="mt-2 text-2xl font-semibold text-zinc-950">{metrics.totalBalance.toFixed(4)}</p>
              </div>
            </section>

            <section className="mt-4 grid gap-4 xl:grid-cols-2">
              <div className="rounded-xl border border-zinc-200 bg-white p-4">
                <h2 className="text-sm font-semibold text-zinc-950">{t("dashboard.analyticsValueChart")}</h2>
                {isLoading ? (
                  <div className="mt-4 h-[300px] animate-pulse rounded-lg bg-zinc-100" />
                ) : valueChartData.length === 0 ? (
                  <div className="mt-4 flex h-[300px] items-center justify-center rounded-lg bg-zinc-50 text-sm text-zinc-500">
                    {t("dashboard.analyticsNoData")}
                  </div>
                ) : (
                  <ChartContainer className="mt-4" config={chartConfig}>
                    <BarChart data={valueChartData}>
                      <CartesianGrid vertical={false} stroke="#E4E4E7" />
                      <XAxis dataKey="providerName" tickLine={false} axisLine={false} tickMargin={10} />
                      <YAxis tickLine={false} axisLine={false} width={52} />
                      <ChartTooltip cursor={false} content={<BalanceTooltip />} />
                      <Bar dataKey="value" fill="var(--color-value)" radius={4} />
                    </BarChart>
                  </ChartContainer>
                )}
              </div>

              <div className="rounded-xl border border-zinc-200 bg-white p-4">
                <h2 className="text-sm font-semibold text-zinc-950">{t("dashboard.analyticsProviderChart")}</h2>
                {isLoading ? (
                  <div className="mt-4 h-[300px] animate-pulse rounded-lg bg-zinc-100" />
                ) : providerChartData.length === 0 ? (
                  <div className="mt-4 flex h-[300px] items-center justify-center rounded-lg bg-zinc-50 text-sm text-zinc-500">
                    {t("dashboard.analyticsNoData")}
                  </div>
                ) : (
                  <ChartContainer className="mt-4" config={chartConfig}>
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend />
                      <Pie
                        data={providerChartData}
                        dataKey="count"
                        nameKey="provider"
                        innerRadius={56}
                        outerRadius={96}
                        paddingAngle={2}
                      >
                        {providerChartData.map((entry) => (
                          <Cell key={entry.provider} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                )}
              </div>
            </section>

            <section className="mt-4 rounded-xl border border-zinc-200 bg-white p-4">
              <h2 className="text-sm font-semibold text-zinc-950">{t("dashboard.analyticsTable")}</h2>
              {isLoading ? (
                <div className="mt-4 h-48 animate-pulse rounded-lg bg-zinc-100" />
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-500">
                        <th className="px-3 py-2">{t("dashboard.name")}</th>
                        <th className="px-3 py-2">{t("dashboard.provider")}</th>
                        <th className="px-3 py-2">{t("dashboard.analyticsMetricType")}</th>
                        <th className="px-3 py-2">{t("dashboard.analyticsMetricValue")}</th>
                        <th className="px-3 py-2">{t("dashboard.analyticsStatus")}</th>
                        <th className="px-3 py-2">{t("dashboard.analyticsRawError")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedRows.map((row) => (
                        <tr key={row.keyId} className="border-b border-gray-100 text-zinc-700">
                          <td className="px-3 py-2 font-medium text-zinc-900">{row.keyName}</td>
                          <td className="px-3 py-2">{row.providerName}</td>
                          <td className="px-3 py-2">
                            {row.metricType ? t(`dashboard.${row.metricType}Label`) : "--"}
                          </td>
                          <td className="px-3 py-2">{row.displayValue ?? "--"}</td>
                          <td className="px-3 py-2">
                            {row.status === "success"
                              ? t("dashboard.analyticsStatusSuccess")
                              : row.status === "unsupported"
                                ? t("dashboard.analyticsStatusUnsupported")
                                : t("dashboard.analyticsStatusError")}
                          </td>
                          <td className="max-w-[300px] truncate px-3 py-2" title={row.rawError ?? ""}>
                            {row.rawError ?? "--"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
