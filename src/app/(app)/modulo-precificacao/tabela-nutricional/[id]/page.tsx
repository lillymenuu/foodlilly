import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { z } from "zod";

import { Skeleton } from "@/components/ui/skeleton";
import { obterNegocioAtualId } from "@/lib/negocio-atual";

import { carregarNutricao } from "../dados";
import { EditorTabela } from "../editor-tabela";
import { BASE_TABELA } from "../tipos";

export const metadata: Metadata = { title: "Tabela nutricional · foodlilly" };

export default function Page({
  params,
}: PageProps<"/modulo-precificacao/tabela-nutricional/[id]">) {
  return (
    <Suspense
      fallback={
        <>
          <Skeleton className="h-12 w-72 rounded-xl" />
          <div className="grid gap-5 lg:grid-cols-[1fr_400px]">
            <Skeleton className="h-96 rounded-2xl" />
            <Skeleton className="h-96 rounded-2xl" />
          </div>
        </>
      }
    >
      <Conteudo params={params} />
    </Suspense>
  );
}

async function Conteudo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  await connection();
  const negocioId = await obterNegocioAtualId();
  const { produtos } = await carregarNutricao(negocioId);
  const p = produtos.find((x) => x.id === id);
  if (!p) notFound();
  // Ainda faltam dados: volta para a lista, que mostra o que completar.
  if (!p.completa || !p.por100 || !p.pesoTotalG) redirect(BASE_TABELA);
  return (
    <EditorTabela
      key={JSON.stringify(p.config)}
      id={p.id}
      nome={p.nome}
      pesoTotalG={p.pesoTotalG}
      por100={p.por100}
      config={p.config}
    />
  );
}
