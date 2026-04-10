"use client";

import { useEffect, useMemo, useRef, useState, useTransition, type ChangeEventHandler } from "react";
import { Download, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  exportApiKeysAction,
  importApiKeysAction,
} from "@/lib/actions/api-keys";
import type { ProviderItem } from "./provider-tabs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ApiKeyTransferDialogProps = {
  mode: "export" | "import";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providers: ProviderItem[];
};

type ImportPreviewProvider = {
  name: string;
  baseUrl: string | null;
  keyCount: number;
};

function parseImportPreview(rawPayload: string): ImportPreviewProvider[] {
  const parsed = JSON.parse(rawPayload) as {
    providers?: Array<{
      name?: unknown;
      baseUrl?: unknown;
      apiKeys?: unknown;
    }>;
  };

  if (!parsed || !Array.isArray(parsed.providers)) {
    return [];
  }

  return parsed.providers
    .map((provider) => {
      const name = String(provider.name ?? "").trim();
      if (!name) {
        return null;
      }

      const keyCount = Array.isArray(provider.apiKeys)
        ? provider.apiKeys.filter((item) => {
            if (!item || typeof item !== "object") {
              return false;
            }

            const record = item as Record<string, unknown>;
            return Boolean(String(record.name ?? "").trim() && String(record.apiKey ?? "").trim());
          }).length
        : 0;

      const baseUrlRaw = provider.baseUrl;
      const baseUrl =
        baseUrlRaw === null || baseUrlRaw === undefined
          ? null
          : String(baseUrlRaw).trim() || null;

      return {
        name,
        baseUrl,
        keyCount,
      };
    })
    .filter((item): item is ImportPreviewProvider => Boolean(item));
}

