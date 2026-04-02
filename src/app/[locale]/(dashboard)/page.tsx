import { auth } from "@/auth";
import { DashboardClient } from "@/components/shared/dashboard-client";
import { listApiKeys } from "@/lib/actions/api-keys";
import { listProviders, seedDefaultProviders } from "@/lib/actions/providers";

type DashboardPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function DashboardPage({ params }: DashboardPageProps) {
  const session = await auth();
  const { locale } = await params;

  await seedDefaultProviders();
  const providers = await listProviders();
  const apiKeys = await listApiKeys();

  return (
    <DashboardClient
      locale={locale}
      username={session?.user?.name ?? "user"}
      providers={providers}
      apiKeys={apiKeys}
    />
  );
}
