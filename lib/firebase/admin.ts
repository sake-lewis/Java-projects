import { initializeApp, getApps, cert, type App } from "firebase-admin/app"
import { getFirestore, type Firestore } from "firebase-admin/firestore"
import { getStorage, type Storage } from "firebase-admin/storage"

// Initialisation paresseuse : Firebase n'est instancié qu'à la première
// requête réelle, jamais au build ni à l'import du module.
let app: App | undefined
let db: Firestore | undefined
let storage: Storage | undefined

/**
 * Normalise une clé privée PEM stockée en variable d'environnement.
 *
 * Reconstruit un PEM propre quelle que soit la façon dont la clé a été collée :
 * - `\n` échappés (cas classique sur Vercel),
 * - vrais retours à la ligne avec indentation parasite (cas d'un éditeur qui
 *   « wrappe » la longue ligne),
 * - marqueurs BEGIN/END éventuellement collés ou coupés.
 */
function normaliserClePrivee(raw: string): string {
  // 1. Convertir les \n échappés en vrais retours à la ligne.
  const text = raw.replace(/\\n/g, "\n")
  // 2. Extraire le corps en retirant marqueurs et tout espace/retour à la ligne.
  const corps = text
    .replace(/-----BEGIN[\s\S]*?KEY-----/, "")
    .replace(/-----END[\s\S]*?KEY-----/, "")
    .replace(/\s+/g, "")
  if (!corps) return text
  // 3. Reconstruire un PEM propre (lignes base64 de 64 caractères).
  const lignes = corps.match(/.{1,64}/g)?.join("\n") ?? corps
  return `-----BEGIN PRIVATE KEY-----\n${lignes}\n-----END PRIVATE KEY-----\n`
}

function getApp(): App {
  if (app) return app
  const rawKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY
  const privateKey = rawKey ? normaliserClePrivee(rawKey) : undefined

  app =
    getApps().length === 0
      ? initializeApp({
          credential: cert({
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            privateKey,
            clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          }),
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        })
      : getApps()[0]
  return app
}

export function getAdminDb(): Firestore {
  if (!db) db = getFirestore(getApp())
  return db
}

export function getAdminStorage(): Storage {
  if (!storage) storage = getStorage(getApp())
  return storage
}
