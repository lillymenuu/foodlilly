"use server";

import { and, count, eq, inArray } from "drizzle-orm";
import { refresh } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import {
  categoriasFicha,
  equipamentos,
  fichaItens,
  fichas,
  funcionarios,
  insumos,
  TIPOS_FICHA,
  TIPOS_ITEM_FICHA,
} from "@/db/schema";
import { garantirNegocioQuery, obterNegocioAtualId } from "@/lib/negocio-atual";
import { errosPorCampo, type ResultadoSalvar } from "@/lib/validacao";

import { dependentesDe } from "./calculo";
import { listarFichas } from "./dados";
import { LIMITES, type DadosFicha } from "./tipos";

const id = z.uuid();
const FALHA: ResultadoSalvar = { ok: false, mensagem: "Não foi possível salvar. Tente novamente." };
const NAO_ENCONTRADA: ResultadoSalvar = { ok: false, mensagem: "Ficha não encontrada. Ela pode ter sido excluída." };

const duplicado = (erro: unknown) =>
  String((erro as { cause?: { code?: string } })?.cause?.code ?? (erro as { code?: string })?.code) === "23505";

const porcentagem = z.number().min(0, "Não pode ser negativa.").max(95, "Máximo: 95%.");

const esquemaFicha = z.object({
  tipo: z.enum(TIPOS_FICHA),
  nome: z.string().trim().min(1, "Informe o nome.").max(LIMITES.nome, `Use no máximo ${LIMITES.nome} caracteres.`),
  categoriaId: z.uuid().nullable(),
  rendimento: z.number({ error: "Informe o rendimento." }).positive("O rendimento deve ser maior que zero.").max(100_000),
  pesoTotalG: z.number().positive("O peso deve ser maior que zero.").max(10_000_000).nullable(),
  tempoPreparoMin: z.number().int("Use minutos inteiros.").min(0).max(100_000).nullable(),
  margem: porcentagem.nullable(),
  margemRevenda: porcentagem.nullable(),
  modoPreparo: z
    .array(z.string().trim().min(1).max(LIMITES.passo, `Cada passo pode ter até ${LIMITES.passo} caracteres.`))
    .max(LIMITES.passos, `Use no máximo ${LIMITES.passos} passos.`),
  itens: z
    .array(
      z.object({
        tipo: z.enum(TIPOS_ITEM_FICHA),
        refId: z.uuid(),
        quantidade: z.number().positive("A quantidade deve ser maior que zero.").max(10_000_000),
      }),
    )
    .max(LIMITES.itens, `Use no máximo ${LIMITES.itens} itens.`),
});

/** Confere se todas as referências da composição pertencem ao negócio. */
async function referenciasValidas(negocioId: string, itens: DadosFicha["itens"]) {
  const ids = (tipos: string[]) => [...new Set(itens.filter((i) => tipos.includes(i.tipo)).map((i) => i.refId))];
  const conferir = async (lista: string[], tabela: typeof insumos | typeof fichas | typeof funcionarios | typeof equipamentos) => {
    if (!lista.length) return true;
    const [{ total }] = await db
      .select({ total: count() })
      .from(tabela)
      .where(and(inArray(tabela.id, lista), eq(tabela.negocioId, negocioId)));
    return total === lista.length;
  };
  const resultados = await Promise.all([
    conferir(ids(["ingrediente", "embalagem"]), insumos),
    conferir(ids(["receita", "produto"]), fichas),
    conferir(ids(["mao_obra"]), funcionarios),
    conferir(ids(["equipamento"]), equipamentos),
  ]);
  return resultados.every(Boolean);
}

