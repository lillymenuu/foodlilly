"use client";

import { useLayoutEffect, useState, useTransition } from "react";
import {
  ArrowRight,
  Building2,
  ChartLine,
  CreditCard,
  EllipsisVertical,
  Layers,
  Lock,
  PiggyBank,
  Plus,
  Settings2,
  Sparkles,
  Star,
  Trash,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";

import { ModalCabecalho } from "@/components/modal-cabecalho";
import { notificar } from "@/components/notificacoes";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatarMoeda } from "@/lib/numero-br";
import { plural } from "@/lib/texto";

import { definirContaPadrao } from "./actions";
import { CartaoConta, ModalConta, ModalExcluirConta } from "./modais";
import type { Conta } from "./tipos";

type Modal =
  | { tipo: "nova" }
  | { tipo: "editar"; conta: Conta }
  | { tipo: "excluir"; conta: Conta }
  | { tipo: "boas-vindas" }
  | null;

export function TelaContas({ contas }: { contas: Conta[] }) {
  // Sem contas: abre o convite para configurar (como na primeira visita).
  const [modal, setModal] = useState<Modal>(
    contas.length ? null : { tipo: "boas-vindas" },
  );
  const [, startPadrao] = useTransition();
  // Ao esconder a página (navegação com Cache Components), fecha os modais.
  useLayoutEffect(() => () => setModal(null), []);

  const total = contas.reduce((s, c) => s + c.saldoAtual, 0);
  const vazio = contas.length === 0;
  const concluir = (titulo: string, descricao: string) => {
    setModal(null);
    notificar.sucesso(titulo, descricao);
  };

  function tornarPadrao(conta: Conta) {
    startPadrao(async () => {
      const r = await definirContaPadrao(conta.id);
      if (r.ok) notificar.sucesso("Conta padrão alterada", conta.nome);
      else notificar.erro("Não foi possível alterar", r.mensagem);
    });
  }

  return (
    <>
      {/* Banner com as etapas da configuração */}
      <section className="relative flex flex-col gap-5 overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary-strong p-5 text-primary-foreground sm:p-6">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-highlight/10"
        />
        <div className="relative flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-highlight text-highlight-foreground">
            <Settings2 className="size-6" />
          </span>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Configurações financeiras
            </h1>
            <p className="mt-0.5 max-w-xl text-sm text-primary-foreground/75">
              Suas contas bancárias, categorias e fornecedores.
            </p>
          </div>
        </div>
        <div
          role="tablist"
          aria-label="Configurações"
          className="relative grid gap-2 sm:grid-cols-3"
        >
          <Aba
            ativa
            icone={Building2}
            titulo="Contas bancárias"
            detalhe={plural(contas.length, "conta", "contas")}
            passo={vazio ? 1 : undefined}
          />
          <Aba
            icone={Layers}
            titulo="Categorias"
            detalhe={vazio ? "Cadastre uma conta primeiro" : "Em breve"}
            bloqueada
          />
          <Aba
            icone={Users}
            titulo="Fornecedores"
            detalhe={vazio ? "Cadastre uma conta primeiro" : "Em breve"}
            bloqueada
          />
        </div>
      </section>

      {vazio ? (
        <BoasVindas onNova={() => setModal({ tipo: "nova" })} />
      ) : (
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <CreditCard className="size-5" />
              </span>
              <div>
                <h2 className="font-semibold">Contas ativas</h2>
                <p className="text-sm text-muted-foreground">
                  {plural(contas.length, "conta", "contas")} · Saldo total{" "}
                  <strong
                    className={cn(
                      "tabular-nums",
                      total < 0 ? "text-destructive" : "text-foreground",
                    )}
                  >
                    {formatarMoeda(total)}
                  </strong>
                </p>
              </div>
            </div>
            <Button
              variant="highlight"
              size="lg"
              className="h-10"
              onClick={() => setModal({ tipo: "nova" })}
            >
              <Plus data-icon="inline-start" />
              Nova conta
            </Button>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {contas.map((c, i) => (
              <li
                key={c.id}
                className="animate-in fade-in slide-in-from-bottom-2 duration-500 motion-reduce:animate-none"
                style={{
                  animationDelay: `${i * 70}ms`,
                  animationFillMode: "both",
                }}
              >
                <CartaoConta
                  conta={c}
                  acoes={
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="relative -mt-1 -mr-1 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                            aria-label={`Opções de ${c.nome}`}
                          />
                        }
                      >
                        <EllipsisVertical />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem
                          onClick={() => setModal({ tipo: "editar", conta: c })}
                        >
                          <Settings2 />
                          Editar conta
                        </DropdownMenuItem>
                        {!c.padrao && (
                          <DropdownMenuItem onClick={() => tornarPadrao(c)}>
                            <Star />
                            Definir como padrão
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() =>
                            setModal({ tipo: "excluir", conta: c })
                          }
                        >
                          <Trash />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  }
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {modal?.tipo === "boas-vindas" && (
        <ModalBoasVindas
          onCadastrar={() => setModal({ tipo: "nova" })}
          onFechar={() => setModal(null)}
        />
      )}
      {(modal?.tipo === "nova" || modal?.tipo === "editar") && (
        <ModalConta
          key={modal.tipo === "editar" ? modal.conta.id : "nova"}
          conta={modal.tipo === "editar" ? modal.conta : undefined}
          primeira={vazio}
          onFechar={() => setModal(null)}
          onConcluido={concluir}
        />
      )}
      {modal?.tipo === "excluir" && (
        <ModalExcluirConta
          conta={modal.conta}
          onFechar={() => setModal(null)}
          onConcluido={concluir}
        />
      )}
    </>
  );
}

function Aba({
  icone: Icone,
  titulo,
  detalhe,
  ativa,
  bloqueada,
  passo,
}: {
  icone: LucideIcon;
  titulo: string;
  detalhe: string;
  ativa?: boolean;
  bloqueada?: boolean;
  passo?: number;
}) {
  return (
    <div
      role="tab"
      aria-selected={Boolean(ativa)}
      aria-disabled={bloqueada || undefined}
      className={cn(
        "relative flex items-center justify-center gap-3 rounded-xl px-4 py-3 text-center transition-colors",
        ativa
          ? "bg-highlight text-highlight-foreground shadow-lg shadow-black/20"
          : "bg-white/5 text-primary-foreground/50 ring-1 ring-white/10",
      )}
    >
      {passo && (
        <span className="absolute -top-2 -left-2 flex size-6 items-center justify-center rounded-full bg-white text-xs font-bold text-primary shadow">
          {passo}
        </span>
      )}
      {bloqueada && <Lock className="absolute top-2 right-2 size-3.5" />}
      <Icone className="size-5 shrink-0" />
      <span className="text-left">
        <span className="block text-sm font-semibold">{titulo}</span>
        <span className="block text-xs opacity-80">{detalhe}</span>
      </span>
    </div>
  );
}

function BoasVindas({ onNova }: { onNova: () => void }) {
  const passos = [
    { n: 1, titulo: "Conta bancária", texto: "Passo atual", atual: true },
    { n: 2, titulo: "Categorias", texto: "Próximo passo" },
    { n: 3, titulo: "Pronto!", texto: "Comece a usar" },
  ];
  return (
    <section className="flex flex-col items-center gap-6 rounded-2xl bg-card px-5 py-12 text-center ring-1 ring-foreground/10 sm:py-16">
      <span className="relative flex size-16 items-center justify-center rounded-2xl bg-primary-soft text-primary">
        <Wallet className="size-8" />
        <span className="absolute -inset-2 animate-ping rounded-3xl bg-primary/10 [animation-duration:2.5s] motion-reduce:hidden" />
      </span>
      <div className="max-w-md">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Bem-vindo à Gestão financeira!
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Vamos configurar em poucos passos. Comece cadastrando a sua primeira
          conta bancária (ou o caixa do negócio).
        </p>
      </div>
      <ol className="flex w-full max-w-2xl flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        {passos.map((p, i) => (
          <li key={p.n} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                "flex flex-1 items-center gap-3 rounded-xl px-4 py-3 text-left ring-1",
                p.atual
                  ? "bg-highlight-soft ring-highlight/60"
                  : "bg-muted/50 ring-foreground/10",
              )}
            >
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                  p.atual
                    ? "bg-highlight text-highlight-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {p.n}
              </span>
              <span>
                <span
                  className={cn(
                    "block text-sm font-semibold",
                    !p.atual && "text-muted-foreground",
                  )}
                >
                  {p.titulo}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {p.texto}
                </span>
              </span>
            </div>
            {i < passos.length - 1 && (
              <ArrowRight className="hidden size-4 shrink-0 text-muted-foreground sm:block" />
            )}
          </li>
        ))}
      </ol>
      <Button
        variant="highlight"
        size="lg"
        className="h-11 px-6"
        onClick={onNova}
      >
        <Plus data-icon="inline-start" />
        Cadastrar primeira conta
      </Button>
    </section>
  );
}

