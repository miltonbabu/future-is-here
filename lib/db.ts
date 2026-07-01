import initSqlJs from "sql.js";

interface DatabaseInstance {
  run(sql: string, params?: unknown[]): void;
  get(sql: string, params?: unknown[]): Record<string, unknown> | undefined;
  all(sql: string, params?: unknown[]): Record<string, unknown>[];
}

interface SQLModule {
  Database: new () => DatabaseInstance;
}

let sqlModule: SQLModule | null = null;
let db: DatabaseInstance | null = null;

async function getDb(): Promise<DatabaseInstance> {
  if (db) return db;
  if (!sqlModule) {
    sqlModule = await initSqlJs({
      locateFile: (file: string) => `https://sql.js.org/dist/${file}`,
    });
  }
  db = new sqlModule.Database();
  db.run(`
    CREATE TABLE IF NOT EXISTS capsules (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      article TEXT NOT NULL,
      image_url TEXT,
      photo_url TEXT,
      name TEXT NOT NULL,
      team TEXT NOT NULL,
      future_date TEXT NOT NULL,
      language TEXT NOT NULL,
      share_url TEXT NOT NULL
    )
  `);
  return db;
}

export interface DbCapsule {
  id: string;
  createdAt: string;
  article: string;
  imageUrl: string | null;
  photoUrl: string | null;
  name: string;
  team: string;
  futureDate: string;
  language: string;
  shareUrl: string;
}

export async function saveCapsuleToDb(capsule: {
  id: string;
  createdAt: string;
  article: string;
  imageUrl: string | null;
  photoUrl: string | null;
  name: string;
  team: string;
  futureDate: string;
  language: string;
  shareUrl: string;
}): Promise<void> {
  const database = await getDb();
  database.run(
    `INSERT OR REPLACE INTO capsules (
      id, created_at, article, image_url, photo_url,
      name, team, future_date, language, share_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      capsule.id,
      capsule.createdAt,
      capsule.article,
      capsule.imageUrl || null,
      capsule.photoUrl || null,
      capsule.name,
      capsule.team,
      capsule.futureDate,
      capsule.language,
      capsule.shareUrl,
    ],
  );
}

export async function getCapsuleFromDb(id: string): Promise<DbCapsule | null> {
  const database = await getDb();
  const result = database.get("SELECT * FROM capsules WHERE id = ?", [id]);
  if (!result) return null;
  return {
    id: result.id as string,
    createdAt: result.created_at as string,
    article: result.article as string,
    imageUrl: result.image_url as string | null,
    photoUrl: result.photo_url as string | null,
    name: result.name as string,
    team: result.team as string,
    futureDate: result.future_date as string,
    language: result.language as string,
    shareUrl: result.share_url as string,
  };
}

export async function getAllCapsulesFromDb(): Promise<DbCapsule[]> {
  const database = await getDb();
  const results = database.all(
    "SELECT * FROM capsules ORDER BY created_at DESC",
  );
  return results.map((row) => ({
    id: row.id as string,
    createdAt: row.created_at as string,
    article: row.article as string,
    imageUrl: row.image_url as string | null,
    photoUrl: row.photo_url as string | null,
    name: row.name as string,
    team: row.team as string,
    futureDate: row.future_date as string,
    language: row.language as string,
    shareUrl: row.share_url as string,
  }));
}
export async function deleteCapsuleFromDb(id: string): Promise<void> {
  const database = await getDb();
  database.run("DELETE FROM capsules WHERE id = ?", [id]);
}
