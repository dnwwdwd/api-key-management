"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { BarChart3, Download, MoreHorizontal, Plus, Search, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteApiKeyAction, type ApiKeyView } from "@/lib/actions/api-keys";
import { deleteProviderAction, updateProviderAction } from "@/lib/actions/providers";
import { AccountMenu } from "./account-menu";
import { ApiKeyTransferDialog } from "./api-key-transfer-dialog";
import { AppSidebar } from "./app-sidebar";
import { KeyFormDialog } from "./key-form-dialog";
import { KeyRecordList } from "./key-record-list";
import { ProviderPicker } from "./provider-picker";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

type DashboardClientProps = {
  locale: string;
  username: string;
  providers: ProviderItem[];
  apiKeys: ApiKeyView[];
};

export function DashboardClient({
  locale,
  username,
  providers,
  apiKeys,
}: DashboardClientProps) {
  const t = useTranslations();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [keySearch, setKeySearch] = useState("");
  const [selectedProviderId, setSelectedProviderId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ApiKeyView | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApiKeyView | null>(null);

  const [providerEditTarget, setProviderEditTarget] = useState<ProviderItem | null>(null);
  const [providerEditName, setProviderEditName] = useState("");
  const [providerEditBaseUrl, setProviderEditBaseUrl] = useState("");
  const [providerDeleteTarget, setProviderDeleteTarget] = useState<ProviderItem | null>(null);

  const providerKeyCountMap = useMemo(() => {
    return apiKeys.reduce<Record<number, number>>((acc, item) => {
      acc[item.providerId] = (acc[item.providerId] ?? 0) + 1;
      return acc;
    }, {});
  }, [apiKeys]);

  const filteredKeys = useMemo(() => {
    const keyword = keySearch.trim().toLowerCase();

    return [...apiKeys].filter((item) => {
      if (selectedProviderId !== null && item.providerId !== selectedProviderId) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      return (
        item.name.toLowerCase().includes(keyword) ||
        item.providerName.toLowerCase().includes(keyword) ||
        (item.providerBaseUrl ?? "").toLowerCase().includes(keyword) ||
        (item.notes ?? "").toLowerCase().includes(keyword)
      );
    });
  }, [apiKeys, keySearch, selectedProviderId]);

  const openCreateDialog = () => {
    setEditTarget(null);
    setFormOpen(true);
  };

  const openEditDialog = (item: ApiKeyView) => {
    setEditTarget(item);
    setFormOpen(true);
  };

  const openProviderEditDialog = (provider: ProviderItem) => {
    setProviderEditTarget(provider);
    setProviderEditName(provider.name);
    setProviderEditBaseUrl(provider.baseUrl ?? "");
  };

  const onSaveProviderEdit = () => {
    if (!providerEditTarget) {
      return;
    }

    const formData = new FormData();
    formData.set("id", String(providerEditTarget.id));
    formData.set("name", providerEditName);
    formData.set("baseUrl", providerEditBaseUrl);

    startTransition(async () => {
      const result = await updateProviderAction(formData);
      if (!result.ok) {
        toast.error(t(result.messageKey));
        return;
      }

      toast.success(t(result.messageKey ?? "dashboard.submitSuccess"));
      setProviderEditTarget(null);
      router.refresh();
    });
  };

  const onConfirmDeleteProvider = () => {
    if (!providerDeleteTarget) {
      return;
    }

    const formData = new FormData();
    formData.set("id", String(providerDeleteTarget.id));

    startTransition(async () => {
      const result = await deleteProviderAction(formData);
      if (!result.ok) {
        toast.error(t(result.messageKey));
        return;
      }

      toast.success(t(result.messageKey ?? "dashboard.submitSuccess"));
      if (selectedProviderId === providerDeleteTarget.id) {
        setSelectedProviderId(null);
      }
      setProviderDeleteTarget(null);
      router.refresh();
    });
  };

  const onConfirmDeleteKey = () => {
    if (!deleteTarget) {
      return;
    }

    const formData = new FormData();
    formData.set("id", String(deleteTarget.id));

    startTransition(async () => {
      const result = await deleteApiKeyAction(formData);
      if (!result.ok) {
        toast.error(t(result.messageKey));
        return;
      }

      toast.success(t(result.messageKey ?? "dashboard.submitSuccess"));
      setDeleteTarget(null);
      router.refresh();
    });
  };

  return (
    <div className="h-screen w-full bg-zinc-50">
      <div className="h-full w-full p-3 md:p-6">
        <div className="hidden h-full grid-cols-[250px_360px_minmax(0,1fr)] gap-4 md:grid">
          <AppSidebar
            locale={locale}
            username={username}
            providers={providers}
            activeMenu="keys"
          />

          <aside className="flex min-h-0 flex-col rounded-2xl border border-zinc-200 bg-white">
            <div className="border-b border-zinc-200 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                {t("dashboard.providers")}
              </p>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
              <button
                type="button"
                onClick={() => setSelectedProviderId(null)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  selectedProviderId === null
                    ? "bg-zinc-950 text-zinc-50"
                    : "text-zinc-700 hover:bg-zinc-100"
                }`}
              >
                <span>{t("dashboard.providerAll")}</span>
                <span className="text-xs opacity-80">{apiKeys.length}</span>
              </button>

              <div className="mt-2 space-y-1">
                {providers.map((provider) => {
                  const keyCount = providerKeyCountMap[provider.id] ?? 0;
                  const canDelete = keyCount === 0;

                  return (
                    <div key={provider.id} className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setSelectedProviderId(provider.id)}
                        className={`min-w-0 flex-1 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                          selectedProviderId === provider.id
                            ? "bg-zinc-950 text-zinc-50"
                            : "text-zinc-700 hover:bg-zinc-100"
                        }`}
                      >
                        <p className="truncate">{provider.name}</p>
                        <p className="truncate text-xs opacity-75">{provider.baseUrl || t("common.baseUrlEmpty")}</p>
                      </button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            aria-label={t("dashboard.providerActions")}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => openProviderEditDialog(provider)}>
                            {t("common.edit")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={!canDelete}
                            onSelect={() => {
                              if (canDelete) {
                                setProviderDeleteTarget(provider);
                              }
                            }}
                          >
                            {t("common.delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>

          <main className="min-h-0 overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-4">
            <div className="border-b border-zinc-200 pb-4">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={openCreateDialog}
                  className="w-full md:w-auto"
                  aria-label={t("dashboard.newKey")}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t("dashboard.newKey")}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setExportDialogOpen(true)}
                  className="w-full md:w-auto"
                >
                  <Download className="mr-2 h-4 w-4" />
                  {t("dashboard.exportJson")}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setImportDialogOpen(true)}
                  className="w-full md:w-auto"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {t("dashboard.importJson")}
                </Button>
              </div>

              <div className="relative mt-4 w-full">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  className="h-10 rounded-lg bg-zinc-50 pl-10"
                  value={keySearch}
                  onChange={(event) => setKeySearch(event.target.value)}
                  placeholder={t("dashboard.searchKeys")}
                />
              </div>
            </div>

            <div className="pt-4">
              <KeyRecordList
                items={filteredKeys}
                onEdit={openEditDialog}
                onDelete={setDeleteTarget}
              />
            </div>
          </main>
        </div>

        <div className="flex h-full flex-col md:hidden">
          <header className="sticky top-0 z-20 rounded-t-xl border border-gray-100 border-b-zinc-200 bg-white px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h1 className="truncate text-base font-semibold text-zinc-950">{t("common.appName")}</h1>
                <p className="mt-0.5 truncate text-xs text-zinc-500">{username}</p>
              </div>
              <div className="flex items-center gap-1">
                <Link
                  href={`/${locale}/analytics`}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-950"
                  aria-label={t("dashboard.menuAnalytics")}
                >
                  <BarChart3 className="h-4 w-4" />
                </Link>
                <AccountMenu
                  locale={locale}
                  username={username}
                  providers={providers}
                  side="bottom"
                  compact
                />
              </div>
            </div>

            <div className="mt-3 space-y-3">
              <ProviderPicker
                options={providers}
                value={selectedProviderId}
                onChange={setSelectedProviderId}
                placeholder={t("dashboard.providers")}
                searchPlaceholder={t("dashboard.providerFilter")}
                allLabel={t("dashboard.providerAll")}
              />

              <Button type="button" onClick={openCreateDialog} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                {t("dashboard.newKey")}
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setExportDialogOpen(true)}
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  {t("dashboard.exportJson")}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setImportDialogOpen(true)}
                  className="w-full"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {t("dashboard.importJson")}
                </Button>
              </div>

              <div className="relative w-full">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  className="h-10 rounded-lg bg-zinc-50 pl-10"
                  value={keySearch}
                  onChange={(event) => setKeySearch(event.target.value)}
                  placeholder={t("dashboard.searchKeys")}
                />
              </div>
            </div>
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto rounded-b-xl border border-t-0 border-zinc-200 bg-white p-4">
            <KeyRecordList
              items={filteredKeys}
              onEdit={openEditDialog}
              onDelete={setDeleteTarget}
            />
          </main>
        </div>
      </div>

      <KeyFormDialog
        key={`${editTarget?.id ?? "create"}-${formOpen ? "open" : "closed"}`}
        open={formOpen}
        onOpenChange={setFormOpen}
        providers={providers}
        editTarget={editTarget}
      />
      <ApiKeyTransferDialog
        mode="export"
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        providers={providers}
      />
      <ApiKeyTransferDialog
        mode="import"
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        providers={providers}
      />

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("dashboard.deleteConfirmTitle")}</DialogTitle>
            <DialogDescription>{t("dashboard.deleteConfirmDescription")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setDeleteTarget(null)}>
              {t("common.cancel")}
            </Button>
            <Button type="button" onClick={onConfirmDeleteKey} disabled={isPending}>
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(providerEditTarget)}
        onOpenChange={(open) => !open && setProviderEditTarget(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("dashboard.providerEditTitle")}</DialogTitle>
            <DialogDescription>{t("dashboard.providerEditDescription")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <p className="mb-1 text-sm text-zinc-600">{t("dashboard.provider")}</p>
              <Input
                value={providerEditName}
                onChange={(event) => setProviderEditName(event.target.value)}
              />
            </div>
            <div>
              <p className="mb-1 text-sm text-zinc-600">{t("dashboard.baseUrl")}</p>
              <Input
                value={providerEditBaseUrl}
                onChange={(event) => setProviderEditBaseUrl(event.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setProviderEditTarget(null)}>
              {t("common.cancel")}
            </Button>
            <Button type="button" onClick={onSaveProviderEdit} disabled={isPending}>
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(providerDeleteTarget)}
        onOpenChange={(open) => !open && setProviderDeleteTarget(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("dashboard.providerDeleteTitle")}</DialogTitle>
            <DialogDescription>{t("dashboard.providerDeleteDescription")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setProviderDeleteTarget(null)}>
              {t("common.cancel")}
            </Button>
            <Button type="button" variant="destructive" onClick={onConfirmDeleteProvider} disabled={isPending}>
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
