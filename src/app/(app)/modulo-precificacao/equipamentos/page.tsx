import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";

import { Skeleton } from "@/components/ui/skeleton";
import { obterNegocioAtualId } from "@/lib/negocio-atual";

import { garantirEquipamentosPadrao, listarEquipamentos } from "./dados";
import { ListaEquipamentos } from "./lista-equipamentos";

export const metadata: Metadata = { title: "Equipamentos · foodlilly" };

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
  await garantirEquipamentosPadrao(negocioId);
  const lista = await listarEquipamentos(negocioId);
  return <ListaEquipamentos equipamentos={lista} />;
}

function Carregando() {
  return (
    <>
      <Skeleton className="h-48 rounded-2xl" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
    </>
  );
}
