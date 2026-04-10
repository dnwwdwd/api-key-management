import {
  PROVIDER_RUNTIME_PRESETS,
  type BillingPortalSeed,
} from "@/lib/constants/providers";

type BillingPortalLink = BillingPortalSeed;

export function getProviderBillingPortalLink(
  providerName: string,
  baseUrl: string | null,
): BillingPortalLink | null {
  const normalizedName = providerName.trim().toLowerCase();
  const normalizedBaseUrl = baseUrl?.trim().toLowerCase() ?? "";
  const lookupSource = `${normalizedName} ${normalizedBaseUrl}`;

  for (const preset of PROVIDER_RUNTIME_PRESETS) {
    if (!preset.billingPortal) {
      continue;
    }

    if (preset.keywords.some((keyword) => lookupSource.includes(keyword.toLowerCase()))) {
      return preset.billingPortal;
    }
  }

  return null;
}
