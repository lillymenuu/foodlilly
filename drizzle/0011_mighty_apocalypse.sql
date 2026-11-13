CREATE TABLE "lancamentos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"negocio_id" uuid NOT NULL,
	"conta_id" uuid NOT NULL,
	"grupo" text NOT NULL,
	"categoria_id" uuid NOT NULL,
	"data" date NOT NULL,
	"valor" numeric(14, 2) NOT NULL,
	"descricao" text,
	"fornecedor_id" uuid,
	"pessoa_nome" text,
	"forma_pagamento" text,
	"pago" boolean DEFAULT false NOT NULL,
	"serie_id" uuid,
	"serie_tipo" text,
	"serie_numero" integer,
	"serie_total" integer,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lancamentos" ADD CONSTRAINT "lancamentos_negocio_id_negocios_id_fk" FOREIGN KEY ("negocio_id") REFERENCES "public"."negocios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lancamentos" ADD CONSTRAINT "lancamentos_conta_id_contas_bancarias_id_fk" FOREIGN KEY ("conta_id") REFERENCES "public"."contas_bancarias"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lancamentos" ADD CONSTRAINT "lancamentos_categoria_id_categorias_financeiras_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias_financeiras"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lancamentos" ADD CONSTRAINT "lancamentos_fornecedor_id_fornecedores_id_fk" FOREIGN KEY ("fornecedor_id") REFERENCES "public"."fornecedores"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lancamentos_negocio_data_idx" ON "lancamentos" USING btree ("negocio_id","data");--> statement-breakpoint
CREATE INDEX "lancamentos_conta_idx" ON "lancamentos" USING btree ("conta_id");--> statement-breakpoint
CREATE INDEX "lancamentos_categoria_idx" ON "lancamentos" USING btree ("categoria_id");--> statement-breakpoint
CREATE INDEX "lancamentos_serie_idx" ON "lancamentos" USING btree ("serie_id");