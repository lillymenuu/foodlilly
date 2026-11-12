import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";

import { Skeleton } from "@/components/ui/skeleton";
import { obterNegocioAtualId } from "@/lib/negocio-atual";

import { garantirCategoriasPadrao, listarCategorias } from "../../insumos/dados";
import { listarCategoriasFicha } from "../dados";
import { TelaCategorias } from "./tela-categorias";

export const metadata: Metadata = { title: "Categorias · foodlilly" };

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
  const [massa, recheio, produto, insumos] = await Promise.all([
    listarCategoriasFicha(negocioId, "massa"),
    listarCategoriasFicha(negocioId, "recheio"),
    listarCategoriasFicha(negocioId, "produto"),
    listarCategorias(negocioId),
  ]);
  return <TelaCategorias fichas={{ massa, recheio, produto }} insumos={insumos} />;
}

function Carregando() {
  return (
    <>
      <Skeleton className="h-52 rounded-2xl" />
      {Array.from({ length: 5 }, (_, i) => (
        <Skeleton key={i} className="h-16 rounded-xl" />
      ))}
    </>
  );
}
