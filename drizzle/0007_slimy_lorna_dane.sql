CREATE TABLE "contas_acesso" (
	"id" text PRIMARY KEY NOT NULL,
	"conta_id" text NOT NULL,
	"provedor" text NOT NULL,
	"usuario_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expira_em" timestamp with time zone,
	"refresh_token_expira_em" timestamp with time zone,
	"escopo" text,
	"senha_hash" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessoes" (
	"id" text PRIMARY KEY NOT NULL,
	"expira_em" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"ip" text,
	"navegador" text,
	"usuario_id" text NOT NULL,
	CONSTRAINT "sessoes_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "usuarios" (
	"id" text PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"email" text NOT NULL,
	"email_verificado" boolean DEFAULT false NOT NULL,
	"imagem" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"telefone" text,
	"cpf" text,
	"pais" text DEFAULT 'BR' NOT NULL,
	"codigo_indicacao" text,
	"termos_aceitos_em" timestamp with time zone,
	CONSTRAINT "usuarios_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verificacoes" (
	"id" text PRIMARY KEY NOT NULL,
	"identificador" text NOT NULL,
	"valor" text NOT NULL,
	"expira_em" timestamp with time zone NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "negocios" ADD COLUMN "usuario_id" text;--> statement-breakpoint
ALTER TABLE "negocios" ADD COLUMN "plano" text DEFAULT 'basico' NOT NULL;--> statement-breakpoint
ALTER TABLE "negocios" ADD COLUMN "teste_ate" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "negocios" ADD COLUMN "pago_ate" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "negocios" ADD COLUMN "isento" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "contas_acesso" ADD CONSTRAINT "contas_acesso_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessoes" ADD CONSTRAINT "sessoes_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contas_acesso_usuario_idx" ON "contas_acesso" USING btree ("usuario_id");--> statement-breakpoint
CREATE INDEX "sessoes_usuario_idx" ON "sessoes" USING btree ("usuario_id");--> statement-breakpoint
CREATE INDEX "verificacoes_identificador_idx" ON "verificacoes" USING btree ("identificador");--> statement-breakpoint
ALTER TABLE "negocios" ADD CONSTRAINT "negocios_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "negocios" ADD CONSTRAINT "negocios_usuario_id_unique" UNIQUE("usuario_id");