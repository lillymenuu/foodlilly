import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";

import { Skeleton } from "@/components/ui/skeleton";
import { obterNegocioAtualId } from "@/lib/negocio-atual";

import { garantirFuncionariosPadrao, listarFuncionarios } from "./dados";
import { ListaFuncionarios } from "./lista-funcionarios";

export const metadata: Metadata = { title: "Funcionários · foodlilly" };

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
  await garantirFuncionariosPadrao(negocioId);
  const lista = await listarFuncionarios(negocioId);
  return <ListaFuncionarios funcionarios={lista} />;
}

function Carregando() {
  return (
    <>
      <Skeleton className="h-48 rounded-2xl" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
    </>
  );
}
