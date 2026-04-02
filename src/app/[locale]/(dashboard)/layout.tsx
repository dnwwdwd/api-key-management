import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDb, persistDatabase } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

type DashboardLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function DashboardLayout({
  children,
  params,
}: DashboardLayoutProps) {
  const session = await auth();
  const { locale } = await params;

  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  if (session.user.name) {
    const db = await getDb();
    const currentUser = db
      .select({ preferredLocale: users.preferredLocale })
      .from(users)
      .where(eq(users.username, session.user.name))
      .get();

    const currentLocale = locale === "en-US" ? "en-US" : "zh-CN";
    if (currentUser && currentUser.preferredLocale !== currentLocale) {
      db.update(users)
        .set({ preferredLocale: currentLocale })
        .where(eq(users.username, session.user.name))
        .run();
      await persistDatabase();
    }
  }

  return children;
}
