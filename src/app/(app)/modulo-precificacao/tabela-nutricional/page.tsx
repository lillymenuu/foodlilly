import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";

import { Skeleton } from "@/components/ui/skeleton";
import { obterNegocioAtualId } from "@/lib/negocio-atual";

import { carregarNutricao } from "./dados";
import { TelaTabelas } from "./tela-tabelas";

export const metadata: Metadata = { title: "Tabela nutricional · foodlilly" };

export default function Page() {
  return (
    <Suspense
      fallback={
        <>
          <Skeleton className="h-44 rounded-2xl" />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-52 rounded-2xl" />
            ))}
          </div>
        </>
      }
    >
      <Conteudo />
    </Suspense>
  );
}

async function Conteudo() {
  await connection(); // dados do negócio: sempre lidos na hora
  const negocioId = await obterNegocioAtualId();
  const dados = await carregarNutricao(negocioId);
  return <TelaTabelas {...dados} />;
}
