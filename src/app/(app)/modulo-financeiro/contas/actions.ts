"use server";

import { and, asc, count, eq, ne } from "drizzle-orm";
import { refresh } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { contasBancarias, CORES_CONTA, TIPOS_CONTA } from "@/db/schema";
import { obterNegocioAtualId } from "@/lib/negocio-atual";
import { errosPorCampo, type ResultadoSalvar } from "@/lib/validacao";

import { LIMITES, type DadosConta } from "./tipos";

const esquema = z.object({
  nome: z
    .string()
    .trim()
    .min(1, "Informe o nome da conta.")
    .max(LIMITES.nome, `Use no máximo ${LIMITES.nome} caracteres.`),
  tipo: z.enum(TIPOS_CONTA, { error: "Escolha o tipo de conta." }),
  saldoInicial: z
    .number({ error: "Informe o saldo inicial." })
    .min(-LIMITES.saldo, "Valor muito alto.")
    .max(LIMITES.saldo, "Valor muito alto."),
  dataSaldoInicial: z.iso.date({ error: "Informe a data do saldo inicial." }),
  padrao: z.boolean(),
  cor: z.enum(CORES_CONTA),
});

const id = z.uuid();
const FALHA: ResultadoSalvar = {
  ok: false,
  mensagem: "Não foi possível salvar. Tente novamente.",
};
const NAO_ENCONTRADA: ResultadoSalvar = {
  ok: false,
  mensagem: "Conta não encontrada. Ela pode ter sido excluída.",
};

function invalido(erro: z.ZodError): ResultadoSalvar {
  return {
    ok: false,
    mensagem: "Confira os campos destacados.",
    erros: errosPorCampo(erro),
  };
}

/** Tira a marca de padrão das outras contas do negócio. */
const tirarPadrao = (negocioId: string, exceto?: string) =>
  db
    .update(contasBancarias)
    .set({ padrao: false })
    .where(
      and(
        eq(contasBancarias.negocioId, negocioId),
        eq(contasBancarias.padrao, true),
        ...(exceto ? [ne(contasBancarias.id, exceto)] : []),
      ),
    );

export async function criarConta(dados: DadosConta): Promise<ResultadoSalvar> {
  const negocioId = await obterNegocioAtualId();
  const v = esquema.safeParse(dados);
  if (!v.success) return invalido(v.error);
  try {
    const [{ total }] = await db
      .select({ total: count() })
      .from(contasBancarias)
      .where(eq(contasBancarias.negocioId, negocioId));
    if (total >= LIMITES.contasPorNegocio)
      return {
        ok: false,
        mensagem: `Limite de ${LIMITES.contasPorNegocio} contas atingido.`,
      };
    // A primeira conta é sempre a padrão.
    const padrao = v.data.padrao || total === 0;
    if (padrao) {
      await db.batch([
        tirarPadrao(negocioId),
        db
          .insert(contasBancarias)
          .values({ negocioId, ...v.data, padrao: true }),
      ]);
    } else {
      await db
        .insert(contasBancarias)
        .values({ negocioId, ...v.data, padrao: false });
    }
  } catch (e) {
    console.error("Erro ao criar conta", e);
    return FALHA;
  }
  refresh();
  return { ok: true };
}

export async function editarConta(
  contaId: string,
  dados: DadosConta,
): Promise<ResultadoSalvar> {
  const negocioId = await obterNegocioAtualId();
  if (!id.safeParse(contaId).success) return NAO_ENCONTRADA;
  const v = esquema.safeParse(dados);
  if (!v.success) return invalido(v.error);
  try {
    const [atual] = await db
      .select({ padrao: contasBancarias.padrao })
      .from(contasBancarias)
      .where(
        and(
          eq(contasBancarias.id, contaId),
          eq(contasBancarias.negocioId, negocioId),
        ),
      );
    if (!atual) return NAO_ENCONTRADA;
    // A conta padrão só deixa de ser padrão quando outra for marcada.
    const padrao = atual.padrao || v.data.padrao;
    const atualizar = db
      .update(contasBancarias)
      .set({ ...v.data, padrao, atualizadoEm: new Date() })
      .where(
        and(
          eq(contasBancarias.id, contaId),
          eq(contasBancarias.negocioId, negocioId),
        ),
      );
    if (padrao && !atual.padrao)
      await db.batch([tirarPadrao(negocioId, contaId), atualizar]);
    else await atualizar;
  } catch (e) {
    console.error("Erro ao editar conta", e);
    return FALHA;
  }
  refresh();
  return { ok: true };
}

export async function definirContaPadrao(
  contaId: string,
): Promise<ResultadoSalvar> {
  const negocioId = await obterNegocioAtualId();
  if (!id.safeParse(contaId).success) return NAO_ENCONTRADA;
  try {
    const [r] = await db.batch([
      db
        .select({ id: contasBancarias.id })
        .from(contasBancarias)
        .where(
          and(
            eq(contasBancarias.id, contaId),
            eq(contasBancarias.negocioId, negocioId),
          ),
        ),
      tirarPadrao(negocioId, contaId),
      db
        .update(contasBancarias)
        .set({ padrao: true })
        .where(
          and(
            eq(contasBancarias.id, contaId),
            eq(contasBancarias.negocioId, negocioId),
          ),
        ),
    ]);
    if (!r.length) return NAO_ENCONTRADA;
  } catch (e) {
    console.error("Erro ao definir conta padrão", e);
    return FALHA;
  }
  refresh();
  return { ok: true };
}

export async function excluirConta(contaId: string): Promise<ResultadoSalvar> {
  const negocioId = await obterNegocioAtualId();
  if (!id.safeParse(contaId).success) return NAO_ENCONTRADA;
  try {
    const excluidas = await db
      .delete(contasBancarias)
      .where(
        and(
          eq(contasBancarias.id, contaId),
          eq(contasBancarias.negocioId, negocioId),
        ),
      )
      .returning({ padrao: contasBancarias.padrao });
    if (!excluidas.length) return NAO_ENCONTRADA;
    // Excluiu a padrão: a mais antiga que sobrou passa a ser a padrão.
    if (excluidas[0].padrao) {
      const [proxima] = await db
        .select({ id: contasBancarias.id })
        .from(contasBancarias)
        .where(eq(contasBancarias.negocioId, negocioId))
        .orderBy(asc(contasBancarias.criadoEm))
        .limit(1);
      if (proxima)
        await db
          .update(contasBancarias)
          .set({ padrao: true })
          .where(eq(contasBancarias.id, proxima.id));
    }
  } catch (e) {
    console.error("Erro ao excluir conta", e);
    return {
      ok: false,
      mensagem: "Não foi possível excluir. Tente novamente.",
    };
  }
  refresh();
  return { ok: true };
}
