"use server";

import { and, count, eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { categoriasInsumo, insumos, UNIDADES } from "@/db/schema";
import { garantirNegocioQuery, obterNegocioAtualId } from "@/lib/negocio-atual";
import { errosPorCampo, type ResultadoSalvar } from "@/lib/validacao";

import { LIMITES, type DadosInsumo, type Unidade } from "./tipos";

const id = z.uuid();
const FALHA: ResultadoSalvar = {
  ok: false,
  mensagem: "Não foi possível salvar. Tente novamente.",
};
const invalido = (erro: z.ZodError): ResultadoSalvar => ({
  ok: false,
  mensagem: "Confira os campos destacados.",
  erros: errosPorCampo(erro),
});

/** Erro do Postgres de valor duplicado (nome de categoria repetido). */
const duplicado = (erro: unknown) =>
  String(
    (erro as { cause?: { code?: string } })?.cause?.code ??
      (erro as { code?: string })?.code,
  ) === "23505";

// ---------------------------------------------------------------- Categorias

const nomeCategoria = z
  .string()
  .trim()
  .min(1, "Informe o nome da categoria.")
  .max(LIMITES.categoria, `Use no máximo ${LIMITES.categoria} caracteres.`);

/** Categoria do negócio atual (ou undefined). */
async function buscarCategoria(negocioId: string, categoriaId: string) {
  if (!id.safeParse(categoriaId).success) return undefined;
  const [categoria] = await db
    .select()
    .from(categoriasInsumo)
    .where(
      and(
        eq(categoriasInsumo.id, categoriaId),
        eq(categoriasInsumo.negocioId, negocioId),
      ),
    )
    .limit(1);
  return categoria;
}

export async function criarCategoria(
  nome: string,
): Promise<ResultadoSalvar & { categoria?: { id: string; nome: string } }> {
  const negocioId = await obterNegocioAtualId();
  const validado = nomeCategoria.safeParse(nome);
  if (!validado.success)
    return {
      ok: false,
      mensagem: validado.error.issues[0].message,
      erros: { nome: validado.error.issues[0].message },
    };

  try {
    const [{ total }] = await db
      .select({ total: count() })
      .from(categoriasInsumo)
      .where(eq(categoriasInsumo.negocioId, negocioId));
    if (total >= LIMITES.categoriasPorNegocio) {
      return {
        ok: false,
        mensagem: `Limite de ${LIMITES.categoriasPorNegocio} categorias atingido.`,
      };
    }
    const [, [criada]] = await db.batch([
      garantirNegocioQuery(negocioId),
      db
        .insert(categoriasInsumo)
        .values({ negocioId, nome: validado.data })
        .returning({ id: categoriasInsumo.id, nome: categoriasInsumo.nome }),
    ]);
    refresh();
    return { ok: true, categoria: criada };
  } catch (erro) {
    if (duplicado(erro)) {
      const mensagem = "Já existe uma categoria com esse nome.";
      return { ok: false, mensagem, erros: { nome: mensagem } };
    }
    console.error("Erro ao criar categoria", erro);
    return FALHA;
  }
}

export async function renomearCategoria(
  categoriaId: string,
  nome: string,
): Promise<ResultadoSalvar> {
  const negocioId = await obterNegocioAtualId();
  const validado = nomeCategoria.safeParse(nome);
  if (!validado.success)
    return {
      ok: false,
      mensagem: validado.error.issues[0].message,
      erros: { nome: validado.error.issues[0].message },
    };

  const categoria = await buscarCategoria(negocioId, categoriaId);
  if (!categoria) return { ok: false, mensagem: "Categoria não encontrada." };
  if (categoria.sistema)
    return {
      ok: false,
      mensagem: "Categorias do sistema não podem ser alteradas.",
    };

  try {
    await db
      .update(categoriasInsumo)
      .set({ nome: validado.data })
      .where(
        and(
          eq(categoriasInsumo.id, categoriaId),
          eq(categoriasInsumo.negocioId, negocioId),
        ),
      );
  } catch (erro) {
    if (duplicado(erro)) {
      const mensagem = "Já existe uma categoria com esse nome.";
      return { ok: false, mensagem, erros: { nome: mensagem } };
    }
    console.error("Erro ao renomear categoria", erro);
    return FALHA;
  }
  refresh();
  return { ok: true };
}

/** Exclui a categoria. Se tiver insumos, eles são movidos para `destinoId` antes. */
export async function excluirCategoria(
  categoriaId: string,
  destinoId?: string,
): Promise<ResultadoSalvar> {
  const negocioId = await obterNegocioAtualId();
  const categoria = await buscarCategoria(negocioId, categoriaId);
  if (!categoria) return { ok: false, mensagem: "Categoria não encontrada." };
  if (categoria.sistema)
    return {
      ok: false,
      mensagem: "Categorias do sistema não podem ser excluídas.",
    };

  const [{ total }] = await db
    .select({ total: count() })
    .from(insumos)
    .where(
      and(
        eq(insumos.categoriaId, categoriaId),
        eq(insumos.negocioId, negocioId),
      ),
    );

  try {
    if (total > 0) {
      const destino = destinoId
        ? await buscarCategoria(negocioId, destinoId)
        : undefined;
      if (!destino || destino.id === categoriaId) {
        return {
          ok: false,
          mensagem: "Escolha para qual categoria mover os insumos.",
        };
      }
      // Lote único (transação): move os insumos e exclui a categoria.
      await db.batch([
        db
          .update(insumos)
          .set({ categoriaId: destino.id, atualizadoEm: new Date() })
          .where(
            and(
              eq(insumos.categoriaId, categoriaId),
              eq(insumos.negocioId, negocioId),
            ),
          ),
        db
          .delete(categoriasInsumo)
          .where(
            and(
              eq(categoriasInsumo.id, categoriaId),
              eq(categoriasInsumo.negocioId, negocioId),
            ),
          ),
      ]);
    } else {
      await db
        .delete(categoriasInsumo)
        .where(
          and(
            eq(categoriasInsumo.id, categoriaId),
            eq(categoriasInsumo.negocioId, negocioId),
          ),
        );
    }
  } catch (erro) {
    console.error("Erro ao excluir categoria", erro);
    return {
      ok: false,
      mensagem: "Não foi possível excluir. Tente novamente.",
    };
  }
  refresh();
  return { ok: true };
}

// ------------------------------------------------------------------ Insumos

const esquemaInsumo = z.object({
  nome: z
    .string()
    .trim()
    .min(1, "Informe o nome do insumo.")
    .max(LIMITES.nome, `Use no máximo ${LIMITES.nome} caracteres.`),
  categoriaId: z.uuid("Escolha uma categoria."),
  codigoBarras: z
    .string()
    .trim()
    .regex(/^\d{8,14}$/, "O código de barras deve ter de 8 a 14 números.")
    .nullable(),
  volume: z
    .number({ error: "Informe o volume." })
    .positive("O volume deve ser maior que zero.")
    .max(LIMITES.volume, "Volume muito alto."),
  unidade: z.enum(UNIDADES, { error: "Escolha a unidade." }),
  custo: z
    .number({ error: "Informe o custo." })
    .positive("O custo deve ser maior que zero.")
    .max(LIMITES.custo, "Valor muito alto."),
  perda: z
    .number({ error: "Informe um número." })
    .min(0, "A perda não pode ser negativa.")
    .max(LIMITES.perdaMax, `Máximo: ${LIMITES.perdaMax}%.`),
});

async function validarInsumo(negocioId: string, dados: DadosInsumo) {
  const validado = esquemaInsumo.safeParse(dados);
  if (!validado.success) return { erro: invalido(validado.error) };
  if (!(await buscarCategoria(negocioId, validado.data.categoriaId))) {
    return {
      erro: {
        ok: false,
        mensagem: "Escolha uma categoria.",
        erros: { categoriaId: "Escolha uma categoria." },
      } as ResultadoSalvar,
    };
  }
  return { dados: validado.data };
}

export async function criarInsumo(
  dados: DadosInsumo,
): Promise<ResultadoSalvar> {
  const negocioId = await obterNegocioAtualId();
  const { erro, dados: validos } = await validarInsumo(negocioId, dados);
  if (erro) return erro;

  try {
    const [{ total }] = await db
      .select({ total: count() })
      .from(insumos)
      .where(eq(insumos.negocioId, negocioId));
    if (total >= LIMITES.insumosPorNegocio) {
      return {
        ok: false,
        mensagem: `Limite de ${LIMITES.insumosPorNegocio} insumos atingido.`,
      };
    }
    await db.insert(insumos).values({ negocioId, ...validos! });
  } catch (e) {
    console.error("Erro ao criar insumo", e);
    return FALHA;
  }
  refresh();
  return { ok: true };
}

export async function editarInsumo(
  insumoId: string,
  dados: DadosInsumo,
): Promise<ResultadoSalvar> {
  const negocioId = await obterNegocioAtualId();
  const naoEncontrado: ResultadoSalvar = {
    ok: false,
    mensagem: "Insumo não encontrado. Ele pode ter sido excluído.",
  };
  if (!id.safeParse(insumoId).success) return naoEncontrado;
  const { erro, dados: validos } = await validarInsumo(negocioId, dados);
  if (erro) return erro;

  try {
    // Filtra também pelo negócio: ninguém edita insumo de outro cliente.
    const alterados = await db
      .update(insumos)
      .set({ ...validos!, atualizadoEm: new Date() })
      .where(and(eq(insumos.id, insumoId), eq(insumos.negocioId, negocioId)))
      .returning({ id: insumos.id });
    if (!alterados.length) return naoEncontrado;
  } catch (e) {
    console.error("Erro ao editar insumo", e);
    return FALHA;
  }
  refresh();
  return { ok: true };
}

export async function excluirInsumo(
  insumoId: string,
): Promise<ResultadoSalvar> {
  const negocioId = await obterNegocioAtualId();
  const naoEncontrado: ResultadoSalvar = {
    ok: false,
    mensagem: "Insumo não encontrado. Ele pode ter sido excluído.",
  };
  if (!id.safeParse(insumoId).success) return naoEncontrado;
  try {
    const excluidos = await db
      .delete(insumos)
      .where(and(eq(insumos.id, insumoId), eq(insumos.negocioId, negocioId)))
      .returning({ id: insumos.id });
    if (!excluidos.length) return naoEncontrado;
  } catch (e) {
    console.error("Erro ao excluir insumo", e);
    return {
      ok: false,
      mensagem: "Não foi possível excluir. Tente novamente.",
    };
  }
  refresh();
  return { ok: true };
}

// ---------------------------------------------------------- Código de barras

export type ProdutoEncontrado = {
  nome: string;
  volume?: number;
  unidade?: Unidade;
};

const UNIDADES_OFF: Record<string, Unidade> = {
  g: "g",
  gr: "g",
  grs: "g",
  kg: "kg",
  ml: "ml",
  l: "l",
  lt: "l",
  cl: "ml",
  un: "unidade",
  und: "unidade",
};

/** "395 g", "1,5 L", "200ml" -> { volume, unidade }. */
function lerQuantidade(
  texto?: string,
): Pick<ProdutoEncontrado, "volume" | "unidade"> {
  const m = texto
    ?.toLowerCase()
    .match(/(\d+(?:[.,]\d+)?)\s*(kg|grs?|g|ml|cl|lt|l|und|un)\b/);
  if (!m) return {};
  let volume = Number(m[1].replace(",", "."));
  const unidade = UNIDADES_OFF[m[2]];
  if (m[2] === "cl") volume *= 10;
  return Number.isFinite(volume) && volume > 0 && unidade
    ? { volume, unidade }
    : {};
}

/**
 * Busca o produto na base pública Open Food Facts pelo código de barras.
 * Envia só o código (nenhum dado do cliente).
 */
export async function buscarCodigoBarras(
  codigo: string,
): Promise<
  { ok: true; produto: ProdutoEncontrado } | { ok: false; mensagem: string }
> {
  await obterNegocioAtualId();
  const limpo = codigo.replace(/\D/g, "");
  if (!/^\d{8,14}$/.test(limpo))
    return {
      ok: false,
      mensagem: "O código de barras deve ter de 8 a 14 números.",
    };

  try {
    const resposta = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${limpo}.json?fields=product_name,product_name_pt,brands,quantity`,
      {
        headers: { "User-Agent": "foodlilly/0.1 (precificacao)" },
        signal: AbortSignal.timeout(8000),
        cache: "no-store",
      },
    );
    if (resposta.status === 404)
      return {
        ok: false,
        mensagem: "Produto não encontrado. Preencha os dados manualmente.",
      };
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
    const json = (await resposta.json()) as {
      status?: number;
      product?: {
        product_name?: string;
        product_name_pt?: string;
        brands?: string;
        quantity?: string;
      };
    };
    const p = json.product;
    const nomeBase = (p?.product_name_pt || p?.product_name || "").trim();
    if (json.status !== 1 || !nomeBase) {
      return {
        ok: false,
        mensagem: "Produto não encontrado. Preencha os dados manualmente.",
      };
    }
    const marca = p?.brands?.split(",")[0]?.trim();
    const nome = (
      marca && !nomeBase.toLowerCase().includes(marca.toLowerCase())
        ? `${nomeBase} ${marca}`
        : nomeBase
    ).slice(0, LIMITES.nome);
    return { ok: true, produto: { nome, ...lerQuantidade(p?.quantity) } };
  } catch (erro) {
    console.error("Erro ao buscar código de barras", erro);
    return {
      ok: false,
      mensagem:
        "Não foi possível consultar o código agora. Preencha os dados manualmente.",
    };
  }
}
