"use client";

import { useLayoutEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeftRight,
  CircleCheck,
  CircleDashed,
  DollarSign,
  Landmark,
  LoaderCircle,
  Pencil,
  Plus,
  Repeat,
  Search,
  Trash,
  TrendingDown,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";

import { ModalExcluir } from "@/components/cadastro";
import { SelectNativo } from "@/components/cadastro/select-nativo";
import { notificar } from "@/components/notificacoes";
import { NumeroAnimado } from "@/components/numero-animado";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatarMoeda } from "@/lib/numero-br";
import { normalizar, plural } from "@/lib/texto";

import {
  GRUPOS,
  GRUPOS_FINANCEIROS,
  type GrupoFinanceiro,
} from "../contas/catalogo-categorias";
import type { CategoriaFinanceira } from "../contas/tipos";
import { alternarPago, excluirLancamento } from "./actions";
import { ModalLancamento } from "./modal-lancamento";
import {
  ehEntrada,
  FORMAS,
  somarMeses,
  type ContaOpcao,
  type FornecedorOpcao,
  type Lancamento,
} from "./tipos";

type Props = {
  contas: ContaOpcao[];
  categorias: CategoriaFinanceira[];
  fornecedores: FornecedorOpcao[];
  lancamentos: Lancamento[];
  saldo: number;
  periodo: { inicio: string; fim: string };
  contaSelecionada: string | null;
  hoje: string;
};

type Modal =
  | { tipo: "novo" }
  | { tipo: "editar"; l: Lancamento }
  | { tipo: "excluir"; l: Lancamento }
  | null;

const dataCurta = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;
const dataLonga = (d: string) =>
  `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}`;
const ultimoDia = (d: string) =>
  new Date(Date.UTC(Number(d.slice(0, 4)), Number(d.slice(5, 7)), 0))
    .toISOString()
    .slice(0, 10);

