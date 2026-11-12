import "server-only";

import { db } from "@/db";
import { negocios } from "@/db/schema";

/**
 * PROVISÓRIO: enquanto não existe login, todos usam o mesmo negócio de
 * demonstração. Quando a autenticação existir, esta função passa a ler o
 * negócio da sessão (e a recusar acesso sem sessão). Toda Server Action e
 * consulta deve obter o negócio por aqui, nunca recebê-lo do navegador.
 */
const NEGOCIO_DEMO = { id: "00000000-0000-4000-8000-000000000001", nome: "Cantina da Ana" };

export async function obterNegocioAtualId(): Promise<string> {
  return NEGOCIO_DEMO.id;
}

/** Garante que o negócio existe no banco antes de gravar dados ligados a ele. */
export function garantirNegocioQuery(id: string) {
  return db
    .insert(negocios)
    .values({ id, nome: NEGOCIO_DEMO.nome })
    .onConflictDoNothing();
}
