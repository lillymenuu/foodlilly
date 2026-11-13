"use server";

import { and, eq, gte, ilike, sql } from "drizzle-orm";
import { refresh } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import {
  categoriasFinanceiras,
  contasBancarias,
  FORMAS_PAGAMENTO,
  fornecedores,
  GRUPOS_FINANCEIROS,
  lancamentos,
} from "@/db/schema";
import { obterNegocioAtualId } from "@/lib/negocio-atual";
import { errosPorCampo, type ResultadoSalvar } from "@/lib/validacao";

import {
  LIMITES_CATEGORIA,
  principalPorChave,
} from "../contas/catalogo-categorias";
import { LIMITES_LANCAMENTO, somarMeses, type DadosLancamento } from "./tipos";

const id = z.uuid();
const esquema = z
  .object({
    grupo: z.enum(GRUPOS_FINANCEIROS),
    contaId: z.uuid({ error: "Escolha a conta." }),
    data: z.iso.date({ error: "Informe a data." }),
    valor: z
      .number({ error: "Informe o valor." })
      .positive("O valor deve ser maior que zero.")
      .max(LIMITES_LANCAMENTO.valor, "Valor muito alto."),
    pessoa: z
      .string()
      .trim()
      .max(LIMITES_LANCAMENTO.pessoa, "Nome muito longo."),
    formaPagamento: z.enum([...FORMAS_PAGAMENTO, ""]),
    descricao: z
      .string()
      .trim()
      .max(
        LIMITES_LANCAMENTO.descricao,
        `Use no máximo ${LIMITES_LANCAMENTO.descricao} caracteres.`,
      ),
    principalChave: z.string().min(1, "Escolha a categoria."),
    subcategoriaId: z.string(),
    subcategoriaNome: z
      .string()
      .trim()
      .max(LIMITES_CATEGORIA.nome, "Nome muito longo."),
    pago: z.boolean(),
    repeticao: z
      .object({
        tipo: z.enum(["parcela", "recorrente"]),
        vezes: z
          .int()
          .min(2, "Mínimo de 2.")
          .max(
            LIMITES_LANCAMENTO.vezes,
            `Máximo de ${LIMITES_LANCAMENTO.vezes}.`,
          ),
      })
      .optional(),
  })
  .superRefine((d, ctx) => {
    const p = principalPorChave(d.principalChave);
    if (!p || p.grupo !== d.grupo)
      ctx.addIssue({
        code: "custom",
        path: ["principalChave"],
        message: "Escolha a categoria.",
      });
    if (!d.subcategoriaId && !d.subcategoriaNome)
      ctx.addIssue({
        code: "custom",
        path: ["subcategoria"],
        message: "Escolha a subcategoria.",
      });
  });

const FALHA: ResultadoSalvar = {
  ok: false,
  mensagem: "Não foi possível salvar. Tente novamente.",
};
const NAO_ENCONTRADO: ResultadoSalvar = {
  ok: false,
  mensagem: "Lançamento não encontrado. Ele pode ter sido excluído.",
};

/**
 * Confere a conta, garante a categoria principal e a subcategoria (criando as que vieram
 * das sugestões ou foram digitadas) e acha o fornecedor pelo nome.
 */
