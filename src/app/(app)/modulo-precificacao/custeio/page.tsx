import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { asc, eq } from "drizzle-orm";

import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/db";
import { custeio, custosExtras } from "@/db/schema";
import { obterNegocioAtualId } from "@/lib/negocio-atual";

import { campos, valoresPadrao, type ValoresCusteio } from "./campos";
import { FormCusteio } from "./form-custeio";

export const metadata: Metadata = { title: "Custeio · foodlilly" };

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

  const [[linha], extras] = await Promise.all([
    db.select().from(custeio).where(eq(custeio.negocioId, negocioId)).limit(1),
    db
      .select({ descricao: custosExtras.descricao, valor: custosExtras.valor })
      .from(custosExtras)
      .where(eq(custosExtras.negocioId, negocioId))
      .orderBy(asc(custosExtras.ordem)),
  ]);

  // Sem nada salvo ainda: mostra os valores sugeridos para o cliente ajustar.
  const valores: ValoresCusteio = linha
    ? (Object.fromEntries(
        campos.map((c) => [c.chave, linha[c.chave]]),
      ) as ValoresCusteio)
    : valoresPadrao;

  return (
    <FormCusteio
      inicial={valores}
      extrasIniciais={extras}
      jaSalvo={Boolean(linha)}
    />
  );
}

function Carregando() {
  return (
    <>
      <Skeleton className="h-44 rounded-2xl" />
      <Skeleton className="h-24 rounded-2xl" />
      <Skeleton className="h-36 rounded-2xl" />
      <Skeleton className="h-80 rounded-2xl" />
    </>
  );
}
