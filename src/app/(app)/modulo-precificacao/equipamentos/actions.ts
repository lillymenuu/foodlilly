"use server";

import { and, count, eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { equipamentos } from "@/db/schema";
import { garantirNegocioQuery, obterNegocioAtualId } from "@/lib/negocio-atual";
import { errosPorCampo, type ResultadoSalvar } from "@/lib/validacao";

import { colunas } from "./dados";
import { LIMITES, type DadosEquipamento } from "./tipos";

const nome = z
  .string()
  .trim()
  .min(1, "Informe o nome do equipamento.")
  .max(LIMITES.nome, `Use no máximo ${LIMITES.nome} caracteres.`);

const esquema = z.discriminatedUnion("tipo", [
  z.object({
    nome,
    tipo: z.literal("eletrico"),
    valor: z
      .number({ error: "Informe a potência." })
      .positive("A potência deve ser maior que zero.")
      .max(LIMITES.potenciaW, "Máximo: 100.000 W."),
  }),
  z.object({
    nome,
    tipo: z.literal("gas"),
    valor: z
      .number({ error: "Informe a vazão." })
      .positive("A vazão deve ser maior que zero.")
      .max(LIMITES.vazaoKgH, "Máximo: 100 kg/h."),
  }),
]);

const id = z.uuid();

function invalido(erro: z.ZodError): ResultadoSalvar {
  return { ok: false, mensagem: "Confira os campos destacados.", erros: errosPorCampo(erro) };
}

const FALHA: ResultadoSalvar = { ok: false, mensagem: "Não foi possível salvar. Tente novamente." };
const NAO_ENCONTRADO: ResultadoSalvar = {
  ok: false,
  mensagem: "Equipamento não encontrado. Ele pode ter sido excluído.",
};

export async function criarEquipamento(dados: DadosEquipamento): Promise<ResultadoSalvar> {
  const negocioId = await obterNegocioAtualId();
  const validado = esquema.safeParse(dados);
  if (!validado.success) return invalido(validado.error);

  try {
    const [{ total }] = await db
      .select({ total: count() })
      .from(equipamentos)
      .where(eq(equipamentos.negocioId, negocioId));
    if (total >= LIMITES.equipamentosPorNegocio) {
      return { ok: false, mensagem: `Limite de ${LIMITES.equipamentosPorNegocio} equipamentos atingido.` };
    }
    await db.batch([
      garantirNegocioQuery(negocioId),
      db.insert(equipamentos).values({ negocioId, ...colunas(validado.data) }),
    ]);
  } catch (erro) {
    console.error("Erro ao criar equipamento", erro);
    return FALHA;
  }

  refresh();
  return { ok: true };
}

export async function editarEquipamento(
  equipamentoId: string,
  dados: DadosEquipamento,
): Promise<ResultadoSalvar> {
  const negocioId = await obterNegocioAtualId();
  if (!id.safeParse(equipamentoId).success) return NAO_ENCONTRADO;
  const validado = esquema.safeParse(dados);
  if (!validado.success) return invalido(validado.error);

  try {
    // Filtra também pelo negócio: ninguém edita equipamento de outro cliente.
    const alterados = await db
      .update(equipamentos)
      .set({ ...colunas(validado.data), atualizadoEm: new Date() })
      .where(and(eq(equipamentos.id, equipamentoId), eq(equipamentos.negocioId, negocioId)))
      .returning({ id: equipamentos.id });
    if (!alterados.length) return NAO_ENCONTRADO;
  } catch (erro) {
    console.error("Erro ao editar equipamento", erro);
    return FALHA;
  }

  refresh();
  return { ok: true };
}

export async function excluirEquipamento(equipamentoId: string): Promise<ResultadoSalvar> {
  const negocioId = await obterNegocioAtualId();
  if (!id.safeParse(equipamentoId).success) return NAO_ENCONTRADO;

  try {
    const excluidos = await db
      .delete(equipamentos)
      .where(and(eq(equipamentos.id, equipamentoId), eq(equipamentos.negocioId, negocioId)))
      .returning({ id: equipamentos.id });
    if (!excluidos.length) return NAO_ENCONTRADO;
  } catch (erro) {
    console.error("Erro ao excluir equipamento", erro);
    return { ok: false, mensagem: "Não foi possível excluir. Tente novamente." };
  }

  refresh();
  return { ok: true };
}
