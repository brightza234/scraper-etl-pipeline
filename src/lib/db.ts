import Database from "better-sqlite3";
import path from "node:path";

const DB_PATH = path.join(process.cwd(), "data", "scraped.db");

let db: Database.Database | null = null;

/** Lazily opens a single read-only connection to the scraper's SQLite file. */
export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH, { readonly: true, fileMustExist: true });
  }
  return db;
}
