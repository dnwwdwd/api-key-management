"use server";

import { and, desc, eq, inArray, like, or } from "drizzle-orm";
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

type ApiKeyExportEntry = {
  name: string;
  apiKey: string;
  notes: string | null;
};

type ApiKeyExportProvider = {
  name: string;
  baseUrl: string | null;
  apiKeys: ApiKeyExportEntry[];
};

export type ApiKeyExportPayload = {
  version: 1;
  exportedAt: string;
  providers: ApiKeyExportProvider[];
};

export type ApiKeyExportResult =
  | {
      ok: true;
      filename: string;
      payload: ApiKeyExportPayload;
    }
  | {
      ok: false;
      messageKey: string;
    };

type ApiKeyImportEntry = {
  name: string;
  apiKey: string;
  notes: string | null;
};

type ApiKeyImportProvider = {
  name: string;
  baseUrl: string | null;
  apiKeys: ApiKeyImportEntry[];
};

export type ApiKeyImportPayload = {
  version: number;
  providers: ApiKeyImportProvider[];
};

export type ApiKeyImportSummary = {
  importedProviders: number;
  createdProviders: number;
  updatedProviders: number;
  importedKeys: number;
  createdKeys: number;
  updatedKeys: number;
  skippedProviders: number;
  skippedKeys: number;
};

export type ApiKeyImportResult =
  | {
      ok: true;
      summary: ApiKeyImportSummary;
    }
  | {
      ok: false;
      messageKey: string;
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

function normalizeBaseUrl(raw: string | null | undefined) {
  const trimmed = raw?.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.replace(/\/+$/, "");
}

function normalizeProviderIds(providerIds: number[] | null | undefined) {
  if (!providerIds || providerIds.length === 0) {
    return [];
  }

  return [...new Set(providerIds.filter((id) => Number.isInteger(id) && id > 0))];
}

function getUniqueImportedKeyName(baseName: string, usedNames: Set<string>) {
  if (!usedNames.has(baseName)) {
    return baseName;
  }

  const importedBase = `${baseName} (imported)`;
  if (!usedNames.has(importedBase)) {
    return importedBase;
  }

  let sequence = 2;
  while (usedNames.has(`${importedBase} ${sequence}`)) {
    sequence += 1;
  }

  return `${importedBase} ${sequence}`;
}

function parseImportPayload(rawPayload: string): ApiKeyImportPayload | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawPayload);
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== "object") {
    return null;
  }

  const record = parsed as Record<string, unknown>;
  const providersInput = record.providers;
  if (!Array.isArray(providersInput)) {
    return null;
  }

  const providersParsed: ApiKeyImportProvider[] = [];

  for (const providerItem of providersInput) {
    if (!providerItem || typeof providerItem !== "object") {
      continue;
    }

    const providerRecord = providerItem as Record<string, unknown>;
    const providerName = String(providerRecord.name ?? "").trim();
    if (!providerName) {
      continue;
    }

    const providerBaseUrl = normalizeBaseUrl(
      providerRecord.baseUrl === null ? null : String(providerRecord.baseUrl ?? ""),
    );

    const keysInput = providerRecord.apiKeys;
    if (!Array.isArray(keysInput)) {
      providersParsed.push({
        name: providerName,
        baseUrl: providerBaseUrl,
        apiKeys: [],
      });
      continue;
    }

    const keysParsed: ApiKeyImportEntry[] = [];
    for (const keyItem of keysInput) {
      if (!keyItem || typeof keyItem !== "object") {
        continue;
      }

      const keyRecord = keyItem as Record<string, unknown>;
      const keyName = String(keyRecord.name ?? "").trim();
      const apiKeyValue = String(keyRecord.apiKey ?? "").trim();
      if (!keyName || !apiKeyValue) {
        continue;
      }

      const notesRaw = keyRecord.notes;
      const notes =
        notesRaw === null || notesRaw === undefined
          ? null
          : String(notesRaw).trim() || null;

      keysParsed.push({
        name: keyName,
        apiKey: apiKeyValue,
        notes,
      });
    }

    providersParsed.push({
      name: providerName,
      baseUrl: providerBaseUrl,
      apiKeys: keysParsed,
    });
  }

  if (providersParsed.length === 0) {
    return null;
  }

  return {
    version: Number(record.version ?? 1),
    providers: providersParsed,
  };
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

export async function exportApiKeysAction(
  providerIds: number[] | null = null,
): Promise<ApiKeyExportResult> {
  if (!(await hasSession())) {
    return { ok: false, messageKey: "errors.unauthorized" };
  }

  const db = await getDb();
  const normalizedProviderIds = normalizeProviderIds(providerIds);
  const whereClause =
    normalizedProviderIds.length > 0
      ? inArray(apiKeys.providerId, normalizedProviderIds)
      : undefined;

  const rows = db
    .select()
    .from(apiKeys)
    .innerJoin(providers, eq(apiKeys.providerId, providers.id))
    .where(whereClause)
    .orderBy(providers.name, desc(apiKeys.id))
    .all();

  const providerBuckets = new Map<number, ApiKeyExportProvider>();

  for (const row of rows) {
    const decrypted = decryptApiKey(row.api_keys.apiKey);
    if (!decrypted.ok) {
      continue;
    }

    const existing = providerBuckets.get(row.providers.id);
    if (!existing) {
      providerBuckets.set(row.providers.id, {
        name: row.providers.name,
        baseUrl: row.providers.baseUrl,
        apiKeys: [
          {
            name: row.api_keys.name,
            apiKey: decrypted.value,
            notes: row.api_keys.notes,
          },
        ],
      });
      continue;
    }

    existing.apiKeys.push({
      name: row.api_keys.name,
      apiKey: decrypted.value,
      notes: row.api_keys.notes,
    });
  }

  const payload: ApiKeyExportPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    providers: [...providerBuckets.values()],
  };

  const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
  return {
    ok: true,
    filename: `api-keys-export-${timestamp}.json`,
    payload,
  };
}

