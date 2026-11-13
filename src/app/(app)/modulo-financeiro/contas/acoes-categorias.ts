"use server";

import { and, count, eq, isNotNull, isNull, or } from "drizzle-orm";
import { refresh } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { categoriasFinanceiras, lancamentos } from "@/db/schema";
import { obterNegocioAtualId } from "@/lib/negocio-atual";
import type { ResultadoSalvar } from "@/lib/validacao";

import {
  CATALOGO,
  GRUPOS_FINANCEIROS,
  LIMITES_CATEGORIA,
} from "./catalogo-categorias";

const id = z.uuid();
const nome = z
  .string()
  .trim()
  .min(1, "Informe o nome.")
  .max(
    LIMITES_CATEGORIA.nome,
    `Use no máximo ${LIMITES_CATEGORIA.nome} caracteres.`,
  );
const FALHA: ResultadoSalvar = {
  ok: false,
  mensagem: "Não foi possível salvar. Tente novamente.",
};
const NAO_ENCONTRADA: ResultadoSalvar = {
  ok: false,
  mensagem: "Categoria não encontrada. Ela pode ter sido excluída.",
};
const JA_EXISTE: ResultadoSalvar = {
  ok: false,
  mensagem: "Já existe uma subcategoria com esse nome.",
  erros: { nome: "Já existe uma subcategoria com esse nome." },
};

const duplicado = (e: unknown) =>
  (e as { cause?: { code?: string } })?.cause?.code === "23505" ||
  (e as { code?: string })?.code === "23505";

const esquemaSugestoes = z.object({
  grupo: z.enum(GRUPOS_FINANCEIROS),
  principais: z.array(z.string()).max(50),
  subcategorias: z
    .array(z.object({ chave: z.string(), nome: z.string() }))
    .max(200),
});

/** Adiciona categorias principais e subcategorias escolhidas nas Sugestões. */
export async function adicionarSugestoes(
  dados: z.input<typeof esquemaSugestoes>,
): Promise<ResultadoSalvar & { adicionadas?: number }> {
  const negocioId = await obterNegocioAtualId();
  const v = esquemaSugestoes.safeParse(dados);
  if (!v.success) return { ok: false, mensagem: "Seleção inválida." };
  const { grupo } = v.data;
  // Só vale o que está no catálogo deste grupo.
  const doGrupo = new Map(
    CATALOGO.filter((p) => p.grupo === grupo).map((p) => [p.chave, p]),
  );
  const subs = v.data.subcategorias.filter((s) =>
    doGrupo.get(s.chave)?.sugestoes.includes(s.nome),
  );
  const chaves = new Set([
    ...v.data.principais.filter((c) => doGrupo.has(c)),
    ...subs.map((s) => s.chave),
  ]);
  if (!chaves.size)
    return { ok: false, mensagem: "Selecione pelo menos uma categoria." };

  try {
    const existentes = await db
      .select({
        id: categoriasFinanceiras.id,
        chave: categoriasFinanceiras.chave,
      })
      .from(categoriasFinanceiras)
      .where(
        and(
          eq(categoriasFinanceiras.negocioId, negocioId),
          isNotNull(categoriasFinanceiras.chave),
        ),
      );
    const idPorChave = new Map(existentes.map((e) => [e.chave!, e.id]));
    const novasPrincipais = [...chaves]
      .filter((c) => !idPorChave.has(c))
      .map((c) => ({ id: crypto.randomUUID(), chave: c }));
    for (const p of novasPrincipais) idPorChave.set(p.chave, p.id);

    const inserirPrincipais = db
      .insert(categoriasFinanceiras)
      .values(
        novasPrincipais.map((p) => ({
          id: p.id,
          negocioId,
          grupo,
          nome: doGrupo.get(p.chave)!.nome,
          chave: p.chave,
        })),
      )
      .onConflictDoNothing();
    const inserirSubs = db
      .insert(categoriasFinanceiras)
      .values(
        subs.map((s) => ({
          negocioId,
          grupo,
          nome: s.nome,
          paiId: idPorChave.get(s.chave)!,
        })),
      )
      .onConflictDoNothing()
      .returning({ id: categoriasFinanceiras.id });
    let subsCriadas = 0;
    // Principais e subcategorias juntas (db.batch): se uma parte falhar, nada é gravado.
    if (novasPrincipais.length && subs.length)
      subsCriadas = (await db.batch([inserirPrincipais, inserirSubs]))[1]
        .length;
    else if (novasPrincipais.length) await inserirPrincipais;
    else subsCriadas = (await inserirSubs).length;
    refresh();
    return { ok: true, adicionadas: novasPrincipais.length + subsCriadas };
  } catch (e) {
    console.error("Erro ao adicionar sugestões", e);
    return FALHA;
  }
}

