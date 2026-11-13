"use client";

import { useLayoutEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  ChartColumnBig,
  ChartPie,
  CircleCheck,
  CircleDollarSign,
  Download,
  FileText,
  Info,
  LoaderCircle,
  Package,
  Pencil,
  Plus,
  Receipt,
  Search,
  Target,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";

import { CampoModal, ModalFormulario } from "@/components/cadastro";
import { NumeroAnimado } from "@/components/numero-animado";
import { SelectNativo } from "@/components/cadastro/select-nativo";
import { notificar } from "@/components/notificacoes";
import { Button } from "@/components/ui/button";
import {
  formatarMoeda,
  formatarPercentual,
  paraNumero,
  paraTexto,
} from "@/lib/numero-br";
import { normalizar, plural } from "@/lib/texto";

import { classificarMargem } from "../receitas/calculo";
import { BASE } from "../receitas/tipos";
import { salvarMargemMeta } from "./actions";
import {
  BarrasMargem,
  BarrasPreco,
  CORES_PRECO,
  Legenda,
  RoscaComposicao,
} from "./graficos";
import {
  COMPOSICAO,
  type AppEntrega,
  type ChaveComposicao,
  type ProdutoRelatorio,
} from "./tipos";

type Aba = "geral" | "composicao" | "analise";
const ABAS: { valor: Aba; rotulo: string; curto: string; icone: LucideIcon }[] =
  [
    {
      valor: "geral",
      rotulo: "Visão geral",
      curto: "Geral",
      icone: ChartColumnBig,
    },
    {
      valor: "composicao",
      rotulo: "Composição de custos",
      curto: "Custos",
      icone: ChartPie,
    },
    {
      valor: "analise",
      rotulo: "Análise",
      curto: "Análise",
      icone: TrendingUp,
    },
  ];

const ORDENS = {
  "margem-desc": "Maior margem",
  "margem-asc": "Menor margem",
  "lucro-desc": "Maior lucro",
  "preco-desc": "Maior preço",
  "custo-desc": "Maior custo",
  nome: "Nome (A–Z)",
};
type Ordem = keyof typeof ORDENS;

const num = (v: number, casas = 1) =>
  v.toLocaleString("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });

export function TelaRelatorio({
  produtos,
  semPreco,
  margemMeta,
  negocio,
  apps,
}: {
  produtos: ProdutoRelatorio[];
  semPreco: number;
  margemMeta: number;
  negocio: string;
  apps: AppEntrega[];
}) {
  const [aba, setAba] = useState<Aba>("geral");
  const [editandoMeta, setEditandoMeta] = useState(false);

  // Ao esconder a página (navegação com Cache Components), fecha o modal.
  useLayoutEffect(() => () => setEditandoMeta(false), []);

  const meta = margemMeta;
  const resumo = useMemo(() => {
    const receita = produtos.reduce((s, p) => s + p.preco, 0);
    const custo = produtos.reduce((s, p) => s + p.custo, 0);
    const margens = produtos.map((p) => p.margem);
    const media = margens.length
      ? margens.reduce((s, m) => s + m, 0) / margens.length
      : 0;
    const variancia = margens.length
      ? margens.reduce((s, m) => s + (m - media) ** 2, 0) / margens.length
      : 0;
    const ordenados = [...produtos].sort(
      (a, b) => b.margem - a.margem || b.lucro - a.lucro,
    );
    const composicao = Object.fromEntries(
      COMPOSICAO.map((c) => [
        c.chave,
        produtos.reduce((s, p) => s + p.composicao[c.chave], 0),
      ]),
    ) as Record<ChaveComposicao, number>;
    return {
      receita,
      custo,
      lucro: receita - custo,
      media,
      variancia,
      desvio: Math.sqrt(variancia),
      maior: ordenados[0],
      menor: ordenados.at(-1),
      foraMeta: produtos.filter((p) => p.margem < meta).length,
      composicao,
    };
  }, [produtos, meta]);

  const [gerando, startGerar] = useTransition();
  function baixar() {
    startGerar(async () => {
      try {
        const { gerarPdfRelatorio } = await import("./pdf");
        await gerarPdfRelatorio({ produtos, meta, negocio, apps, resumo });
        notificar.sucesso(
          "Relatório baixado",
          "O PDF foi salvo na pasta de downloads.",
        );
      } catch {
        notificar.erro(
          "Não foi possível gerar o PDF",
          "Tente de novo em instantes.",
        );
      }
    });
  }

  return (
    <>
      <Banner total={produtos.length} meta={meta} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="tablist"
          aria-label="Seções do relatório"
          className="grid grid-cols-3 gap-1 rounded-full bg-card p-1 ring-1 ring-foreground/10 sm:flex"
        >
          {ABAS.map((a) => (
            <button
              key={a.valor}
              type="button"
              role="tab"
              id={`aba-${a.valor}`}
              aria-selected={aba === a.valor}
              aria-controls={`painel-${a.valor}`}
              onClick={() => setAba(a.valor)}
              className={cn(
                "flex h-9 shrink-0 items-center justify-center gap-2 rounded-full px-3 text-sm font-semibold sm:px-4 transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                aba === a.valor
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <a.icone className="size-4" />
              <span className="sm:hidden">{a.curto}</span>
              <span className="max-sm:hidden">{a.rotulo}</span>
            </button>
          ))}
        </div>
        <Button
          variant="highlight"
          size="lg"
          className="h-10 shadow-sm"
          onClick={baixar}
          disabled={!produtos.length || gerando}
        >
          {gerando ? (
            <LoaderCircle className="animate-spin" data-icon="inline-start" />
          ) : (
            <Download data-icon="inline-start" />
          )}
          {gerando ? "Gerando PDF..." : "Baixar relatório"}
        </Button>
      </div>

      {semPreco > 0 && (
        <p className="flex items-center gap-2 rounded-xl bg-highlight-soft px-4 py-2.5 text-sm text-highlight-foreground">
          <Info className="size-4 shrink-0" />
          {plural(semPreco, "produto ficou", "produtos ficaram")} de fora por
          ainda não ter{semPreco > 1 ? "em" : ""} preço calculado (margem,
          impostos e taxas somam 100% ou mais).
        </p>
      )}

      {!produtos.length ? (
        <section className="flex flex-col items-center gap-3 rounded-2xl bg-card px-6 py-16 text-center ring-1 ring-foreground/10">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
            <ChartColumnBig className="size-7" />
          </span>
          <h2 className="text-lg font-semibold">
            Nenhum produto para analisar ainda
          </h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Cadastre seus produtos com a ficha técnica: o relatório mostra
            receita, custos e margens de todos eles, com gráficos para comparar.
          </p>
          <Button
            variant="highlight"
            size="lg"
            render={<Link href={`${BASE}/produtos/nova`} />}
          >
            <Plus data-icon="inline-start" />
            Novo produto
          </Button>
        </section>
      ) : (
        <div
          key={aba}
          id={`painel-${aba}`}
          role="tabpanel"
          aria-labelledby={`aba-${aba}`}
          className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300 motion-reduce:animate-none"
        >
          {aba === "geral" && (
            <VisaoGeral
              produtos={produtos}
              resumo={resumo}
              meta={meta}
              onEditarMeta={() => setEditandoMeta(true)}
            />
          )}
          {aba === "composicao" && (
            <Composicao resumo={resumo} total={produtos.length} meta={meta} />
          )}
          {aba === "analise" && <Analise produtos={produtos} meta={meta} />}
        </div>
      )}

      {editandoMeta && (
        <ModalMeta
          atual={meta}
          onFechar={() => setEditandoMeta(false)}
          onSalvo={(v) => {
            setEditandoMeta(false);
            notificar.sucesso(
              "Margem meta atualizada",
              `Agora a meta é ${num(v, 0)}%.`,
            );
          }}
        />
      )}
    </>
  );
}

type Resumo = {
  receita: number;
  custo: number;
  lucro: number;
  media: number;
  variancia: number;
  desvio: number;
  maior?: ProdutoRelatorio;
  menor?: ProdutoRelatorio;
  foraMeta: number;
  composicao: Record<ChaveComposicao, number>;
};

// ------------------------------------------------------------------ Banner

function Banner({ total, meta }: { total: number; meta: number }) {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary-strong p-5 text-primary-foreground sm:p-7">
      {/* Gráfico decorativo que se desenha ao abrir */}
      <svg
        aria-hidden
        viewBox="0 0 320 140"
        className="pointer-events-none absolute -right-6 bottom-0 h-full w-auto opacity-30 sm:opacity-60"
        fill="none"
      >
        {[28, 52, 40, 74, 60, 96, 84].map((h, i) => (
          <rect
            key={i}
            x={20 + i * 40}
            y={130 - h}
            width="22"
            height={h}
            rx="4"
            className="origin-bottom fill-white/10 animate-[crescer-y_700ms_ease-out_both] motion-reduce:animate-none"
            style={{
              animationDelay: `${i * 70}ms`,
              animationFillMode: "both",
              transformBox: "fill-box",
            }}
          />
        ))}
        <path
          d="M31 98 L71 80 L111 88 L151 58 L191 66 L231 36 L271 44"
          stroke="var(--highlight)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          className="[stroke-dasharray:1] [stroke-dashoffset:1] animate-[desenhar_1.4s_ease-out_0.4s_forwards] motion-reduce:animate-none motion-reduce:[stroke-dashoffset:0]"
        />
        {[
          [31, 98],
          [151, 58],
          [271, 44],
        ].map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="4.5"
            fill="var(--highlight)"
            stroke="var(--primary)"
            strokeWidth="2"
            className="animate-in fade-in zoom-in duration-500"
            style={{
              animationDelay: `${600 + i * 300}ms`,
              animationFillMode: "both",
              transformBox: "fill-box",
              transformOrigin: "center",
            }}
          />
        ))}
      </svg>
      <div className="relative flex items-start gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-highlight text-highlight-foreground shadow-lg shadow-black/20">
          <FileText className="size-6" />
        </span>
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Relatório de produtos
          </h1>
          <p className="mt-0.5 max-w-lg text-sm text-primary-foreground/75">
            Receita, custos e margem de lucro de cada produto, com gráficos para
            comparar.
          </p>
          <ul className="mt-4 flex flex-wrap gap-2 text-xs font-medium">
            <li className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/15 backdrop-blur-sm">
              <Package className="size-3.5 text-highlight" />
              {plural(total, "produto", "produtos")}
            </li>
            <li className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/15 backdrop-blur-sm">
              <Target className="size-3.5 text-highlight" />
              Meta de margem: {num(meta, 0)}%
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ Visão geral

const TONS = {
  azul: { chip: "bg-serie-1/12 text-serie-1", borda: "hover:ring-serie-1/50" },
  laranja: {
    chip: "bg-serie-2/12 text-serie-2",
    borda: "hover:ring-serie-2/50",
  },
  verde: { chip: "bg-success/12 text-success", borda: "hover:ring-success/50" },
  marinho: {
    chip: "bg-primary-soft text-primary",
    borda: "hover:ring-primary/40",
  },
  ambar: {
    chip: "bg-highlight-soft text-highlight-strong",
    borda: "hover:ring-highlight/60",
  },
  vermelho: {
    chip: "bg-destructive/10 text-destructive",
    borda: "hover:ring-destructive/40",
  },
};

function Kpi({
  titulo,
  icone: Icone,
  tom,
  children,
  rodape,
  acao,
  atraso = 0,
}: {
  titulo: string;
  icone: LucideIcon;
  tom: keyof typeof TONS;
  children: React.ReactNode;
  rodape: React.ReactNode;
  acao?: React.ReactNode;
  atraso?: number;
}) {
  return (
    <div
      className={cn(
        "group flex flex-col gap-1 rounded-2xl bg-card p-4 ring-1 ring-foreground/10 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:ring-2 motion-reduce:hover:translate-y-0",
        "animate-in fade-in slide-in-from-bottom-3 duration-500 motion-reduce:animate-none",
        TONS[tom].borda,
      )}
      style={{ animationDelay: `${atraso}ms`, animationFillMode: "both" }}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          {titulo}
        </span>
        {acao ?? (
          <span
            className={cn(
              "flex size-8 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110",
              TONS[tom].chip,
            )}
          >
            <Icone className="size-4" />
          </span>
        )}
      </div>
      <p className="text-xl font-bold tracking-tight sm:text-2xl">{children}</p>
      <div className="text-xs text-muted-foreground">{rodape}</div>
    </div>
  );
}

function VisaoGeral({
  produtos,
  resumo,
  meta,
  onEditarMeta,
}: {
  produtos: ProdutoRelatorio[];
  resumo: Resumo;
  meta: number;
  onEditarMeta: () => void;
}) {
  const acimaMeta = resumo.media >= meta;
  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi
          titulo="Receita total"
          icone={CircleDollarSign}
          tom="azul"
          rodape={`Preço de 1 unidade de cada um dos ${plural(produtos.length, "produto", "produtos")}`}
        >
          <NumeroAnimado valor={resumo.receita} formato={formatarMoeda} />
        </Kpi>
        <Kpi
          titulo="Custo total"
          icone={Receipt}
          tom="laranja"
          rodape="Custo de fabricação somado"
          atraso={60}
        >
          <NumeroAnimado valor={resumo.custo} formato={formatarMoeda} />
        </Kpi>
        <Kpi
          titulo="Lucro total"
          icone={TrendingUp}
          tom="verde"
          rodape="Receita − custos"
          atraso={120}
        >
          <NumeroAnimado valor={resumo.lucro} formato={formatarMoeda} />
        </Kpi>
        <Kpi
          titulo="Margem média"
          icone={acimaMeta ? CircleCheck : TriangleAlert}
          tom={acimaMeta ? "verde" : "vermelho"}
          rodape={
            <span
              className={cn(
                "font-medium",
                acimaMeta ? "text-success" : "text-destructive",
              )}
            >
              {acimaMeta ? "Acima" : "Abaixo"} da meta ({acimaMeta ? "+" : ""}
              {num(resumo.media - meta)} p.p.)
            </span>
          }
          atraso={180}
        >
          <NumeroAnimado valor={resumo.media} formato={(v) => `${num(v)}%`} />
        </Kpi>
        <Kpi
          titulo="Margem meta"
          icone={Target}
          tom="ambar"
          rodape="Toque no lápis para alterar"
          atraso={240}
          acao={
            <Button
              variant="outline"
              size="icon"
              className="size-8 border-highlight/50 bg-highlight-soft text-highlight-foreground hover:bg-highlight"
              onClick={onEditarMeta}
              aria-label="Alterar margem meta"
              title="Alterar margem meta"
            >
              <Pencil />
            </Button>
          }
        >
          {num(meta, 0)}%
        </Kpi>
      </div>

      {resumo.maior && resumo.menor && (
        <div className="grid gap-3 md:grid-cols-2">
          <Destaque tipo="maior" produto={resumo.maior} />
          <Destaque tipo="menor" produto={resumo.menor} />
        </div>
      )}

      <ListaProdutos produtos={produtos} meta={meta} />
    </>
  );
}

function Destaque({
  tipo,
  produto,
}: {
  tipo: "maior" | "menor";
  produto: ProdutoRelatorio;
}) {
  const maior = tipo === "maior";
  const Icone = maior ? ArrowUpRight : ArrowDownRight;
  return (
    <div
      className={cn(
        "group relative flex flex-col gap-4 overflow-hidden rounded-2xl bg-card p-5 ring-1 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-lg motion-reduce:hover:translate-y-0 sm:flex-row sm:items-end sm:justify-between",
        maior ? "ring-success/30" : "ring-destructive/30",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute inset-x-0 top-0 h-1",
          maior ? "bg-success" : "bg-destructive",
        )}
      />
      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:rotate-6",
              maior
                ? "bg-success/12 text-success"
                : "bg-destructive/10 text-destructive",
            )}
          >
            <Icone className="size-5" />
          </span>
          <div className="min-w-0">
            <p
              className={cn(
                "text-[11px] font-semibold tracking-wide uppercase",
                maior ? "text-success" : "text-destructive",
              )}
            >
              {maior ? "Maior margem" : "Menor margem"}
            </p>
            <p className="truncate font-semibold" title={produto.nome}>
              {produto.nome}
            </p>
          </div>
        </div>
        <dl className="flex gap-6">
          <div>
            <dt className="text-xs text-muted-foreground">Margem</dt>
            <dd
              className={cn(
                "text-2xl font-bold tabular-nums",
                maior ? "text-success" : "text-destructive",
              )}
            >
              {num(produto.margem)}%
            </dd>
          </div>
          <div className="border-l border-border pl-6">
            <dt className="text-xs text-muted-foreground">Lucro por venda</dt>
            <dd className="text-2xl font-bold tabular-nums">
              {formatarMoeda(produto.lucro)}
            </dd>
          </div>
        </dl>
      </div>
      <Button
        variant="outline"
        className="h-9 shrink-0"
        render={<Link href={`${BASE}/ficha/${produto.id}`} />}
      >
        <FileText data-icon="inline-start" />
        Ver ficha
      </Button>
    </div>
  );
}

