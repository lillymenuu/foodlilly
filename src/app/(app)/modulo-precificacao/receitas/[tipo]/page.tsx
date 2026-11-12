import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { Skeleton } from "@/components/ui/skeleton";
import { obterNegocioAtualId } from "@/lib/negocio-atual";

import { carregarTudo, listarCategoriasFicha } from "../dados";
import { ListaFichas, type ItemLista } from "../lista-fichas";
import { INFO_TIPO, SEGMENTOS, type Segmento } from "../tipos";

export function generateStaticParams() {
  return Object.keys(SEGMENTOS).map((tipo) => ({ tipo }));
}

export async function generateMetadata({
  params,
}: PageProps<"/modulo-precificacao/receitas/[tipo]">): Promise<Metadata> {
  const { tipo } = await params;
  const t = SEGMENTOS[tipo as Segmento];
  return { title: t ? `${INFO_TIPO[t].titulo} · foodlilly` : "foodlilly" };
}

export default function Page({
  params,
}: PageProps<"/modulo-precificacao/receitas/[tipo]">) {
  // O tipo da URL é lido dentro do <Suspense>, para a navegação ser instantânea.
  return (
    <Suspense fallback={<Carregando />}>
      <Conteudo params={params} />
    </Suspense>
  );
}

async function Conteudo({
  params,
}: {
  params: PageProps<"/modulo-precificacao/receitas/[tipo]">["params"];
}) {
  const tipo = SEGMENTOS[(await params).tipo as Segmento];
  if (!tipo) notFound();
  await connection(); // dados do negócio: sempre lidos na hora
  const negocioId = await obterNegocioAtualId();
  const [{ fichas, resultados }, categorias] = await Promise.all([
    carregarTudo(negocioId),
    listarCategoriasFicha(negocioId, tipo),
  ]);
  const itens: ItemLista[] = fichas
    .filter((f) => f.tipo === tipo)
    .map((f) => {
      const r = resultados.get(f.id)!;
      return {
        id: f.id,
        nome: f.nome,
        categoriaId: f.categoriaId,
        favorito: f.favorito,
        pesoTotalG: f.pesoTotalG,
        custoTotal: r.custoTotal,
        custoKg: r.custoKg,
        custoPorcao: r.custoPorcao,
        preco: r.preco?.valido ? r.preco.preco : null,
        margem: f.margem,
        marketplace: r.preco?.valido ? r.preco.marketplace : [],
        atualizadoEm: f.atualizadoEm,
      };
    });
  return <ListaFichas tipo={tipo} itens={itens} categorias={categorias} />;
}

function Carregando() {
  return (
    <>
      <Skeleton className="h-56 rounded-2xl" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-64 rounded-2xl" />
        ))}
      </div>
    </>
  );
}
