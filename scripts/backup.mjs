import { DatabaseSync, backup } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
const source = process.env.DATABASE_PATH || "data/baaqa.sqlite";
const target = process.argv[2];
if (!target)
  throw Error("Usage: node scripts/backup.mjs /secure/path/backup.sqlite");
mkdirSync(resolve(target, ".."), { recursive: true });
const db = new DatabaseSync(source, { readOnly: true });
await backup(db, target);
db.close();
console.log("Database backup completed. Store the file securely.");
