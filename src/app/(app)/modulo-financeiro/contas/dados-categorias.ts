import "server-only";

import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { categoriasFinanceiras, negocios } from "@/db/schema";

import { PADRAO, principalPorChave } from "./catalogo-categorias";
import type { CategoriaFinanceira } from "./tipos";

/**
 * Cria Vendas → Revendas na primeira vez (quando o negócio já tem conta). A data fica no
 * negócio para não recriar o que o cliente excluiu.
 */
export async function garantirCategoriasPadrao(negocioId: string) {
  const [n] = await db
    .select({ em: negocios.categoriasFinanceirasPadraoEm })
    .from(negocios)
    .where(eq(negocios.id, negocioId));
  if (!n || n.em) return;
  const info = principalPorChave(PADRAO.chave)!;
  let [principal] = await db
    .select({ id: categoriasFinanceiras.id })
    .from(categoriasFinanceiras)
    .where(
      and(
        eq(categoriasFinanceiras.negocioId, negocioId),
        eq(categoriasFinanceiras.chave, PADRAO.chave),
      ),
    );
  if (!principal) {
    [principal] = await db
      .insert(categoriasFinanceiras)
      .values({
        negocioId,
        grupo: info.grupo,
        nome: info.nome,
        chave: info.chave,
      })
      .onConflictDoNothing()
      .returning({ id: categoriasFinanceiras.id });
  }
  const marcar = db
    .update(negocios)
    .set({ categoriasFinanceirasPadraoEm: new Date() })
    .where(eq(negocios.id, negocioId));
  if (!principal) return void (await marcar);
  await db.batch([
    db
      .insert(categoriasFinanceiras)
      .values(
        PADRAO.subcategorias.map((nome) => ({
          negocioId,
          grupo: info.grupo,
          nome,
          paiId: principal.id,
        })),
      )
      .onConflictDoNothing(),
    marcar,
  ]);
}

export async function listarCategorias(
  negocioId: string,
): Promise<CategoriaFinanceira[]> {
  const linhas = await db
    .select({
      id: categoriasFinanceiras.id,
      grupo: categoriasFinanceiras.grupo,
      nome: categoriasFinanceiras.nome,
      chave: categoriasFinanceiras.chave,
      paiId: categoriasFinanceiras.paiId,
    })
    .from(categoriasFinanceiras)
    .where(eq(categoriasFinanceiras.negocioId, negocioId))
    .orderBy(asc(categoriasFinanceiras.criadoEm));
  return linhas;
}
