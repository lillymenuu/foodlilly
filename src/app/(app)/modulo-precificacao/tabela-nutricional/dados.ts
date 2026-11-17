import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { categoriasInsumo, fichas, insumos } from "@/db/schema";
import { calcularNutricaoTodas, type InsumoNutricao } from "@/lib/nutricao";

import {
  garantirCategoriasPadrao,
  listarCategorias,
  listarInsumos,
} from "../insumos/dados";
import { listarFichas } from "../receitas/dados";
import type { ProdutoNutricao } from "./tipos";

/** Produtos com a nutrição calculada + o que falta para completar cada um. */
export async function carregarNutricao(negocioId: string) {
  await garantirCategoriasPadrao(negocioId);
  const [lista, listaInsumos, categorias, embalagens, configs] = await Promise.all([
    listarFichas(negocioId),
    listarInsumos(negocioId),
    listarCategorias(negocioId),
    db
      .select({ id: insumos.id, sistema: categoriasInsumo.sistema })
      .from(insumos)
      .innerJoin(categoriasInsumo, eq(categoriasInsumo.id, insumos.categoriaId))
      .where(eq(insumos.negocioId, negocioId)),
    db
      .select({ id: fichas.id, config: fichas.tabelaNutricional })
      .from(fichas)
      .where(eq(fichas.negocioId, negocioId)),
  ]);

  const ehEmbalagem = new Map(embalagens.map((e) => [e.id, e.sistema]));
  const mapaInsumos = new Map<string, InsumoNutricao>(
    listaInsumos.map((i) => [
      i.id,
      {
        id: i.id,
        nome: i.nome,
        unidade: i.unidade,
        embalagem: ehEmbalagem.get(i.id) ?? false,
        nutricao: i.nutricao,
      },
    ]),
  );
  const resultados = calcularNutricaoTodas(lista, mapaInsumos);
  const configPorFicha = new Map(configs.map((c) => [c.id, c.config]));

  const produtos: ProdutoNutricao[] = lista
    .filter((f) => f.tipo === "produto")
    .map((f) => {
      const r = resultados.get(f.id)!;
      return {
        id: f.id,
        nome: f.nome,
        pesoTotalG: f.pesoTotalG,
        rendimento: f.rendimento,
        por100: r.por100,
        completa: r.completa,
        pendencias: r.pendencias,
        config: configPorFicha.get(f.id) ?? null,
      };
    });

  return { produtos, insumos: listaInsumos, categorias };
}
