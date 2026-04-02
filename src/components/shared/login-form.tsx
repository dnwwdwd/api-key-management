"use client";

import { useActionState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { loginAction, type LoginActionState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const initialState: LoginActionState = { ok: false };

type LoginFormProps = {
  locale: string;
};

export function LoginForm({ locale }: LoginFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  useEffect(() => {
    if (state.ok && state.redirectTo) {
      router.push(state.redirectTo);
      router.refresh();
    }
  }, [router, state.ok, state.redirectTo]);

  return (
    <Card className="w-full max-w-md border-zinc-200 bg-white shadow-sm">
      <CardHeader className="space-y-3 text-center">
        <CardTitle className="text-3xl font-bold text-zinc-950">
          {t("auth.title")}
        </CardTitle>
        <p className="text-sm text-zinc-500">{t("auth.subtitle")}</p>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-5">
          <input type="hidden" name="locale" value={locale} />
          <div className="space-y-2">
            <Label htmlFor="username" className="font-medium text-zinc-700">
              {t("auth.username")}
            </Label>
            <Input
              id="username"
              name="username"
              autoComplete="username"
              placeholder="admin"
              className="h-11 rounded-lg border-zinc-300 bg-white"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="font-medium text-zinc-700">
              {t("auth.password")}
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              className="h-11 rounded-lg border-zinc-300 bg-white"
              required
            />
          </div>
          {state.messageKey ? (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-600">{t(state.messageKey)}</p>
            </div>
          ) : null}
          <Button
            type="submit"
            className="h-11 w-full rounded-lg bg-zinc-950 font-medium text-zinc-50 hover:bg-zinc-800"
            disabled={isPending}
          >
            {t("auth.submit")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
