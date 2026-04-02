"use server";

import { AuthError } from "next-auth";
import { eq } from "drizzle-orm";
import { auth, signIn, signOut } from "@/auth";
import { getDb, persistDatabase } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { hashPassword, verifyPassword } from "@/lib/utils/password";
import { errorResult, successResult, type ActionResult } from "./result";

export type LoginActionState = {
  ok: boolean;
  messageKey?: string;
  redirectTo?: string;
};

function normalizeLocale(raw: string) {
  return raw === "en-US" ? "en-US" : "zh-CN";
}

export async function loginAction(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const locale = normalizeLocale(String(formData.get("locale") ?? "zh-CN"));

  if (!username || !password) {
    return {
      ok: false,
      messageKey: "auth.missingFields",
    };
  }

  try {
    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    if (!result || result.error) {
      return { ok: false, messageKey: "auth.invalidCredentials" };
    }

    const db = await getDb();
    db.update(users)
      .set({ preferredLocale: locale })
      .where(eq(users.username, username))
      .run();
    await persistDatabase();

    return { ok: true, redirectTo: `/${locale}` };
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, messageKey: "auth.invalidCredentials" };
    }

    return { ok: false, messageKey: "errors.authLoginFailed" };
  }
}

export async function logoutAction(locale: string) {
  await signOut({
    redirectTo: `/${normalizeLocale(locale)}/login`,
  });
}

export async function saveLocalePreferenceAction(locale: string) {
  const session = await auth();
  if (!session?.user?.name) {
    return;
  }

  const db = await getDb();
  db.update(users)
    .set({ preferredLocale: normalizeLocale(locale) })
    .where(eq(users.username, session.user.name))
    .run();
  await persistDatabase();
}

export async function changePasswordAction(
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.name) {
    return errorResult("errors.unauthorized");
  }
  const db = await getDb();

  const username = session.user.name;
  const oldPassword = String(formData.get("oldPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!username || !oldPassword || !newPassword || !confirmPassword) {
    return errorResult("errors.passwordFieldsRequired");
  }

  if (newPassword !== confirmPassword) {
    return errorResult("errors.passwordConfirmMismatch");
  }

  const user = db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .get();

  if (!user) {
    return errorResult("errors.userNotFound");
  }

  const validOldPassword = await verifyPassword(oldPassword, user.passwordHash);
  if (!validOldPassword) {
    return errorResult("errors.oldPasswordIncorrect");
  }

  const passwordHashResult = await hashPassword(newPassword);
  if (!passwordHashResult.ok) {
    return errorResult(passwordHashResult.messageKey);
  }

  db.update(users)
    .set({ passwordHash: passwordHashResult.value })
    .where(eq(users.id, user.id))
    .run();
  await persistDatabase();

  return successResult(undefined, "dashboard.submitSuccess");
}
