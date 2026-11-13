"use client";

import { useState, useTransition } from "react";
import { Check, Minus, Plus, Star } from "lucide-react";
import { cn } from "cn";

import {
  CampoModal,
  ModalExcluir,
  ModalFormulario,
  semErro,
} from "@/components/cadastro";
import { SelectNativo } from "@/components/cadastro/select-nativo";
import { InputUnidade } from "@/components/formulario";
import { Input } from "@/components/ui/input";
import {
  formatarMoeda,
  mascaraMoeda,
  paraNumero,
  paraTexto,
} from "@/lib/numero-br";

import { criarConta, editarConta, excluirConta } from "./actions";
import {
  CORES,
  LIMITES,
  TIPOS,
  type Conta,
  type CorConta,
  type TipoConta,
} from "./tipos";

/** Hoje no fuso de Brasília, como AAAA-MM-DD. */
const hoje = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(
    new Date(),
  );

/** Modal de cadastro (sem `conta`) ou edição (com `conta`). */
export function ModalConta({
  conta,
  primeira,
  onFechar,
  onConcluido,
}: {
  conta?: Conta;
  /** Primeira conta do negócio: vira a padrão. */
  primeira: boolean;
  onFechar: () => void;
  onConcluido: (titulo: string, descricao: string) => void;
}) {
  const [nome, setNome] = useState(conta?.nome ?? "");
  const [tipo, setTipo] = useState<TipoConta>(conta?.tipo ?? "corrente");
  const [negativo, setNegativo] = useState((conta?.saldoInicial ?? 0) < 0);
  const [saldo, setSaldo] = useState(
    paraTexto(Math.abs(conta?.saldoInicial ?? 0), 2),
  );
  const [data, setData] = useState(conta?.dataSaldoInicial ?? hoje());
  const [padrao, setPadrao] = useState(conta?.padrao ?? primeira);
  const [cor, setCor] = useState<CorConta>(conta?.cor ?? "grafite");
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState<string>();
  const [salvando, start] = useTransition();
  const travaPadrao = primeira || Boolean(conta?.padrao);

  function enviar() {
    const errosLocais: Record<string, string> = {};
    const valor = saldo.trim() ? paraNumero(saldo) : 0;
    if (!nome.trim()) errosLocais.nome = "Informe o nome da conta.";
    if (valor == null || Number.isNaN(valor))
      errosLocais.saldoInicial = "Informe um valor válido.";
    if (!data)
      errosLocais.dataSaldoInicial = "Informe a data do saldo inicial.";
    if (Object.keys(errosLocais).length || valor == null)
      return setErros(errosLocais);
    const dados = {
      nome: nome.trim(),
      tipo,
      saldoInicial: negativo ? -valor : valor,
      dataSaldoInicial: data,
      padrao,
      cor,
    };
    start(async () => {
      const r = conta
        ? await editarConta(conta.id, dados)
        : await criarConta(dados);
      if (r.ok)
        onConcluido(conta ? "Conta atualizada" : "Conta criada", dados.nome);
      else {
        setErros(r.erros ?? {});
        setErroGeral(r.mensagem);
      }
    });
  }

  return (
    <ModalFormulario
      editando={Boolean(conta)}
      item="conta bancária"
      genero="f"
      descricaoNovo="Cadastre a conta do banco, a carteira ou o caixa do negócio."
      salvando={salvando}
      erroGeral={erroGeral}
      onFechar={onFechar}
      onEnviar={enviar}
    >
      <CampoModal id="conta-nome" rotulo="Nome da conta" erro={erros.nome}>
        <Input
          id="conta-nome"
          value={nome}
          onChange={(e) => {
            setNome(e.target.value);
            setErros(semErro("nome"));
          }}
          placeholder="Ex.: Conta principal, Nubank, Caixa da loja"
          maxLength={LIMITES.nome}
          autoFocus={!conta}
          className="h-10 bg-muted/60"
        />
      </CampoModal>

      <CampoModal id="conta-tipo" rotulo="Tipo de conta" erro={erros.tipo}>
        <SelectNativo
          id="conta-tipo"
          value={tipo}
          onChange={(e) => setTipo(e.target.value as TipoConta)}
        >
          {(Object.keys(TIPOS) as TipoConta[]).map((t) => (
            <option key={t} value={t}>
              {TIPOS[t].rotulo}
            </option>
          ))}
        </SelectNativo>
      </CampoModal>

      <div className="grid gap-5 sm:grid-cols-2">
        <CampoModal
          id="conta-saldo"
          rotulo="Saldo inicial"
          erro={erros.saldoInicial}
        >
          <div className="flex flex-col gap-2">
            <div
              role="radiogroup"
              aria-label="Saldo positivo ou negativo"
              className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1"
            >
              {(
                [
                  [false, "Positivo", Plus],
                  [true, "Negativo", Minus],
                ] as const
              ).map(([neg, rotulo, Icone]) => (
                <button
                  key={rotulo}
                  type="button"
                  role="radio"
                  aria-checked={negativo === neg}
                  onClick={() => setNegativo(neg)}
                  className={cn(
                    "flex h-8 items-center justify-center gap-1 rounded-md text-xs font-semibold transition-colors",
                    negativo === neg
                      ? neg
                        ? "bg-destructive text-white shadow-sm"
                        : "bg-success text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icone className="size-3.5" />
                  {rotulo}
                </button>
              ))}
            </div>
            <InputUnidade
              id="conta-saldo"
              prefixo={negativo ? "−R$" : "R$"}
              inputMode="numeric"
              value={saldo}
              placeholder="0,00"
              onChange={(e) => {
                setSaldo(mascaraMoeda(e.target.value));
                setErros(semErro("saldoInicial"));
              }}
              className={cn(
                negativo && "text-destructive",
                negativo && "pl-12",
              )}
            />
          </div>
        </CampoModal>

        <CampoModal
          id="conta-data"
          rotulo="Data do saldo inicial"
          descricao="Só lançamentos a partir desta data entram no saldo."
          erro={erros.dataSaldoInicial}
        >
          <Input
            id="conta-data"
            type="date"
            value={data}
            max="2100-12-31"
            onChange={(e) => setData(e.target.value)}
            className="h-10 bg-muted/60"
          />
        </CampoModal>
      </div>

      <label
        className={cn(
          "flex items-center gap-3 rounded-xl p-3 ring-1 transition-colors",
          padrao
            ? "bg-highlight-soft/60 ring-highlight/50"
            : "bg-muted/40 ring-foreground/10",
          travaPadrao ? "cursor-default" : "cursor-pointer",
        )}
      >
        <input
          type="checkbox"
          checked={padrao}
          disabled={travaPadrao}
          onChange={(e) => setPadrao(e.target.checked)}
          className="size-4 accent-[var(--primary)]"
        />
        <span className="flex-1">
          <span className="block text-sm font-medium">
            Definir como conta padrão
          </span>
          <span className="block text-xs text-muted-foreground">
            {primeira
              ? "A primeira conta é sempre a padrão."
              : conta?.padrao
                ? "Para trocar, marque outra conta como padrão."
                : "Será a conta escolhida automaticamente nos lançamentos."}
          </span>
        </span>
        <Star
          className={cn(
            "size-5",
            padrao
              ? "fill-highlight text-highlight-strong"
              : "text-muted-foreground",
          )}
        />
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Cor do cartão</legend>
        <div
          role="radiogroup"
          aria-label="Cor do cartão"
          className="flex flex-wrap gap-2.5"
        >
          {(Object.keys(CORES) as CorConta[]).map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={cor === c}
              aria-label={CORES[c].rotulo}
              title={CORES[c].rotulo}
              onClick={() => setCor(c)}
              className={cn(
                "flex size-9 items-center justify-center rounded-full text-white transition-transform hover:scale-110 focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none",
                cor === c &&
                  "scale-110 ring-2 ring-foreground ring-offset-2 ring-offset-card",
              )}
              style={{ background: CORES[c].valor }}
            >
              {cor === c && <Check className="size-4" strokeWidth={3} />}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Prévia do cartão */}
      <div className="flex justify-center pt-1">
        <CartaoConta
          previa
          conta={{
            id: "",
            nome: nome.trim() || "Nome da conta",
            tipo,
            cor,
            padrao,
            saldoInicial: 0,
            dataSaldoInicial: data,
            saldoAtual: (negativo ? -1 : 1) * (paraNumero(saldo) ?? 0),
          }}
        />
      </div>
    </ModalFormulario>
  );
}

export function ModalExcluirConta({
  conta,
  onFechar,
  onConcluido,
}: {
  conta: Conta;
  onFechar: () => void;
  onConcluido: (titulo: string, descricao: string) => void;
}) {
  return (
    <ModalExcluir
      item="conta"
      genero="f"
      nome={conta.nome}
      consequencia={
        conta.padrao
          ? "Ela é a conta padrão: a conta mais antiga passa a ser a padrão."
          : "A conta será removida do Financeiro."
      }
      detalhes={[
        { rotulo: "Tipo", valor: TIPOS[conta.tipo].rotulo },
        { rotulo: "Saldo atual", valor: formatarMoeda(conta.saldoAtual) },
      ]}
      excluir={() => excluirConta(conta.id)}
      onFechar={onFechar}
      onConcluido={onConcluido}
    />
  );
}

/** Cartão no estilo de cartão de banco, na cor escolhida. */
export function CartaoConta({
  conta,
  previa,
  acoes,
}: {
  conta: Conta;
  previa?: boolean;
  acoes?: React.ReactNode;
}) {
  const Tipo = TIPOS[conta.tipo];
  const positivo = conta.saldoAtual >= 0;
  return (
    <div
      className={cn(
        "relative flex aspect-[1.6] w-full flex-col overflow-hidden rounded-2xl p-5 text-white shadow-lg ring-1 ring-white/10",
        previa
          ? "max-w-72 text-sm"
          : "transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-2xl motion-reduce:hover:translate-y-0",
      )}
      style={{
        background: `linear-gradient(135deg, color-mix(in oklab, ${CORES[conta.cor].valor} 100%, white 8%), color-mix(in oklab, ${CORES[conta.cor].valor} 70%, black))`,
      }}
    >
      {/* brilho e marca d'água */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-10 size-48 rounded-full bg-white/10"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -left-10 size-48 rounded-full bg-black/10"
      />
      <Tipo.icone
        aria-hidden
        className="pointer-events-none absolute right-4 bottom-12 size-20 text-white/8"
      />

      <div className="relative flex items-start justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          <span
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase",
              positivo ? "bg-white/15" : "bg-red-950/40",
            )}
          >
            {positivo ? "Saldo positivo" : "Saldo negativo"}
          </span>
          {conta.padrao && (
            <span className="flex items-center gap-1 rounded-full bg-highlight px-2 py-0.5 text-[10px] font-bold tracking-wide text-highlight-foreground uppercase">
              <Star className="size-3 fill-current" />
              Padrão
            </span>
          )}
        </div>
        {acoes}
      </div>

      {/* chip */}
      <span
        aria-hidden
        className="relative mt-3 h-7 w-10 rounded-md bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 shadow-inner"
      >
        <span className="absolute inset-x-1.5 top-1/2 h-px bg-amber-800/40" />
        <span className="absolute inset-y-1.5 left-1/2 w-px bg-amber-800/40" />
      </span>
      <p
        aria-hidden
        className="relative mt-2 font-mono text-sm tracking-[0.3em] text-white/70"
      >
        •••• •••• ••••
      </p>

      <div className="relative mt-auto flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold tracking-wider text-white/60 uppercase">
            {Tipo.rotulo}
          </p>
          <p
            className="truncate text-base font-bold tracking-wide uppercase"
            title={conta.nome}
          >
            {conta.nome}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[10px] font-semibold tracking-wider text-white/60 uppercase">
            Saldo atual
          </p>
          <p className="text-lg font-bold tabular-nums">
            {formatarMoeda(conta.saldoAtual)}
          </p>
        </div>
      </div>
    </div>
  );
}
