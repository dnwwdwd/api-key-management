"use client";

import Link from "next/link";
import { BarChart3, KeyRound } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ProviderItem } from "./provider-tabs";
import { AccountMenu } from "./account-menu";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type AppSidebarProps = {
  locale: string;
  username: string;
  providers: ProviderItem[];
  activeMenu: "keys" | "analytics";
  showOnMobile?: boolean;
};

export function AppSidebar({
  locale,
  username,
  providers,
  activeMenu,
  showOnMobile = false,
}: AppSidebarProps) {
  const t = useTranslations();

  return (
    <aside className={`${showOnMobile ? "block" : "hidden"} min-h-0 md:block`}>
      <Card className={showOnMobile ? "h-auto md:h-full" : "h-full"}>
        <CardHeader className="border-b border-zinc-200">
          <CardTitle className="text-base text-zinc-950">{t("common.appName")}</CardTitle>
          <CardDescription className="truncate">{username}</CardDescription>
        </CardHeader>

        <CardContent className={showOnMobile ? "flex h-auto flex-col p-4 md:h-[calc(100%-74px)]" : "flex h-[calc(100%-74px)] flex-col p-4"}>
          <Tabs value={activeMenu} className="w-full">
            <TabsList className="grid h-auto w-full grid-cols-1 gap-2 bg-transparent p-0">
              <TabsTrigger value="keys" asChild className="justify-start rounded-lg border border-zinc-200 px-3 py-2">
                <Link href={`/${locale}`}>
                  <KeyRound className="mr-2 h-4 w-4" />
                  {t("dashboard.menuApiKeys")}
                </Link>
              </TabsTrigger>
              <TabsTrigger value="analytics" asChild className="justify-start rounded-lg border border-zinc-200 px-3 py-2">
                <Link href={`/${locale}/analytics`}>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  {t("dashboard.menuAnalytics")}
                </Link>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="mt-4 pt-2 md:mt-auto md:pt-4">
            <AccountMenu
              locale={locale}
              username={username}
              providers={providers}
              side={showOnMobile ? "bottom" : "top"}
            />
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}
