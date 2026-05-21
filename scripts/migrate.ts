// Apply Drizzle migrations. Called from the Docker entrypoint before the
// server boots, and locally via `pnpm db:migrate`.

// TODO(basile): wire once drizzle-orm + drizzle-kit are installed.
// import { Database } from "bun:sqlite";
// import { drizzle } from "drizzle-orm/bun-sqlite";
// import { migrate } from "drizzle-orm/bun-sqlite/migrator";
//
// const path = process.env.DATABASE_PATH ?? "./data/app.db";
// const sqlite = new Database(path);
// sqlite.exec("PRAGMA journal_mode = WAL");
// sqlite.exec("PRAGMA foreign_keys = ON");
//
// const db = drizzle(sqlite);
// migrate(db, { migrationsFolder: "./drizzle" });
//
// console.log(`migrations applied to ${path}`);

// biome-ignore lint/suspicious/noConsoleLog: bootstrap script
console.log("migrate: no migrations to apply yet (scaffold)");