/** Cria (fichaId = null) ou atualiza uma ficha com toda a composição. */
export async function salvarFicha(
  fichaId: string | null,
  dados: DadosFicha,
): Promise<ResultadoSalvar & { id?: string }> {
  const negocioId = await obterNegocioAtualId();
  const validado = esquemaFicha.safeParse(dados);
  if (!validado.success) {
    return { ok: false, mensagem: "Confira os campos destacados.", erros: errosPorCampo(validado.error) };
  }
  const d = validado.data;
  if (d.tipo === "produto" && !d.pesoTotalG) {
    return { ok: false, mensagem: "Informe o peso total do produto.", erros: { pesoTotalG: "Informe o peso total." } };
  }
  if (fichaId && !id.safeParse(fichaId).success) return NAO_ENCONTRADA;

  try {
    if (d.categoriaId) {
      const [cat] = await db
        .select({ id: categoriasFicha.id })
        .from(categoriasFicha)
        .where(and(eq(categoriasFicha.id, d.categoriaId), eq(categoriasFicha.negocioId, negocioId), eq(categoriasFicha.tipo, d.tipo)))
        .limit(1);
      if (!cat) return { ok: false, mensagem: "Escolha uma categoria válida.", erros: { categoriaId: "Categoria inválida." } };
    }
    if (!(await referenciasValidas(negocioId, d.itens))) {
      return { ok: false, mensagem: "Algum item da composição não existe mais. Recarregue a página." };
    }

    const todas = await listarFichas(negocioId);
    if (fichaId) {
      const atual = todas.find((f) => f.id === fichaId);
      if (!atual) return NAO_ENCONTRADA;
      if (atual.tipo !== d.tipo) return { ok: false, mensagem: "O tipo da ficha não pode ser alterado." };
      // Não pode usar uma ficha que (direta ou indiretamente) já usa esta: seria circular.
      const proibidas = dependentesDe(fichaId, todas);
      if (d.itens.some((i) => (i.tipo === "receita" || i.tipo === "produto") && proibidas.has(i.refId))) {
        return { ok: false, mensagem: "Uma ficha não pode usar a si mesma, nem uma ficha que já a utiliza." };
      }
    } else if (todas.length >= LIMITES.fichasPorNegocio) {
      return { ok: false, mensagem: `Limite de ${LIMITES.fichasPorNegocio} fichas atingido.` };
    }

    const novoId = fichaId ?? crypto.randomUUID();
    const campos = {
      nome: d.nome,
      categoriaId: d.categoriaId,
      rendimento: d.rendimento,
      pesoTotalG: d.pesoTotalG,
      tempoPreparoMin: d.tempoPreparoMin,
      margem: d.margem,
      margemRevenda: d.margemRevenda,
      modoPreparo: d.modoPreparo,
      atualizadoEm: new Date(),
    };
    const linhas = d.itens.map((i, ordem) => ({
      fichaId: novoId,
      tipo: i.tipo,
      quantidade: i.quantidade,
      ordem,
      insumoId: i.tipo === "ingrediente" || i.tipo === "embalagem" ? i.refId : null,
      fichaRefId: i.tipo === "receita" || i.tipo === "produto" ? i.refId : null,
      funcionarioId: i.tipo === "mao_obra" ? i.refId : null,
      equipamentoId: i.tipo === "equipamento" ? i.refId : null,
    }));

    // Lote único (transação): grava a ficha e substitui a composição.
    await db.batch([
      garantirNegocioQuery(negocioId),
      fichaId
        ? db.update(fichas).set(campos).where(and(eq(fichas.id, fichaId), eq(fichas.negocioId, negocioId)))
        : db.insert(fichas).values({ id: novoId, negocioId, tipo: d.tipo, ...campos }),
      db.delete(fichaItens).where(eq(fichaItens.fichaId, novoId)),
      ...(linhas.length ? [db.insert(fichaItens).values(linhas)] : []),
    ]);
    refresh();
    return { ok: true, id: novoId };
  } catch (erro) {
    console.error("Erro ao salvar ficha", erro);
    return FALHA;
  }
}

async function fichaDoNegocio(negocioId: string, fichaId: string) {
  if (!id.safeParse(fichaId).success) return undefined;
  const [f] = await db
    .select()
    .from(fichas)
    .where(and(eq(fichas.id, fichaId), eq(fichas.negocioId, negocioId)))
    .limit(1);
  return f;
}

export async function excluirFicha(fichaId: string): Promise<ResultadoSalvar> {
  const negocioId = await obterNegocioAtualId();
  try {
    const excluidas = await db
      .delete(fichas)
      .where(and(eq(fichas.id, fichaId), eq(fichas.negocioId, negocioId)))
      .returning({ id: fichas.id });
    if (!excluidas.length) return NAO_ENCONTRADA;
  } catch (erro) {
    console.error("Erro ao excluir ficha", erro);
    return { ok: false, mensagem: "Não foi possível excluir. Tente novamente." };
  }
  refresh();
  return { ok: true };
}

export async function duplicarFicha(fichaId: string): Promise<ResultadoSalvar & { id?: string }> {
  const negocioId = await obterNegocioAtualId();
  const original = await fichaDoNegocio(negocioId, fichaId);
  if (!original) return NAO_ENCONTRADA;
  try {
    const itens = await db.select().from(fichaItens).where(eq(fichaItens.fichaId, fichaId));
    const novoId = crypto.randomUUID();
    await db.batch([
      db.insert(fichas).values({
        ...original,
        id: novoId,
        nome: `${original.nome} (cópia)`.slice(0, LIMITES.nome),
        favorito: false,
        criadoEm: new Date(),
        atualizadoEm: new Date(),
      }),
      ...(itens.length
        ? [db.insert(fichaItens).values(itens.map((i) => ({ ...i, id: crypto.randomUUID(), fichaId: novoId })))]
        : []),
    ]);
    refresh();
    return { ok: true, id: novoId };
  } catch (erro) {
    console.error("Erro ao duplicar ficha", erro);
    return FALHA;
  }
}

