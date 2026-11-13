import "server-only";

import { cache } from "react";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import { db } from "@/db";
import { negocios } from "@/db/schema";

import { auth, DIAS_TESTE } from "./auth";

/**
 * Camada de acesso: quem está logado e qual negócio é dele.
 * Toda Server Action e consulta obtém o negócio por aqui, nunca do navegador.
 */

/** Sessão da requisição atual (lida uma vez por requisição). */
export const obterSessao = cache(async () => {
  // A sessão só existe na requisição de verdade: fora da pré-renderização e do pré-carregamento.
  await connection();
  return auth.api.getSession({ headers: await headers() });
});

/** Usuário logado; sem sessão, vai para o login. */
export async function obterUsuarioAtual() {
  const sessao = await obterSessao();
  if (!sessao) redirect("/entrar");
  return sessao.user;
}

export type Negocio = typeof negocios.$inferSelect;

const negocioDoUsuario = cache(async (usuarioId: string): Promise<Negocio> => {
  const [n] = await db
    .select()
    .from(negocios)
    .where(eq(negocios.usuarioId, usuarioId))
    .limit(1);
  if (n) return n;
  // Segurança: usuário sem negócio (não deveria acontecer) ganha um com teste.
  const [novo] = await db
    .insert(negocios)
    .values({
      nome: "Meu negócio",
      usuarioId,
      testeAte: new Date(Date.now() + DIAS_TESTE * 86_400_000),
    })
    .onConflictDoNothing()
    .returning();
  if (novo) return novo;
  const [existente] = await db
    .select()
    .from(negocios)
    .where(eq(negocios.usuarioId, usuarioId))
    .limit(1);
  return existente;
});

export async function obterNegocioAtual() {
  const usuario = await obterUsuarioAtual();
  return negocioDoUsuario(usuario.id);
}

export type SituacaoAcesso = "isento" | "pago" | "teste" | "expirado";

/** Situação do acesso: isento, pago, em teste ou vencido (bloqueado até pagar). */
export function acessoDo(
  n: Pick<Negocio, "isento" | "pagoAte" | "testeAte">,
  agora = new Date(),
) {
  if (n.isento)
    return { situacao: "isento" as SituacaoAcesso, ate: null, dias: null };
  if (n.pagoAte && n.pagoAte > agora)
    return {
      situacao: "pago" as SituacaoAcesso,
      ate: n.pagoAte,
      dias: diasAte(n.pagoAte, agora),
    };
  if (n.testeAte && n.testeAte > agora)
    return {
      situacao: "teste" as SituacaoAcesso,
      ate: n.testeAte,
      dias: diasAte(n.testeAte, agora),
    };
  return {
    situacao: "expirado" as SituacaoAcesso,
    ate: n.pagoAte ?? n.testeAte,
    dias: 0,
  };
}

const diasAte = (d: Date, agora: Date) =>
  Math.max(0, Math.ceil((d.getTime() - agora.getTime()) / 86_400_000));

/**
 * Id do negócio do usuário logado. Com o acesso vencido, manda para a Assinatura
 * (exceto onde `permitirVencido` for usado: Assinatura e Perfil).
 */
export async function obterNegocioAtualId(opcoes?: {
  permitirVencido?: boolean;
}): Promise<string> {
  const n = await obterNegocioAtual();
  if (!opcoes?.permitirVencido && acessoDo(n).situacao === "expirado")
    redirect("/assinatura");
  return n.id;
}

/** Usado em `db.batch` antes de gravar: o negócio já existe (criado no cadastro), então é inofensivo. */
export function garantirNegocioQuery(id: string) {
  return db
    .insert(negocios)
    .values({ id, nome: "Meu negócio" })
    .onConflictDoNothing();
}
