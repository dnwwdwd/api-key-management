"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, Copy, Eye, EyeOff, Pencil, Trash2, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { CodeSnippetsDialog } from "@/components/shared/code-snippets-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ApiKeyView } from "@/lib/actions/api-keys";

type KeyDetailProps = {
  item: ApiKeyView | null;
  onEdit: (item: ApiKeyView) => void;
  onDeleteRequest: (item: ApiKeyView) => void;
  isMobile?: boolean;
};

type PingResult =
  | {
      ok: true;
      status: number;
      latencyMs: number;
    }
  | {
      ok: false;
      status: number;
      rawMessage: string;
    };

type BalanceResult =
  | {
      ok: true;
      supported: true;
      metricType: "balance" | "usage";
      displayValue: string | null;
      numericValue: number | null;
    }
  | {
      ok: true;
      supported: false;
    }
  | {
      ok: false;
      status: number;
      metricType: "balance" | "usage";
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

export function KeyDetail({
  item,
  onEdit,
  onDeleteRequest,
  isMobile = false,
}: KeyDetailProps) {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const [showPlainText, setShowPlainText] = useState(false);
  const [pingLoading, setPingLoading] = useState(false);
  const [pingResult, setPingResult] = useState<PingResult | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceResult, setBalanceResult] = useState<BalanceResult | null>(null);
  const [snippetOpen, setSnippetOpen] = useState(false);

  useEffect(() => {
    setShowPlainText(false);
    setPingResult(null);
    setBalanceResult(null);
  }, [item?.id]);

  const maskedKey = useMemo(() => {
    if (!item?.apiKey) {
      return "";
    }

    return "*".repeat(Math.max(item.apiKey.length, 12));
  }, [item?.apiKey]);

  if (!item) {
    return (
      <div className="flex h-full min-h-72 items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-white text-sm text-zinc-500">
        {t("emptyKeys")}
      </div>
    );
  }

  const canCheckBalance = supportsBalance(item.providerName, item.providerBaseUrl);

  const onCopy = async () => {
    if (!item.apiKey) {
      toast.error(tc("copyFailed"));
      return;
    }

    await navigator.clipboard.writeText(item.apiKey);
    toast.success(t("copied"));
  };

  const onPingTest = async () => {
    if (!item.providerBaseUrl) {
      setPingResult({
        ok: false,
        status: 400,
        rawMessage: t("pingBaseUrlMissingRaw"),
      });
      return;
    }

    setPingLoading(true);
    setPingResult(null);

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
        status: number;
        latencyMs?: number;
        rawMessage?: string;
      };

      if (payload.ok) {
        setPingResult({
          ok: true,
          status: payload.status,
          latencyMs: payload.latencyMs ?? 0,
        });
        return;
      }

      setPingResult({
        ok: false,
        status: payload.status,
        rawMessage: payload.rawMessage ?? t("pingFailedRawFallback"),
      });
    } catch (error) {
      setPingResult({
        ok: false,
        status: 500,
        rawMessage:
          error instanceof Error ? error.message : t("pingFailedRawFallback"),
      });
    } finally {
      setPingLoading(false);
    }
  };

  const onCheckBalance = async () => {
    setBalanceLoading(true);
    setBalanceResult(null);

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
        status?: number;
        rawMessage?: string;
      };

      if (payload.ok && payload.supported) {
        setBalanceResult({
          ok: true,
          supported: true,
          metricType: payload.metricType ?? "usage",
          displayValue: payload.displayValue ?? null,
          numericValue: payload.numericValue ?? null,
        });
        return;
      }

      if (payload.ok && !payload.supported) {
        setBalanceResult({
          ok: true,
          supported: false,
        });
        return;
      }

      setBalanceResult({
        ok: false,
        status: payload.status ?? response.status,
        metricType: payload.metricType ?? "usage",
        rawMessage: payload.rawMessage ?? t("balanceFailedRawFallback"),
      });
    } catch (error) {
      setBalanceResult({
        ok: false,
        status: 500,
        metricType: "usage",
        rawMessage:
          error instanceof Error ? error.message : t("balanceFailedRawFallback"),
      });
    } finally {
      setBalanceLoading(false);
    }
  };

  return (
    <div className="h-full rounded-xl border border-zinc-200 bg-white p-5 md:p-8">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="truncate text-2xl font-bold tracking-tight text-zinc-950">
            {item.name}
          </h2>
          <p className="mt-2 inline-flex rounded border border-gray-200 bg-white px-2 py-0.5 text-xs text-zinc-500 shadow-sm">
            {item.providerName}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button size="icon" variant="secondary" onClick={() => onEdit(item)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="destructive" onClick={() => onDeleteRequest(item)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mt-8 space-y-6">
        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            {t("apiKey")}
          </p>
          <div className="break-all rounded-md border border-gray-200 bg-zinc-50 p-3.5 font-mono text-sm text-zinc-900 shadow-inner">
            {showPlainText ? item.apiKey : maskedKey}
          </div>
          <div className={cn("flex flex-wrap gap-2", isMobile && "flex-col")}> 
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowPlainText((value) => !value)}
              className={cn(isMobile && "w-full py-3.5")}
            >
              {showPlainText ? (
                <>
                  <EyeOff className="mr-2 h-4 w-4" />
                  {t("hide")}
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  {t("show")}
                </>
              )}
            </Button>
            <Button
              type="button"
              onClick={onCopy}
              className={cn("bg-[#09090B] text-white hover:bg-zinc-800", isMobile && "w-full py-3.5")}
            >
              <Copy className="mr-2 h-4 w-4" />
              {tc("copy")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setSnippetOpen(true)}
              className={cn(isMobile && "w-full py-3.5")}
            >
              {t("codeSnippets")}
            </Button>
          </div>
        </section>

        <section className="space-y-5 text-sm">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {t("baseUrl")}
            </p>
            <div className="overflow-x-auto rounded-md border border-gray-200 bg-zinc-50 p-3.5 font-mono text-sm text-zinc-700 shadow-inner">
              {item.providerBaseUrl || tc("baseUrlEmpty")}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {t("notes")}
            </p>
            <div className="whitespace-pre-wrap rounded-md border border-gray-200 bg-zinc-50 p-3.5 text-sm text-zinc-700 shadow-inner">
              {item.notes || tc("baseUrlEmpty")}
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div className={cn("flex flex-wrap gap-2", isMobile && "flex-col")}> 
            <Button
              type="button"
              variant="secondary"
              onClick={onPingTest}
              disabled={pingLoading}
              className={cn(isMobile && "w-full py-3.5")}
            >
              <Activity className="mr-2 h-4 w-4" />
              {t("pingTest")}
            </Button>

            {canCheckBalance ? (
              <Button
                type="button"
                variant="secondary"
                onClick={onCheckBalance}
                disabled={balanceLoading}
                className={cn(isMobile && "w-full py-3.5")}
              >
                <Wallet className="mr-2 h-4 w-4" />
                {t("checkBalance")}
              </Button>
            ) : null}
          </div>

          {!canCheckBalance ? (
            <p className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-500">
              {t("balanceUnsupportedHint")}
            </p>
          ) : null}

          {pingResult ? (
            pingResult.ok ? (
              <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700">
                <p>
                  {t("pingSuccess", {
                    status: pingResult.status,
                    latencyMs: pingResult.latencyMs,
                  })}
                </p>
              </div>
            ) : (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <p className="font-medium">{pingResult.rawMessage}</p>
                <p className="mt-1">{t("pingTroubleshoot")}</p>
              </div>
            )
          ) : null}

          {balanceResult ? (
            balanceResult.ok && balanceResult.supported ? (
              <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700">
                <p className="text-xs uppercase tracking-wide text-zinc-500">
                  {balanceResult.metricType === "balance"
                    ? t("balanceLabel")
                    : t("usageLabel")}
                </p>
                <p className="mt-1 text-lg font-semibold text-zinc-950">
                  {balanceResult.displayValue ?? tc("baseUrlEmpty")}
                </p>
              </div>
            ) : balanceResult.ok && !balanceResult.supported ? (
              <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-500">
                {t("balanceUnsupportedHint")}
              </div>
            ) : (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <p className="font-medium">{balanceResult.rawMessage}</p>
                <p className="mt-1">{t("balanceTroubleshoot")}</p>
              </div>
            )
          ) : null}
        </section>
      </div>

      <CodeSnippetsDialog
        open={snippetOpen}
        onOpenChange={setSnippetOpen}
        keyId={item.id}
        apiKey={item.apiKey}
        providerBaseUrl={item.providerBaseUrl}
      />
    </div>
  );
}
