import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core"
import type { Forfait, Secteur, TypeTransaction } from "@/types"

// ============================================================
// Schéma Postgres (Neon) — clients → catalogues → produits
//                          clients → transactions
// ============================================================

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  nomEntreprise: text("nom_entreprise").notNull(),
  secteur: text("secteur").$type<Secteur>().notNull(),
  // Numéro WhatsApp du vendeur, format international sans + (ex: 237675947160)
  whatsapp: text("whatsapp").notNull(),
  forfait: text("forfait").$type<Forfait>().notNull(),
  creditsRestants: integer("credits_restants").notNull().default(0),
  dateAchat: timestamp("date_achat", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
  dateExpirationCredits: timestamp("date_expiration_credits", {
    withTimezone: true,
    mode: "date",
  }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
})

export const catalogues = pgTable("catalogues", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  titre: text("titre").notNull(),
  // Date de la dernière génération de PDF. Tant qu'elle est null, le catalogue
  // est « en création » : les modifications sont gratuites. Après la première
  // génération, chaque modification coûte 1 crédit.
  derniereGenerationAt: timestamp("derniere_generation_at", {
    withTimezone: true,
    mode: "date",
  }),
  // Passe à true quand le cron a purgé les photos Cloudinary
  // (7 jours après la dernière génération).
  photosExpirees: boolean("photos_expirees").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
})

export const produits = pgTable("produits", {
  id: serial("id").primaryKey(),
  catalogueId: integer("catalogue_id")
    .notNull()
    .references(() => catalogues.id, { onDelete: "cascade" }),
  nom: text("nom").notNull(),
  prix: integer("prix").notNull(), // FCFA
  description: text("description"),
  photoUrl: text("photo_url"),
  photoPublicId: text("photo_public_id"),
  ordre: integer("ordre").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
})

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  type: text("type").$type<TypeTransaction>().notNull(),
  montant: integer("montant").notNull(), // FCFA
  creditsAjoutes: integer("credits_ajoutes").notNull().default(0),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
})

export type Client = typeof clients.$inferSelect
export type Catalogue = typeof catalogues.$inferSelect
export type Produit = typeof produits.$inferSelect
export type Transaction = typeof transactions.$inferSelect
