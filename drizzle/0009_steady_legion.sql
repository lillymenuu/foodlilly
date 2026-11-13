CREATE TABLE "categorias_financeiras" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"negocio_id" uuid NOT NULL,
	"grupo" text NOT NULL,
	"nome" text NOT NULL,
	"chave" text,
	"pai_id" uuid,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "negocios" ADD COLUMN "categorias_financeiras_padrao_em" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "categorias_financeiras" ADD CONSTRAINT "categorias_financeiras_negocio_id_negocios_id_fk" FOREIGN KEY ("negocio_id") REFERENCES "public"."negocios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categorias_financeiras" ADD CONSTRAINT "categorias_financeiras_pai_id_categorias_financeiras_id_fk" FOREIGN KEY ("pai_id") REFERENCES "public"."categorias_financeiras"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "categorias_financeiras_negocio_idx" ON "categorias_financeiras" USING btree ("negocio_id");--> statement-breakpoint
CREATE UNIQUE INDEX "categorias_financeiras_chave_unica" ON "categorias_financeiras" USING btree ("negocio_id","chave") WHERE "categorias_financeiras"."chave" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "categorias_financeiras_sub_unica" ON "categorias_financeiras" USING btree ("pai_id",lower("nome")) WHERE "categorias_financeiras"."pai_id" is not null;