"use client";

import { useState } from "react";
import { Pie, PieChart, Sector } from "recharts";
import {
  CircleCheck,
  CircleDollarSign,
  Lightbulb,
  Percent,
  ReceiptText,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  Trophy,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";

import { NumeroAnimado } from "@/components/numero-animado";
import { Button } from "@/components/ui/button";
import { ChartContainer } from "@/components/ui/chart";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatarMoeda, formatarPercentual } from "@/lib/numero-br";

import { LIMITE_ATENCAO, LIMITE_CUSTO_FIXO } from "./campos";
import type { GrupoResumo } from "./resumo-financeiro";

/** Cor de cada grupo pela posição (ordem fixa do Custeio; paleta validada para daltonismo). */
const CORES = [
  "var(--serie-1)",
  "var(--serie-2)",
  "var(--serie-3)",
  "var(--serie-4)",
  "var(--serie-5)",
];

export type Situacao = { rotulo: string; texto: string; selo: string };

const pctTexto = (v: number) => formatarPercentual(v, 1);

export function ModalResumo({
  receita,
  totalCustos,
  grupos,
  situacao,
  onFechar,
}: {
  receita: number;
  totalCustos: number;
  grupos: GrupoResumo[];
  situacao: Situacao | null;
  onFechar: () => void;
}) {
  const [ativo, setAtivo] = useState<number | null>(null);
  const aliquota = receita > 0 ? totalCustos / receita : null;
  const margem = receita - totalCustos;
  const dados = grupos.map((g, i) => ({
    ...g,
    cor: CORES[i % CORES.length],
    total: g.itens.reduce((s, it) => s + it.valor, 0),
    indice: i,
  }));
  const comValor = dados.filter((g) => g.total > 0);
  const ranking = dados
    .flatMap((g) =>
      g.itens
        .filter((it) => it.valor > 0)
        .map((it) => ({ ...it, grupo: g.titulo, cor: g.cor })),
    )
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 6);
  const maiorItem = ranking[0]?.valor ?? 0;

  return (
    <Dialog open onOpenChange={(aberto) => !aberto && onFechar()}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden bg-background p-0 sm:max-w-4xl max-sm:inset-0 max-sm:h-dvh max-sm:max-h-dvh max-sm:w-full max-sm:max-w-full max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none"
      >
        {/* Cabeçalho */}
        <header className="relative shrink-0 overflow-hidden bg-gradient-to-br from-primary to-primary-strong px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-5 text-primary-foreground sm:px-7 sm:pt-5 sm:pb-6">
          <svg
            aria-hidden
            viewBox="0 0 200 100"
            className="pointer-events-none absolute -right-4 -bottom-2 h-28 w-auto opacity-40"
            fill="none"
          >
            {[30, 48, 38, 66, 54, 80].map((h, i) => (
              <rect
                key={i}
                x={10 + i * 32}
                y={96 - h}
                width="18"
                height={h}
                rx="3"
                className="origin-bottom fill-white/10 animate-[crescer-y_600ms_ease-out_both] motion-reduce:animate-none"
                style={{
                  animationDelay: `${150 + i * 60}ms`,
                  transformBox: "fill-box",
                }}
              />
            ))}
          </svg>
          <div className="relative flex items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-highlight text-highlight-foreground shadow-lg shadow-black/20">
              <ReceiptText className="size-6" />
            </span>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-xl font-semibold tracking-tight">
                Resumo financeiro
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-sm text-primary-foreground/75">
                Seus custos fixos do mês comparados com a receita bruta.
              </DialogDescription>
              {situacao && aliquota != null && (
                <span
                  className={cn(
                    "mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                    situacao.selo,
                    "bg-white ring-1 ring-white/50",
                  )}
                >
                  {situacao.rotulo === "Saudável" ? (
                    <CircleCheck className="size-3.5" />
                  ) : (
                    <TriangleAlert className="size-3.5" />
                  )}
                  Situação: {situacao.rotulo}
                </span>
              )}
            </div>
            <DialogClose
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="-mt-1 -mr-2 text-primary-foreground hover:bg-white/15 hover:text-primary-foreground"
                />
              }
              aria-label="Fechar"
            >
              <X />
            </DialogClose>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain p-4 sm:p-6">
          {/* Indicadores */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Indicador
              titulo="Receita bruta"
              icone={CircleDollarSign}
              classeIcone="bg-serie-1/12 text-serie-1"
              rodape="Faturamento do mês"
            >
              <NumeroAnimado valor={receita} formato={formatarMoeda} />
            </Indicador>
            <Indicador
              titulo="Custos fixos"
              icone={TrendingDown}
              classeIcone="bg-serie-2/12 text-serie-2"
              rodape={`${comValor.length} de ${grupos.length} grupos com valores`}
              atraso={60}
            >
              <NumeroAnimado valor={totalCustos} formato={formatarMoeda} />
            </Indicador>
            <Indicador
              titulo="Margem líquida"
              icone={TrendingUp}
              classeIcone={
                margem >= 0
                  ? "bg-success/12 text-success"
                  : "bg-destructive/10 text-destructive"
              }
              rodape={
                aliquota != null
                  ? `${pctTexto(1 - aliquota)} da receita`
                  : "Informe a receita"
              }
              atraso={120}
              classeValor={margem >= 0 ? "text-success" : "text-destructive"}
            >
              <NumeroAnimado valor={margem} formato={formatarMoeda} />
            </Indicador>
            <Indicador
              titulo="Alíquota"
              icone={Percent}
              classeIcone={
                situacao ? situacao.selo : "bg-muted text-muted-foreground"
              }
              rodape="Custos fixos ÷ receita"
              atraso={180}
              classeValor={situacao?.texto}
            >
              {aliquota != null ? (
                <NumeroAnimado
                  valor={aliquota * 100}
                  formato={(v) =>
                    `${v.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
                  }
                />
              ) : (
                "—"
              )}
            </Indicador>
          </div>

          {/* Para onde vai a receita */}
          {aliquota != null && (
            <BarraReceita
              receita={receita}
              grupos={comValor}
              aliquota={aliquota}
              ativo={ativo}
              onAtivo={setAtivo}
            />
          )}

          {/* Rosca + grupos */}
          <div className="grid gap-3 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <section className="flex flex-col items-center gap-3 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
              <h3 className="self-start text-sm font-semibold">
                Custos por grupo
              </h3>
              {comValor.length ? (
                <Rosca
                  dados={comValor}
                  total={totalCustos}
                  ativo={ativo}
                  onAtivo={setAtivo}
                />
              ) : (
                <p className="py-12 text-sm text-muted-foreground">
                  Nenhum custo informado ainda.
                </p>
              )}
            </section>
            <ul className="flex flex-col gap-2">
              {dados.map((g, i) => {
                const parte = totalCustos ? g.total / totalCustos : 0;
                const sel = ativo === g.indice;
                return (
                  <li
                    key={g.titulo}
                    onMouseEnter={() => g.total > 0 && setAtivo(g.indice)}
                    onMouseLeave={() => setAtivo(null)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl bg-card p-3 ring-1 ring-foreground/10 transition-[transform,box-shadow,opacity] duration-200 animate-in fade-in slide-in-from-right-2 motion-reduce:animate-none",
                      sel && "-translate-y-0.5 shadow-md ring-2",
                      ativo != null && !sel && "opacity-55",
                    )}
                    style={{
                      animationDelay: `${i * 60}ms`,
                      animationFillMode: "both",
                      ...(sel ? { ["--tw-ring-color" as string]: g.cor } : {}),
                    }}
                  >
                    <span
                      className="flex size-9 shrink-0 items-center justify-center rounded-lg text-white"
                      style={{ background: g.cor }}
                    >
                      <g.icone className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm font-medium">
                          {g.titulo}
                        </span>
                        <span className="shrink-0 text-sm font-semibold tabular-nums">
                          {formatarMoeda(g.total)}
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full origin-left rounded-full animate-[crescer-x_700ms_ease-out_both] motion-reduce:animate-none"
                            style={{
                              width: `${parte * 100}%`,
                              background: g.cor,
                              animationDelay: `${200 + i * 60}ms`,
                            }}
                          />
                        </div>
                        <span className="w-12 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                          {pctTexto(parte)}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Maiores custos */}
          {ranking.length > 0 && (
            <section className="rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Trophy className="size-4 text-highlight-strong" />
                Maiores custos do mês
              </h3>
              <ol className="flex flex-col gap-2.5">
                {ranking.map((it, i) => (
                  <li
                    key={`${it.grupo}-${it.rotulo}`}
                    className="grid grid-cols-[1.25rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 text-sm"
                  >
                    <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                      {i + 1}º
                    </span>
                    <span className="min-w-0 truncate">
                      {it.rotulo}
                      <span className="ml-1.5 text-xs text-muted-foreground">
                        · {it.grupo}
                      </span>
                    </span>
                    <span className="text-right font-semibold tabular-nums">
                      {formatarMoeda(it.valor)}
                      {receita > 0 && (
                        <span className="ml-1.5 text-xs font-normal text-muted-foreground max-sm:hidden">
                          {pctTexto(it.valor / receita)} da receita
                        </span>
                      )}
                    </span>
                    <div className="col-start-2 col-end-4 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full origin-left rounded-full animate-[crescer-x_700ms_ease-out_both] motion-reduce:animate-none"
                        style={{
                          width: `${(it.valor / maiorItem) * 100}%`,
                          background: it.cor,
                          animationDelay: `${300 + i * 70}ms`,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* Dica conforme a situação */}
          {aliquota != null && (
            <Dica
              aliquota={aliquota}
              maior={ranking[0]}
              receita={receita}
              totalCustos={totalCustos}
            />
          )}
        </div>

        <footer className="flex shrink-0 justify-end border-t bg-card px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-3">
          <DialogClose render={<Button variant="outline" size="lg" />}>
            Fechar
          </DialogClose>
        </footer>
      </DialogContent>
    </Dialog>
  );
}

function Indicador({
  titulo,
  icone: Icone,
  classeIcone,
  classeValor,
  rodape,
  atraso = 0,
  children,
}: {
  titulo: string;
  icone: LucideIcon;
  classeIcone: string;
  classeValor?: string;
  rodape: string;
  atraso?: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className="group flex flex-col gap-1 rounded-2xl bg-card p-4 ring-1 ring-foreground/10 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-lg animate-in fade-in slide-in-from-bottom-3 motion-reduce:animate-none motion-reduce:hover:translate-y-0"
      style={{ animationDelay: `${atraso}ms`, animationFillMode: "both" }}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          {titulo}
        </span>
        <span
          className={cn(
            "flex size-8 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110",
            classeIcone,
          )}
        >
          <Icone className="size-4" />
        </span>
      </div>
      <p
        className={cn(
          "text-lg font-bold tracking-tight sm:text-xl",
          classeValor,
        )}
      >
        {children}
      </p>
      <p className="text-xs text-muted-foreground">{rodape}</p>
    </div>
  );
}

/** Barra de 0 a 100% da receita: custos por grupo + o que sobra, com as faixas de alerta. */
function BarraReceita({
  receita,
  grupos,
  aliquota,
  ativo,
  onAtivo,
}: {
  receita: number;
  grupos: { titulo: string; total: number; cor: string; indice: number }[];
  aliquota: number;
  ativo: number | null;
  onAtivo: (i: number | null) => void;
}) {
  const passou = aliquota > 1;
  const escala = passou ? aliquota : 1; // se os custos passam da receita, a barra mostra o total dos custos
  const marcas = [
    {
      valor: LIMITE_ATENCAO,
      rotulo: "Atenção",
      curto: formatarPercentual(LIMITE_ATENCAO, 0),
    },
    {
      valor: LIMITE_CUSTO_FIXO,
      rotulo: "Limite",
      curto: formatarPercentual(LIMITE_CUSTO_FIXO, 0),
    },
  ];
  return (
    <section className="rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
      <div className="mb-8 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold">Para onde vai a receita</h3>
        <p className="text-xs text-muted-foreground">
          De cada <strong className="text-foreground">R$ 100</strong> faturados,{" "}
          <strong className="text-foreground tabular-nums">
            {formatarMoeda(aliquota * 100)}
          </strong>{" "}
          pagam os custos fixos
        </p>
      </div>
      <div className="relative">
        {/* Marcas de 20% e 30% */}
        {marcas.map((m) => (
          <div
            key={m.valor}
            className="absolute -top-6 bottom-0 flex flex-col items-center"
            style={{ left: `${(m.valor / escala) * 100}%` }}
          >
            <span className="-translate-x-1/2 text-[10px] font-semibold whitespace-nowrap text-muted-foreground">
              <span className="max-sm:hidden">{m.rotulo} </span>
              {m.curto}
            </span>
            <span className="h-full w-px -translate-x-1/2 border-l border-dashed border-foreground/40" />
          </div>
        ))}
        <div className="flex h-7 overflow-hidden rounded-lg bg-success/15 ring-1 ring-foreground/5">
          {grupos.map((g, i) => (
            <span
              key={g.titulo}
              onMouseEnter={() => onAtivo(g.indice)}
              onMouseLeave={() => onAtivo(null)}
              title={`${g.titulo}: ${formatarMoeda(g.total)} (${pctTexto(g.total / receita)} da receita)`}
              className={cn(
                "h-full origin-left border-r-2 border-card transition-opacity duration-200 animate-[crescer-x_800ms_ease-out_both] last:border-r-0 motion-reduce:animate-none",
                ativo != null && ativo !== g.indice && "opacity-40",
              )}
              style={{
                width: `${(g.total / receita / escala) * 100}%`,
                background: g.cor,
                animationDelay: `${i * 90}ms`,
              }}
            />
          ))}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          Custos fixos:{" "}
          <strong className="text-foreground tabular-nums">
            {pctTexto(aliquota)}
          </strong>
        </span>
        {passou ? (
          <span className="font-semibold text-destructive">
            Os custos passam a receita em{" "}
            {formatarMoeda((aliquota - 1) * receita)}
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="size-2.5 rounded-[3px] bg-success/40" />
            Sobra para produção e lucro:{" "}
            <strong className="text-success tabular-nums">
              {pctTexto(1 - aliquota)}
            </strong>
          </span>
        )}
      </div>
    </section>
  );
}

function Rosca({
  dados,
  total,
  ativo,
  onAtivo,
}: {
  dados: { titulo: string; total: number; cor: string; indice: number }[];
  total: number;
  ativo: number | null;
  onAtivo: (i: number | null) => void;
}) {
  const destaque = dados.find((d) => d.indice === ativo);
  return (
    <div className="relative aspect-square w-full max-w-60">
      <ChartContainer
        config={{}}
        className="aspect-square size-full"
        initialDimension={{ width: 240, height: 240 }}
      >
        <PieChart>
          <Pie
            data={dados}
            dataKey="total"
            nameKey="titulo"
            innerRadius="62%"
            outerRadius="88%"
            paddingAngle={1.5}
            cornerRadius={4}
            stroke="var(--card)"
            strokeWidth={2}
            startAngle={90}
            endAngle={-270}
            animationDuration={900}
            animationEasing="ease-out"
            onMouseEnter={(_, i) => onAtivo(dados[i]?.indice ?? null)}
            onMouseLeave={() => onAtivo(null)}
            shape={(props, i) => {
              const d = dados[i];
              const sel = d?.indice === ativo;
              return (
                <g
                  style={{
                    transform: `scale(${sel ? 1.06 : 1})`,
                    transformOrigin: `${props.cx}px ${props.cy}px`,
                    transition: "transform 250ms ease-out, opacity 250ms",
                    opacity: ativo != null && !sel ? 0.35 : 1,
                  }}
                  className="cursor-pointer motion-reduce:transition-none"
                >
                  <Sector {...props} fill={d?.cor} />
                </g>
              );
            }}
          />
        </PieChart>
      </ChartContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
        <span
          key={destaque?.titulo ?? "total"}
          className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-1 duration-300"
        >
          <span className="line-clamp-2 text-xs text-muted-foreground">
            {destaque ? destaque.titulo : "Total de custos"}
          </span>
          <span className="text-lg font-bold tabular-nums sm:text-xl">
            {formatarMoeda(destaque ? destaque.total : total)}
          </span>
          {destaque && (
            <span className="text-xs font-semibold text-muted-foreground tabular-nums">
              {pctTexto(destaque.total / total)}
            </span>
          )}
        </span>
      </div>
    </div>
  );
}

function Dica({
  aliquota,
  maior,
  receita,
  totalCustos,
}: {
  aliquota: number;
  maior?: { rotulo: string; valor: number };
  receita: number;
  totalCustos: number;
}) {
  const critico = aliquota > LIMITE_CUSTO_FIXO;
  const atencao = !critico && aliquota > LIMITE_ATENCAO;
  // Quanto de receita seria preciso para a alíquota voltar ao limite.
  const receitaIdeal = totalCustos / LIMITE_CUSTO_FIXO;
  return (
    <section
      className={cn(
        "flex gap-3 rounded-2xl p-4 text-sm ring-1",
        critico
          ? "bg-destructive/5 text-foreground ring-destructive/25"
          : atencao
            ? "bg-highlight-soft/60 ring-highlight/30"
            : "bg-success/8 ring-success/25",
      )}
    >
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg",
          critico
            ? "bg-destructive/10 text-destructive"
            : atencao
              ? "bg-highlight-soft text-highlight-strong"
              : "bg-success/12 text-success",
        )}
      >
        {critico || atencao ? (
          <TriangleAlert className="size-4" />
        ) : (
          <Lightbulb className="size-4" />
        )}
      </span>
      <div className="flex flex-col gap-1">
        <p className="font-semibold">
          {critico
            ? "Custos fixos acima do limite"
            : atencao
              ? "Fique de olho nos custos fixos"
              : "Custos fixos sob controle"}
        </p>
        <p className="text-muted-foreground">
          {critico ? (
            <>
              Os custos fixos levam {pctTexto(aliquota)} do faturamento (limite
              de {formatarPercentual(LIMITE_CUSTO_FIXO, 0)}). Para voltar ao
              limite com os custos atuais, a receita precisaria chegar a{" "}
              <strong className="text-foreground">
                {formatarMoeda(receitaIdeal)}
              </strong>{" "}
              ({formatarMoeda(receitaIdeal - receita)} a mais)
              {maior && (
                <>
                  , ou reduza custos começando pelo maior:{" "}
                  <strong className="text-foreground">{maior.rotulo}</strong> (
                  {formatarMoeda(maior.valor)})
                </>
              )}
              .
            </>
          ) : atencao ? (
            <>
              A alíquota está entre {formatarPercentual(LIMITE_ATENCAO, 0)} e{" "}
              {formatarPercentual(LIMITE_CUSTO_FIXO, 0)}. Ainda é aceitável, mas
              acompanhe os maiores custos para não passar do limite.
            </>
          ) : (
            <>
              Abaixo de {formatarPercentual(LIMITE_ATENCAO, 0)} do faturamento:
              sobra uma boa parte da receita para produção e lucro.
            </>
          )}
        </p>
      </div>
    </section>
  );
}
