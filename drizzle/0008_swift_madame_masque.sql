CREATE TABLE "contas_bancarias" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"negocio_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"tipo" text NOT NULL,
	"saldo_inicial" numeric(14, 2) DEFAULT 0 NOT NULL,
	"data_saldo_inicial" date NOT NULL,
	"padrao" boolean DEFAULT false NOT NULL,
	"cor" text DEFAULT 'grafite' NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contas_bancarias" ADD CONSTRAINT "contas_bancarias_negocio_id_negocios_id_fk" FOREIGN KEY ("negocio_id") REFERENCES "public"."negocios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contas_bancarias_negocio_idx" ON "contas_bancarias" USING btree ("negocio_id");--> statement-breakpoint
CREATE UNIQUE INDEX "contas_bancarias_padrao_unica" ON "contas_bancarias" USING btree ("negocio_id") WHERE "contas_bancarias"."padrao";