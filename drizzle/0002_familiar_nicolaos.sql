CREATE TABLE "equipamentos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"negocio_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"tipo" text NOT NULL,
	"potencia_w" numeric(10, 2),
	"vazao_kg_h" numeric(10, 4),
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "negocios" ADD COLUMN "equipamentos_padrao_em" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "equipamentos" ADD CONSTRAINT "equipamentos_negocio_id_negocios_id_fk" FOREIGN KEY ("negocio_id") REFERENCES "public"."negocios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "equipamentos_negocio_idx" ON "equipamentos" USING btree ("negocio_id");