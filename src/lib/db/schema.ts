import { relations, sql } from "drizzle-orm";
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable(
  "users",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    username: text("username").notNull(),
    passwordHash: text("password_hash").notNull(),
    preferredLocale: text("preferred_locale").notNull().default("zh-CN"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [uniqueIndex("users_username_unique").on(table.username)],
);

export const providers = sqliteTable(
  "providers",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    baseUrl: text("base_url"),
    isCustom: integer("is_custom", { mode: "boolean" })
      .notNull()
      .default(false),
  },
  (table) => [uniqueIndex("providers_name_unique").on(table.name)],
);

export const apiKeys = sqliteTable("api_keys", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  providerId: integer("provider_id")
    .notNull()
    .references(() => providers.id),
  name: text("name").notNull(),
  apiKey: text("api_key").notNull(),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const providersRelations = relations(providers, ({ many }) => ({
  apiKeys: many(apiKeys),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  provider: one(providers, {
    fields: [apiKeys.providerId],
    references: [providers.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type Provider = typeof providers.$inferSelect;
export type ApiKey = typeof apiKeys.$inferSelect;
