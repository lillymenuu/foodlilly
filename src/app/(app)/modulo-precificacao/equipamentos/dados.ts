import "server-only";

import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { equipamentos } from "@/db/schema";
import { garantirItensPadrao } from "@/lib/itens-padrao";

import { EQUIPAMENTOS_PADRAO, type DadosEquipamento, type Equipamento } from "./tipos";

/** Converte os dados do formulário nas colunas da tabela. */
export function colunas(dados: DadosEquipamento) {
  return {
    nome: dados.nome,
    tipo: dados.tipo,
    potenciaW: dados.tipo === "eletrico" ? dados.valor : null,
    vazaoKgH: dados.tipo === "gas" ? dados.valor : null,
  };
}

/** Na primeira visita do negócio, cria os equipamentos padrão (uma única vez). */
export function garantirEquipamentosPadrao(negocioId: string) {
  return garantirItensPadrao(negocioId, "equipamentosPadraoEm", () =>
    db.insert(equipamentos).values(EQUIPAMENTOS_PADRAO.map((e) => ({ negocioId, ...colunas(e) }))),
  );
}

export async function listarEquipamentos(negocioId: string): Promise<Equipamento[]> {
  const linhas = await db
    .select()
    .from(equipamentos)
    .where(eq(equipamentos.negocioId, negocioId))
    .orderBy(asc(equipamentos.criadoEm), asc(equipamentos.nome));

  return linhas.map((l) => ({
    id: l.id,
    nome: l.nome,
    tipo: l.tipo,
    potenciaW: l.potenciaW,
    vazaoKgH: l.vazaoKgH,
    criadoEm: l.criadoEm.toISOString(),
  }));
}