/** Nova subcategoria dentro de uma principal do negócio. */
export async function criarSubcategoria(
  principalId: string,
  texto: string,
): Promise<ResultadoSalvar> {
  const negocioId = await obterNegocioAtualId();
  if (!id.safeParse(principalId).success) return NAO_ENCONTRADA;
  const n = nome.safeParse(texto);
  if (!n.success)
    return {
      ok: false,
      mensagem: n.error.issues[0].message,
      erros: { nome: n.error.issues[0].message },
    };
  try {
    const [pai] = await db
      .select({ grupo: categoriasFinanceiras.grupo })
      .from(categoriasFinanceiras)
      .where(
        and(
          eq(categoriasFinanceiras.id, principalId),
          eq(categoriasFinanceiras.negocioId, negocioId),
          isNull(categoriasFinanceiras.paiId),
        ),
      );
    if (!pai) return NAO_ENCONTRADA;
    const [{ total }] = await db
      .select({ total: count() })
      .from(categoriasFinanceiras)
      .where(eq(categoriasFinanceiras.paiId, principalId));
    if (total >= LIMITES_CATEGORIA.subPorPrincipal)
      return {
        ok: false,
        mensagem: `Limite de ${LIMITES_CATEGORIA.subPorPrincipal} subcategorias atingido.`,
      };
    await db.insert(categoriasFinanceiras).values({
      negocioId,
      grupo: pai.grupo,
      nome: n.data,
      paiId: principalId,
    });
  } catch (e) {
    if (duplicado(e)) return JA_EXISTE;
    console.error("Erro ao criar subcategoria", e);
    return FALHA;
  }
  refresh();
  return { ok: true };
}

/** Renomeia uma subcategoria (as principais são fixas). */
export async function renomearSubcategoria(
  subId: string,
  texto: string,
): Promise<ResultadoSalvar> {
  const negocioId = await obterNegocioAtualId();
  if (!id.safeParse(subId).success) return NAO_ENCONTRADA;
  const n = nome.safeParse(texto);
  if (!n.success)
    return {
      ok: false,
      mensagem: n.error.issues[0].message,
      erros: { nome: n.error.issues[0].message },
    };
  try {
    const alteradas = await db
      .update(categoriasFinanceiras)
      .set({ nome: n.data })
      .where(
        and(
          eq(categoriasFinanceiras.id, subId),
          eq(categoriasFinanceiras.negocioId, negocioId),
          isNotNull(categoriasFinanceiras.paiId),
        ),
      )
      .returning({ id: categoriasFinanceiras.id });
    if (!alteradas.length) return NAO_ENCONTRADA;
  } catch (e) {
    if (duplicado(e)) return JA_EXISTE;
    console.error("Erro ao renomear subcategoria", e);
    return FALHA;
  }
  refresh();
  return { ok: true };
}

/** Exclui uma subcategoria, ou uma principal com todas as subcategorias dela. */
export async function excluirCategoriaFinanceira(
  categoriaId: string,
): Promise<ResultadoSalvar> {
  const negocioId = await obterNegocioAtualId();
  if (!id.safeParse(categoriaId).success) return NAO_ENCONTRADA;
  try {
    // Categoria (ou subcategoria dela) usada em lançamentos não pode ser excluída.
    const [{ usados }] = await db
      .select({ usados: count() })
      .from(lancamentos)
      .innerJoin(
        categoriasFinanceiras,
        eq(categoriasFinanceiras.id, lancamentos.categoriaId),
      )
      .where(
        and(
          eq(lancamentos.negocioId, negocioId),
          or(
            eq(categoriasFinanceiras.id, categoriaId),
            eq(categoriasFinanceiras.paiId, categoriaId),
          ),
        ),
      );
    if (usados > 0)
      return {
        ok: false,
        mensagem: `Está em uso em ${usados} lançamento(s). Altere esses lançamentos antes de excluir.`,
      };
    const excluidas = await db
      .delete(categoriasFinanceiras)
      .where(
        and(
          eq(categoriasFinanceiras.id, categoriaId),
          eq(categoriasFinanceiras.negocioId, negocioId),
        ),
      )
      .returning({ id: categoriasFinanceiras.id });
    if (!excluidas.length) return NAO_ENCONTRADA;
  } catch (e) {
    console.error("Erro ao excluir categoria financeira", e);
    return {
      ok: false,
      mensagem: "Não foi possível excluir. Tente novamente.",
    };
  }
  refresh();
  return { ok: true };
}
