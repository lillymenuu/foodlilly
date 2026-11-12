CREATE TABLE "categorias_insumo" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"negocio_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"sistema" boolean DEFAULT false NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "insumos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"negocio_id" uuid NOT NULL,
	"categoria_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"codigo_barras" text,
	"volume" numeric(12, 3) NOT NULL,
	"unidade" text NOT NULL,
	"custo" numeric(12, 2) NOT NULL,
	"perda" numeric(5, 2) DEFAULT 0 NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "negocios" ADD COLUMN "categorias_insumo_padrao_em" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "categorias_insumo" ADD CONSTRAINT "categorias_insumo_negocio_id_negocios_id_fk" FOREIGN KEY ("negocio_id") REFERENCES "public"."negocios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insumos" ADD CONSTRAINT "insumos_negocio_id_negocios_id_fk" FOREIGN KEY ("negocio_id") REFERENCES "public"."negocios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insumos" ADD CONSTRAINT "insumos_categoria_id_categorias_insumo_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias_insumo"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "categorias_insumo_nome_unico" ON "categorias_insumo" USING btree ("negocio_id",lower("nome"));--> statement-breakpoint
CREATE INDEX "insumos_negocio_idx" ON "insumos" USING btree ("negocio_id");--> statement-breakpoint
CREATE INDEX "insumos_categoria_idx" ON "insumos" USING btree ("categoria_id");