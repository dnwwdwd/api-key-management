import { drizzle } from "drizzle-orm/sql-js";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import type { Database } from "sql.js";
import * as schema from "./schema";

const configuredPath = process.env.DATABASE_FILE;
const databasePath =
  configuredPath && path.isAbsolute(configuredPath)
    ? configuredPath
    : path.join(process.cwd(), "data", "app.db");

function createDb(sqlite: Database) {
  return drizzle(sqlite, { schema });
}

export type DbClient = ReturnType<typeof createDb>;

type DbState = {
  sqlite: Database;
  db: DbClient;
};

let dbStatePromise: Promise<DbState> | null = null;

async function createDbState(): Promise<DbState> {
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });

  const require = createRequire(import.meta.url);
  const initSqlJs = require("sql.js/dist/sql-asm.js") as () => Promise<{
    Database: new (data?: ArrayLike<number> | null) => Database;
  }>;
  const SQL = await initSqlJs();

  const initialData = fs.existsSync(databasePath)
    ? fs.readFileSync(databasePath)
    : undefined;
  const sqlite = initialData
    ? new SQL.Database(initialData)
    : new SQL.Database();

  sqlite.exec("PRAGMA foreign_keys = ON;");
  return {
    sqlite,
    db: createDb(sqlite),
  };
}

async function getDbState() {
  if (!dbStatePromise) {
    dbStatePromise = createDbState();
  }

  return dbStatePromise;
}

export async function getDb(): Promise<DbClient> {
  const state = await getDbState();
  return state.db;
}

export async function persistDatabase() {
  const state = await getDbState();
  const bytes = state.sqlite.export();
  fs.writeFileSync(databasePath, Buffer.from(bytes));
}
