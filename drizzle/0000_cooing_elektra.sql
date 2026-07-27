CREATE TABLE "catalogues" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"titre" text NOT NULL,
	"derniere_generation_at" timestamp with time zone,
	"photos_expirees" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" serial PRIMARY KEY NOT NULL,
	"nom_entreprise" text NOT NULL,
	"secteur" text NOT NULL,
	"whatsapp" text NOT NULL,
	"forfait" text NOT NULL,
	"credits_restants" integer DEFAULT 0 NOT NULL,
	"date_achat" timestamp with time zone DEFAULT now() NOT NULL,
	"date_expiration_credits" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "produits" (
	"id" serial PRIMARY KEY NOT NULL,
	"catalogue_id" integer NOT NULL,
	"nom" text NOT NULL,
	"prix" integer NOT NULL,
	"description" text,
	"photo_url" text,
	"photo_public_id" text,
	"ordre" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"type" text NOT NULL,
	"montant" integer NOT NULL,
	"credits_ajoutes" integer DEFAULT 0 NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "catalogues" ADD CONSTRAINT "catalogues_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "produits" ADD CONSTRAINT "produits_catalogue_id_catalogues_id_fk" FOREIGN KEY ("catalogue_id") REFERENCES "public"."catalogues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;