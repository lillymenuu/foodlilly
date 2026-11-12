import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { eq } from "drizzle-orm";

import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/db";
import { dadosEntrada } from "@/db/schema";
import { obterNegocioAtualId } from "@/lib/negocio-atual";

import { campos, valoresPadrao, type Valores } from "./campos";
import { FormDadosEntrada } from "./form-dados-entrada";

export const metadata: Metadata = { title: "Dados de entrada · foodlilly" };

export default function Page() {
  return (
    <Suspense fallback={<Carregando />}>
      <Conteudo />
    </Suspense>
  );
}

async function Conteudo() {
  await connection(); // dados do negócio: sempre lidos na hora
  const negocioId = await obterNegocioAtualId();
  const [linha] = await db
    .select()
    .from(dadosEntrada)
    .where(eq(dadosEntrada.negocioId, negocioId))
    .limit(1);

  // Sem nada salvo ainda: mostra os valores sugeridos para o cliente ajustar.
  const valores: Valores = linha
    ? (Object.fromEntries(campos.map((c) => [c.chave, linha[c.chave]])) as Valores)
    : valoresPadrao;

  return <FormDadosEntrada inicial={valores} jaSalvo={Boolean(linha)} />;
}

function Carregando() {
  return (
    <>
      <Skeleton className="h-44 rounded-2xl" />
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-96 rounded-2xl" />
        ))}
      </div>
    </>
  );
}
