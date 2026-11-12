import "server-only";

import { and, asc, count, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  categoriasFicha,
  categoriasInsumo,
  custeio,
  custosExtras,
  dadosEntrada,
  equipamentos,
  fichaItens,
  fichas,
  funcionarios,
  insumos,
} from "@/db/schema";

import { valoresPadrao as padraoCusteio, campos as camposCusteio } from "../custeio/campos";
import { valoresPadrao as padraoDados } from "../dados-de-entrada/campos";
import { custosUnitarios } from "../insumos/tipos";
import { calcularTodas, dependentesDe, type Contexto, type FichaBase, type TipoFicha, type TipoItem } from "./calculo";
import { MARGEM_REVENDA_PADRAO, type CategoriaFicha } from "./tipos";

/** Custos e parâmetros do negócio usados no cálculo das fichas. */
export async function carregarContexto(negocioId: string): Promise<Contexto> {
  const [listaInsumos, listaFuncionarios, listaEquipamentos, [dados], [custos], extras] = await Promise.all([
    db
      .select({
        id: insumos.id,
        nome: insumos.nome,
        unidade: insumos.unidade,
        volume: insumos.volume,
        custo: insumos.custo,
        perda: insumos.perda,
        categoria: categoriasInsumo.nome,
        sistema: categoriasInsumo.sistema,
      })
      .from(insumos)
      .innerJoin(categoriasInsumo, eq(categoriasInsumo.id, insumos.categoriaId))
      .where(eq(insumos.negocioId, negocioId)),
    db.select().from(funcionarios).where(eq(funcionarios.negocioId, negocioId)),
    db.select().from(equipamentos).where(eq(equipamentos.negocioId, negocioId)),
    db.select().from(dadosEntrada).where(eq(dadosEntrada.negocioId, negocioId)).limit(1),
    db.select().from(custeio).where(eq(custeio.negocioId, negocioId)).limit(1),
    db.select({ valor: custosExtras.valor }).from(custosExtras).where(eq(custosExtras.negocioId, negocioId)),
  ]);

  // Sem nada salvo, valem os mesmos valores sugeridos que as telas mostram.
  const p = { ...padraoDados, ...Object.fromEntries(Object.entries(dados ?? {}).filter(([, v]) => v != null)) };
  const c = { ...padraoCusteio, ...Object.fromEntries(Object.entries(custos ?? {}).filter(([, v]) => v != null)) };

  const minutosMes = (p.diasMes ?? 21) * (p.horasDia ?? 8) * 60;
  const precoGasKg = p.gasPreco && p.gasPesoKg ? p.gasPreco / p.gasPesoKg : 0;
  const custosFixos =
    camposCusteio.filter((k) => k.chave !== "receitaBruta").reduce((s, k) => s + Number(c[k.chave] ?? 0), 0) +
    extras.reduce((s, e) => s + e.valor, 0);
  const receita = Number(c.receitaBruta ?? 0);

  return {
    insumos: new Map(
      listaInsumos.map((i) => [
        i.id,
        {
          id: i.id,
          nome: i.nome,
          unidade: i.unidade,
          categoria: i.categoria,
          // A categoria de sistema é "Embalagens e descartáveis".
          embalagem: i.sistema,
          custoUnitario: custosUnitarios(i).comPerda,
        },
      ]),
    ),
    funcionarios: new Map(
      listaFuncionarios.map((f) => [f.id, { id: f.id, nome: f.nome, custoMinuto: minutosMes ? f.salario / minutosMes : 0 }]),
    ),
    equipamentos: new Map(
      listaEquipamentos.map((e) => [
        e.id,
        e.tipo === "eletrico"
          ? {
              id: e.id,
              nome: e.nome,
              detalhe: `${(e.potenciaW ?? 0).toLocaleString("pt-BR")} W`,
              custoMinuto: ((e.potenciaW ?? 0) / 1000 / 60) * (p.energiaKwh ?? 0),
            }
          : {
              id: e.id,
              nome: e.nome,
              detalhe: `${(e.vazaoKgH ?? 0).toLocaleString("pt-BR")} kg/h`,
              custoMinuto: ((e.vazaoKgH ?? 0) / 60) * precoGasKg,
            },
      ]),
    ),
    parametros: {
      aliquotaFixa: receita > 0 ? Math.min(custosFixos / receita, 0.95) : 0,
      imposto: (p.aliquotaImposto ?? 0) / 100,
      taxaCredito: (p.taxaCredito ?? 0) / 100,
      apps: [
        { nome: "iFood", taxa: (p.taxaIfood ?? 0) / 100 },
        { nome: "99Food", taxa: (p.taxa99food ?? 0) / 100 },
        { nome: "Keeta", taxa: (p.taxaKeeta ?? 0) / 100 },
      ],
      margemRevendaPadrao: MARGEM_REVENDA_PADRAO,
    },
  };
}