export function TelaLancamentos(p: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [carregando, start] = useTransition();
  const [grupo, setGrupo] = useState<GrupoFinanceiro>("recebimentos");
  const [modal, setModal] = useState<Modal>(null);
  const [busca, setBusca] = useState("");
  const [situacao, setSituacao] = useState<
    "" | "pago" | "pendente" | "vencido"
  >("");
  const [categoria, setCategoria] = useState("");
  const [datas, setDatas] = useState(p.periodo);
  const [, startPago] = useTransition();
  useLayoutEffect(() => () => setModal(null), []);

  const catPorId = useMemo(
    () => new Map(p.categorias.map((c) => [c.id, c])),
    [p.categorias],
  );
  const contaPorId = useMemo(
    () => new Map(p.contas.map((c) => [c.id, c])),
    [p.contas],
  );

  /** Muda período/conta pelo endereço (o servidor recarrega os dados). */
  function navegar(muda: {
    inicio?: string;
    fim?: string;
    conta?: string | null;
  }) {
    const q = new URLSearchParams();
    const inicio = muda.inicio ?? p.periodo.inicio;
    const fim = muda.fim ?? p.periodo.fim;
    const conta = muda.conta === undefined ? p.contaSelecionada : muda.conta;
    q.set("inicio", inicio);
    q.set("fim", fim);
    if (conta) q.set("conta", conta);
    setDatas({ inicio, fim });
    start(() => router.replace(`${pathname}?${q}`, { scroll: false }));
  }

  const mesAtual = `${p.hoje.slice(0, 7)}-01`;
  const atalhos = [
    { rotulo: "Mês atual", inicio: mesAtual, fim: ultimoDia(mesAtual) },
    {
      rotulo: "Mês passado",
      inicio: somarMeses(mesAtual, -1),
      fim: ultimoDia(somarMeses(mesAtual, -1)),
    },
    {
      rotulo: "Últimos 3 meses",
      inicio: somarMeses(mesAtual, -2),
      fim: ultimoDia(mesAtual),
    },
    {
      rotulo: "Últimos 6 meses",
      inicio: somarMeses(mesAtual, -5),
      fim: ultimoDia(mesAtual),
    },
    {
      rotulo: "Este ano",
      inicio: `${p.hoje.slice(0, 4)}-01-01`,
      fim: `${p.hoje.slice(0, 4)}-12-31`,
    },
  ];

  // Indicadores do período (todas as abas).
  const r = useMemo(() => {
    const soma = (f: (l: Lancamento) => boolean) =>
      p.lancamentos.filter(f).reduce((s, l) => s + l.valor, 0);
    const recebido = soma((l) => ehEntrada(l.grupo) && l.pago);
    const aReceber = soma((l) => ehEntrada(l.grupo) && !l.pago);
    const pago = soma((l) => !ehEntrada(l.grupo) && l.pago);
    const aPagar = soma((l) => !ehEntrada(l.grupo) && !l.pago);
    return {
      recebido,
      aReceber,
      pago,
      aPagar,
      receitas: recebido + aReceber,
      despesas: pago + aPagar,
    };
  }, [p.lancamentos]);
  const resultado = r.receitas - r.despesas;

  const contagem = useMemo(() => {
    const m = new Map<GrupoFinanceiro, number>();
    for (const l of p.lancamentos) m.set(l.grupo, (m.get(l.grupo) ?? 0) + 1);
    return m;
  }, [p.lancamentos]);

  const vencido = (l: Lancamento) => !l.pago && l.data < p.hoje;
  const termo = normalizar(busca);
  const doGrupo = p.lancamentos.filter((l) => l.grupo === grupo);
  const visiveis = doGrupo
    .filter(
      (l) =>
        !situacao ||
        (situacao === "pago"
          ? l.pago
          : situacao === "vencido"
            ? vencido(l)
            : !l.pago && !vencido(l)),
    )
    .filter(
      (l) => !categoria || catPorId.get(l.categoriaId)?.paiId === categoria,
    )
    .filter((l) => {
      if (!termo) return true;
      const sub = catPorId.get(l.categoriaId);
      return normalizar(
        `${l.descricao ?? ""} ${l.pessoa ?? ""} ${sub?.nome ?? ""} ${catPorId.get(sub?.paiId ?? "")?.nome ?? ""}`,
      ).includes(termo);
    });
  const principaisDoGrupo = p.categorias.filter(
    (c) => c.grupo === grupo && !c.paiId,
  );
  const info = GRUPOS[grupo];
  const entrada = ehEntrada(grupo);

  function trocarPago(l: Lancamento) {
    startPago(async () => {
      const res = await alternarPago(l.id, !l.pago);
      if (res.ok)
        notificar.sucesso(
          l.pago
            ? "Marcado como pendente"
            : entrada
              ? "Marcado como recebido"
              : "Marcado como pago",
          formatarMoeda(l.valor),
        );
      else notificar.erro("Não foi possível alterar", res.mensagem);
    });
  }

  if (!p.contas.length) {
    return (
      <section className="flex flex-col items-center gap-4 rounded-2xl bg-card px-5 py-16 text-center ring-1 ring-foreground/10">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
          <Landmark className="size-7" />
        </span>
        <h1 className="text-xl font-semibold">Cadastre uma conta primeiro</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Os gastos e recebimentos são lançados em uma conta bancária ou no
          caixa do negócio.
        </p>
        <Button
          variant="highlight"
          size="lg"
          render={<Link href="/modulo-financeiro/contas" />}
        >
          <Plus data-icon="inline-start" />
          Cadastrar conta
        </Button>
      </section>
    );
  }

  return (
    <>
      {/* Topo */}
      <section className="relative flex flex-col gap-4 overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary-strong p-5 text-primary-foreground sm:p-6 lg:flex-row lg:items-center">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-highlight/10"
        />
        <div className="relative flex flex-1 items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-highlight text-highlight-foreground">
            <Wallet className="size-6" />
          </span>
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Gastos e recebimentos
            </h1>
            <p className="mt-0.5 text-sm text-primary-foreground/75">
              Todas as entradas e saídas de dinheiro do negócio.
            </p>
          </div>
        </div>
        <div className="relative lg:w-72">
          <label
            htmlFor="conta-atual"
            className="mb-1 block text-xs font-medium text-primary-foreground/70"
          >
            Conta
          </label>
          <SelectNativo
            id="conta-atual"
            value={p.contaSelecionada ?? ""}
            onChange={(e) => navegar({ conta: e.target.value || null })}
            className="bg-white text-foreground"
          >
            <option value="">Todas as contas</option>
            {p.contas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
                {c.padrao ? " (padrão)" : ""}
              </option>
            ))}
          </SelectNativo>
        </div>
      </section>

      {/* Indicadores */}
      <div>
        <p className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
          Período: {dataLonga(p.periodo.inicio)} a {dataLonga(p.periodo.fim)}
          {carregando && <LoaderCircle className="size-3.5 animate-spin" />}
        </p>
        <div
          className={cn(
            "grid grid-cols-2 gap-3 transition-opacity lg:grid-cols-4",
            carregando && "opacity-60",
          )}
        >
          <Indicador
            titulo="Saldo"
            icone={Wallet}
            cor="var(--primary)"
            valor={p.saldo}
            rodape={
              p.contaSelecionada
                ? `Saldo atual de ${contaPorId.get(p.contaSelecionada)?.nome}`
                : "Saldo atual (todas as contas)"
            }
          />
          <Indicador
            titulo="Receitas"
            icone={TrendingUp}
            cor="var(--success)"
            valor={r.receitas}
            rodape={`${formatarMoeda(r.recebido)} recebido · ${formatarMoeda(r.aReceber)} a receber`}
          />
          <Indicador
            titulo="Despesas"
            icone={TrendingDown}
            cor="var(--destructive)"
            valor={r.despesas}
            rodape={`${formatarMoeda(r.pago)} pago · ${formatarMoeda(r.aPagar)} a pagar`}
          />
          <Indicador
            titulo="Resultado"
            icone={DollarSign}
            cor={resultado >= 0 ? "var(--serie-1)" : "var(--destructive)"}
            valor={resultado}
            rodape={
              resultado >= 0
                ? "Sobra prevista no período"
                : "Falta prevista no período"
            }
            destaque
          />
        </div>
      </div>

      {/* Grupos */}
      <div
        role="tablist"
        aria-label="Tipo de movimentação"
        className="flex gap-2 overflow-x-auto pb-1"
      >
        {GRUPOS_FINANCEIROS.map((g) => {
          const G = GRUPOS[g];
          const ativo = g === grupo;
          return (
            <button
              key={g}
              type="button"
              role="tab"
              aria-selected={ativo}
              onClick={() => {
                setGrupo(g);
                setCategoria("");
              }}
              className={cn(
                "flex h-10 shrink-0 items-center gap-2 rounded-xl px-3.5 text-sm font-semibold ring-1 transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                ativo
                  ? "text-white shadow-md ring-transparent"
                  : "bg-card ring-foreground/10 hover:ring-foreground/25",
              )}
              style={ativo ? { background: G.cor } : undefined}
            >
              <G.icone
                className="size-4"
                style={ativo ? undefined : { color: G.cor }}
              />
              {G.rotulo}
              {(contagem.get(g) ?? 0) > 0 && (
                <span
                  className={cn(
                    "rounded-full px-1.5 text-xs tabular-nums",
                    ativo ? "bg-white/25" : "bg-muted text-muted-foreground",
                  )}
                >
                  {contagem.get(g)}
                </span>
              )}
            </button>
          );
        })}
        <button
          type="button"
          disabled
          title="Em breve"
          className="flex h-10 shrink-0 cursor-not-allowed items-center gap-2 rounded-xl bg-card px-3.5 text-sm font-semibold text-muted-foreground/60 ring-1 ring-foreground/5"
        >
          <ArrowLeftRight className="size-4" />
          Transferências
          <span className="rounded bg-muted px-1.5 text-[10px] uppercase">
            Em breve
          </span>
        </button>
      </div>

      {/* Movimentações */}
      <section className="flex flex-col gap-4 rounded-2xl bg-card p-4 ring-1 ring-foreground/10 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span
              className="flex size-10 items-center justify-center rounded-lg text-white"
              style={{ background: info.cor }}
            >
              <info.icone className="size-5" />
            </span>
            <div>
              <h2 className="font-semibold">{info.rotulo}</h2>
              <p className="text-sm text-muted-foreground">{info.descricao}</p>
            </div>
          </div>
          <Button
            variant="highlight"
            size="lg"
            className="h-10"
            onClick={() => setModal({ tipo: "novo" })}
          >
            <Plus data-icon="inline-start" />
            {entrada ? "Novo recebimento" : "Novo gasto"}
          </Button>
        </div>

        {/* Período */}
        <div className="flex flex-col gap-3 rounded-xl bg-muted/40 p-3">
          <div className="flex flex-wrap gap-1.5">
            {atalhos.map((a) => {
              const ativo =
                a.inicio === p.periodo.inicio && a.fim === p.periodo.fim;
              return (
                <button
                  key={a.rotulo}
                  type="button"
                  onClick={() => navegar({ inicio: a.inicio, fim: a.fim })}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold ring-1 transition-colors",
                    ativo
                      ? "bg-primary text-primary-foreground ring-primary"
                      : "bg-card ring-foreground/10 hover:ring-foreground/30",
                  )}
                >
                  {a.rotulo}
                </button>
              );
            })}
          </div>
          <form
            className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              if (datas.inicio && datas.fim && datas.inicio <= datas.fim)
                navegar(datas);
              else
                notificar.erro(
                  "Período inválido",
                  "A data de início deve ser antes da data de fim.",
                );
            }}
          >
            <label className="flex flex-col gap-1 text-xs font-medium">
              Data de início
              <Input
                type="date"
                value={datas.inicio}
                onChange={(e) =>
                  setDatas((d) => ({ ...d, inicio: e.target.value }))
                }
                className="h-9 bg-card"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium">
              Data de fim
              <Input
                type="date"
                value={datas.fim}
                onChange={(e) =>
                  setDatas((d) => ({ ...d, fim: e.target.value }))
                }
                className="h-9 bg-card"
              />
            </label>
            <Button type="submit" variant="outline" className="h-9">
              Filtrar
            </Button>
          </form>
        </div>

        {/* Busca e filtros */}
        <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <label htmlFor="lanc-busca" className="sr-only">
              Buscar
            </label>
            <Input
              id="lanc-busca"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder={`Buscar descrição, ${entrada ? "quem pagou" : "quem recebeu"}...`}
              className="h-10 bg-muted/40 pl-9"
            />
          </div>
          <div className="sm:w-44">
            <label htmlFor="lanc-situacao" className="sr-only">
              Situação
            </label>
            <SelectNativo
              id="lanc-situacao"
              value={situacao}
              onChange={(e) => setSituacao(e.target.value as typeof situacao)}
            >
              <option value="">Todas as situações</option>
              <option value="pago">{entrada ? "Recebidos" : "Pagos"}</option>
              <option value="pendente">Pendentes</option>
              <option value="vencido">Vencidos</option>
            </SelectNativo>
          </div>
          <div className="sm:w-52">
            <label htmlFor="lanc-categoria" className="sr-only">
              Categoria
            </label>
            <SelectNativo
              id="lanc-categoria"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
            >
              <option value="">Todas as categorias</option>
              {principaisDoGrupo.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </SelectNativo>
          </div>
        </div>

        {/* Lista */}
        {visiveis.length ? (
          <>
            <ul
              className={cn(
                "flex flex-col divide-y rounded-xl ring-1 ring-foreground/10 transition-opacity",
                carregando && "opacity-60",
              )}
            >
              {visiveis.map((l) => {
                const sub = catPorId.get(l.categoriaId);
                const principal = catPorId.get(sub?.paiId ?? "");
                const venc = vencido(l);
                return (
                  <li
                    key={l.id}
                    className="group flex flex-col gap-2 px-3 py-3 hover:bg-muted/40 sm:flex-row sm:items-center sm:gap-3 sm:px-4"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <span className="flex size-9 shrink-0 flex-col items-center justify-center rounded-lg bg-muted text-[11px] leading-tight font-semibold tabular-nums">
                        {dataCurta(l.data).split("/")[0]}
                        <span className="text-[9px] font-medium text-muted-foreground">
                          {
                            [
                              "",
                              "jan",
                              "fev",
                              "mar",
                              "abr",
                              "mai",
                              "jun",
                              "jul",
                              "ago",
                              "set",
                              "out",
                              "nov",
                              "dez",
                            ][Number(l.data.slice(5, 7))]
                          }
                        </span>
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {l.descricao || sub?.nome || "Lançamento"}
                        </p>
                        <p className="flex flex-wrap gap-x-2 text-xs text-muted-foreground">
                          <span className="truncate">
                            {principal?.nome} › {sub?.nome}
                          </span>
                          {l.pessoa && <span>· {l.pessoa}</span>}
                          {l.formaPagamento && (
                            <span>· {FORMAS[l.formaPagamento]}</span>
                          )}
                          {!p.contaSelecionada && p.contas.length > 1 && (
                            <span>· {contaPorId.get(l.contaId)?.nome}</span>
                          )}
                          {l.serieTipo && (
                            <span className="flex items-center gap-0.5">
                              · <Repeat className="size-3" />
                              {l.serieTipo === "parcela"
                                ? "Parcela"
                                : "Recorrente"}{" "}
                              {l.serieNumero}/{l.serieTotal}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                          l.pago
                            ? "bg-success/12 text-success"
                            : venc
                              ? "bg-destructive/10 text-destructive"
                              : "bg-highlight-soft text-highlight-foreground",
                        )}
                      >
                        {l.pago
                          ? entrada
                            ? "Recebido"
                            : "Pago"
                          : venc
                            ? "Vencido"
                            : "Pendente"}
                      </span>
                      <span
                        className={cn(
                          "w-28 text-right font-semibold tabular-nums",
                          entrada ? "text-success" : "text-destructive",
                        )}
                      >
                        {entrada ? "+" : "−"} {formatarMoeda(l.valor)}
                      </span>
                      <div className="flex shrink-0">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => trocarPago(l)}
                          aria-label={
                            l.pago
                              ? "Marcar como pendente"
                              : entrada
                                ? "Marcar como recebido"
                                : "Marcar como pago"
                          }
                          title={
                            l.pago
                              ? "Marcar como pendente"
                              : entrada
                                ? "Marcar como recebido"
                                : "Marcar como pago"
                          }
                          className={
                            l.pago
                              ? "text-success hover:text-success"
                              : "text-muted-foreground"
                          }
                        >
                          {l.pago ? <CircleCheck /> : <CircleDashed />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setModal({ tipo: "editar", l })}
                          aria-label="Editar"
                          title="Editar"
                          className="text-muted-foreground"
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setModal({ tipo: "excluir", l })}
                          aria-label="Excluir"
                          title="Excluir"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash />
                        </Button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="text-right text-sm text-muted-foreground">
              {plural(visiveis.length, "movimentação", "movimentações")} · Total{" "}
              <strong className={entrada ? "text-success" : "text-destructive"}>
                {formatarMoeda(visiveis.reduce((s, l) => s + l.valor, 0))}
              </strong>
            </p>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-xl px-5 py-12 text-center ring-1 ring-foreground/10 ring-dashed">
            <span
              className="flex size-12 items-center justify-center rounded-2xl text-white"
              style={{ background: info.cor }}
            >
              <info.icone className="size-6" />
            </span>
            <p className="font-medium">
              {doGrupo.length
                ? "Nada encontrado com esses filtros"
                : `Nenhum ${entrada ? "recebimento" : "gasto"} neste período`}
            </p>
            {!doGrupo.length && (
              <Button
                variant="highlight"
                onClick={() => setModal({ tipo: "novo" })}
              >
                <Plus data-icon="inline-start" />
                {entrada ? "Novo recebimento" : "Novo gasto"}
              </Button>
            )}
          </div>
        )}
      </section>

      {(modal?.tipo === "novo" || modal?.tipo === "editar") && (
        <ModalLancamento
          key={modal.tipo === "editar" ? modal.l.id : `novo-${grupo}`}
          lancamento={modal.tipo === "editar" ? modal.l : undefined}
          grupoInicial={modal.tipo === "editar" ? modal.l.grupo : grupo}
          contas={p.contas}
          contaInicial={p.contaSelecionada}
          categorias={p.categorias}
          fornecedores={p.fornecedores}
          hoje={p.hoje}
          onFechar={() => setModal(null)}
          onConcluido={(titulo, descricao, novoGrupo) => {
            setModal(null);
            if (novoGrupo) setGrupo(novoGrupo);
            notificar.sucesso(titulo, descricao);
          }}
        />
      )}
      {modal?.tipo === "excluir" && (
        <ModalExcluirLancamento
          l={modal.l}
          rotulo={catPorId.get(modal.l.categoriaId)?.nome ?? "Lançamento"}
          onFechar={() => setModal(null)}
          onConcluido={(t, d) => {
            setModal(null);
            notificar.sucesso(t, d);
          }}
        />
      )}
    </>
  );
}

function Indicador({
  titulo,
  icone: Icone,
  cor,
  valor,
  rodape,
  destaque,
}: {
  titulo: string;
  icone: LucideIcon;
  cor: string;
  valor: number;
  rodape: string;
  destaque?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col gap-1 overflow-hidden rounded-2xl bg-card p-4 ring-1 ring-foreground/10 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-lg motion-reduce:hover:translate-y-0",
        destaque && "ring-2",
      )}
      style={
        destaque
          ? {
              ["--tw-ring-color" as string]: `color-mix(in oklab, ${cor} 40%, transparent)`,
            }
          : undefined
      }
    >
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-1"
        style={{ background: cor }}
      />
      <div className="flex items-center justify-between">
        <span
          className="text-xs font-semibold tracking-wide uppercase"
          style={{ color: cor }}
        >
          {titulo}
        </span>
        <span
          className="flex size-8 items-center justify-center rounded-lg"
          style={{
            background: `color-mix(in oklab, ${cor} 12%, transparent)`,
            color: cor,
          }}
        >
          <Icone className="size-4" />
        </span>
      </div>
      <p
        className="text-lg font-bold tracking-tight sm:text-2xl"
        style={valor < 0 ? { color: "var(--destructive)" } : undefined}
      >
        <NumeroAnimado valor={valor} formato={formatarMoeda} />
      </p>
      <p className="text-xs text-muted-foreground">{rodape}</p>
    </div>
  );
}

