import "server-only";

import { and, asc, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { equipamentos, negocios } from "@/db/schema";
import { garantirNegocioQuery } from "@/lib/negocio-atual";

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

/**
 * Na primeira visita do negócio, cria os equipamentos padrão. A data fica
 * marcada no negócio, então equipamentos excluídos pelo cliente não voltam.
 */
export async function garantirEquipamentosPadrao(negocioId: string) {
  const [, marcado] = await db.batch([
    garantirNegocioQuery(negocioId),
    db
      .update(negocios)
      .set({ equipamentosPadraoEm: new Date() })
      .where(and(eq(negocios.id, negocioId), isNull(negocios.equipamentosPadraoEm)))
      .returning({ id: negocios.id }),
  ]);
  if (!marcado.length) return; // já criados antes (ou por outra requisição ao mesmo tempo)

  try {
    await db.insert(equipamentos).values(EQUIPAMENTOS_PADRAO.map((e) => ({ negocioId, ...colunas(e) })));
  } catch (erro) {
    // Desfaz a marcação para tentar de novo na próxima visita.
    await db.update(negocios).set({ equipamentosPadraoEm: null }).where(eq(negocios.id, negocioId));
    throw erro;
  }
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