async function resolver(negocioId: string, d: z.output<typeof esquema>) {
  const [conta] = await db
    .select({ id: contasBancarias.id })
    .from(contasBancarias)
    .where(
      and(
        eq(contasBancarias.id, d.contaId),
        eq(contasBancarias.negocioId, negocioId),
      ),
    );
  if (!conta)
    return {
      erro: {
        ok: false,
        mensagem: "Conta não encontrada.",
        erros: { contaId: "Escolha a conta." },
      } as ResultadoSalvar,
    };

  const info = principalPorChave(d.principalChave)!;
  let [principal] = await db
    .select({ id: categoriasFinanceiras.id })
    .from(categoriasFinanceiras)
    .where(
      and(
        eq(categoriasFinanceiras.negocioId, negocioId),
        eq(categoriasFinanceiras.chave, info.chave),
      ),
    );
  if (!principal) {
    await db
      .insert(categoriasFinanceiras)
      .values({
        negocioId,
        grupo: info.grupo,
        nome: info.nome,
        chave: info.chave,
      })
      .onConflictDoNothing();
    [principal] = await db
      .select({ id: categoriasFinanceiras.id })
      .from(categoriasFinanceiras)
      .where(
        and(
          eq(categoriasFinanceiras.negocioId, negocioId),
          eq(categoriasFinanceiras.chave, info.chave),
        ),
      );
  }

  let subId: string | undefined;
  if (d.subcategoriaId && id.safeParse(d.subcategoriaId).success) {
    const [s] = await db
      .select({ id: categoriasFinanceiras.id })
      .from(categoriasFinanceiras)
      .where(
        and(
          eq(categoriasFinanceiras.id, d.subcategoriaId),
          eq(categoriasFinanceiras.negocioId, negocioId),
          eq(categoriasFinanceiras.paiId, principal.id),
        ),
      );
    subId = s?.id;
  }
  if (!subId && d.subcategoriaNome) {
    await db
      .insert(categoriasFinanceiras)
      .values({
        negocioId,
        grupo: info.grupo,
        nome: d.subcategoriaNome,
        paiId: principal.id,
      })
      .onConflictDoNothing();
    const [s] = await db
      .select({ id: categoriasFinanceiras.id })
      .from(categoriasFinanceiras)
      .where(
        and(
          eq(categoriasFinanceiras.paiId, principal.id),
          sql`lower(${categoriasFinanceiras.nome}) = lower(${d.subcategoriaNome})`,
        ),
      );
    subId = s?.id;
  }
  if (!subId)
    return {
      erro: {
        ok: false,
        mensagem: "Escolha a subcategoria.",
        erros: { subcategoria: "Escolha a subcategoria." },
      } as ResultadoSalvar,
    };

  let fornecedorId: string | null = null;
  if (d.pessoa) {
    const [f] = await db
      .select({ id: fornecedores.id })
      .from(fornecedores)
      .where(
        and(
          eq(fornecedores.negocioId, negocioId),
          ilike(fornecedores.nome, d.pessoa.replace(/[%_\\]/g, "\\$&")),
        ),
      )
      .limit(1);
    fornecedorId = f?.id ?? null;
  }
  return {
    colunas: {
      contaId: conta.id,
      grupo: d.grupo,
      categoriaId: subId,
      valor: d.valor,
      descricao: d.descricao || null,
      fornecedorId,
      pessoaNome: fornecedorId ? null : d.pessoa || null,
      formaPagamento: d.formaPagamento || null,
    },
  };
}

export async function criarLancamento(
  dados: DadosLancamento,
): Promise<ResultadoSalvar & { quantidade?: number }> {
  const negocioId = await obterNegocioAtualId();
  const v = esquema.safeParse(dados);
  if (!v.success)
    return {
      ok: false,
      mensagem: "Confira os campos destacados.",
      erros: errosPorCampo(v.error),
    };
  try {
    const r = await resolver(negocioId, v.data);
    if ("erro" in r) return r.erro!;
    const rep = v.data.repeticao;
    let linhas;
    if (!rep) {
      linhas = [
        { ...r.colunas, negocioId, data: v.data.data, pago: v.data.pago },
      ];
    } else {
      const serieId = crypto.randomUUID();
      // Parcelas dividem o total (a diferença dos centavos vai na primeira); recorrência repete o valor.
      const centavos = Math.round(v.data.valor * 100);
      const parcela = Math.floor(centavos / rep.vezes);
      linhas = Array.from({ length: rep.vezes }, (_, i) => ({
        ...r.colunas,
        negocioId,
        data: somarMeses(v.data.data, i),
        valor:
          rep.tipo === "parcela"
            ? (parcela + (i === 0 ? centavos - parcela * rep.vezes : 0)) / 100
            : v.data.valor,
        pago: i === 0 && v.data.pago,
        serieId,
        serieTipo: rep.tipo,
        serieNumero: i + 1,
        serieTotal: rep.vezes,
      }));
    }
    await db.insert(lancamentos).values(linhas);
    refresh();
    return { ok: true, quantidade: linhas.length };
  } catch (e) {
    console.error("Erro ao criar lançamento", e);
    return FALHA;
  }
}

