import { auth } from "@/auth";
import { AnalyticsDashboard } from "@/components/shared/analytics-dashboard";
import { listApiKeys } from "@/lib/actions/api-keys";
import { listProviders, seedDefaultProviders } from "@/lib/actions/providers";

type AnalyticsPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AnalyticsPage({ params }: AnalyticsPageProps) {
  const session = await auth();
  const { locale } = await params;

  await seedDefaultProviders();
  const providers = await listProviders();
  const apiKeys = await listApiKeys();

  return (
    <AnalyticsDashboard
      locale={locale}
      username={session?.user?.name ?? "user"}
      providers={providers}
      items={apiKeys.map((item) => ({
        id: item.id,
        name: item.name,
        providerName: item.providerName,
      }))}
    />
  );
}
