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
  fileVersion: string;
};

let dbStatePromise: Promise<DbState> | null = null;

function readDatabaseFileVersion() {
  if (!fs.existsSync(databasePath)) {
    return "missing";
  }

  const stat = fs.statSync(databasePath);
  return `${stat.size}:${stat.mtimeMs}`;
}

async function createDbState(fileVersion: string): Promise<DbState> {
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
    fileVersion,
  };
}

async function getDbState() {
  const currentFileVersion = readDatabaseFileVersion();

  if (!dbStatePromise) {
    dbStatePromise = createDbState(currentFileVersion);
    return dbStatePromise;
  }

  const state = await dbStatePromise;
  if (state.fileVersion !== currentFileVersion) {
    state.sqlite.close();
    dbStatePromise = createDbState(currentFileVersion);
    return dbStatePromise;
  }

  return state;
}

export async function getDb(): Promise<DbClient> {
  const state = await getDbState();
  return state.db;
}

export async function persistDatabase() {
  const state = await getDbState();
  const bytes = state.sqlite.export();
  fs.writeFileSync(databasePath, Buffer.from(bytes));
  state.fileVersion = readDatabaseFileVersion();
}
