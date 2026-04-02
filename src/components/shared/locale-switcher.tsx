"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

type LocaleSwitcherProps = {
  locale: string;
  children: ReactNode;
};

export function LocaleSwitcher({ locale, children }: LocaleSwitcherProps) {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const nextLocale = locale === "zh-CN" ? "en-US" : "zh-CN";

  const hasLocalePrefix = /^\/(zh-CN|en-US)(?=\/|$)/.test(pathname);
  const nextPath = hasLocalePrefix
    ? pathname.replace(/^\/(zh-CN|en-US)(?=\/|$)/, `/${nextLocale}`)
    : `/${nextLocale}${pathname === "/" ? "" : pathname}`;
  const href = search ? `${nextPath}?${search}` : nextPath;

  return <Link href={href}>{children}</Link>;
}
