CREATE TABLE "custeio" (
	"negocio_id" uuid PRIMARY KEY NOT NULL,
	"receita_bruta" numeric(12, 2),
	"aluguel" numeric(12, 2),
	"energia" numeric(12, 2),
	"agua" numeric(12, 2),
	"gas" numeric(12, 2),
	"internet" numeric(12, 2),
	"telefone" numeric(12, 2),
	"salarios" numeric(12, 2),
	"pro_labore" numeric(12, 2),
	"sistemas" numeric(12, 2),
	"mensalidade_ifood" numeric(12, 2),
	"marketing" numeric(12, 2),
	"contador" numeric(12, 2),
	"motoboy" numeric(12, 2),
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "custos_extras" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"negocio_id" uuid NOT NULL,
	"descricao" text NOT NULL,
	"valor" numeric(12, 2) NOT NULL,
	"ordem" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "custeio" ADD CONSTRAINT "custeio_negocio_id_negocios_id_fk" FOREIGN KEY ("negocio_id") REFERENCES "public"."negocios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custos_extras" ADD CONSTRAINT "custos_extras_negocio_id_negocios_id_fk" FOREIGN KEY ("negocio_id") REFERENCES "public"."negocios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "custos_extras_negocio_idx" ON "custos_extras" USING btree ("negocio_id");