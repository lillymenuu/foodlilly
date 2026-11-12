CREATE TABLE "dados_entrada" (
	"negocio_id" uuid PRIMARY KEY NOT NULL,
	"energia_kwh" numeric(10, 4),
	"gas_preco" numeric(10, 2),
	"gas_peso_kg" numeric(8, 3),
	"taxa_ifood" numeric(5, 2),
	"taxa_99food" numeric(5, 2),
	"taxa_keeta" numeric(5, 2),
	"taxa_credito" numeric(5, 2),
	"aliquota_imposto" numeric(5, 2),
	"dias_mes" integer,
	"horas_dia" numeric(4, 2),
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "negocios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dados_entrada" ADD CONSTRAINT "dados_entrada_negocio_id_negocios_id_fk" FOREIGN KEY ("negocio_id") REFERENCES "public"."negocios"("id") ON DELETE cascade ON UPDATE no action;