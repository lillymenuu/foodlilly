"use server";

import { and, count, eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { funcionarios } from "@/db/schema";
import { garantirNegocioQuery, obterNegocioAtualId } from "@/lib/negocio-atual";
import { errosPorCampo, type ResultadoSalvar } from "@/lib/validacao";

import { LIMITES, type DadosFuncionario } from "./tipos";

const esquema = z.object({
  nome: z
    .string()
    .trim()
    .min(1, "Informe o nome ou a função.")
    .max(LIMITES.nome, `Use no máximo ${LIMITES.nome} caracteres.`),
  salario: z
    .number({ error: "Informe o salário." })
    .positive("O salário deve ser maior que zero.")
    .max(LIMITES.salario, "Valor muito alto."),
});

const id = z.uuid();

const FALHA: ResultadoSalvar = { ok: false, mensagem: "Não foi possível salvar. Tente novamente." };
const NAO_ENCONTRADO: ResultadoSalvar = {
  ok: false,
  mensagem: "Funcionário não encontrado. Ele pode ter sido excluído.",
};

function invalido(erro: z.ZodError): ResultadoSalvar {
  return { ok: false, mensagem: "Confira os campos destacados.", erros: errosPorCampo(erro) };
}

export async function criarFuncionario(dados: DadosFuncionario): Promise<ResultadoSalvar> {
  const negocioId = await obterNegocioAtualId();
  const validado = esquema.safeParse(dados);
  if (!validado.success) return invalido(validado.error);

  try {
    const [{ total }] = await db
      .select({ total: count() })
      .from(funcionarios)
      .where(eq(funcionarios.negocioId, negocioId));
    if (total >= LIMITES.funcionariosPorNegocio) {
      return { ok: false, mensagem: `Limite de ${LIMITES.funcionariosPorNegocio} funcionários atingido.` };
    }
    await db.batch([
      garantirNegocioQuery(negocioId),
      db.insert(funcionarios).values({ negocioId, ...validado.data }),
    ]);
  } catch (erro) {
    console.error("Erro ao criar funcionário", erro);
    return FALHA;
  }

  refresh();
  return { ok: true };
}

export async function editarFuncionario(
  funcionarioId: string,
  dados: DadosFuncionario,
): Promise<ResultadoSalvar> {
  const negocioId = await obterNegocioAtualId();
  if (!id.safeParse(funcionarioId).success) return NAO_ENCONTRADO;
  const validado = esquema.safeParse(dados);
  if (!validado.success) return invalido(validado.error);

  try {
    // Filtra também pelo negócio: ninguém edita funcionário de outro cliente.
    const alterados = await db
      .update(funcionarios)
      .set({ ...validado.data, atualizadoEm: new Date() })
      .where(and(eq(funcionarios.id, funcionarioId), eq(funcionarios.negocioId, negocioId)))
      .returning({ id: funcionarios.id });
    if (!alterados.length) return NAO_ENCONTRADO;
  } catch (erro) {
    console.error("Erro ao editar funcionário", erro);
    return FALHA;
  }

  refresh();
  return { ok: true };
}

export async function excluirFuncionario(funcionarioId: string): Promise<ResultadoSalvar> {
  const negocioId = await obterNegocioAtualId();
  if (!id.safeParse(funcionarioId).success) return NAO_ENCONTRADO;

  try {
    const excluidos = await db
      .delete(funcionarios)
      .where(and(eq(funcionarios.id, funcionarioId), eq(funcionarios.negocioId, negocioId)))
      .returning({ id: funcionarios.id });
    if (!excluidos.length) return NAO_ENCONTRADO;
  } catch (erro) {
    console.error("Erro ao excluir funcionário", erro);
    return { ok: false, mensagem: "Não foi possível excluir. Tente novamente." };
  }

  refresh();
  return { ok: true };
}
