CREATE TABLE "categorias_ficha" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"negocio_id" uuid NOT NULL,
	"tipo" text NOT NULL,
	"nome" text NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ficha_itens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ficha_id" uuid NOT NULL,
	"tipo" text NOT NULL,
	"insumo_id" uuid,
	"ficha_ref_id" uuid,
	"funcionario_id" uuid,
	"equipamento_id" uuid,
	"quantidade" numeric(12, 3) NOT NULL,
	"ordem" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fichas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"negocio_id" uuid NOT NULL,
	"tipo" text NOT NULL,
	"nome" text NOT NULL,
	"categoria_id" uuid,
	"rendimento" numeric(10, 2) DEFAULT 1 NOT NULL,
	"peso_total_g" numeric(12, 2),
	"tempo_preparo_min" integer,
	"margem" numeric(5, 2),
	"margem_revenda" numeric(5, 2),
	"favorito" boolean DEFAULT false NOT NULL,
	"modo_preparo" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "categorias_ficha" ADD CONSTRAINT "categorias_ficha_negocio_id_negocios_id_fk" FOREIGN KEY ("negocio_id") REFERENCES "public"."negocios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ficha_itens" ADD CONSTRAINT "ficha_itens_ficha_id_fichas_id_fk" FOREIGN KEY ("ficha_id") REFERENCES "public"."fichas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ficha_itens" ADD CONSTRAINT "ficha_itens_insumo_id_insumos_id_fk" FOREIGN KEY ("insumo_id") REFERENCES "public"."insumos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ficha_itens" ADD CONSTRAINT "ficha_itens_ficha_ref_id_fichas_id_fk" FOREIGN KEY ("ficha_ref_id") REFERENCES "public"."fichas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ficha_itens" ADD CONSTRAINT "ficha_itens_funcionario_id_funcionarios_id_fk" FOREIGN KEY ("funcionario_id") REFERENCES "public"."funcionarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ficha_itens" ADD CONSTRAINT "ficha_itens_equipamento_id_equipamentos_id_fk" FOREIGN KEY ("equipamento_id") REFERENCES "public"."equipamentos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fichas" ADD CONSTRAINT "fichas_negocio_id_negocios_id_fk" FOREIGN KEY ("negocio_id") REFERENCES "public"."negocios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fichas" ADD CONSTRAINT "fichas_categoria_id_categorias_ficha_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias_ficha"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "categorias_ficha_nome_unico" ON "categorias_ficha" USING btree ("negocio_id","tipo",lower("nome"));--> statement-breakpoint
CREATE INDEX "ficha_itens_ficha_idx" ON "ficha_itens" USING btree ("ficha_id");--> statement-breakpoint
CREATE INDEX "ficha_itens_ref_idx" ON "ficha_itens" USING btree ("ficha_ref_id");--> statement-breakpoint
CREATE INDEX "fichas_negocio_idx" ON "fichas" USING btree ("negocio_id","tipo");