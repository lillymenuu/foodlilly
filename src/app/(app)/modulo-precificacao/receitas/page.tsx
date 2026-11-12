import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { ChevronRight, FileText, Soup, Sparkles, Tags, type LucideIcon } from "lucide-react";
import { and, count, eq } from "drizzle-orm";

import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/db";
import { categoriasFicha, categoriasInsumo, fichas } from "@/db/schema";
import { obterNegocioAtualId } from "@/lib/negocio-atual";
import { plural } from "@/lib/texto";

import type { TipoFicha } from "./calculo";
import { BASE, INFO_TIPO } from "./tipos";

export const metadata: Metadata = { title: "Receitas e produtos · foodlilly" };

export default function Page() {
  return (
    <>
      <section className="flex items-center gap-4 rounded-2xl bg-primary p-5 text-primary-foreground sm:p-6">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-highlight text-highlight-foreground">
          <Soup className="size-6" />
        </span>
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Receitas e produtos</h1>
          <p className="mt-0.5 text-sm text-primary-foreground/75">
            Monte as fichas técnicas e descubra o custo real e o preço de venda.
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Receitas e produtos</h2>
        <Suspense fallback={<div className="grid gap-3 sm:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>}>
          <CardsTipos />
        </Suspense>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Ferramentas</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Suspense
            fallback={
              <Card href={`${BASE}/categorias`} icone={Tags} titulo="Categorias" descricao="Organize massas, recheios, produtos e insumos." />
            }
          >
            <CardCategorias />
          </Suspense>
          <Card href="/modulo-precificacao/simulador" icone={Sparkles} titulo="Simulador de promoções" descricao="Monte combos e descontos sem perder margem." />
          <Card href="/modulo-precificacao/relatorios" icone={FileText} titulo="Relatórios" descricao="Margens, custos e preços em gráficos." />
        </div>
      </section>
    </>
  );
}

async function CardCategorias() {
  await connection();
  const negocioId = await obterNegocioAtualId();
  const [[fichasCat], [insumosCat]] = await Promise.all([
    db.select({ total: count() }).from(categoriasFicha).where(eq(categoriasFicha.negocioId, negocioId)),
    db.select({ total: count() }).from(categoriasInsumo).where(eq(categoriasInsumo.negocioId, negocioId)),
  ]);
  return (
    <Card
      href={`${BASE}/categorias`}
      icone={Tags}
      titulo="Categorias"
      descricao="Organize massas, recheios, produtos e insumos."
      selo={plural(fichasCat.total + insumosCat.total, "categoria", "categorias")}
    />
  );
}

async function CardsTipos() {
  await connection();
  const negocioId = await obterNegocioAtualId();
  const contagem = await db
    .select({ tipo: fichas.tipo, total: count() })
    .from(fichas)
    .where(and(eq(fichas.negocioId, negocioId)))
    .groupBy(fichas.tipo);
  const total = (t: TipoFicha) => contagem.find((c) => c.tipo === t)?.total ?? 0;

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {(["massa", "recheio", "produto"] as const).map((t) => {
        const info = INFO_TIPO[t];
        return (
          <Card
            key={t}
            href={`${BASE}/${info.segmento}`}
            icone={info.icone}
            titulo={info.titulo}
            descricao={info.descricao}
            selo={plural(total(t), info.singular, info.plural)}
          />
        );
      })}
    </div>
  );
}

function Card({
  href,
  icone: Icone,
  titulo,
  descricao,
  selo,
}: {
  href: string;
  icone: LucideIcon;
  titulo: string;
  descricao: string;
  selo?: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-xl bg-card p-4 ring-1 ring-foreground/10 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-md hover:ring-2 hover:ring-highlight focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary transition-colors group-hover:bg-highlight group-hover:text-highlight-foreground">
        <Icone className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2 font-semibold">
          {titulo}
          {selo && <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">{selo}</span>}
        </span>
        <span className="mt-0.5 block text-sm text-muted-foreground">{descricao}</span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
