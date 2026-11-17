"use client";

import { useLayoutEffect, useState } from "react";
import Link from "next/link";
import {
  Apple,
  ArrowRight,
  CircleAlert,
  CircleCheck,
  Info,
  Scale,
  Search,
  ShoppingBag,
  Wheat,
} from "lucide-react";

import { notificar } from "@/components/notificacoes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sugerirCategoria } from "@/config/porcoes-anvisa";
import { escalar, lupaSugerida } from "@/lib/nutricao";
import { normalizar } from "@/lib/texto";

import { ModalInsumo } from "../insumos/modais-insumo";
import type { Categoria, Insumo } from "../insumos/tipos";
import { BASE } from "../receitas/tipos";
import { BASE_TABELA, type ProdutoNutricao } from "./tipos";

const kcal = (v: number) => Math.round(v).toLocaleString("pt-BR");

export function TelaTabelas({
  produtos,
  insumos,
  categorias,
}: {
  produtos: ProdutoNutricao[];
  insumos: Insumo[];
  categorias: Categoria[];
}) {
  const [busca, setBusca] = useState("");
  const [editando, setEditando] = useState<Insumo | null>(null);
  // Com Cache Components a página fica escondida (Activity) ao navegar: fecha o modal.
  useLayoutEffect(() => () => setEditando(null), []);

  const termo = normalizar(busca);
  const filtrados = produtos.filter((p) =>
    normalizar(p.nome).includes(termo),
  );
  const prontos = filtrados.filter((p) => p.completa);
  const pendentes = filtrados.filter((p) => !p.completa);
  const totalProntos = produtos.filter((p) => p.completa).length;
  const insumoPorId = new Map(insumos.map((i) => [i.id, i]));

  return (
    <>
      <section className="flex flex-col gap-5 rounded-2xl bg-primary p-5 text-primary-foreground sm:p-6">
        <div className="flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-highlight text-highlight-foreground">
            <Apple className="size-6" />
          </span>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Tabela nutricional
            </h1>
            <p className="mt-0.5 max-w-xl text-sm text-primary-foreground/75">
              Calculada pela ficha técnica de cada produto e pela informação
              nutricional dos insumos (rótulo ou TACO), no modelo da ANVISA.
            </p>
          </div>
        </div>
        <ul className="flex flex-wrap gap-2 text-xs font-medium">
          <li className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/15">
            <CircleCheck className="size-3.5 text-highlight" />
            {totalProntos} {totalProntos === 1 ? "pronto" : "prontos"}
          </li>
          <li className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/15">
            <CircleAlert className="size-3.5 text-highlight" />
            {produtos.length - totalProntos} com dados faltando
          </li>
        </ul>
        {produtos.length > 0 && (
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar produto"
              aria-label="Buscar produto"
              className="h-10 bg-card pl-9 text-foreground"
            />
          </div>
        )}
      </section>

      <p className="flex items-start gap-2 rounded-xl bg-primary-soft/60 px-4 py-3 text-xs text-primary sm:text-sm">
        <Info className="mt-0.5 size-4 shrink-0" />
        <span>
          Produtos preparados e vendidos no próprio estabelecimento não são
          obrigados a ter tabela (IN 75/2020, Anexo I), mas ela pode ser usada
          voluntariamente. Os valores são estimados pelas receitas: confira antes
          de imprimir no rótulo.
        </span>
      </p>

      {produtos.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-card px-6 py-14 text-center ring-1 ring-foreground/10">
          <span className="flex size-12 items-center justify-center rounded-full bg-highlight-soft text-highlight-foreground">
            <ShoppingBag className="size-6" />
          </span>
          <p className="font-medium">Nenhum produto cadastrado ainda.</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Crie a ficha técnica de um produto para gerar a tabela nutricional.
          </p>
          <Button render={<Link href={`${BASE}/produtos`} />}>
            Ir para Produtos
          </Button>
        </div>
      ) : (
        <>
          {prontos.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-base font-semibold">Prontos para a tabela</h2>
              <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {prontos.map((p) => (
                  <CardPronto key={p.id} produto={p} />
                ))}
              </ul>
            </section>
          )}

          {pendentes.length > 0 && (
            <section className="flex flex-col gap-3">
              <div>
                <h2 className="text-base font-semibold">Faltam dados</h2>
                <p className="text-sm text-muted-foreground">
                  Complete a informação nutricional dos ingredientes para liberar
                  a tabela.
                </p>
              </div>
              <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {pendentes.map((p) => (
                  <li
                    key={p.id}
                    className="flex flex-col gap-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/10"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="min-w-0 font-semibold">{p.nome}</h3>
                      <span className="shrink-0 rounded-full bg-highlight-soft px-2 py-0.5 text-xs font-semibold text-highlight-foreground">
                        {p.pendencias.length || 1}{" "}
                        {(p.pendencias.length || 1) === 1 ? "pendência" : "pendências"}
                      </span>
                    </div>
                    <ul className="flex flex-col divide-y rounded-xl border">
                      {p.pendencias.length === 0 && (
                        <li className="px-3 py-2 text-sm text-muted-foreground">
                          A ficha ainda não tem ingredientes.
                        </li>
                      )}
                      {p.pendencias.map((d) => (
                        <li
                          key={`${d.tipo}-${d.id}-${d.motivo}`}
                          className="flex items-center gap-2 px-3 py-2"
                        >
                          {d.tipo === "insumo" ? (
                            <Wheat className="size-4 shrink-0 text-highlight-strong" />
                          ) : (
                            <Scale className="size-4 shrink-0 text-highlight-strong" />
                          )}
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">
                              {d.nome}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              {d.tipo === "ficha"
                                ? "Ficha sem peso total"
                                : d.motivo === "sem_peso"
                                  ? "Falta o peso da unidade"
                                  : "Sem informação nutricional"}
                            </span>
                          </span>
                          {d.tipo === "insumo" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const i = insumoPorId.get(d.id);
                                if (i) setEditando(i);
                              }}
                            >
                              Completar
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              render={<Link href={`${BASE}/ficha/${d.id}`} />}
                            >
                              Abrir ficha
                            </Button>
                          )}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {!prontos.length && !pendentes.length && (
            <p className="rounded-2xl bg-card px-6 py-10 text-center text-sm text-muted-foreground ring-1 ring-foreground/10">
              Nada encontrado para &quot;{busca}&quot;.
            </p>
          )}
        </>
      )}

      {editando && (
        <ModalInsumo
          insumo={editando}
          categorias={categorias}
          onFechar={() => setEditando(null)}
          onConcluido={(titulo, descricao) => {
            setEditando(null);
            notificar.sucesso(titulo, descricao);
          }}
        />
      )}
    </>
  );
}

function CardPronto({ produto: p }: { produto: ProdutoNutricao }) {
  const categoria = sugerirCategoria(p.nome);
  const porcaoG = p.config?.porcaoG ?? categoria.porcao;
  const liquido = p.config?.liquido ?? Boolean(categoria.liquido);
  const porcao = escalar(p.por100!, porcaoG / 100);
  const u = liquido ? "ml" : "g";
  const lupa = p.config?.lupa ?? lupaSugerida(p.por100!, liquido);
  const alertas = [
    lupa.acucar && "Açúcar",
    lupa.saturada && "Gord. saturada",
    lupa.sodio && "Sódio",
  ].filter(Boolean) as string[];

  return (
    <li className="flex flex-col gap-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
      <div className="flex items-start justify-between gap-2">
        <h3 className="min-w-0 font-semibold">{p.nome}</h3>
        <span
          className={
            p.config
              ? "shrink-0 rounded-full bg-success/15 px-2 py-0.5 text-xs font-semibold text-success"
              : "shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground"
          }
        >
          {p.config ? "Configurada" : "Porção sugerida"}
        </span>
      </div>
      <dl className="grid grid-cols-3 gap-2 text-center">
        {[
          ["Porção", `${porcaoG.toLocaleString("pt-BR")} ${u}`],
          ["Energia", `${kcal(porcao.kcal)} kcal`],
          ["Sódio", `${kcal(porcao.sodio)} mg`],
        ].map(([r, v]) => (
          <div key={r} className="rounded-xl bg-muted/60 px-2 py-2">
            <dt className="text-[11px] text-muted-foreground">{r}</dt>
            <dd className="text-sm font-semibold tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="flex min-h-6 flex-wrap gap-1.5">
        {alertas.length ? (
          alertas.map((a) => (
            <span
              key={a}
              className="rounded-full bg-foreground px-2 py-0.5 text-[11px] font-bold text-background uppercase"
            >
              Alto em {a}
            </span>
          ))
        ) : (
          <span className="text-xs text-muted-foreground">Sem advertência frontal</span>
        )}
      </div>
      <Button
        variant="highlight"
        className="mt-auto"
        render={<Link href={`${BASE_TABELA}/${p.id}`} />}
      >
        Ver tabela
        <ArrowRight data-icon="inline-end" />
      </Button>
    </li>
  );
}