function ModalExcluirLancamento({
  l,
  rotulo,
  onFechar,
  onConcluido,
}: {
  l: Lancamento;
  rotulo: string;
  onFechar: () => void;
  onConcluido: (t: string, d: string) => void;
}) {
  const [seguintes, setSeguintes] = useState(false);
  return (
    <ModalExcluir
      item="lançamento"
      nome={l.descricao || rotulo}
      consequencia={
        l.pago
          ? "O saldo da conta será recalculado sem este valor."
          : "O lançamento será removido."
      }
      detalhes={[
        { rotulo: "Data", valor: dataLonga(l.data) },
        { rotulo: "Valor", valor: formatarMoeda(l.valor) },
      ]}
      excluir={() => excluirLancamento(l.id, seguintes)}
      onFechar={onFechar}
      onConcluido={onConcluido}
    >
      {l.serieId && (
        <label className="flex cursor-pointer items-start gap-2 rounded-lg bg-muted/60 p-3 text-sm">
          <input
            type="checkbox"
            checked={seguintes}
            onChange={(e) => setSeguintes(e.target.checked)}
            className="mt-0.5 size-4 accent-[var(--primary)]"
          />
          <span>
            Excluir também{" "}
            {l.serieTipo === "parcela"
              ? "as próximas parcelas"
              : "as próximas repetições"}{" "}
            que ainda não foram pagas
            <span className="block text-xs text-muted-foreground">
              Este é o {l.serieNumero}º de {l.serieTotal}.
            </span>
          </span>
        </label>
      )}
    </ModalExcluir>
  );
}
