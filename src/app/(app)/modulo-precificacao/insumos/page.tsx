import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";

import { Skeleton } from "@/components/ui/skeleton";
import { obterNegocioAtualId } from "@/lib/negocio-atual";

import { garantirCategoriasPadrao, listarCategorias, listarInsumos } from "./dados";
import { TelaInsumos } from "./tela-insumos";

export const metadata: Metadata = { title: "Insumos · foodlilly" };

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
  await garantirCategoriasPadrao(negocioId);
  const [insumos, categorias] = await Promise.all([listarInsumos(negocioId), listarCategorias(negocioId)]);
  return <TelaInsumos insumos={insumos} categorias={categorias} />;
}

function Carregando() {
  return (
    <>
      <Skeleton className="h-56 rounded-2xl" />
      <Skeleton className="h-20 rounded-2xl" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 min-[1100px]:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-56 rounded-2xl" />
        ))}
      </div>
    </>
  );
}