function ListaProdutos({
  produtos,
  meta,
}: {
  produtos: ProdutoRelatorio[];
  meta: number;
}) {
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<"todas" | "acima" | "abaixo">("todas");
  const [ordem, setOrdem] = useState<Ordem>("margem-desc");
  const termo = normalizar(busca);
  const visiveis = produtos
    .filter(
      (p) =>
        filtro === "todas" ||
        (filtro === "acima" ? p.margem >= meta : p.margem < meta),
    )
    .filter(
      (p) => !termo || normalizar(`${p.nome} ${p.categoria}`).includes(termo),
    )
    .sort((a, b) => {
      switch (ordem) {
        case "margem-desc":
          return b.margem - a.margem;
        case "margem-asc":
          return a.margem - b.margem;
        case "lucro-desc":
          return b.lucro - a.lucro;
        case "preco-desc":
          return b.preco - a.preco;
        case "custo-desc":
          return b.custo - a.custo;
        case "nome":
          return a.nome.localeCompare(b.nome, "pt-BR");
      }
    });

  return (
    <section className="flex flex-col gap-4 rounded-2xl bg-card p-4 ring-1 ring-foreground/10 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-semibold">
          <Package className="size-4 text-highlight-strong" />
          Lista de produtos
        </h2>
        <span className="text-sm text-muted-foreground tabular-nums">
          {visiveis.length} de {plural(produtos.length, "produto", "produtos")}
        </span>
      </div>
      <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <label htmlFor="rel-busca" className="sr-only">
            Buscar produto
          </label>
          <input
            id="rel-busca"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar produto..."
            className="h-10 w-full rounded-lg border border-input bg-background/60 pr-3 pl-9 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
        <div className="sm:w-48">
          <label htmlFor="rel-filtro" className="sr-only">
            Filtrar pela meta
          </label>
          <SelectNativo
            id="rel-filtro"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value as typeof filtro)}
          >
            <option value="todas">Todas as margens</option>
            <option value="acima">Acima da meta</option>
            <option value="abaixo">Abaixo da meta</option>
          </SelectNativo>
        </div>
        <div className="sm:w-48">
          <label htmlFor="rel-ordem" className="sr-only">
            Ordenar
          </label>
          <SelectNativo
            id="rel-ordem"
            value={ordem}
            onChange={(e) => setOrdem(e.target.value as Ordem)}
          >
            {Object.entries(ORDENS).map(([v, r]) => (
              <option key={v} value={v}>
                {r}
              </option>
            ))}
          </SelectNativo>
        </div>
      </div>

      {visiveis.length ? (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
          {visiveis.map((p, i) => (
            <CardProduto
              key={p.id}
              produto={p}
              meta={meta}
              atraso={Math.min(i, 10) * 40}
            />
          ))}
        </ul>
      ) : (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Nenhum produto encontrado com esses filtros.
        </p>
      )}
    </section>
  );
}

