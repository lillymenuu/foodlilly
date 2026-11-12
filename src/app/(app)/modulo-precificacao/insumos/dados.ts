import "server-only";

import { asc, count, eq } from "drizzle-orm";

import { db } from "@/db";
import { categoriasInsumo, insumos } from "@/db/schema";
import { garantirItensPadrao } from "@/lib/itens-padrao";

import { CATEGORIAS_PADRAO, type Categoria, type Insumo } from "./tipos";

/** Na primeira visita do negócio, cria as categorias padrão (uma única vez). */
export function garantirCategoriasPadrao(negocioId: string) {
  return garantirItensPadrao(negocioId, "categoriasInsumoPadraoEm", () =>
    db
      .insert(categoriasInsumo)
      .values(CATEGORIAS_PADRAO.map((c) => ({ negocioId, nome: c.nome, sistema: c.sistema ?? false })))
      .onConflictDoNothing(),
  );
}

export async function listarCategorias(negocioId: string): Promise<Categoria[]> {
  const linhas = await db
    .select({
      id: categoriasInsumo.id,
      nome: categoriasInsumo.nome,
      sistema: categoriasInsumo.sistema,
      insumos: count(insumos.id),
    })
    .from(categoriasInsumo)
    .leftJoin(insumos, eq(insumos.categoriaId, categoriasInsumo.id))
    .where(eq(categoriasInsumo.negocioId, negocioId))
    .groupBy(categoriasInsumo.id)
    .orderBy(asc(categoriasInsumo.nome));
  return linhas;
}

export async function listarInsumos(negocioId: string): Promise<Insumo[]> {
  const linhas = await db
    .select()
    .from(insumos)
    .where(eq(insumos.negocioId, negocioId))
    .orderBy(asc(insumos.criadoEm));

  return linhas.map((l) => ({
    id: l.id,
    nome: l.nome,
    categoriaId: l.categoriaId,
    codigoBarras: l.codigoBarras,
    volume: l.volume,
    unidade: l.unidade,
    custo: l.custo,
    perda: l.perda,
    criadoEm: l.criadoEm.toISOString(),
  }));
}
