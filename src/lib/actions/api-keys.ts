"use server";

import { and, desc, eq, like, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getDb, persistDatabase } from "@/lib/db";
import { apiKeys, providers } from "@/lib/db/schema";
import { decryptApiKey, encryptApiKey } from "@/lib/utils/encryption";
import { errorResult, successResult, type ActionResult } from "./result";

export type ApiKeyView = {
  id: number;
  name: string;
  providerId: number;
  providerName: string;
  providerBaseUrl: string | null;
  apiKey: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ApiKeyFilter = {
  providerId?: number | null;
  search?: string;
};

function validateApiKeyPayload(payload: {
  name: string;
  providerId: number;
  apiKeyValue: string;
}) {
  if (!payload.name) {
    return errorResult("errors.apiKeyNameRequired");
  }

  if (!Number.isInteger(payload.providerId) || payload.providerId <= 0) {
    return errorResult("errors.apiKeyProviderRequired");
  }

  if (!payload.apiKeyValue) {
    return errorResult("errors.apiKeyPlaintextRequired");
  }

  return null;
}

async function hasSession() {
  const session = await auth();
  return Boolean(session?.user);
}

function toApiKeyView(item: {
  api_keys: typeof apiKeys.$inferSelect;
  providers: typeof providers.$inferSelect;
}): ApiKeyView {
  const decrypted = decryptApiKey(item.api_keys.apiKey);

  return {
    id: item.api_keys.id,
    name: item.api_keys.name,
    providerId: item.api_keys.providerId,
    providerName: item.providers.name,
    providerBaseUrl: item.providers.baseUrl,
    apiKey: decrypted.ok ? decrypted.value : "",
    notes: item.api_keys.notes,
    createdAt: item.api_keys.createdAt,
    updatedAt: item.api_keys.updatedAt,
  };
}

export async function listApiKeys(filter: ApiKeyFilter = {}) {
  if (!(await hasSession())) {
    return [];
  }

  const db = await getDb();
  const keyword = filter.search?.trim() ?? "";
  const conditions = [];

  if (filter.providerId) {
    conditions.push(eq(apiKeys.providerId, filter.providerId));
  }

  if (keyword) {
    conditions.push(
      or(
        like(apiKeys.name, `%${keyword}%`),
        like(providers.name, `%${keyword}%`),
        like(providers.baseUrl, `%${keyword}%`),
        like(apiKeys.notes, `%${keyword}%`),
      ),
    );
  }

  const whereClause =
    conditions.length > 1 ? and(...conditions) : conditions[0] ?? undefined;

  const rows = db
    .select()
    .from(apiKeys)
    .innerJoin(providers, eq(apiKeys.providerId, providers.id))
    .where(whereClause)
    .orderBy(desc(apiKeys.id))
    .all();

  return rows.map(toApiKeyView);
}

export async function getApiKeyDetail(id: number) {
  if (!(await hasSession())) {
    return null;
  }

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

  return toApiKeyView(row);
}

export async function createApiKeyAction(
  formData: FormData,
): Promise<ActionResult> {
  if (!(await hasSession())) {
    return errorResult("errors.unauthorized");
  }

  const db = await getDb();
  const name = String(formData.get("name") ?? "").trim();
  const providerId = Number(formData.get("providerId"));
  const apiKeyValue = String(formData.get("apiKey") ?? "").trim();
  const notesValue = String(formData.get("notes") ?? "").trim();

  const validation = validateApiKeyPayload({ name, providerId, apiKeyValue });
  if (validation) {
    return validation;
  }

  const encrypted = encryptApiKey(apiKeyValue);
  if (!encrypted.ok) {
    return errorResult(encrypted.messageKey);
  }

  db.insert(apiKeys)
    .values({
      name,
      providerId,
      apiKey: encrypted.value,
      notes: notesValue || null,
    })
    .run();

  await persistDatabase();
  revalidatePath("/", "layout");
  return successResult(undefined, "dashboard.submitSuccess");
}

export async function updateApiKeyAction(
  formData: FormData,
): Promise<ActionResult> {
  if (!(await hasSession())) {
    return errorResult("errors.unauthorized");
  }

  const db = await getDb();
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const providerId = Number(formData.get("providerId"));
  const apiKeyValue = String(formData.get("apiKey") ?? "").trim();
  const notesValue = String(formData.get("notes") ?? "").trim();

  if (!Number.isInteger(id) || id <= 0) {
    return errorResult("errors.invalidApiKeyForm");
  }

  const validation = validateApiKeyPayload({ name, providerId, apiKeyValue });
  if (validation) {
    return validation;
  }

  const encrypted = encryptApiKey(apiKeyValue);
  if (!encrypted.ok) {
    return errorResult(encrypted.messageKey);
  }

  db.update(apiKeys)
    .set({
      name,
      providerId,
      apiKey: encrypted.value,
      notes: notesValue || null,
      updatedAt: new Date(),
    })
    .where(eq(apiKeys.id, id))
    .run();

  await persistDatabase();
  revalidatePath("/", "layout");
  return successResult(undefined, "dashboard.submitSuccess");
}

export async function deleteApiKeyAction(
  formData: FormData,
): Promise<ActionResult> {
  if (!(await hasSession())) {
    return errorResult("errors.unauthorized");
  }

  const db = await getDb();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return errorResult("errors.invalidApiKeyId");
  }

  db.delete(apiKeys).where(eq(apiKeys.id, id)).run();
  await persistDatabase();
  revalidatePath("/", "layout");
  return successResult(undefined, "dashboard.submitSuccess");
}