export async function editarLancamento(
  lancamentoId: string,
  dados: DadosLancamento,
): Promise<ResultadoSalvar> {
  const negocioId = await obterNegocioAtualId();
  if (!id.safeParse(lancamentoId).success) return NAO_ENCONTRADO;
  const v = esquema.safeParse({ ...dados, repeticao: undefined });
  if (!v.success)
    return {
      ok: false,
      mensagem: "Confira os campos destacados.",
      erros: errosPorCampo(v.error),
    };
  try {
    const r = await resolver(negocioId, v.data);
    if ("erro" in r) return r.erro!;
    const alterados = await db
      .update(lancamentos)
      .set({
        ...r.colunas,
        data: v.data.data,
        pago: v.data.pago,
        atualizadoEm: new Date(),
      })
      .where(
        and(
          eq(lancamentos.id, lancamentoId),
          eq(lancamentos.negocioId, negocioId),
        ),
      )
      .returning({ id: lancamentos.id });
    if (!alterados.length) return NAO_ENCONTRADO;
  } catch (e) {
    console.error("Erro ao editar lançamento", e);
    return FALHA;
  }
  refresh();
  return { ok: true };
}

export async function alternarPago(
  lancamentoId: string,
  pago: boolean,
): Promise<ResultadoSalvar> {
  const negocioId = await obterNegocioAtualId();
  if (!id.safeParse(lancamentoId).success) return NAO_ENCONTRADO;
  const r = await db
    .update(lancamentos)
    .set({ pago, atualizadoEm: new Date() })
    .where(
      and(
        eq(lancamentos.id, lancamentoId),
        eq(lancamentos.negocioId, negocioId),
      ),
    )
    .returning({ id: lancamentos.id });
  if (!r.length) return NAO_ENCONTRADO;
  refresh();
  return { ok: true };
}

/** Exclui o lançamento; com `seguintes`, também os próximos da mesma série que ainda não foram pagos. */
export async function excluirLancamento(
  lancamentoId: string,
  seguintes = false,
): Promise<ResultadoSalvar> {
  const negocioId = await obterNegocioAtualId();
  if (!id.safeParse(lancamentoId).success) return NAO_ENCONTRADO;
  try {
    const [l] = await db
      .select({ serieId: lancamentos.serieId, data: lancamentos.data })
      .from(lancamentos)
      .where(
        and(
          eq(lancamentos.id, lancamentoId),
          eq(lancamentos.negocioId, negocioId),
        ),
      );
    if (!l) return NAO_ENCONTRADO;
    if (seguintes && l.serieId) {
      await db.batch([
        db
          .delete(lancamentos)
          .where(
            and(
              eq(lancamentos.id, lancamentoId),
              eq(lancamentos.negocioId, negocioId),
            ),
          ),
        db
          .delete(lancamentos)
          .where(
            and(
              eq(lancamentos.negocioId, negocioId),
              eq(lancamentos.serieId, l.serieId),
              gte(lancamentos.data, l.data),
              eq(lancamentos.pago, false),
            ),
          ),
      ]);
    } else {
      await db
        .delete(lancamentos)
        .where(
          and(
            eq(lancamentos.id, lancamentoId),
            eq(lancamentos.negocioId, negocioId),
          ),
        );
    }
  } catch (e) {
    console.error("Erro ao excluir lançamento", e);
    return {
      ok: false,
      mensagem: "Não foi possível excluir. Tente novamente.",
    };
  }
  refresh();
  return { ok: true };
}
