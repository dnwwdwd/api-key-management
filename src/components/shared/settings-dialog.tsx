"use client";

import type { ReactNode } from "react";
import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { changePasswordAction, logoutAction } from "@/lib/actions/auth";
import {
  createProviderAction,
  updateProviderAction,
} from "@/lib/actions/providers";
import type { ProviderItem } from "./provider-tabs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type SettingsDialogProps = {
  locale: string;
  providers: ProviderItem[];
  children?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

type ProviderDraft = {
  name: string;
  baseUrl: string;
};

function normalizeBaseUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  return trimmed.replace(/\/+$/, "");
}

export function SettingsDialog({
  locale,
  providers,
  children,
  open: controlledOpen,
  onOpenChange,
}: SettingsDialogProps) {
  const t = useTranslations();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [internalOpen, setInternalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"system" | "providers">("system");
  const [newProviderName, setNewProviderName] = useState("");
  const [newProviderBaseUrl, setNewProviderBaseUrl] = useState("");
  const [providerDrafts, setProviderDrafts] = useState<Record<number, ProviderDraft>>({});
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const open = controlledOpen ?? internalOpen;

  const setOpen = (nextOpen: boolean) => {
    if (controlledOpen === undefined) {
      setInternalOpen(nextOpen);
    }

    onOpenChange?.(nextOpen);
  };

  const resetState = () => {
    setActiveTab("system");
    setNewProviderName("");
    setNewProviderBaseUrl("");
    setProviderDrafts({});
    setPasswordForm({
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  const closeDialog = () => {
    setOpen(false);
    resetState();
  };

  const getProviderDraft = (provider: ProviderItem): ProviderDraft => {
    const draft = providerDrafts[provider.id];
    if (draft) {
      return draft;
    }

    return {
      name: provider.name,
      baseUrl: provider.baseUrl ?? "",
    };
  };

  const changedProviders = useMemo(
    () =>
      providers
        .map((provider) => {
          const draft = providerDrafts[provider.id];
          if (!draft) {
            return null;
          }

          const nextName = draft.name.trim();
          const nextBaseUrl = normalizeBaseUrl(draft.baseUrl);
          const currentBaseUrl = provider.baseUrl ?? "";

          if (!nextName) {
            return {
              id: provider.id,
              invalid: true,
              name: nextName,
              baseUrl: nextBaseUrl,
            };
          }

          if (nextName === provider.name && nextBaseUrl === currentBaseUrl) {
            return null;
          }

          return {
            id: provider.id,
            invalid: false,
            name: nextName,
            baseUrl: nextBaseUrl,
          };
        })
        .filter((item) => item !== null),
    [providerDrafts, providers],
  );

  const hasInvalidProviderDraft = changedProviders.some((item) => item.invalid);

  const onCreateProvider = () => {
    const formData = new FormData();
    formData.set("name", newProviderName);
    formData.set("baseUrl", newProviderBaseUrl);

    startTransition(async () => {
      const result = await createProviderAction(formData);
      if (!result.ok) {
        toast.error(t(result.messageKey));
        return;
      }

      setNewProviderName("");
      setNewProviderBaseUrl("");
      toast.success(t(result.messageKey ?? "dashboard.submitSuccess"));
      router.refresh();
    });
  };

  const onSaveProviders = () => {
    if (hasInvalidProviderDraft) {
      toast.error(t("errors.providerNameRequired"));
      return;
    }

    if (changedProviders.length === 0) {
      return;
    }

    startTransition(async () => {
      for (const provider of changedProviders) {
        const formData = new FormData();
        formData.set("id", String(provider.id));
        formData.set("name", provider.name);
        formData.set("baseUrl", provider.baseUrl);

        const result = await updateProviderAction(formData);
        if (!result.ok) {
          toast.error(t(result.messageKey));
          return;
        }
      }

      setProviderDrafts({});
      toast.success(t("dashboard.submitSuccess"));
      router.refresh();
    });
  };

  const onChangePassword = () => {
    const formData = new FormData();
    formData.set("oldPassword", passwordForm.oldPassword);
    formData.set("newPassword", passwordForm.newPassword);
    formData.set("confirmPassword", passwordForm.confirmPassword);

    startTransition(async () => {
      const result = await changePasswordAction(formData);
      if (!result.ok) {
        toast.error(t(result.messageKey));
        return;
      }

      setPasswordForm({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      toast.success(t(result.messageKey ?? "dashboard.submitSuccess"));
      closeDialog();
      await logoutAction(locale);
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          resetState();
        }
      }}
    >
      {children ? <DialogTrigger asChild>{children}</DialogTrigger> : null}
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("common.settings")}</DialogTitle>
          <DialogDescription>{t("dashboard.systemProvidersReadonly")}</DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "system" | "providers")}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="system">{t("common.settings")}</TabsTrigger>
            <TabsTrigger value="providers">{t("dashboard.providerManagement")}</TabsTrigger>
          </TabsList>

          <TabsContent value="system" className="space-y-4 pt-4">
            <h3 className="text-sm font-semibold text-zinc-900">{t("dashboard.changePassword")}</h3>
            <div className="space-y-2">
              <Label>{t("dashboard.oldPassword")}</Label>
              <Input
                type="password"
                value={passwordForm.oldPassword}
                onChange={(event) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    oldPassword: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{t("dashboard.newPassword")}</Label>
              <Input
                type="password"
                value={passwordForm.newPassword}
                onChange={(event) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    newPassword: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{t("dashboard.confirmPassword")}</Label>
              <Input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(event) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    confirmPassword: event.target.value,
                  }))
                }
              />
            </div>
          </TabsContent>

          <TabsContent value="providers" className="space-y-5 pt-4">
            <div className="space-y-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm font-medium text-zinc-900">{t("dashboard.createProvider")}</p>
              <div className="space-y-2">
                <Label>{t("dashboard.customProviderName")}</Label>
                <Input
                  value={newProviderName}
                  onChange={(event) => setNewProviderName(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("dashboard.baseUrl")}</Label>
                <Input
                  value={newProviderBaseUrl}
                  onChange={(event) => setNewProviderBaseUrl(event.target.value)}
                  placeholder="https://..."
                  className="font-mono"
                />
              </div>
              <div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onCreateProvider}
                  disabled={isPending || !newProviderName.trim()}
                >
                  {t("common.create")}
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {providers.map((provider) => {
                const draft = getProviderDraft(provider);
                return (
                  <div
                    key={provider.id}
                    className="space-y-2 rounded-lg border border-zinc-200 bg-white p-3"
                  >
                    <div className="space-y-1">
                      <Label>{t("dashboard.provider")}</Label>
                      <Input
                        value={draft.name}
                        onChange={(event) =>
                          setProviderDrafts((prev) => ({
                            ...prev,
                            [provider.id]: {
                              ...getProviderDraft(provider),
                              name: event.target.value,
                            },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>{t("dashboard.baseUrl")}</Label>
                      <Input
                        value={draft.baseUrl}
                        onChange={(event) =>
                          setProviderDrafts((prev) => ({
                            ...prev,
                            [provider.id]: {
                              ...getProviderDraft(provider),
                              baseUrl: event.target.value,
                            },
                          }))
                        }
                        placeholder="https://..."
                        className="font-mono"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={closeDialog}>
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            onClick={activeTab === "system" ? onChangePassword : onSaveProviders}
            disabled={
              isPending ||
              (activeTab === "providers" &&
                (changedProviders.length === 0 || hasInvalidProviderDraft))
            }
          >
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
