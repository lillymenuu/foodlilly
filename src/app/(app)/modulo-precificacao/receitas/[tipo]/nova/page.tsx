import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { obterNegocioAtualId } from "@/lib/negocio-atual";

import { montarEditor } from "../../dados";
import { CarregandoFicha } from "../../carregando-ficha";
import { EditorFicha } from "../../editor-ficha";
import { INFO_TIPO, SEGMENTOS, type Segmento } from "../../tipos";

export function generateStaticParams() {
  return Object.keys(SEGMENTOS).map((tipo) => ({ tipo }));
}

export async function generateMetadata({ params }: PageProps<"/modulo-precificacao/receitas/[tipo]/nova">): Promise<Metadata> {
  const { tipo } = await params;
  const t = SEGMENTOS[tipo as Segmento];
  return { title: t ? `Nov${t === "massa" ? "a" : "o"} ${INFO_TIPO[t].singular} · foodlilly` : "foodlilly" };
}

export default function Page({ params }: PageProps<"/modulo-precificacao/receitas/[tipo]/nova">) {
  // O tipo da URL é lido dentro do <Suspense>, para a navegação ser instantânea.
  return (
    <Suspense fallback={<CarregandoFicha />}>
      <Conteudo params={params} />
    </Suspense>
  );
}

async function Conteudo({ params }: { params: PageProps<"/modulo-precificacao/receitas/[tipo]/nova">["params"] }) {
  const tipo = SEGMENTOS[(await params).tipo as Segmento];
  if (!tipo) notFound();
  await connection();
  const negocioId = await obterNegocioAtualId();
  const props = await montarEditor(negocioId, tipo);
  if (!props) notFound();
  return <EditorFicha {...props} />;
}
