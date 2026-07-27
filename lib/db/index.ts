import { neon } from "@neondatabase/serverless"
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http"
import * as schema from "./schema"

// Connexion paresseuse : la base n'est contactée qu'au premier appel réel,
// jamais au moment du build (où DATABASE_URL peut être absente).
let _db: NeonHttpDatabase<typeof schema> | null = null

export function db(): NeonHttpDatabase<typeof schema> {
  if (_db) return _db
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error(
      "DATABASE_URL manquante — configure ta base Neon dans .env.local (voir .env.example)"
    )
  }
  _db = drizzle(neon(url), { schema })
  return _db
}

export * from "./schema"
