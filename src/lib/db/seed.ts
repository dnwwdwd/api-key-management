import { eq } from "drizzle-orm";
import { getDb, persistDatabase, type DbClient } from "./index";
import { apiKeys, providers, users } from "./schema";
import {
  BUILTIN_PROVIDERS,
  LEGACY_PROVIDER_ARCHIVE_SUFFIX,
  LEGACY_PROVIDER_RENAMES,
  REMOVED_BUILTIN_PROVIDER_NAMES,
} from "../constants/providers";
import { hashPassword } from "../utils/password";

function normalizeLegacyProviderNames(db: DbClient) {
  for (const [legacyName, nextName] of Object.entries(LEGACY_PROVIDER_RENAMES)) {
    const legacyProvider = db
      .select({ id: providers.id, name: providers.name })
      .from(providers)
      .where(eq(providers.name, legacyName))
      .get();

    if (!legacyProvider) {
      continue;
    }

    const nextProvider = db
      .select({ id: providers.id })
      .from(providers)
      .where(eq(providers.name, nextName))
      .get();

    if (nextProvider && nextProvider.id !== legacyProvider.id) {
      db.update(apiKeys)
        .set({ providerId: nextProvider.id, updatedAt: new Date() })
        .where(eq(apiKeys.providerId, legacyProvider.id))
        .run();

      let archiveName = `${legacyProvider.name}${LEGACY_PROVIDER_ARCHIVE_SUFFIX}`;
      const archiveConflict = db
        .select({ id: providers.id })
        .from(providers)
        .where(eq(providers.name, archiveName))
        .get();

      if (archiveConflict && archiveConflict.id !== legacyProvider.id) {
        archiveName = `${archiveName}-${legacyProvider.id}`;
      }

      db.update(providers)
        .set({ name: archiveName, isCustom: true })
        .where(eq(providers.id, legacyProvider.id))
        .run();

      continue;
    }

    db.update(providers)
      .set({ name: nextName })
      .where(eq(providers.id, legacyProvider.id))
      .run();
  }
}

function cleanupRemovedBuiltinProviders(db: DbClient) {
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
      .set({ name: archiveName, isCustom: true })
      .where(eq(providers.id, existing.id))
      .run();
  }
}

async function seedProviders(db: DbClient) {
  normalizeLegacyProviderNames(db);
  cleanupRemovedBuiltinProviders(db);

  for (const provider of BUILTIN_PROVIDERS) {
    const existing = db
      .select()
      .from(providers)
      .where(eq(providers.name, provider.name))
      .get();

    if (!existing) {
      db.insert(providers)
        .values({
          name: provider.name,
          baseUrl: provider.baseUrl,
          isCustom: false,
        })
        .run();
      continue;
    }

    if (!existing.isCustom && !existing.baseUrl && provider.baseUrl) {
      db.update(providers)
        .set({ baseUrl: provider.baseUrl })
        .where(eq(providers.id, existing.id))
        .run();
    }
  }
}

async function seedAdminUser(db: DbClient) {
  const username = process.env.SEED_ADMIN_USERNAME ?? "admin";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "admin123456";

  const existing = db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .get();

  if (existing) {
    return;
  }

  const passwordHashResult = await hashPassword(password);
  if (!passwordHashResult.ok) {
    console.error(passwordHashResult.messageKey);
    return;
  }

  db.insert(users)
    .values({
      username,
      passwordHash: passwordHashResult.value,
      preferredLocale: "zh-CN",
    })
    .run();
}

async function main() {
  const db = await getDb();
  await seedProviders(db);
  await seedAdminUser(db);
  await persistDatabase();

  const totalUsers = db.select().from(users).all().length;
  const totalProviders = db.select().from(providers).all().length;

  console.log(`Seed completed. users=${totalUsers} providers=${totalProviders}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
