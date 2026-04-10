"use server";

import { and, eq, like, not } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  BUILTIN_PROVIDERS,
  DEFAULT_PROVIDERS,
  LEGACY_PROVIDER_ARCHIVE_SUFFIX,
  REMOVED_BUILTIN_PROVIDER_NAMES,
} from "@/lib/constants/providers";
import { getDb, persistDatabase } from "@/lib/db";
import { apiKeys, providers } from "@/lib/db/schema";
import { errorResult, successResult, type ActionResult } from "./result";

const providerOrderMap = new Map<string, number>(
  DEFAULT_PROVIDERS.map((name, index) => [name, index]),
);

function normalizeBaseUrl(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.replace(/\/+$/, "");
}

async function hasSession() {
  const session = await auth();
  return Boolean(session?.user);
}

function isArchivedProviderName(name: string) {
  return name.endsWith(LEGACY_PROVIDER_ARCHIVE_SUFFIX);
}

function sortProviders(items: Array<typeof providers.$inferSelect>) {
  return [...items].sort((a, b) => {
    const customDiff = Number(Boolean(a.isCustom)) - Number(Boolean(b.isCustom));
    if (customDiff !== 0) {
      return customDiff;
    }

    if (!a.isCustom && !b.isCustom) {
      const aIndex = providerOrderMap.get(a.name);
      const bIndex = providerOrderMap.get(b.name);

      if (aIndex !== undefined && bIndex !== undefined && aIndex !== bIndex) {
        return aIndex - bIndex;
      }

      if (aIndex !== undefined && bIndex === undefined) {
        return -1;
      }

      if (aIndex === undefined && bIndex !== undefined) {
        return 1;
      }
    }

    return a.name.localeCompare(b.name, "zh-CN");
  });
}

function cleanupRemovedBuiltinProviders(db: Awaited<ReturnType<typeof getDb>>) {
  let changed = false;

  for (const providerName of REMOVED_BUILTIN_PROVIDER_NAMES) {
    const existing = db
      .select()
      .from(providers)
      .where(eq(providers.name, providerName))
      .get();

    if (!existing) {
      continue;
    }

    const keyCount = db
      .select({ id: apiKeys.id })
      .from(apiKeys)
      .where(eq(apiKeys.providerId, existing.id))
      .all().length;

    if (keyCount === 0) {
      db.delete(providers).where(eq(providers.id, existing.id)).run();
      changed = true;
      continue;
    }

    let archiveName = `${existing.name}${LEGACY_PROVIDER_ARCHIVE_SUFFIX}`;
    const archiveConflict = db
      .select({ id: providers.id })
      .from(providers)
      .where(eq(providers.name, archiveName))
      .get();

    if (archiveConflict && archiveConflict.id !== existing.id) {
      archiveName = `${archiveName}-${existing.id}`;
    }

    db.update(providers)
      .set({
        name: archiveName,
        isCustom: true,
      })
      .where(eq(providers.id, existing.id))
      .run();
    changed = true;
  }

  return changed;
}

export async function seedDefaultProviders() {
  if (!(await hasSession())) {
    return;
  }

  const db = await getDb();
  let changed = cleanupRemovedBuiltinProviders(db);

  const existingProviders = db.select({ id: providers.id }).from(providers).all();
  if (existingProviders.length > 0) {
    if (changed) {
      await persistDatabase();
    }
    return;
  }

  for (const item of BUILTIN_PROVIDERS) {
    const existing = db
      .select()
      .from(providers)
      .where(eq(providers.name, item.name))
      .get();

    if (!existing) {
      db.insert(providers)
        .values({
          name: item.name,
          baseUrl: item.baseUrl,
          isCustom: false,
        })
        .run();
      changed = true;
      continue;
    }

    if (!existing.isCustom && !existing.baseUrl && item.baseUrl) {
      db.update(providers)
        .set({ baseUrl: item.baseUrl })
        .where(eq(providers.id, existing.id))
        .run();
      changed = true;
    }
  }

  if (changed) {
    await persistDatabase();
  }
}

