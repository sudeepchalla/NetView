import Database from "@tauri-apps/plugin-sql";

let db: Database | null = null;

/**
 * Get or create database connection
 */
export async function getDb(): Promise<Database> {
  if (!db) {
    db = await Database.load("sqlite:netview.db");
    await initSchema();
  }
  return db;
}

/**
 * Initialize database schema
 */
async function initSchema(): Promise<void> {
  if (!db) return;

  // Tools table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS tools (
      name TEXT PRIMARY KEY,
      version TEXT,
      path TEXT,
      installed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Favourites table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS favourites (
      tool_name TEXT PRIMARY KEY,
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // History table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tool_name TEXT NOT NULL,
      action TEXT NOT NULL,
      target TEXT NOT NULL,
      category TEXT,
      status TEXT DEFAULT 'Running',
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME
    )
  `);

  // Notifications table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT,
      read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Engagements table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS engagements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Engagement files table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS engagement_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      engagement_id INTEGER NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      tool_name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (engagement_id) REFERENCES engagements(id) ON DELETE CASCADE
    )
  `);

  // Presets table for workflow builder
  await db.execute(`
    CREATE TABLE IF NOT EXISTS presets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      nodes_json TEXT DEFAULT '[]',
      edges_json TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

/**
 * Execute a query and return results
 */
export async function query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  const database = await getDb();
  return database.select<T[]>(sql, params);
}

/**
 * Execute a statement (INSERT, UPDATE, DELETE)
 */
export async function execute(sql: string, params: unknown[] = []): Promise<void> {
  const database = await getDb();
  await database.execute(sql, params);
}
