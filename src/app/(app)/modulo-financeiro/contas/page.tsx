import { Suspense } from "react";
import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { connection } from "next/server";

import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/db";
import { contasBancarias, fornecedores } from "@/db/schema";
import { obterNegocioAtualId } from "@/lib/negocio-atual";

import { garantirCategoriasPadrao, listarCategorias } from "./dados-categorias";
import { TelaContas } from "./tela-contas";
import type { Conta } from "./tipos";

export const metadata: Metadata = { title: "Contas e categorias · foodlilly" };

export default function Page({
  searchParams,
}: PageProps<"/modulo-financeiro/contas">) {
  return (
    <Suspense fallback={<Carregando />}>
      <Conteudo searchParams={searchParams} />
    </Suspense>
  );
}

async function Conteudo({
  searchParams,
}: {
  searchParams: PageProps<"/modulo-financeiro/contas">["searchParams"];
}) {
  await connection();
  const negocioId = await obterNegocioAtualId();
  const { aba } = await searchParams;
  const linhas = await db
    .select()
    .from(contasBancarias)
    .where(eq(contasBancarias.negocioId, negocioId))
    .orderBy(asc(contasBancarias.criadoEm));
  const contas: Conta[] = linhas.map((c) => ({
    id: c.id,
    nome: c.nome,
    tipo: c.tipo,
    saldoInicial: c.saldoInicial,
    dataSaldoInicial: c.dataSaldoInicial,
    // Sem lançamentos ainda: o saldo atual é o inicial. Quando os lançamentos existirem, somar aqui.
    saldoAtual: c.saldoInicial,
    padrao: c.padrao,
    cor: c.cor,
  }));
  // Padrão primeiro.
  contas.sort((a, b) => Number(b.padrao) - Number(a.padrao));
  // Categorias padrão (Vendas → Revendas) quando já existe conta.
  if (contas.length) await garantirCategoriasPadrao(negocioId);
  const [categorias, listaFornecedores] = contas.length
    ? await Promise.all([
        listarCategorias(negocioId),
        db
          .select({
            id: fornecedores.id,
            nome: fornecedores.nome,
            telefone: fornecedores.telefone,
            documento: fornecedores.documento,
            email: fornecedores.email,
            observacoes: fornecedores.observacoes,
          })
          .from(fornecedores)
          .where(eq(fornecedores.negocioId, negocioId))
          .orderBy(asc(fornecedores.nome)),
      ])
    : [[], []];
  return (
    <TelaContas
      contas={contas}
      categorias={categorias}
      fornecedores={listaFornecedores}
      abaInicial={
        aba === "categorias" || aba === "fornecedores" ? aba : undefined
      }
    />
  );
}

function Carregando() {
  return (
    <>
      <Skeleton className="h-52 rounded-2xl" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="aspect-[1.6] rounded-2xl" />
        ))}
      </div>
    </>
  );
}
