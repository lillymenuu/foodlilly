import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { z } from "zod";

import { obterNegocioAtualId } from "@/lib/negocio-atual";

import { CarregandoFicha } from "../../carregando-ficha";
import { montarEditor } from "../../dados";
import { EditorFicha } from "../../editor-ficha";

export const metadata: Metadata = { title: "Ficha técnica · foodlilly" };

export default function Page({ params }: PageProps<"/modulo-precificacao/receitas/ficha/[id]">) {
  return (
    <Suspense fallback={<CarregandoFicha />}>
      <Conteudo params={params} />
    </Suspense>
  );
}

async function Conteudo({ params }: { params: PageProps<"/modulo-precificacao/receitas/ficha/[id]">["params"] }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  await connection();
  const negocioId = await obterNegocioAtualId();
  // O tipo vem da própria ficha; "massa" é só o valor de partida.
  const props = await montarEditor(negocioId, "massa", id);
  if (!props) notFound();
  return <EditorFicha key={props.ficha?.atualizadoEm} {...props} />;
}
