import { migrate } from "drizzle-orm/sql-js/migrator";
import path from "node:path";
import { getDb, persistDatabase } from "./index";

async function main() {
  const db = await getDb();

  migrate(db, {
    migrationsFolder: path.join(process.cwd(), "drizzle"),
  });

  await persistDatabase();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});