export async function importApiKeysAction(input: {
  payload: string;
  selectedProviders?: string[];
}): Promise<ApiKeyImportResult> {
  if (!(await hasSession())) {
    return { ok: false, messageKey: "errors.unauthorized" };
  }

  const parsedPayload = parseImportPayload(input.payload);
  if (!parsedPayload) {
    return { ok: false, messageKey: "errors.invalidImportJson" };
  }

  const selectedProviderNames = new Set(
    (input.selectedProviders ?? []).map((name) => name.trim()).filter(Boolean),
  );
  const hasSelection = selectedProviderNames.size > 0;

  const summary: ApiKeyImportSummary = {
    importedProviders: 0,
    createdProviders: 0,
    updatedProviders: 0,
    importedKeys: 0,
    createdKeys: 0,
    updatedKeys: 0,
    skippedProviders: 0,
    skippedKeys: 0,
  };

  const db = await getDb();
  let changed = false;

  for (const providerItem of parsedPayload.providers) {
    if (hasSelection && !selectedProviderNames.has(providerItem.name)) {
      summary.skippedProviders += 1;
      summary.skippedKeys += providerItem.apiKeys.length;
      continue;
    }

    const normalizedBaseUrl = normalizeBaseUrl(providerItem.baseUrl);
    let providerRow = db
      .select()
      .from(providers)
      .where(eq(providers.name, providerItem.name))
      .get();

    if (!providerRow) {
      db.insert(providers)
        .values({
          name: providerItem.name,
          baseUrl: normalizedBaseUrl,
          isCustom: true,
        })
        .run();

      providerRow = db
        .select()
        .from(providers)
        .where(eq(providers.name, providerItem.name))
        .get();

      if (!providerRow) {
        summary.skippedProviders += 1;
        summary.skippedKeys += providerItem.apiKeys.length;
        continue;
      }

      summary.createdProviders += 1;
      changed = true;
    } else {
      const providerNeedsBaseUrlUpdate =
        normalizedBaseUrl &&
        !providerRow.baseUrl &&
        providerRow.baseUrl !== normalizedBaseUrl;

      if (providerNeedsBaseUrlUpdate) {
        db.update(providers)
          .set({ baseUrl: normalizedBaseUrl })
          .where(eq(providers.id, providerRow.id))
          .run();
        providerRow = {
          ...providerRow,
          baseUrl: normalizedBaseUrl,
        };
        summary.updatedProviders += 1;
        changed = true;
      }
    }

    summary.importedProviders += 1;

    const existingKeyRows = db
      .select({ name: apiKeys.name, encryptedApiKey: apiKeys.apiKey })
      .from(apiKeys)
      .where(eq(apiKeys.providerId, providerRow.id))
      .all();
    const usedKeyNames = new Set(existingKeyRows.map((row) => row.name));
    const existingNameValueMap = new Map<string, Set<string>>();

    for (const row of existingKeyRows) {
      const decrypted = decryptApiKey(row.encryptedApiKey);
      if (!decrypted.ok) {
        continue;
      }

      const bucket = existingNameValueMap.get(row.name) ?? new Set<string>();
      bucket.add(decrypted.value);
      existingNameValueMap.set(row.name, bucket);
    }

    for (const keyItem of providerItem.apiKeys) {
      const existingValues = existingNameValueMap.get(keyItem.name);
      if (existingValues?.has(keyItem.apiKey)) {
        summary.skippedKeys += 1;
        continue;
      }

      const encrypted = encryptApiKey(keyItem.apiKey);
      if (!encrypted.ok) {
        summary.skippedKeys += 1;
        continue;
      }

      const nextName = getUniqueImportedKeyName(keyItem.name, usedKeyNames);
      db.insert(apiKeys)
        .values({
          providerId: providerRow.id,
          name: nextName,
          apiKey: encrypted.value,
          notes: keyItem.notes,
        })
        .run();
      usedKeyNames.add(nextName);
      const createdBucket = existingNameValueMap.get(nextName) ?? new Set<string>();
      createdBucket.add(keyItem.apiKey);
      existingNameValueMap.set(nextName, createdBucket);
      summary.createdKeys += 1;

      summary.importedKeys += 1;
      changed = true;
    }
  }

  if (changed) {
    await persistDatabase();
    revalidatePath("/", "layout");
  }

  return {
    ok: true,
    summary,
  };
}
