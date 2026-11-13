import { Suspense } from "react";
import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { connection } from "next/server";

import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/db";
import { negocios } from "@/db/schema";
import { obterNegocioAtualId } from "@/lib/negocio-atual";

import { carregarTudo, listarCategoriasFicha } from "../receitas/dados";
import { TelaRelatorio } from "./tela-relatorio";
import type { AppEntrega, ProdutoRelatorio } from "./tipos";

export const metadata: Metadata = { title: "Relatórios · foodlilly" };

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
  const [{ fichas, resultados, contexto }, categorias, [negocio]] =
    await Promise.all([
      carregarTudo(negocioId),
      listarCategoriasFicha(negocioId, "produto"),
      db
        .select({ margemMeta: negocios.margemMeta, nome: negocios.nome })
        .from(negocios)
        .where(eq(negocios.id, negocioId))
        .limit(1),
    ]);
  const nomeCategoria = new Map(categorias.map((c) => [c.id, c.nome]));
  const apps: AppEntrega[] = contexto.parametros.apps;

  const produtos: ProdutoRelatorio[] = [];
  let semPreco = 0;
  for (const f of fichas) {
    if (f.tipo !== "produto") continue;
    const r = resultados.get(f.id);
    const p = r?.preco;
    if (!r || !p?.valido || p.preco <= 0) {
      semPreco++;
      continue;
    }
    const porcao = (v: number) => v / (f.rendimento > 0 ? f.rendimento : 1);
    produtos.push({
      id: f.id,
      nome: f.nome,
      categoria: nomeCategoria.get(f.categoriaId ?? "") ?? "Sem categoria",
      preco: p.preco,
      custo: p.fabricacao,
      lucro: p.preco - p.fabricacao,
      margem: f.margem ?? 0,
      composicao: {
        ingredientes: porcao(r.custos.ingrediente),
        embalagens: porcao(r.custos.embalagem),
        receitas: porcao(r.custos.receita + r.custos.produto),
        maoObra: porcao(r.custos.mao_obra),
        equipamentos: porcao(r.custos.equipamento),
      },
      pesoTotalG: f.pesoTotalG,
      rendimento: f.rendimento,
      revenda: p.revenda,
      // Mesmo cálculo da ficha (preço ÷ (1 − taxa)), um valor por app, na ordem de `apps`.
      marketplace: apps.map((a) =>
        a.taxa > 0 && a.taxa < 1 ? p.preco / (1 - a.taxa) : p.preco,
      ),
      precoKg: p.precoKg,
      margemValor: p.lucro,
      receitas: f.itens.filter(
        (i) => i.tipo === "receita" || i.tipo === "produto",
      ).length,
    });
  }

  return (
    <TelaRelatorio
      produtos={produtos}
      semPreco={semPreco}
      margemMeta={negocio?.margemMeta ?? 30}
      negocio={negocio?.nome ?? ""}
      apps={apps}
    />
  );
}

function Carregando() {
  return (
    <>
      <Skeleton className="h-44 rounded-2xl" />
      <Skeleton className="h-12 w-full max-w-lg rounded-full" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-96 rounded-2xl" />
    </>
  );
}
