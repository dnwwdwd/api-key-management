"use client";

import { useMemo, useState } from "react";
import { Activity, Copy, Eye, EyeOff, Pencil, Trash2, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { ApiKeyView } from "@/lib/actions/api-keys";
import { CodeSnippetsDialog } from "./code-snippets-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type KeyRecordListProps = {
  items: ApiKeyView[];
  onEdit: (item: ApiKeyView) => void;
  onDelete: (item: ApiKeyView) => void;
};

type PingStatus = {
  kind: "success";
  status: number;
  latencyMs: number;
} | {
  kind: "error";
  rawMessage: string;
};

type BalanceStatus =
  | {
      kind: "success";
      supported: true;
      metricType: "balance" | "usage";
      displayValue: string | null;
    }
  | {
      kind: "success";
      supported: false;
    }
  | {
      kind: "error";
      rawMessage: string;
    };

function supportsBalance(providerName: string, baseUrl: string | null) {
  const normalizedName = providerName.toLowerCase();
  const normalizedBaseUrl = baseUrl?.toLowerCase() ?? "";

  return (
    normalizedName.includes("deepseek") ||
    normalizedName.includes("moonshot") ||
    normalizedName.includes("kimi") ||
    normalizedName.includes("openai") ||
    normalizedBaseUrl.includes("deepseek.com") ||
    normalizedBaseUrl.includes("moonshot.cn") ||
    normalizedBaseUrl.includes("openai.com")
  );
}

