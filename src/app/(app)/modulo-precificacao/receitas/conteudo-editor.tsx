import { notFound } from "next/navigation";
import { connection } from "next/server";
import { z } from "zod";

import { obterNegocioAtualId } from "@/lib/negocio-atual";

import { montarEditor } from "./dados";
import { EditorFicha } from "./editor-ficha";
import { SEGMENTOS, type Segmento } from "./tipos";

/** Editor de uma ficha salva (página /ficha/[id] e modal interceptado). */
export async function ConteudoFicha({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  await connection();
  const negocioId = await obterNegocioAtualId();
  // O tipo vem da própria ficha; "massa" é só o valor de partida.
  const props = await montarEditor(negocioId, "massa", id);
  if (!props) notFound();
  return <EditorFicha key={props.ficha?.atualizadoEm} {...props} />;
}

/** Editor de ficha nova (página /[tipo]/nova e modal interceptado). */
export async function ConteudoNova({
  params,
}: {
  params: Promise<{ tipo: string }>;
}) {
  const tipo = SEGMENTOS[(await params).tipo as Segmento];
  if (!tipo) notFound();
  await connection();
  const negocioId = await obterNegocioAtualId();
  const props = await montarEditor(negocioId, tipo);
  if (!props) notFound();
  return <EditorFicha {...props} />;
}
