"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { generateCodeSnippet, type SnippetLanguage } from "@/lib/utils/code-snippets";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type CodeSnippetsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keyId: number;
  apiKey: string;
  providerBaseUrl: string | null;
};

export function CodeSnippetsDialog({
  open,
  onOpenChange,
  keyId,
  apiKey,
  providerBaseUrl,
}: CodeSnippetsDialogProps) {
  const t = useTranslations();
  const tc = useTranslations("common");
  const [language, setLanguage] = useState<SnippetLanguage>("curl");
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [modelSearch, setModelSearch] = useState("");
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [rawErrorMessage, setRawErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    const loadModels = async () => {
      setIsLoadingModels(true);
      setRawErrorMessage(null);

      try {
        const response = await fetch("/api/fetch-models", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ keyId }),
        });

        const payload = (await response.json()) as {
          ok: boolean;
          models?: string[];
          rawMessage?: string;
        };

        if (!payload.ok) {
          if (!cancelled) {
            setModels([]);
            setRawErrorMessage(payload.rawMessage ?? t("errors.modelFetchFailed"));
          }
          return;
        }

        if (!cancelled) {
          const nextModels = payload.models ?? [];
          setModels(nextModels);
          setSelectedModel((current) => {
            if (current && nextModels.includes(current)) {
              return current;
            }

            return nextModels[0] ?? null;
          });
        }
      } catch (error) {
        if (!cancelled) {
          setModels([]);
          setRawErrorMessage(
            error instanceof Error ? error.message : t("errors.modelFetchFailed"),
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingModels(false);
        }
      }
    };

    loadModels();

    return () => {
      cancelled = true;
    };
  }, [keyId, open, t]);

  const filteredModels = useMemo(() => {
    const keyword = modelSearch.trim().toLowerCase();
    if (!keyword) {
      return models;
    }

    return models.filter((item) => item.toLowerCase().includes(keyword));
  }, [modelSearch, models]);

  const generatedCode = useMemo(
    () =>
      generateCodeSnippet({
        language,
        apiKey,
        baseUrl: providerBaseUrl,
        model: selectedModel,
      }),
    [apiKey, language, providerBaseUrl, selectedModel],
  );

  const onCopySnippet = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode);
      toast.success(t("dashboard.copied"));
    } catch {
      toast.error(tc("copyFailed"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("dashboard.codeSnippets")}</DialogTitle>
          <DialogDescription>{t("dashboard.codeSnippetsDescription")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-[280px_minmax(0,1fr)]">
            <div className="space-y-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                {t("dashboard.modelSelect")}
              </p>
              <Input
                value={modelSearch}
                onChange={(event) => setModelSearch(event.target.value)}
                placeholder={t("dashboard.modelSearch")}
                className="h-10 bg-white"
              />
              <div className="max-h-52 space-y-1 overflow-y-auto">
                {isLoadingModels ? (
                  <p className="px-2 py-3 text-sm text-zinc-500">{t("common.syncing")}</p>
                ) : filteredModels.length === 0 ? (
                  <p className="px-2 py-3 text-sm text-zinc-500">{t("dashboard.modelEmpty")}</p>
                ) : (
                  filteredModels.map((model) => (
                    <button
                      key={model}
                      type="button"
                      onClick={() => setSelectedModel(model)}
                      className={`w-full rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                        selectedModel === model
                          ? "border-zinc-950 bg-zinc-950 text-zinc-50"
                          : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100"
                      }`}
                    >
                      {model}
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Tabs
                value={language}
                onValueChange={(value) => setLanguage(value as SnippetLanguage)}
              >
                <TabsList>
                  <TabsTrigger value="curl">cURL</TabsTrigger>
                  <TabsTrigger value="python">Python</TabsTrigger>
                  <TabsTrigger value="nodejs">Node.js</TabsTrigger>
                </TabsList>
              </Tabs>

              <pre className="max-h-[45vh] overflow-auto rounded-md border border-gray-200 bg-zinc-50 p-4 font-mono text-xs text-zinc-900 shadow-inner">
                <code>{generatedCode}</code>
              </pre>
            </div>
          </div>

          {rawErrorMessage ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <p className="font-medium">{rawErrorMessage}</p>
              <p className="mt-1">{t("dashboard.modelFetchTroubleshoot")}</p>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            {tc("cancel")}
          </Button>
          <Button type="button" onClick={onCopySnippet}>
            {t("dashboard.copyCode")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
