import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";

export default async function Home() {
  const session = await auth();
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

  redirect("/zh-CN");
}