export function ApiKeyTransferDialog({
  mode,
  open,
  onOpenChange,
  providers,
}: ApiKeyTransferDialogProps) {
  const t = useTranslations();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const allProviderIds = useMemo(() => providers.map((provider) => provider.id), [providers]);

  const [selectedExportProviderIds, setSelectedExportProviderIds] = useState<number[]>([]);
  const [importRawPayload, setImportRawPayload] = useState("");
  const [importFileName, setImportFileName] = useState("");
  const [importPreviewProviders, setImportPreviewProviders] = useState<ImportPreviewProvider[]>([]);
  const [selectedImportProviders, setSelectedImportProviders] = useState<string[]>([]);
  const importFileInputRef = useRef<HTMLInputElement | null>(null);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!open) {
      return;
    }

    setSelectedExportProviderIds(allProviderIds);

    if (mode === "import") {
      setImportRawPayload("");
      setImportFileName("");
      setImportPreviewProviders([]);
      setSelectedImportProviders([]);
    }
  }, [allProviderIds, mode, open]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const onSelectExportAll = () => {
    setSelectedExportProviderIds(allProviderIds);
  };

  const onToggleExportProvider = (providerId: number) => {
    setSelectedExportProviderIds((prev) => {
      if (prev.includes(providerId)) {
        return prev.filter((id) => id !== providerId);
      }

      return [...prev, providerId];
    });
  };

  const onChooseImportFile: ChangeEventHandler<HTMLInputElement> = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    void file.text().then((text) => {
      try {
        const preview = parseImportPreview(text);
        if (preview.length === 0) {
          toast.error(t("errors.invalidImportJson"));
          return;
        }

        setImportRawPayload(text);
        setImportFileName(file.name);
        setImportPreviewProviders(preview);
        setSelectedImportProviders(preview.map((item) => item.name));
      } catch {
        toast.error(t("errors.invalidImportJson"));
      }
    });

    event.target.value = "";
  };

  const onSelectImportAll = () => {
    setSelectedImportProviders(importPreviewProviders.map((item) => item.name));
  };

  const onToggleImportProvider = (providerName: string) => {
    setSelectedImportProviders((prev) => {
      if (prev.includes(providerName)) {
        return prev.filter((name) => name !== providerName);
      }

      return [...prev, providerName];
    });
  };

  const onConfirmExport = () => {
    if (selectedExportProviderIds.length === 0) {
      toast.error(t("dashboard.transferProviderRequired"));
      return;
    }

    startTransition(async () => {
      const providerIds =
        selectedExportProviderIds.length === allProviderIds.length
          ? null
          : selectedExportProviderIds;
      const result = await exportApiKeysAction(providerIds);

      if (!result.ok) {
        toast.error(t(result.messageKey));
        return;
      }

      const blob = new Blob([JSON.stringify(result.payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      const exportedProviderCount = result.payload.providers.length;
      const exportedKeyCount = result.payload.providers.reduce(
        (total, provider) => total + provider.apiKeys.length,
        0,
      );

      toast.success(
        t("dashboard.exportSuccessSummary", {
          providers: exportedProviderCount,
          keys: exportedKeyCount,
        }),
      );
      onOpenChange(false);
    });
  };

  const onConfirmImport = () => {
    if (!importRawPayload || importPreviewProviders.length === 0) {
      toast.error(t("errors.invalidImportJson"));
      return;
    }

    if (selectedImportProviders.length === 0) {
      toast.error(t("dashboard.transferProviderRequired"));
      return;
    }

    startTransition(async () => {
      const selectedProviders =
        selectedImportProviders.length === importPreviewProviders.length
          ? []
          : selectedImportProviders;

      const result = await importApiKeysAction({
        payload: importRawPayload,
        selectedProviders,
      });

      if (!result.ok) {
        toast.error(t(result.messageKey));
        return;
      }

      toast.success(
        t("dashboard.importSuccessSummary", {
          providers: result.summary.importedProviders,
          keys: result.summary.importedKeys,
        }),
      );

      router.refresh();
      onOpenChange(false);
    });
  };

  const title = mode === "export" ? t("dashboard.exportJson") : t("dashboard.importJson");
  const description =
    mode === "export"
      ? t("dashboard.exportJsonDescription")
      : t("dashboard.importJsonDescription");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {mode === "export" ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-zinc-600">{t("dashboard.transferSelectProviders")}</p>
              <Button type="button" variant="secondary" size="sm" onClick={onSelectExportAll}>
                {t("dashboard.transferSelectAll")}
              </Button>
            </div>
            <div className="max-h-72 space-y-2 overflow-y-auto rounded-lg border border-zinc-200 bg-zinc-50 p-3">
              {providers.map((provider) => {
                const checked = selectedExportProviderIds.includes(provider.id);
                return (
                  <label
                    key={provider.id}
                    className="flex cursor-pointer items-start gap-3 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 accent-zinc-900"
                      checked={checked}
                      onChange={() => onToggleExportProvider(provider.id)}
                    />
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-zinc-900">{provider.name}</span>
                      <span className="block truncate text-xs text-zinc-500">
                        {provider.baseUrl || t("common.baseUrlEmpty")}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
              <p className="text-sm font-medium text-zinc-900">{t("dashboard.importJsonFile")}</p>
              <input
                ref={importFileInputRef}
                type="file"
                accept="application/json,.json"
                onChange={onChooseImportFile}
                className="sr-only"
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    importFileInputRef.current?.click();
                  }}
                >
                  {t("dashboard.importChooseFile")}
                </Button>
                <p className="min-w-0 flex-1 truncate text-xs text-zinc-500">
                  {importFileName || t("dashboard.importNoFileSelected")}
                </p>
              </div>
            </div>

            {importPreviewProviders.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm text-zinc-600">{t("dashboard.transferSelectProviders")}</p>
                  <Button type="button" variant="secondary" size="sm" onClick={onSelectImportAll}>
                    {t("dashboard.transferSelectAll")}
                  </Button>
                </div>
                <div className="max-h-72 space-y-2 overflow-y-auto rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                  {importPreviewProviders.map((provider) => {
                    const checked = selectedImportProviders.includes(provider.name);
                    return (
                      <label
                        key={provider.name}
                        className="flex cursor-pointer items-start gap-3 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          className="mt-0.5 h-4 w-4 accent-zinc-900"
                          checked={checked}
                          onChange={() => onToggleImportProvider(provider.name)}
                        />
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-zinc-900">{provider.name}</span>
                          <span className="block truncate text-xs text-zinc-500">
                            {provider.baseUrl || t("common.baseUrlEmpty")}
                          </span>
                          <span className="mt-1 block text-xs text-zinc-500">
                            {t("dashboard.transferKeyCount", { count: provider.keyCount })}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            onClick={mode === "export" ? onConfirmExport : onConfirmImport}
            disabled={
              isPending ||
              (mode === "export"
                ? selectedExportProviderIds.length === 0
                : importPreviewProviders.length === 0 || selectedImportProviders.length === 0)
            }
          >
            {mode === "export" ? <Download className="mr-2 h-4 w-4" /> : <Upload className="mr-2 h-4 w-4" />}
            {mode === "export" ? t("dashboard.exportNow") : t("dashboard.importNow")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
