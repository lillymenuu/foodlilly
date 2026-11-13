"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ReferenceLine,
  Sector,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "cn";

import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { formatarMoeda, formatarPercentual } from "@/lib/numero-br";

import { COMPOSICAO, type ChaveComposicao } from "./tipos";

/** Nome do produto no eixo: uma linha só, cortado com reticências (o nome inteiro fica no tooltip). */
function RotuloEixo({
  x,
  y,
  payload,
}: {
  x?: number | string;
  y?: number | string;
  payload?: { value: string };
}) {
  const v = payload?.value ?? "";
  return (
    <text
      x={x}
      y={y}
      dy={4}
      textAnchor="end"
      fontSize={11}
      fill="var(--muted-foreground)"
    >
      <title>{v}</title>
      {v.length > 17 ? `${v.slice(0, 16)}…` : v}
    </text>
  );
}

const ANIMACAO = {
  animationDuration: 900,
  animationEasing: "ease-out" as const,
};

/** Caixa do tooltip, igual em todos os gráficos. */
function CaixaTooltip({
  titulo,
  linhas,
}: {
  titulo: string;
  linhas: { rotulo: string; valor: string; cor?: string; forte?: boolean }[];
}) {
  return (
    <div className="min-w-44 rounded-xl bg-card px-3 py-2.5 text-xs shadow-xl ring-1 ring-foreground/10 animate-in fade-in zoom-in-95">
      <p className="mb-1.5 max-w-60 truncate font-semibold text-foreground">
        {titulo}
      </p>
      <ul className="flex flex-col gap-1">
        {linhas.map((l) => (
          <li
            key={l.rotulo}
            className="flex items-center justify-between gap-4"
          >
            <span className="flex items-center gap-1.5 text-muted-foreground">
              {l.cor && (
                <span
                  className="size-2.5 rounded-[3px]"
                  style={{ background: l.cor }}
                />
              )}
              {l.rotulo}
            </span>
            <span
              className={cn(
                "tabular-nums text-foreground",
                l.forte ? "font-bold" : "font-semibold",
              )}
            >
              {l.valor}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ------------------------------------------------------------------ Rosca

export function RoscaComposicao({
  totais,
  ativo,
  onAtivo,
}: {
  totais: Record<ChaveComposicao, number>;
  ativo: ChaveComposicao | null;
  onAtivo: (c: ChaveComposicao | null) => void;
}) {
  const dados = COMPOSICAO.map((c) => ({
    ...c,
    valor: totais[c.chave],
  })).filter((d) => d.valor > 0);
  const total = dados.reduce((s, d) => s + d.valor, 0);
  const destaque = dados.find((d) => d.chave === ativo);
  const config = Object.fromEntries(
    COMPOSICAO.map((c) => [c.chave, { label: c.rotulo, color: c.cor }]),
  ) satisfies ChartConfig;

  if (!total)
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        Sem custos para mostrar.
      </p>
    );

  return (
    <div className="relative mx-auto aspect-square w-full max-w-72">
      <ChartContainer
        config={config}
        className="aspect-square size-full"
        initialDimension={{ width: 288, height: 288 }}
      >
        <PieChart>
          <Pie
            data={dados}
            dataKey="valor"
            nameKey="rotulo"
            innerRadius="62%"
            outerRadius="88%"
            paddingAngle={1.5}
            cornerRadius={4}
            stroke="var(--card)"
            strokeWidth={2}
            startAngle={90}
            endAngle={-270}
            {...ANIMACAO}
            onMouseEnter={(_, i) => onAtivo(dados[i]?.chave ?? null)}
            onMouseLeave={() => onAtivo(null)}
            shape={(props, i) => {
              const sel = dados[i]?.chave === ativo;
              const apagado = ativo != null && !sel;
              return (
                <g
                  style={{
                    transform: `scale(${sel ? 1.06 : 1})`,
                    transformOrigin: `${props.cx}px ${props.cy}px`,
                    transition: "transform 250ms ease-out, opacity 250ms",
                    opacity: apagado ? 0.35 : 1,
                  }}
                  className="cursor-pointer motion-reduce:transition-none"
                >
                  <Sector {...props} fill={dados[i]?.cor} />
                </g>
              );
            }}
          >
            {dados.map((d) => (
              <Cell key={d.chave} fill={d.cor} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      {/* Centro da rosca: total ou a fatia apontada */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <span
          key={destaque?.chave ?? "total"}
          className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-1 duration-300"
        >
          <span className="text-xs text-muted-foreground">
            {destaque ? destaque.rotulo : "Soma dos custos"}
          </span>
          <span className="text-xl font-bold tabular-nums sm:text-2xl">
            {formatarMoeda(destaque ? destaque.valor : total)}
          </span>
          {destaque && (
            <span className="text-xs font-semibold text-muted-foreground tabular-nums">
              {formatarPercentual(destaque.valor / total, 1)}
            </span>
          )}
        </span>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ Barras de margem

export function BarrasMargem({
  itens,
  meta,
}: {
  itens: { nome: string; margem: number; lucro: number; preco: number }[];
  meta: number;
}) {
  const max = Math.max(meta, ...itens.map((i) => i.margem));
  const topo = Math.min(100, Math.ceil((max + 5) / 10) * 10);
  return (
    <ChartContainer
      config={{ margem: { label: "Margem", color: "var(--serie-1)" } }}
      className="aspect-auto w-full"
      style={{ height: itens.length * 38 + 48 }}
    >
      <BarChart
        data={itens}
        layout="vertical"
        margin={{ top: 18, right: 48, left: 4, bottom: 0 }}
        barCategoryGap={8}
      >
        <CartesianGrid
          horizontal={false}
          strokeDasharray="3 3"
          stroke="var(--border)"
        />
        <XAxis
          type="number"
          domain={[0, topo]}
          tickFormatter={(v) => `${v}%`}
          tickLine={false}
          axisLine={false}
          fontSize={11}
        />
        <YAxis
          type="category"
          dataKey="nome"
          width={124}
          tickLine={false}
          axisLine={false}
          tick={<RotuloEixo />}
        />
        <Tooltip
          cursor={{ fill: "var(--muted)", radius: 6 }}
          content={({ active, payload }) => {
            const d = payload?.[0]?.payload as
              (typeof itens)[number] | undefined;
            if (!active || !d) return null;
            return (
              <CaixaTooltip
                titulo={d.nome}
                linhas={[
                  {
                    rotulo: "Margem",
                    valor: formatarPercentual(d.margem / 100, 1),
                    forte: true,
                  },
                  {
                    rotulo:
                      d.margem >= meta ? "Acima da meta" : "Abaixo da meta",
                    valor: `${d.margem >= meta ? "+" : ""}${(d.margem - meta).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} p.p.`,
                  },
                  { rotulo: "Preço de venda", valor: formatarMoeda(d.preco) },
                  { rotulo: "Lucro por venda", valor: formatarMoeda(d.lucro) },
                ]}
              />
            );
          }}
        />
        <ReferenceLine
          x={meta}
          stroke="var(--highlight-strong)"
          strokeDasharray="5 4"
          strokeWidth={2}
          label={{
            value: `Meta ${meta.toLocaleString("pt-BR")}%`,
            position: "top",
            fill: "var(--foreground)",
            fontSize: 11,
            fontWeight: 600,
          }}
        />
        <Bar
          dataKey="margem"
          radius={[0, 4, 4, 0]}
          maxBarSize={22}
          {...ANIMACAO}
          activeBar={{ fillOpacity: 0.85 }}
        >
          {itens.map((d) => (
            <Cell
              key={d.nome}
              fill={d.margem >= meta ? "var(--serie-1)" : "var(--destructive)"}
            />
          ))}
          <LabelList
            dataKey="margem"
            position="right"
            formatter={(v) =>
              `${Number(v).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`
            }
            className="fill-foreground text-[11px] font-semibold"
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

// ------------------------------------------------------------------ Preço = custo + lucro

const CORES_PRECO = { custo: "var(--serie-2)", lucro: "var(--serie-3)" };

export function BarrasPreco({
  itens,
}: {
  itens: { nome: string; custo: number; lucro: number; preco: number }[];
}) {
  return (
    <ChartContainer
      config={{
        custo: { label: "Custo", color: CORES_PRECO.custo },
        lucro: { label: "Lucro", color: CORES_PRECO.lucro },
      }}
      className="aspect-auto w-full"
      style={{ height: itens.length * 38 + 40 }}
    >
      <BarChart
        data={itens}
        layout="vertical"
        margin={{ top: 8, right: 64, left: 4, bottom: 0 }}
        barCategoryGap={8}
      >
        <CartesianGrid
          horizontal={false}
          strokeDasharray="3 3"
          stroke="var(--border)"
        />
        <XAxis
          type="number"
          tickFormatter={(v) => formatarMoeda(v).replace(",00", "")}
          tickLine={false}
          axisLine={false}
          fontSize={11}
        />
        <YAxis
          type="category"
          dataKey="nome"
          width={124}
          tickLine={false}
          axisLine={false}
          tick={<RotuloEixo />}
        />
        <Tooltip
          cursor={{ fill: "var(--muted)", radius: 6 }}
          content={({ active, payload }) => {
            const d = payload?.[0]?.payload as
              (typeof itens)[number] | undefined;
            if (!active || !d) return null;
            return (
              <CaixaTooltip
                titulo={d.nome}
                linhas={[
                  {
                    rotulo: "Custo",
                    valor: formatarMoeda(d.custo),
                    cor: CORES_PRECO.custo,
                  },
                  {
                    rotulo: "Lucro",
                    valor: formatarMoeda(d.lucro),
                    cor: CORES_PRECO.lucro,
                  },
                  {
                    rotulo: "Preço de venda",
                    valor: formatarMoeda(d.preco),
                    forte: true,
                  },
                ]}
              />
            );
          }}
        />
        {/* 2px de respiro entre os dois trechos da barra */}
        <Bar
          dataKey="custo"
          stackId="p"
          fill={CORES_PRECO.custo}
          stroke="var(--card)"
          strokeWidth={2}
          radius={[4, 0, 0, 4]}
          maxBarSize={22}
          {...ANIMACAO}
        />
        <Bar
          dataKey="lucro"
          stackId="p"
          fill={CORES_PRECO.lucro}
          stroke="var(--card)"
          strokeWidth={2}
          radius={[0, 4, 4, 0]}
          maxBarSize={22}
          {...ANIMACAO}
        >
          <LabelList
            dataKey="preco"
            position="right"
            formatter={(v) => formatarMoeda(Number(v))}
            className="fill-foreground text-[11px] font-semibold"
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

/** Legenda simples (sempre visível; a cor nunca fica sozinha). */
export function Legenda({
  itens,
}: {
  itens: { rotulo: string; cor: string }[];
}) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {itens.map((i) => (
        <li key={i.rotulo} className="flex items-center gap-1.5">
          <span
            className="size-2.5 rounded-[3px]"
            style={{ background: i.cor }}
          />
          {i.rotulo}
        </li>
      ))}
    </ul>
  );
}

export { CORES_PRECO };