function CardProduto({
  produto: p,
  meta,
  atraso,
}: {
  produto: ProdutoRelatorio;
  meta: number;
  atraso: number;
}) {
  const acima = p.margem >= meta;
  const classe = classificarMargem(p.margem);
  const progresso = Math.min(100, (p.margem / meta) * 100);
  const total = COMPOSICAO.reduce((s, c) => s + p.composicao[c.chave], 0);
  const partes = COMPOSICAO.filter((c) => p.composicao[c.chave] > 0);
  return (
    <li
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10 transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:shadow-xl hover:ring-2 motion-reduce:hover:translate-y-0",
        acima ? "hover:ring-success/50" : "hover:ring-destructive/50",
        "animate-in fade-in slide-in-from-bottom-2 duration-500 motion-reduce:animate-none",
      )}
      style={{ animationDelay: `${atraso}ms`, animationFillMode: "both" }}
    >
      <div className="relative flex h-20 items-start justify-between gap-2 overflow-hidden bg-gradient-to-br from-primary to-primary-strong p-3">
        <Package
          aria-hidden
          className="absolute -bottom-3 left-1/2 size-16 -translate-x-1/2 text-white/8 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6"
        />
        <span
          className={cn(
            "relative flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
            acima ? "bg-success text-white" : "bg-destructive text-white",
          )}
        >
          {acima ? (
            <TrendingUp className="size-3" />
          ) : (
            <TrendingDown className="size-3" />
          )}
          {acima ? "Acima da meta" : "Abaixo da meta"}
        </span>
        <span className="relative rounded-lg bg-card px-2 py-1 text-right shadow-md">
          <span className="block text-sm font-bold tabular-nums">
            {formatarMoeda(p.preco)}
          </span>
          <span className="block text-[10px] text-muted-foreground">
            Preço de venda
          </span>
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-3.5">
        <div className="min-w-0">
          <h3 className="truncate font-semibold" title={p.nome}>
            {p.nome}
          </h3>
          <p className="truncate text-xs text-muted-foreground">
            {p.categoria}
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-1.5">
          <div className="rounded-lg bg-muted px-2.5 py-1.5">
            <dt className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
              Custo
            </dt>
            <dd className="text-sm font-semibold tabular-nums">
              {formatarMoeda(p.custo)}
            </dd>
          </div>
          <div className="rounded-lg bg-muted px-2.5 py-1.5">
            <dt className="flex items-center justify-between text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
              Margem
              <span
                className={cn(
                  "rounded px-1 py-px text-[9px] normal-case tracking-normal",
                  classe.classe,
                )}
              >
                {classe.rotulo}
              </span>
            </dt>
            <dd
              className={cn(
                "text-sm font-semibold tabular-nums",
                acima ? "text-success" : "text-destructive",
              )}
            >
              {num(p.margem)}%
            </dd>
          </div>
        </dl>

        <div>
          <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
            <span>Atual × meta ({num(meta, 0)}%)</span>
            <span
              className={cn(
                "font-semibold tabular-nums",
                acima ? "text-success" : "text-destructive",
              )}
            >
              {num(progresso, 0)}%
            </span>
          </div>
          <div
            className="h-1.5 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={Math.round(progresso)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Margem atual em relação à meta"
          >
            <div
              className={cn(
                "h-full origin-left rounded-full animate-[crescer-x_700ms_ease-out_both] motion-reduce:animate-none",
                acima ? "bg-success" : "bg-destructive",
              )}
              style={{
                width: `${progresso}%`,
                animationDelay: `${atraso + 200}ms`,
                animationFillMode: "both",
              }}
            />
          </div>
        </div>

        <div>
          <p className="mb-1 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
            Composição do custo
          </p>
          <div className="flex h-2 gap-0.5 overflow-hidden rounded-full">
            {partes.map((c) => (
              <span
                key={c.chave}
                className="h-full transition-[filter] first:rounded-l-full last:rounded-r-full hover:brightness-110"
                style={{
                  width: `${(p.composicao[c.chave] / total) * 100}%`,
                  background: c.cor,
                }}
                title={`${c.rotulo}: ${formatarMoeda(p.composicao[c.chave])} (${formatarPercentual(p.composicao[c.chave] / total, 0)})`}
              />
            ))}
          </div>
          <ul className="mt-1.5 flex flex-wrap gap-x-2.5 gap-y-0.5 text-[10px] text-muted-foreground">
            {partes.map((c) => (
              <li key={c.chave} className="flex items-center gap-1">
                <span
                  className="size-1.5 rounded-full"
                  style={{ background: c.cor }}
                />
                {c.curto}
              </li>
            ))}
          </ul>
        </div>

        <Button
          variant="highlight"
          className="mt-auto h-9"
          render={<Link href={`${BASE}/ficha/${p.id}`} />}
        >
          <FileText data-icon="inline-start" />
          Ficha técnica
        </Button>
      </div>
    </li>
  );
}

