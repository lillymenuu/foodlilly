"use server";

import { and, count, eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { fornecedores } from "@/db/schema";
import { documentoValido, telefoneValido } from "@/lib/cadastro";
import { obterNegocioAtualId } from "@/lib/negocio-atual";
import { errosPorCampo, type ResultadoSalvar } from "@/lib/validacao";

export type DadosFornecedor = {
  nome: string;
  telefone: string;
  documento: string;
  email: string;
  observacoes: string;
};

const LIMITE = 500;
const vazioParaNulo = (v: string) => (v.trim() ? v.trim() : null);

const esquema = z
  .object({
    nome: z
      .string()
      .trim()
      .min(1, "Informe o nome.")
      .max(100, "Use no máximo 100 caracteres."),
    telefone: z.string().transform((v) => v.replace(/\D/g, "")),
    documento: z
      .string()
      .transform((v) => v.toUpperCase().replace(/[^0-9A-Z]/g, "")),
    email: z.string().trim().toLowerCase(),
    observacoes: z.string().trim().max(500, "Use no máximo 500 caracteres."),
  })
  .superRefine((d, ctx) => {
    if (d.telefone && !telefoneValido(d.telefone, "BR"))
      ctx.addIssue({
        code: "custom",
        path: ["telefone"],
        message: "Telefone inválido.",
      });
    if (!documentoValido(d.documento))
      ctx.addIssue({
        code: "custom",
        path: ["documento"],
        message: "CPF ou CNPJ inválido.",
      });
    if (d.email && !z.email().safeParse(d.email).success)
      ctx.addIssue({
        code: "custom",
        path: ["email"],
        message: "E-mail inválido.",
      });
  });

const id = z.uuid();
const FALHA: ResultadoSalvar = {
  ok: false,
  mensagem: "Não foi possível salvar. Tente novamente.",
};
const NAO_ENCONTRADO: ResultadoSalvar = {
  ok: false,
  mensagem: "Fornecedor não encontrado. Ele pode ter sido excluído.",
};

function colunas(d: z.output<typeof esquema>) {
  return {
    nome: d.nome,
    telefone: d.telefone || null,
    documento: d.documento || null,
    email: vazioParaNulo(d.email),
    observacoes: vazioParaNulo(d.observacoes),
  };
}

export async function criarFornecedor(
  dados: DadosFornecedor,
): Promise<ResultadoSalvar> {
  const negocioId = await obterNegocioAtualId();
  const v = esquema.safeParse(dados);
  if (!v.success)
    return {
      ok: false,
      mensagem: "Confira os campos destacados.",
      erros: errosPorCampo(v.error),
    };
  try {
    const [{ total }] = await db
      .select({ total: count() })
      .from(fornecedores)
      .where(eq(fornecedores.negocioId, negocioId));
    if (total >= LIMITE)
      return {
        ok: false,
        mensagem: `Limite de ${LIMITE} fornecedores atingido.`,
      };
    await db.insert(fornecedores).values({ negocioId, ...colunas(v.data) });
  } catch (e) {
    console.error("Erro ao criar fornecedor", e);
    return FALHA;
  }
  refresh();
  return { ok: true };
}

export async function editarFornecedor(
  fornecedorId: string,
  dados: DadosFornecedor,
): Promise<ResultadoSalvar> {
  const negocioId = await obterNegocioAtualId();
  if (!id.safeParse(fornecedorId).success) return NAO_ENCONTRADO;
  const v = esquema.safeParse(dados);
  if (!v.success)
    return {
      ok: false,
      mensagem: "Confira os campos destacados.",
      erros: errosPorCampo(v.error),
    };
  try {
    const r = await db
      .update(fornecedores)
      .set({ ...colunas(v.data), atualizadoEm: new Date() })
      .where(
        and(
          eq(fornecedores.id, fornecedorId),
          eq(fornecedores.negocioId, negocioId),
        ),
      )
      .returning({ id: fornecedores.id });
    if (!r.length) return NAO_ENCONTRADO;
  } catch (e) {
    console.error("Erro ao editar fornecedor", e);
    return FALHA;
  }
  refresh();
  return { ok: true };
}

export async function excluirFornecedor(
  fornecedorId: string,
): Promise<ResultadoSalvar> {
  const negocioId = await obterNegocioAtualId();
  if (!id.safeParse(fornecedorId).success) return NAO_ENCONTRADO;
  try {
    const r = await db
      .delete(fornecedores)
      .where(
        and(
          eq(fornecedores.id, fornecedorId),
          eq(fornecedores.negocioId, negocioId),
        ),
      )
      .returning({ id: fornecedores.id });
    if (!r.length) return NAO_ENCONTRADO;
  } catch (e) {
    console.error("Erro ao excluir fornecedor", e);
    return {
      ok: false,
      mensagem: "Não foi possível excluir. Tente novamente.",
    };
  }
  refresh();
  return { ok: true };
}