function ModalBoasVindas({
  onCadastrar,
  onFechar,
}: {
  onCadastrar: () => void;
  onFechar: () => void;
}) {
  const itens = [
    { icone: PiggyBank, texto: "Controlar saldos e movimentações" },
    { icone: ChartLine, texto: "Gerar relatórios e gráficos" },
    { icone: Sparkles, texto: "Importar extratos do banco" },
  ];
  return (
    <Dialog open onOpenChange={(a) => !a && onFechar()}>
      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden p-0 sm:max-w-md"
      >
        <ModalCabecalho
          tipo="editar"
          icone={Building2}
          titulo="Nenhuma conta cadastrada"
          descricao="Vamos configurar juntos"
        />
        <div className="flex flex-col gap-4 p-5 sm:p-6">
          <p className="text-sm">
            Para começar a usar a Gestão financeira, cadastre pelo menos uma
            conta bancária (ou o caixa do negócio).
          </p>
          <div className="rounded-xl bg-muted/60 p-4">
            <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              O que você poderá fazer
            </p>
            <ul className="flex flex-col gap-3">
              {itens.map((it, i) => (
                <li
                  key={it.texto}
                  className="flex items-center gap-3 text-sm animate-in fade-in slide-in-from-left-2 motion-reduce:animate-none"
                  style={{
                    animationDelay: `${150 + i * 100}ms`,
                    animationFillMode: "both",
                  }}
                >
                  <span className="flex size-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    <it.icone className="size-4" />
                  </span>
                  {it.texto}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="flex flex-col-reverse gap-2 border-t bg-muted px-5 py-4 sm:flex-row sm:px-6">
          <DialogClose
            render={
              <Button variant="outline" size="lg" className="h-11 sm:w-32" />
            }
          >
            Depois
          </DialogClose>
          <Button
            variant="highlight"
            size="lg"
            className="h-11 flex-1"
            onClick={onCadastrar}
          >
            <Building2 data-icon="inline-start" />
            Cadastrar conta
            <ArrowRight data-icon="inline-end" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
