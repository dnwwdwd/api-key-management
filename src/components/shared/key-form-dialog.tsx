"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createApiKeyAction,
  updateApiKeyAction,
  type ApiKeyView,
} from "@/lib/actions/api-keys";
import type { ProviderItem } from "./provider-tabs";
import { ProviderPicker } from "./provider-picker";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type KeyFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providers: ProviderItem[];
  editTarget: ApiKeyView | null;
};

export function KeyFormDialog({
  open,
  onOpenChange,
  providers,
  editTarget,
}: KeyFormDialogProps) {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const tr = useTranslations();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const [providerId, setProviderId] = useState<number | null>(
    editTarget?.providerId ?? providers[0]?.id ?? null,
  );
  const formKey = useMemo(
    () => `${editTarget?.id ?? "create"}-${open ? "open" : "closed"}`,
    [editTarget?.id, open],
  );
  const selectedProvider = useMemo(
    () => providers.find((item) => item.id === providerId) ?? null,
    [providers, providerId],
  );

  const onSubmit = () => {
    if (!formRef.current) {
      return;
    }

    const formData = new FormData(formRef.current);
    const name = String(formData.get("name") ?? "").trim();
    const apiKey = String(formData.get("apiKey") ?? "").trim();

    if (!name) {
      toast.error(tr("errors.apiKeyNameRequired"));
      return;
    }

    if (!providerId) {
      toast.error(tr("errors.apiKeyProviderRequired"));
      return;
    }

    if (!apiKey) {
      toast.error(tr("errors.apiKeyPlaintextRequired"));
      return;
    }

    formData.set("providerId", String(providerId));
    if (editTarget) {
      formData.set("id", String(editTarget.id));
    }

    startTransition(async () => {
      const result = editTarget
        ? await updateApiKeyAction(formData)
        : await createApiKeyAction(formData);

      if (!result.ok) {
        toast.error(tr(result.messageKey));
        return;
      }

      toast.success(tr(result.messageKey ?? "dashboard.submitSuccess"));
      router.refresh();
      onOpenChange(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editTarget ? t("keyFormTitleEdit") : t("keyFormTitleCreate")}
          </DialogTitle>
          <DialogDescription>{t("apiKey")}</DialogDescription>
        </DialogHeader>
        <form key={formKey} ref={formRef} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="key-name">
              {t("name")}
              <span className="ml-1 text-xs font-normal text-zinc-500">
                * {t("required")}
              </span>
            </Label>
            <Input
              id="key-name"
              name="name"
              defaultValue={editTarget?.name ?? ""}
              className="h-10"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="key-provider">
              {t("provider")}
              <span className="ml-1 text-xs font-normal text-zinc-500">
                * {t("required")}
              </span>
            </Label>
            <ProviderPicker
              options={providers}
              value={providerId}
              onChange={setProviderId}
              placeholder={t("provider")}
              searchPlaceholder={t("providerFilter")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="key-api">
              {t("apiKey")}
              <span className="ml-1 text-xs font-normal text-zinc-500">
                * {t("required")}
              </span>
            </Label>
            <Input
              id="key-api"
              name="apiKey"
              defaultValue={editTarget?.apiKey ?? ""}
              className="h-10 font-mono"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>{t("baseUrl")}</Label>
            <div className="rounded-md border border-gray-200 bg-zinc-50 p-3 font-mono text-sm text-zinc-700">
              {selectedProvider?.baseUrl || tc("baseUrlEmpty")}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="key-notes">{t("notes")}</Label>
            <Textarea
              id="key-notes"
              name="notes"
              defaultValue={editTarget?.notes ?? ""}
            />
          </div>
        </form>
        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
          >
            {tc("cancel")}
          </Button>
          <Button type="button" disabled={isPending} onClick={onSubmit}>
            {tc("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
