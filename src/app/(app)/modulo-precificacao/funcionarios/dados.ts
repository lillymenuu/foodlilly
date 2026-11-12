import "server-only";

import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { funcionarios } from "@/db/schema";
import { garantirItensPadrao } from "@/lib/itens-padrao";

import { FUNCIONARIOS_PADRAO, type Funcionario } from "./tipos";

/** Na primeira visita do negócio, cria os funcionários padrão (uma única vez). */
export function garantirFuncionariosPadrao(negocioId: string) {
  return garantirItensPadrao(negocioId, "funcionariosPadraoEm", () =>
    db.insert(funcionarios).values(FUNCIONARIOS_PADRAO.map((f) => ({ negocioId, ...f }))),
  );
}

export async function listarFuncionarios(negocioId: string): Promise<Funcionario[]> {
  const linhas = await db
    .select()
    .from(funcionarios)
    .where(eq(funcionarios.negocioId, negocioId))
    .orderBy(asc(funcionarios.criadoEm), asc(funcionarios.nome));

  return linhas.map((l) => ({
    id: l.id,
    nome: l.nome,
    salario: l.salario,
    criadoEm: l.criadoEm.toISOString(),
  }));
}
