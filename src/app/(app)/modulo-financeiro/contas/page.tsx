import { Suspense } from "react";
import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { connection } from "next/server";

import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/db";
import { contasBancarias } from "@/db/schema";
import { obterNegocioAtualId } from "@/lib/negocio-atual";

import { TelaContas } from "./tela-contas";
import type { Conta } from "./tipos";

export const metadata: Metadata = { title: "Contas e categorias · foodlilly" };

export default function Page() {
  return (
    <Suspense fallback={<Carregando />}>
      <Conteudo />
    </Suspense>
  );
}

async function Conteudo() {
  await connection();
  const negocioId = await obterNegocioAtualId();
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
  return <TelaContas contas={contas} />;
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