export function KeyRecordList({ items, onEdit, onDelete }: KeyRecordListProps) {
  const td = useTranslations("dashboard");
  const tc = useTranslations("common");
  const [maskedMap, setMaskedMap] = useState<Record<number, boolean>>({});
  const [pingLoadingMap, setPingLoadingMap] = useState<Record<number, boolean>>({});
  const [pingStatusMap, setPingStatusMap] = useState<Record<number, PingStatus | undefined>>({});
  const [balanceLoadingMap, setBalanceLoadingMap] = useState<Record<number, boolean>>({});
  const [balanceStatusMap, setBalanceStatusMap] = useState<
    Record<number, BalanceStatus | undefined>
  >({});
  const [snippetTarget, setSnippetTarget] = useState<ApiKeyView | null>(null);

  const emptyText = tc("baseUrlEmpty");

  const sortedItems = useMemo(() => [...items].sort((a, b) => b.id - a.id), [items]);

  const onCopy = async (item: ApiKeyView) => {
    if (!item.apiKey) {
      toast.error(tc("copyFailed"));
      return;
    }

    try {
      await navigator.clipboard.writeText(item.apiKey);
      toast.success(td("copied"));
    } catch {
      toast.error(tc("copyFailed"));
    }
  };

  const onPing = async (item: ApiKeyView) => {
    setPingLoadingMap((prev) => ({ ...prev, [item.id]: true }));
    setPingStatusMap((prev) => ({ ...prev, [item.id]: undefined }));

    try {
      const response = await fetch("/api/test-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ keyId: item.id }),
      });

      const payload = (await response.json()) as {
        ok: boolean;
        status?: number;
        latencyMs?: number;
        rawMessage?: string;
      };

      if (payload.ok) {
        setPingStatusMap((prev) => ({
          ...prev,
          [item.id]: {
            kind: "success",
            status: payload.status ?? 200,
            latencyMs: payload.latencyMs ?? 0,
          },
        }));
      } else {
        setPingStatusMap((prev) => ({
          ...prev,
          [item.id]: {
            kind: "error",
            rawMessage: payload.rawMessage ?? td("pingFailedRawFallback"),
          },
        }));
      }
    } catch (error) {
      setPingStatusMap((prev) => ({
        ...prev,
        [item.id]: {
          kind: "error",
          rawMessage: error instanceof Error ? error.message : td("pingFailedRawFallback"),
        },
      }));
    } finally {
      setPingLoadingMap((prev) => ({ ...prev, [item.id]: false }));
    }
  };

  const onCheckBalance = async (item: ApiKeyView) => {
    setBalanceLoadingMap((prev) => ({ ...prev, [item.id]: true }));
    setBalanceStatusMap((prev) => ({ ...prev, [item.id]: undefined }));

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
        rawMessage?: string;
      };

      if (payload.ok && payload.supported) {
        setBalanceStatusMap((prev) => ({
          ...prev,
          [item.id]: {
            kind: "success",
            supported: true,
            metricType: payload.metricType ?? "usage",
            displayValue: payload.displayValue ?? null,
          },
        }));
      } else if (payload.ok && !payload.supported) {
        setBalanceStatusMap((prev) => ({
          ...prev,
          [item.id]: {
            kind: "success",
            supported: false,
          },
        }));
      } else {
        setBalanceStatusMap((prev) => ({
          ...prev,
          [item.id]: {
            kind: "error",
            rawMessage: payload.rawMessage ?? td("balanceFailedRawFallback"),
          },
        }));
      }
    } catch (error) {
      setBalanceStatusMap((prev) => ({
        ...prev,
        [item.id]: {
          kind: "error",
          rawMessage: error instanceof Error ? error.message : td("balanceFailedRawFallback"),
        },
      }));
    } finally {
      setBalanceLoadingMap((prev) => ({ ...prev, [item.id]: false }));
    }
  };

  if (sortedItems.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-6 text-center text-sm text-zinc-500">
        {td("emptyKeys")}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {sortedItems.map((item) => {
          const isMasked = Boolean(maskedMap[item.id]);
          const apiKeyValue = isMasked
            ? "*".repeat(Math.max(item.apiKey.length, 12))
            : item.apiKey;
          const canBalance = supportsBalance(item.providerName, item.providerBaseUrl);
          const pingStatus = pingStatusMap[item.id];
          const balanceStatus = balanceStatusMap[item.id];

          const updatedAt = new Intl.DateTimeFormat(undefined, {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }).format(new Date(item.updatedAt));

          return (
            <Card key={item.id} className="border-zinc-200">
              <CardHeader className="border-b border-zinc-200 pb-3">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-base text-zinc-950">{item.name || emptyText}</CardTitle>
                  <span className="shrink-0 text-xs text-zinc-500">{updatedAt}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 p-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-xs text-zinc-500">{td("provider")}</p>
                    <p className="mt-1 text-sm text-zinc-900">{item.providerName || emptyText}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">{td("baseUrl")}</p>
                    <p className="mt-1 break-all font-mono text-sm text-zinc-900">
                      {item.providerBaseUrl || emptyText}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs text-zinc-500">{td("apiKey")}</p>
                    <p className="mt-1 break-all rounded-md border border-zinc-200 bg-zinc-50 p-2 font-mono text-sm text-zinc-900">
                      {apiKeyValue || emptyText}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs text-zinc-500">{td("notes")}</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-900">{item.notes || emptyText}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      setMaskedMap((prev) => ({
                        ...prev,
                        [item.id]: !prev[item.id],
                      }))
                    }
                  >
                    {isMasked ? <Eye className="mr-1 h-4 w-4" /> : <EyeOff className="mr-1 h-4 w-4" />}
                    {isMasked ? td("show") : td("hide")}
                  </Button>
                  <Button type="button" variant="secondary" size="sm" onClick={() => onCopy(item)}>
                    <Copy className="mr-1 h-4 w-4" />
                    {tc("copy")}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={Boolean(pingLoadingMap[item.id])}
                    onClick={() => onPing(item)}
                  >
                    <Activity className="mr-1 h-4 w-4" />
                    {td("pingTest")}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={!canBalance || Boolean(balanceLoadingMap[item.id])}
                    onClick={() => onCheckBalance(item)}
                  >
                    <Wallet className="mr-1 h-4 w-4" />
                    {td("checkBalance")}
                  </Button>
                  <Button type="button" variant="secondary" size="sm" onClick={() => setSnippetTarget(item)}>
                    {td("codeSnippets")}
                  </Button>
                  <Button type="button" variant="secondary" size="sm" onClick={() => onEdit(item)}>
                    <Pencil className="mr-1 h-4 w-4" />
                    {tc("edit")}
                  </Button>
                  <Button type="button" variant="destructive" size="sm" onClick={() => onDelete(item)}>
                    <Trash2 className="mr-1 h-4 w-4" />
                    {tc("delete")}
                  </Button>
                </div>

                {!canBalance ? (
                  <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-500">
                    {td("balanceUnsupportedHint")}
                  </div>
                ) : null}

                {pingStatus ? (
                  pingStatus.kind === "success" ? (
                    <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
                      {td("pingSuccess", {
                        status: pingStatus.status,
                        latencyMs: pingStatus.latencyMs,
                      })}
                    </div>
                  ) : (
                    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      <p className="font-medium">{pingStatus.rawMessage}</p>
                      <p className="mt-1">{td("pingTroubleshoot")}</p>
                    </div>
                  )
                ) : null}

                {balanceStatus ? (
                  balanceStatus.kind === "success" && balanceStatus.supported ? (
                    <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
                      <p className="text-xs text-zinc-500">
                        {balanceStatus.metricType === "balance" ? td("balanceLabel") : td("usageLabel")}
                      </p>
                      <p className="mt-1 text-sm font-medium text-zinc-900">
                        {balanceStatus.displayValue ?? emptyText}
                      </p>
                    </div>
                  ) : balanceStatus.kind === "success" && !balanceStatus.supported ? (
                    <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-500">
                      {td("balanceUnsupportedHint")}
                    </div>
                  ) : (
                    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      <p className="font-medium">{balanceStatus.rawMessage}</p>
                      <p className="mt-1">{td("balanceTroubleshoot")}</p>
                    </div>
                  )
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {snippetTarget ? (
        <CodeSnippetsDialog
          open={Boolean(snippetTarget)}
          onOpenChange={(open) => {
            if (!open) {
              setSnippetTarget(null);
            }
          }}
          keyId={snippetTarget.id}
          apiKey={snippetTarget.apiKey}
          providerBaseUrl={snippetTarget.providerBaseUrl}
        />
      ) : null}
    </>
  );
}
