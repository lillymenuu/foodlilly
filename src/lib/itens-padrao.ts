import "server-only";

import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { negocios } from "@/db/schema";
import { garantirNegocioQuery } from "@/lib/negocio-atual";

/** Colunas de `negocios` que marcam quando os itens padrão de cada cadastro foram criados. */
type MarcaPadrao = "equipamentosPadraoEm" | "funcionariosPadraoEm";

/**
 * Na primeira visita do negócio a um cadastro, cria os itens padrão. A data
 * fica marcada no negócio, então itens excluídos pelo cliente não voltam.
 */
export async function garantirItensPadrao(
  negocioId: string,
  marca: MarcaPadrao,
  inserir: () => Promise<unknown>,
) {
  const coluna = negocios[marca];
  const [, marcado] = await db.batch([
    garantirNegocioQuery(negocioId),
    db
      .update(negocios)
      .set({ [marca]: new Date() })
      .where(and(eq(negocios.id, negocioId), isNull(coluna)))
      .returning({ id: negocios.id }),
  ]);
  if (!marcado.length) return; // já criados antes (ou por outra requisição ao mesmo tempo)

  try {
    await inserir();
  } catch (erro) {
    // Desfaz a marcação para tentar de novo na próxima visita.
    await db.update(negocios).set({ [marca]: null }).where(eq(negocios.id, negocioId));
    throw erro;
  }
}
