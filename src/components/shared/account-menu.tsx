"use client";

import { useState, useTransition } from "react";
import { ChevronUp, Globe, LogOut, Settings } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { logoutAction } from "@/lib/actions/auth";
import type { ProviderItem } from "./provider-tabs";
import { SettingsDialog } from "./settings-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type AccountMenuProps = {
  locale: string;
  username: string;
  providers: ProviderItem[];
  side?: "top" | "bottom";
  compact?: boolean;
};

export function AccountMenu({
  locale,
  username,
  providers,
  side = "top",
  compact = false,
}: AccountMenuProps) {
  const t = useTranslations();
  const [, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const nextLocale = locale === "zh-CN" ? "en-US" : "zh-CN";
  const hasLocalePrefix = /^\/(zh-CN|en-US)(?=\/|$)/.test(pathname);
  const nextPath = hasLocalePrefix
    ? pathname.replace(/^\/(zh-CN|en-US)(?=\/|$)/, `/${nextLocale}`)
    : `/${nextLocale}${pathname === "/" ? "" : pathname}`;
  const nextLocaleHref = search ? `${nextPath}?${search}` : nextPath;

  const onLogout = () => {
    startTransition(async () => {
      await logoutAction(locale);
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="secondary"
            className={compact ? "h-9 px-3" : "w-full justify-between"}
            aria-label={t("dashboard.accountMenu")}
          >
            <span className="max-w-[160px] truncate text-left">{username}</span>
            <ChevronUp className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side={side} className="w-56">
          <DropdownMenuItem onSelect={() => setSettingsOpen(true)}>
            <Settings className="mr-2 h-4 w-4" />
            {t("common.settings")}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => router.push(nextLocaleHref)}>
            <Globe className="mr-2 h-4 w-4" />
            {t("common.switchLocale")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={onLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            {t("common.logout")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SettingsDialog
        locale={locale}
        providers={providers}
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
    </>
  );
}