export async function alternarFavorito(fichaId: string, favorito: boolean): Promise<ResultadoSalvar> {
  const negocioId = await obterNegocioAtualId();
  if (!id.safeParse(fichaId).success) return NAO_ENCONTRADA;
  try {
    await db
      .update(fichas)
      .set({ favorito })
      .where(and(eq(fichas.id, fichaId), eq(fichas.negocioId, negocioId)));
  } catch (erro) {
    console.error("Erro ao favoritar", erro);
    return FALHA;
  }
  refresh();
  return { ok: true };
}

// ---------------------------------------------------------------- Categorias

const nomeCategoria = z
  .string()
  .trim()
  .min(1, "Informe o nome da categoria.")
  .max(LIMITES.categoria, `Use no máximo ${LIMITES.categoria} caracteres.`);

const erroNome = (mensagem: string): ResultadoSalvar => ({ ok: false, mensagem, erros: { nome: mensagem } });

export async function criarCategoriaFicha(
  tipo: (typeof TIPOS_FICHA)[number],
  nome: string,
): Promise<ResultadoSalvar & { categoria?: { id: string; nome: string } }> {
  const negocioId = await obterNegocioAtualId();
  const validado = nomeCategoria.safeParse(nome);
  if (!validado.success) return erroNome(validado.error.issues[0].message);
  if (!TIPOS_FICHA.includes(tipo)) return FALHA;
  try {
    const [, [criada]] = await db.batch([
      garantirNegocioQuery(negocioId),
      db
        .insert(categoriasFicha)
        .values({ negocioId, tipo, nome: validado.data })
        .returning({ id: categoriasFicha.id, nome: categoriasFicha.nome }),
    ]);
    refresh();
    return { ok: true, categoria: criada };
  } catch (erro) {
    if (duplicado(erro)) return erroNome("Já existe uma categoria com esse nome.");
    console.error("Erro ao criar categoria de ficha", erro);
    return FALHA;
  }
}

export async function renomearCategoriaFicha(categoriaId: string, nome: string): Promise<ResultadoSalvar> {
  const negocioId = await obterNegocioAtualId();
  const validado = nomeCategoria.safeParse(nome);
  if (!validado.success) return erroNome(validado.error.issues[0].message);
  if (!id.safeParse(categoriaId).success) return { ok: false, mensagem: "Categoria não encontrada." };
  try {
    const alteradas = await db
      .update(categoriasFicha)
      .set({ nome: validado.data })
      .where(and(eq(categoriasFicha.id, categoriaId), eq(categoriasFicha.negocioId, negocioId)))
      .returning({ id: categoriasFicha.id });
    if (!alteradas.length) return { ok: false, mensagem: "Categoria não encontrada." };
  } catch (erro) {
    if (duplicado(erro)) return erroNome("Já existe uma categoria com esse nome.");
    console.error("Erro ao renomear categoria de ficha", erro);
    return FALHA;
  }
  refresh();
  return { ok: true };
}

/**
 * Exclui a categoria. As fichas dela vão para `destinoId` (outra categoria
 * do mesmo tipo) ou ficam "Sem categoria" quando o destino é nulo.
 */
export async function excluirCategoriaFicha(categoriaId: string, destinoId: string | null = null): Promise<ResultadoSalvar> {
  const negocioId = await obterNegocioAtualId();
  const naoEncontrada: ResultadoSalvar = { ok: false, mensagem: "Categoria não encontrada." };
  if (!id.safeParse(categoriaId).success) return naoEncontrada;
  try {
    const [categoria] = await db
      .select()
      .from(categoriasFicha)
      .where(and(eq(categoriasFicha.id, categoriaId), eq(categoriasFicha.negocioId, negocioId)))
      .limit(1);
    if (!categoria) return naoEncontrada;

    if (destinoId) {
      if (!id.safeParse(destinoId).success || destinoId === categoriaId) return { ok: false, mensagem: "Escolha um destino válido." };
      const [destino] = await db
        .select({ id: categoriasFicha.id })
        .from(categoriasFicha)
        .where(and(eq(categoriasFicha.id, destinoId), eq(categoriasFicha.negocioId, negocioId), eq(categoriasFicha.tipo, categoria.tipo)))
        .limit(1);
      if (!destino) return { ok: false, mensagem: "Escolha um destino válido." };
      // Lote único (transação): move as fichas e exclui a categoria.
      await db.batch([
        db
          .update(fichas)
          .set({ categoriaId: destinoId })
          .where(and(eq(fichas.categoriaId, categoriaId), eq(fichas.negocioId, negocioId))),
        db.delete(categoriasFicha).where(and(eq(categoriasFicha.id, categoriaId), eq(categoriasFicha.negocioId, negocioId))),
      ]);
    } else {
      // Sem destino: a chave estrangeira deixa as fichas sem categoria.
      await db.delete(categoriasFicha).where(and(eq(categoriasFicha.id, categoriaId), eq(categoriasFicha.negocioId, negocioId)));
    }
  } catch (erro) {
    console.error("Erro ao excluir categoria de ficha", erro);
    return { ok: false, mensagem: "Não foi possível excluir. Tente novamente." };
  }
  refresh();
  return { ok: true };
}
