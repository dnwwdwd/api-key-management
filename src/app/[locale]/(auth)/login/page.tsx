import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { LoginForm } from "@/components/shared/login-form";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";

type LoginPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function LoginPage({ params }: LoginPageProps) {
  const session = await auth();
  const { locale } = await params;

  if (session?.user?.name) {
    const db = await getDb();
    const currentUser = db
      .select({ preferredLocale: users.preferredLocale })
      .from(users)
      .where(eq(users.username, session.user.name))
      .get();

    const preferredLocale = currentUser?.preferredLocale === "en-US" ? "en-US" : "zh-CN";
    redirect(`/${preferredLocale}`);
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center p-4 sm:p-6">
        <div className="relative w-full max-w-md">
          <div className="absolute -top-14 right-0">
            <LocaleSwitcher locale={locale}>
              <span className="inline-flex h-10 items-center rounded-lg border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-950">
                {locale === "zh-CN" ? "English" : "\u4e2d\u6587"}
              </span>
            </LocaleSwitcher>
          </div>
          <LoginForm locale={locale} />
        </div>
      </div>
    </div>
  );
}