// ------------------------------------------------------------------ Composição

function Composicao({
  resumo,
  total,
  meta,
}: {
  resumo: Resumo;
  total: number;
  meta: number;
}) {
  const [ativo, setAtivo] = useState<ChaveComposicao | null>(null);
  const soma = COMPOSICAO.reduce((s, c) => s + resumo.composicao[c.chave], 0);
  const presentes = COMPOSICAO.filter((c) => resumo.composicao[c.chave] > 0);
  return (
    <>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <section className="flex flex-col gap-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
          <div>
            <h2 className="flex items-center gap-2 font-semibold">
              <ChartPie className="size-4 text-highlight-strong" />
              Composição de custos
            </h2>
            <p className="text-xs text-muted-foreground">
              Soma do custo de 1 unidade de cada produto, sem o custo fixo do
              Custeio. Passe o mouse ou toque nas fatias.
            </p>
          </div>
          <RoscaComposicao
            totais={resumo.composicao}
            ativo={ativo}
            onAtivo={setAtivo}
          />
          <Legenda
            itens={presentes.map((c) => ({ rotulo: c.rotulo, cor: c.cor }))}
          />
        </section>

        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
          {COMPOSICAO.map((c, i) => {
            const valor = resumo.composicao[c.chave];
            const pct = soma ? valor / soma : 0;
            const sel = ativo === c.chave;
            return (
              <li
                key={c.chave}
                onMouseEnter={() => valor > 0 && setAtivo(c.chave)}
                onMouseLeave={() => setAtivo(null)}
                className={cn(
                  "flex flex-col gap-2 rounded-2xl bg-card p-4 ring-1 ring-foreground/10 transition-[transform,box-shadow,opacity] duration-200 animate-in fade-in slide-in-from-bottom-2 motion-reduce:animate-none",
                  sel && "-translate-y-0.5 shadow-lg ring-2",
                  ativo && !sel && "opacity-60",
                )}
                style={{
                  animationDelay: `${i * 60}ms`,
                  animationFillMode: "both",
                  ...(sel ? { ["--tw-ring-color" as string]: c.cor } : {}),
                }}
              >
                <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <span
                    className="flex size-7 items-center justify-center rounded-lg text-white"
                    style={{ background: c.cor }}
                  >
                    <c.icone className="size-3.5" />
                  </span>
                  {c.rotulo}
                </span>
                <span className="text-lg font-bold tabular-nums">
                  <NumeroAnimado valor={valor} formato={formatarMoeda} />
                </span>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-[width] duration-700 ease-out"
                    style={{ width: `${pct * 100}%`, background: c.cor }}
                  />
                </div>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {formatarPercentual(pct, 1)} do total
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          titulo="Total de produtos"
          icone={Package}
          tom="marinho"
          rodape="Com preço calculado"
        >
          {total}
        </Kpi>
        <Kpi
          titulo="Fora da meta"
          icone={resumo.foraMeta ? TriangleAlert : CircleCheck}
          tom={resumo.foraMeta ? "vermelho" : "verde"}
          rodape={`${formatarPercentual(total ? resumo.foraMeta / total : 0, 1)} dos produtos abaixo de ${num(meta, 0)}%`}
          atraso={60}
        >
          {resumo.foraMeta}
        </Kpi>
        <Kpi
          titulo="Variância da margem"
          icone={ChartColumnBig}
          tom="azul"
          rodape="Quanto as margens variam entre si (p.p.²)"
          atraso={120}
        >
          {num(resumo.variancia, 2)}
        </Kpi>
        <Kpi
          titulo="Desvio padrão"
          icone={TrendingUp}
          tom="ambar"
          rodape={`Em média, cada margem fica ${num(resumo.desvio)} p.p. da média`}
          atraso={180}
        >
          {num(resumo.desvio, 2)}
        </Kpi>
      </div>
    </>
  );
}

// ------------------------------------------------------------------ Análise

function Analise({
  produtos,
  meta,
}: {
  produtos: ProdutoRelatorio[];
  meta: number;
}) {
  const porMargem = [...produtos]
    .sort((a, b) => b.margem - a.margem)
    .slice(0, 15);
  const porPreco = [...produtos].sort((a, b) => b.preco - a.preco).slice(0, 15);
  const limite = produtos.length > 15 ? " (15 primeiros)" : "";
  return (
    <div className="grid gap-3 xl:grid-cols-2">
      <section className="flex flex-col gap-3 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="flex items-center gap-2 font-semibold">
              <ChartColumnBig className="size-4 text-highlight-strong" />
              Margem por produto{limite}
            </h2>
            <p className="text-xs text-muted-foreground">
              A linha tracejada é a sua meta de margem.
            </p>
          </div>
          <Legenda
            itens={[
              { rotulo: "Acima da meta", cor: "var(--serie-1)" },
              { rotulo: "Abaixo da meta", cor: "var(--destructive)" },
            ]}
          />
        </div>
        <BarrasMargem itens={porMargem} meta={meta} />
      </section>
      <section className="flex flex-col gap-3 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="flex items-center gap-2 font-semibold">
              <CircleDollarSign className="size-4 text-highlight-strong" />
              Do que é feito o preço{limite}
            </h2>
            <p className="text-xs text-muted-foreground">
              Custo de fabricação + lucro = preço de venda.
            </p>
          </div>
          <Legenda
            itens={[
              { rotulo: "Custo", cor: CORES_PRECO.custo },
              { rotulo: "Lucro", cor: CORES_PRECO.lucro },
            ]}
          />
        </div>
        <BarrasPreco itens={porPreco} />
      </section>
    </div>
  );
}

// ------------------------------------------------------------------ Modal da meta

function ModalMeta({
  atual,
  onFechar,
  onSalvo,
}: {
  atual: number;
  onFechar: () => void;
  onSalvo: (v: number) => void;
}) {
  const [texto, setTexto] = useState(paraTexto(atual));
  const [erro, setErro] = useState<string>();
  const [salvando, startSalvar] = useTransition();
  const valor = paraNumero(texto);
  return (
    <ModalFormulario
      editando
      item="margem meta"
      genero="f"
      subtitulo="A margem de lucro que você quer atingir em cada produto."
      descricaoNovo=""
      salvando={salvando}
      erroGeral={erro}
      onFechar={onFechar}
      onEnviar={() => {
        if (valor == null) return setErro("Informe a margem meta.");
        startSalvar(async () => {
          const r = await salvarMargemMeta(valor);
          if (r.ok) onSalvo(valor);
          else setErro(r.mensagem);
        });
      }}
    >
      <CampoModal
        id="margem-meta"
        rotulo="Margem meta (%)"
        descricao="Produtos abaixo dela aparecem como “Abaixo da meta”."
      >
        <div className="relative">
          <input
            id="margem-meta"
            value={texto}
            onChange={(e) => {
              setTexto(e.target.value);
              setErro(undefined);
            }}
            inputMode="decimal"
            autoFocus
            className="h-10 w-full rounded-lg border border-input bg-transparent pr-8 pl-3 text-sm tabular-nums outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">
            %
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {[25, 30, 35, 40, 50].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setTexto(String(v))}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium ring-1 ring-foreground/10 transition-colors hover:bg-muted",
                valor === v &&
                  "bg-highlight text-highlight-foreground ring-highlight",
              )}
            >
              {v}%
            </button>
          ))}
        </div>
      </CampoModal>
    </ModalFormulario>
  );
}