export async function listProviders(search = "") {
  if (!(await hasSession())) {
    return [];
  }

  const db = await getDb();
  const keyword = search.trim();

  const rows = keyword
    ? db
        .select()
        .from(providers)
        .where(like(providers.name, `%${keyword}%`))
        .all()
    : db.select().from(providers).all();

  const visibleRows = rows.filter((item) => !isArchivedProviderName(item.name));
  return sortProviders(visibleRows);
}

export async function createProviderAction(
  formData: FormData,
): Promise<ActionResult> {
  if (!(await hasSession())) {
    return errorResult("errors.unauthorized");
  }

  const db = await getDb();
  const name = String(formData.get("name") ?? "").trim();
  const baseUrl = normalizeBaseUrl(String(formData.get("baseUrl") ?? ""));

  if (!name) {
    return errorResult("errors.providerNameRequired");
  }

  const existing = db
    .select({ id: providers.id })
    .from(providers)
    .where(eq(providers.name, name))
    .get();

  if (existing) {
    return errorResult("errors.providerNameExists");
  }

  db.insert(providers)
    .values({ name, baseUrl, isCustom: true })
    .run();
  await persistDatabase();
  revalidatePath("/", "layout");
  return successResult(undefined, "dashboard.submitSuccess");
}

export async function renameProviderAction(
  formData: FormData,
): Promise<ActionResult> {
  if (!(await hasSession())) {
    return errorResult("errors.unauthorized");
  }

  const db = await getDb();
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();

  if (!Number.isInteger(id) || id <= 0) {
    return errorResult("errors.invalidProviderId");
  }

  if (!name) {
    return errorResult("errors.providerNameRequired");
  }

  const duplicate = db
    .select({ id: providers.id })
    .from(providers)
    .where(and(eq(providers.name, name), not(eq(providers.id, id))))
    .get();

  if (duplicate) {
    return errorResult("errors.providerNameExists");
  }

  db.update(providers).set({ name }).where(eq(providers.id, id)).run();
  await persistDatabase();
  revalidatePath("/", "layout");
  return successResult(undefined, "dashboard.submitSuccess");
}

export async function updateProviderAction(
  formData: FormData,
): Promise<ActionResult> {
  if (!(await hasSession())) {
    return errorResult("errors.unauthorized");
  }

  const db = await getDb();
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const baseUrl = normalizeBaseUrl(String(formData.get("baseUrl") ?? ""));

  if (!Number.isInteger(id) || id <= 0) {
    return errorResult("errors.invalidProviderId");
  }

  if (!name) {
    return errorResult("errors.providerNameRequired");
  }

  const duplicate = db
    .select({ id: providers.id })
    .from(providers)
    .where(and(eq(providers.name, name), not(eq(providers.id, id))))
    .get();

  if (duplicate) {
    return errorResult("errors.providerNameExists");
  }

  db.update(providers)
    .set({ name, baseUrl })
    .where(eq(providers.id, id))
    .run();

  await persistDatabase();
  revalidatePath("/", "layout");
  return successResult(undefined, "dashboard.submitSuccess");
}

export async function deleteProviderAction(
  formData: FormData,
): Promise<ActionResult> {
  if (!(await hasSession())) {
    return errorResult("errors.unauthorized");
  }

  const db = await getDb();
  const id = Number(formData.get("id"));

  if (!Number.isInteger(id) || id <= 0) {
    return errorResult("errors.invalidProviderId");
  }

  const boundKeyCount = db
    .select({ id: apiKeys.id })
    .from(apiKeys)
    .where(eq(apiKeys.providerId, id))
    .all().length;

  if (boundKeyCount > 0) {
    return errorResult("errors.providerDeleteBlockedByKeys");
  }

  db.delete(providers).where(eq(providers.id, id)).run();
  await persistDatabase();
  revalidatePath("/", "layout");
  return successResult(undefined, "dashboard.submitSuccess");
}
