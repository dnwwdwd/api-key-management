import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { apiKeys, providers } from "@/lib/db/schema";
import { decryptApiKey } from "@/lib/utils/encryption";

export type RuntimeApiKeyRecord = {
  id: number;
  name: string;
  providerName: string;
  providerBaseUrl: string | null;
  apiKey: string;
};

export async function getRuntimeApiKeyRecordById(
  id: number,
): Promise<RuntimeApiKeyRecord | null> {
  const db = await getDb();

  const row = db
    .select()
    .from(apiKeys)
    .innerJoin(providers, eq(apiKeys.providerId, providers.id))
    .where(eq(apiKeys.id, id))
    .get();

  if (!row) {
    return null;
  }

  const decrypted = decryptApiKey(row.api_keys.apiKey);
  if (!decrypted.ok) {
    return null;
  }

  return {
    id: row.api_keys.id,
    name: row.api_keys.name,
    providerName: row.providers.name,
    providerBaseUrl: row.providers.baseUrl,
    apiKey: decrypted.value,
  };
}