/** Todas as fichas do negócio (receitas e produtos), com a composição. */
export async function listarFichas(negocioId: string): Promise<FichaBase[]> {
  const [linhas, itens] = await Promise.all([
    db.select().from(fichas).where(eq(fichas.negocioId, negocioId)).orderBy(asc(fichas.nome)),
    db
      .select({
        fichaId: fichaItens.fichaId,
        tipo: fichaItens.tipo,
        insumoId: fichaItens.insumoId,
        fichaRefId: fichaItens.fichaRefId,
        funcionarioId: fichaItens.funcionarioId,
        equipamentoId: fichaItens.equipamentoId,
        quantidade: fichaItens.quantidade,
        ordem: fichaItens.ordem,
      })
      .from(fichaItens)
      .innerJoin(fichas, eq(fichas.id, fichaItens.fichaId))
      .where(eq(fichas.negocioId, negocioId))
      .orderBy(asc(fichaItens.ordem)),
  ]);

  const porFicha = new Map<string, FichaBase["itens"]>();
  for (const i of itens) {
    const refId = i.insumoId ?? i.fichaRefId ?? i.funcionarioId ?? i.equipamentoId;
    if (!refId) continue;
    porFicha.set(i.fichaId, [...(porFicha.get(i.fichaId) ?? []), { tipo: i.tipo as TipoItem, refId, quantidade: i.quantidade }]);
  }

  return linhas.map((f) => ({
    id: f.id,
    tipo: f.tipo,
    nome: f.nome,
    categoriaId: f.categoriaId,
    rendimento: f.rendimento,
    pesoTotalG: f.pesoTotalG,
    tempoPreparoMin: f.tempoPreparoMin,
    margem: f.margem,
    margemRevenda: f.margemRevenda,
    favorito: f.favorito,
    modoPreparo: f.modoPreparo,
    itens: porFicha.get(f.id) ?? [],
    atualizadoEm: f.atualizadoEm.toISOString(),
  }));
}

export async function listarCategoriasFicha(negocioId: string, tipo: TipoFicha): Promise<CategoriaFicha[]> {
  return db
    .select({ id: categoriasFicha.id, nome: categoriasFicha.nome, fichas: count(fichas.id) })
    .from(categoriasFicha)
    .leftJoin(fichas, eq(fichas.categoriaId, categoriasFicha.id))
    .where(and(eq(categoriasFicha.negocioId, negocioId), eq(categoriasFicha.tipo, tipo)))
    .groupBy(categoriasFicha.id)
    .orderBy(asc(categoriasFicha.nome));
}

/** Tudo calculado: fichas, contexto e resultados. */
export async function carregarTudo(negocioId: string) {
  const [contexto, lista] = await Promise.all([carregarContexto(negocioId), listarFichas(negocioId)]);
  const { resultados } = calcularTodas(lista, contexto);
  return { contexto, fichas: lista, resultados };
}

/** Tudo que o editor precisa. Sem `fichaId`, prepara uma ficha nova. */
export async function montarEditor(negocioId: string, tipo: TipoFicha, fichaId?: string) {
  // Categorias de massa e recheio vêm juntas: a receita pode alternar entre os dois tipos.
  const [{ contexto, fichas: lista, resultados }, massa, recheio, produto] = await Promise.all([
    carregarTudo(negocioId),
    listarCategoriasFicha(negocioId, "massa"),
    listarCategoriasFicha(negocioId, "recheio"),
    listarCategoriasFicha(negocioId, "produto"),
  ]);
  const categoriasPorTipo: Record<TipoFicha, CategoriaFicha[]> = { massa, recheio, produto };
  const ficha = fichaId ? lista.find((f) => f.id === fichaId) : null;
  if (fichaId && !ficha) return null;

  // Não oferecer fichas que criariam vínculo circular.
  const proibidas = ficha ? dependentesDe(ficha.id, lista) : new Set<string>();
  const fichasRef = lista
    .filter((f) => !proibidas.has(f.id))
    .map((f) => {
      const r = resultados.get(f.id)!;
      return { id: f.id, nome: f.nome, tipo: f.tipo, custoTotal: r.custoTotal, cmvTotal: r.cmvTotal, pesoTotalG: f.pesoTotalG };
    });

  const usadoEm = ficha
    ? lista
        .filter((f) => f.itens.some((i) => (i.tipo === "receita" || i.tipo === "produto") && i.refId === ficha.id))
        .map((f) => ({ id: f.id, nome: f.nome, preco: resultados.get(f.id)?.preco?.preco ?? null, pesoG: f.pesoTotalG }))
    : [];

  return {
    tipo: ficha?.tipo ?? tipo,
    ficha: ficha ?? null,
    insumos: [...contexto.insumos.values()],
    funcionarios: [...contexto.funcionarios.values()],
    equipamentos: [...contexto.equipamentos.values()],
    parametros: contexto.parametros,
    fichasRef,
    categoriasPorTipo,
    usadoEm,
  };
}
