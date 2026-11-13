import { Suspense } from "react";
import type { Metadata } from "next";
import { and, asc, desc, eq, gte, lte } from "drizzle-orm";
import { connection } from "next/server";

import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/db";
import { contasBancarias, fornecedores, lancamentos } from "@/db/schema";
import { obterNegocioAtualId } from "@/lib/negocio-atual";

import {
  garantirCategoriasPadrao,
  listarCategorias,
} from "../contas/dados-categorias";
import { saldosDasContas } from "../saldos";
import { TelaLancamentos } from "./tela-lancamentos";
import { hojeBr, type Lancamento } from "./tipos";

export const metadata: Metadata = {
  title: "Gastos e recebimentos · foodlilly",
};

const dataValida = (v: unknown) =>
  typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined;

export default function Page({
  searchParams,
}: PageProps<"/modulo-financeiro/gastos-recebimentos">) {
  return (
    <Suspense fallback={<Carregando />}>
      <Conteudo searchParams={searchParams} />
    </Suspense>
  );
}

async function Conteudo({
  searchParams,
}: {
  searchParams: PageProps<"/modulo-financeiro/gastos-recebimentos">["searchParams"];
}) {
  await connection();
  const negocioId = await obterNegocioAtualId();
  const sp = await searchParams;
  // Período: o mês atual, se não vier no endereço.
  const hoje = hojeBr();
  const inicio = dataValida(sp.inicio) ?? `${hoje.slice(0, 7)}-01`;
  const fimPadrao = new Date(
    Date.UTC(Number(hoje.slice(0, 4)), Number(hoje.slice(5, 7)), 0),
  )
    .toISOString()
    .slice(0, 10);
  const fim = dataValida(sp.fim) ?? fimPadrao;

  const contas = await db
    .select({
      id: contasBancarias.id,
      nome: contasBancarias.nome,
      padrao: contasBancarias.padrao,
    })
    .from(contasBancarias)
    .where(eq(contasBancarias.negocioId, negocioId))
    .orderBy(desc(contasBancarias.padrao), asc(contasBancarias.criadoEm));
  const contaSelecionada =
    typeof sp.conta === "string" && contas.some((c) => c.id === sp.conta)
      ? sp.conta
      : null;

  if (contas.length) await garantirCategoriasPadrao(negocioId);
  const [categorias, listaFornecedores, saldos, linhas] = await Promise.all([
    listarCategorias(negocioId),
    db
      .select({ id: fornecedores.id, nome: fornecedores.nome })
      .from(fornecedores)
      .where(eq(fornecedores.negocioId, negocioId))
      .orderBy(asc(fornecedores.nome)),
    saldosDasContas(negocioId),
    db
      .select({
        id: lancamentos.id,
        contaId: lancamentos.contaId,
        grupo: lancamentos.grupo,
        categoriaId: lancamentos.categoriaId,
        data: lancamentos.data,
        valor: lancamentos.valor,
        descricao: lancamentos.descricao,
        fornecedorId: lancamentos.fornecedorId,
        fornecedorNome: fornecedores.nome,
        pessoaNome: lancamentos.pessoaNome,
        formaPagamento: lancamentos.formaPagamento,
        pago: lancamentos.pago,
        serieId: lancamentos.serieId,
        serieTipo: lancamentos.serieTipo,
        serieNumero: lancamentos.serieNumero,
        serieTotal: lancamentos.serieTotal,
      })
      .from(lancamentos)
      .leftJoin(fornecedores, eq(fornecedores.id, lancamentos.fornecedorId))
      .where(
        and(
          eq(lancamentos.negocioId, negocioId),
          gte(lancamentos.data, inicio),
          lte(lancamentos.data, fim),
          ...(contaSelecionada
            ? [eq(lancamentos.contaId, contaSelecionada)]
            : []),
        ),
      )
      .orderBy(desc(lancamentos.data), desc(lancamentos.criadoEm)),
  ]);

  const lista: Lancamento[] = linhas.map(
    ({ fornecedorNome, pessoaNome, ...l }) => ({
      ...l,
      pessoa: fornecedorNome ?? pessoaNome,
    }),
  );
  const saldo = contaSelecionada
    ? (saldos.get(contaSelecionada) ?? 0)
    : [...saldos.values()].reduce((s, v) => s + v, 0);

  return (
    <TelaLancamentos
      contas={contas}
      categorias={categorias}
      fornecedores={listaFornecedores}
      lancamentos={lista}
      saldo={saldo}
      periodo={{ inicio, fim }}
      contaSelecionada={contaSelecionada}
      hoje={hoje}
    />
  );
}

function Carregando() {
  return (
    <>
      <Skeleton className="h-24 rounded-2xl" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-96 rounded-2xl" />
    </>
  );
}
