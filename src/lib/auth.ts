import "server-only";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";

import { DIAS_TESTE_GRATIS } from "@/config/planos";
import { db } from "@/db";
import {
  contasAcesso,
  negocios,
  sessoes,
  usuarios,
  verificacoes,
} from "@/db/schema";

import { esquemaDadosPessoais, SENHA_MINIMA, somenteDigitos } from "./cadastro";

/** Dias de teste grátis a partir do cadastro. */
export const DIAS_TESTE = DIAS_TESTE_GRATIS;

/** Login com Google só aparece quando as chaves estão configuradas. */
export const googleAtivo = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
);

const urlProducao = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : undefined;

export const auth = betterAuth({
  appName: "foodlilly",
  database: drizzleAdapter(db, {
    provider: "pg",
    // O driver HTTP do Neon não tem transações interativas.
    transaction: false,
    schema: {
      user: usuarios,
      session: sessoes,
      account: contasAcesso,
      verification: verificacoes,
    },
  }),
  // Endereço do site: o da Vercel em produção e prévias, localhost no desenvolvimento.
  baseURL: {
    allowedHosts: ["localhost:*", "127.0.0.1:*", "*.vercel.app"],
    fallback:
      process.env.BETTER_AUTH_URL ?? urlProducao ?? "http://localhost:3000",
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: SENHA_MINIMA,
    maxPasswordLength: 128,
    autoSignIn: true,
  },
  socialProviders: googleAtivo
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          prompt: "select_account",
        },
      }
    : {},
  account: { accountLinking: { enabled: true, trustedProviders: ["google"] } },
  user: {
    additionalFields: {
      telefone: { type: "string", required: false, input: true },
      cpf: { type: "string", required: false, input: true },
      pais: {
        type: "string",
        required: false,
        input: true,
        defaultValue: "BR",
      },
      codigoIndicacao: { type: "string", required: false, input: true },
      termosAceitosEm: { type: "date", required: false, input: false },
    },
  },
  hooks: {
    // Cadastro e alteração de dados passam pelas mesmas regras do formulário.
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/sign-up/email") {
        const b = (ctx.body ?? {}) as Record<string, unknown>;
        const r = esquemaDadosPessoais.safeParse(b);
        if (!r.success)
          throw new APIError("BAD_REQUEST", {
            message: r.error.issues[0]?.message ?? "Dados inválidos.",
          });
        return {
          context: {
            body: {
              ...b,
              name: r.data.name,
              pais: r.data.pais,
              telefone: somenteDigitos(r.data.telefone),
              cpf: r.data.pais === "BR" ? somenteDigitos(r.data.cpf) : null,
              codigoIndicacao:
                typeof b.codigoIndicacao === "string" &&
                b.codigoIndicacao.trim()
                  ? b.codigoIndicacao.trim().slice(0, 40)
                  : null,
            },
          },
        };
      }
      // Dados pessoais só mudam pelo Perfil (que valida); a rota genérica não altera esses campos.
      if (ctx.path === "/update-user") {
        const b = (ctx.body ?? {}) as Record<string, unknown>;
        if (
          ["telefone", "cpf", "pais", "codigoIndicacao"].some((k) => k in b)
        ) {
          throw new APIError("BAD_REQUEST", {
            message: "Altere estes dados pela tela de Perfil.",
          });
        }
      }
    }),
  },
  databaseHooks: {
    user: {
      create: {
        // Cadastro por e-mail exige o aceite no formulário; no Google, o aceite está no texto do botão.
        before: async (usuario) => ({
          data: { ...usuario, termosAceitosEm: new Date() },
        }),
        // Todo usuário novo ganha um negócio com 7 dias de teste.
        after: async (usuario) => {
          await db
            .insert(negocios)
            .values({
              nome: "Meu negócio",
              usuarioId: usuario.id,
              testeAte: new Date(Date.now() + DIAS_TESTE * 24 * 60 * 60 * 1000),
            })
            .onConflictDoNothing();
        },
      },
    },
  },
  plugins: [nextCookies()],
});

export type Sessao = typeof auth.$Infer.Session;
