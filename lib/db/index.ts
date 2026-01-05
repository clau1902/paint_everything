import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "./schema";
import path from "path";

let db: ReturnType<typeof drizzle<typeof schema>> | null = null;
let sqlite: Database | null = null;

function getDbPath() {
  return path.join(process.cwd(), "paint_everything.db");
}

function initializeDatabase(database: Database) {
  // Create tables if they don't exist
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at INTEGER DEFAULT (unixepoch())
    );
  `);

  database.exec(`
    CREATE TABLE IF NOT EXISTS drawings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      image_data TEXT NOT NULL,
      thumbnail TEXT,
      share_token TEXT,
      is_public INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch()),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  database.exec(`CREATE INDEX IF NOT EXISTS idx_drawings_user_id ON drawings(user_id);`);

  // Migration: add share columns if they don't exist (for existing databases)
  // Check if columns exist first
  const tableInfo = database.prepare("PRAGMA table_info(drawings)").all() as { name: string }[];
  const columnNames = tableInfo.map(col => col.name);

  if (!columnNames.includes("share_token")) {
    database.exec(`ALTER TABLE drawings ADD COLUMN share_token TEXT;`);
  }
  
  if (!columnNames.includes("is_public")) {
    database.exec(`ALTER TABLE drawings ADD COLUMN is_public INTEGER DEFAULT 0;`);
  }

  // Create index for share_token if it doesn't exist
  try {
    database.exec(`CREATE INDEX IF NOT EXISTS idx_drawings_share_token ON drawings(share_token);`);
  } catch {
    // Index might already exist
  }
}

export function getDb() {
  if (!db) {
    sqlite = new Database(getDbPath());
    sqlite.exec("PRAGMA foreign_keys = ON;");
    initializeDatabase(sqlite);
    db = drizzle(sqlite, { schema });
  }
  return db;
}

// Export for convenience - lazily initialized
export { schema };
