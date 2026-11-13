"use client";

import { useId, useState, useTransition } from "react";
import { CreditCard, LoaderCircle, Repeat, X } from "lucide-react";
import { cn } from "cn";

import { Aviso } from "@/components/formulario";
import { SelectNativo } from "@/components/cadastro/select-nativo";
import { InputUnidade } from "@/components/formulario";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  formatarMoeda,
  mascaraMoeda,
  paraNumero,
  paraTexto,
} from "@/lib/numero-br";
import { normalizar } from "@/lib/texto";

import {
  CATALOGO,
  GRUPOS,
  GRUPOS_FINANCEIROS,
  type GrupoFinanceiro,
} from "../contas/catalogo-categorias";
import type { CategoriaFinanceira } from "../contas/tipos";
import { criarLancamento, editarLancamento } from "./actions";
import { INTERVALOS, PainelRepeticao, type Parcela } from "./painel-repeticao";
import {
  ehEntrada,
  FORMAS,
  dataDaOcorrencia,
  LIMITES_LANCAMENTO,
  MAXIMO_VEZES,
  type ContaOpcao,
  type Intervalo,
  type FormaPagamento,
  type FornecedorOpcao,
  type Lancamento,
} from "./tipos";

const NOVA = "__nova";

/** Nomes curtos para as abas do modal caberem numa linha. */
const ROTULO_CURTO: Record<GrupoFinanceiro, string> = {
  recebimentos: "Recebimentos",
  operacionais: "Operacionais",
  variaveis: "Variáveis",
  pessoas: "Pessoas",
  impostos: "Impostos",
  aquisicoes: "Aquisições",
};

export function ModalLancamento({
  lancamento: l,
  grupoInicial,
  contas,
  contaInicial,
  categorias,
  fornecedores,
  hoje,
  onFechar,
  onConcluido,
}: {
  lancamento?: Lancamento;
  grupoInicial: GrupoFinanceiro;
  contas: ContaOpcao[];
  contaInicial: string | null;
  categorias: CategoriaFinanceira[];
  fornecedores: FornecedorOpcao[];
  hoje: string;
  onFechar: () => void;
  onConcluido: (
    titulo: string,
    descricao: string,
    grupo?: GrupoFinanceiro,
  ) => void;
}) {
  const subInicial = l
    ? categorias.find((c) => c.id === l.categoriaId)
    : undefined;
  const principalInicial = subInicial
    ? categorias.find((c) => c.id === subInicial.paiId)
    : undefined;

  const [grupo, setGrupo] = useState<GrupoFinanceiro>(grupoInicial);
  const [contaId, setContaId] = useState(
    l?.contaId ??
      contaInicial ??
      contas.find((c) => c.padrao)?.id ??
      contas[0]?.id ??
      "",
  );
  const [data, setData] = useState(l?.data ?? hoje);
  const [valor, setValor] = useState(l ? paraTexto(l.valor, 2) : "");
  const [pessoa, setPessoa] = useState(l?.pessoa ?? "");
  const [forma, setForma] = useState<FormaPagamento | "">(
    l?.formaPagamento ?? "",
  );
  const [descricao, setDescricao] = useState(l?.descricao ?? "");
  const [principal, setPrincipal] = useState(principalInicial?.chave ?? "");
  const [sub, setSub] = useState(subInicial?.id ?? "");
  const [subNova, setSubNova] = useState("");
  const [pago, setPago] = useState(l?.pago ?? false);
  const [repeticao, setRepeticao] = useState<"" | "parcela" | "recorrente">("");
  const [vezes, setVezes] = useState(2);
  const [intervalo, setIntervalo] = useState<Intervalo>("mensal");
  const [personalizar, setPersonalizar] = useState(false);
  const [parcelas, setParcelas] = useState<Parcela[]>([]);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState<string>();
  const [salvando, start] = useTransition();
  const listaId = useId();

  const info = GRUPOS[grupo];
  const entrada = ehEntrada(grupo);
  const salvas = categorias.filter((c) => c.grupo === grupo && !c.paiId);
  const sugeridas = CATALOGO.filter(
    (p) => p.grupo === grupo && !salvas.some((s) => s.chave === p.chave),
  );
  const principalSalva = salvas.find((s) => s.chave === principal);
  const subsSalvas = principalSalva
    ? categorias
        .filter((c) => c.paiId === principalSalva.id)
        .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
    : [];
  const subsSugeridas = (
    CATALOGO.find((p) => p.chave === principal)?.sugestoes ?? []
  ).filter(
    (s) => !subsSalvas.some((x) => normalizar(x.nome) === normalizar(s)),
  );
  const personalizado = repeticao === "parcela" && personalizar;
  // Com parcelas personalizadas, o total é a soma delas.
  const somaParcelas = parcelas.reduce(
    (s, p) => s + (paraNumero(p.valor) ?? 0),
    0,
  );
  const valorNum = personalizado
    ? Math.round(somaParcelas * 100) / 100
    : paraNumero(valor);
  const nVezes = vezes;
  const maximo =
    repeticao === "parcela"
      ? MAXIMO_VEZES.parcela
      : MAXIMO_VEZES.recorrente[intervalo];

  /** Parcelas iguais (centavos de sobra na 1ª), nas datas do intervalo. */
  function distribuir(
    total: number | null,
    n: number,
    inicio: string,
    iv: Intervalo,
    anteriores: Parcela[] = [],
  ): Parcela[] {
    const centavos = Math.round((total ?? 0) * 100);
    const base = Math.floor(centavos / n);
    return Array.from({ length: n }, (_, i) => ({
      valor: paraTexto((base + (i === 0 ? centavos - base * n : 0)) / 100, 2),
      data: dataDaOcorrencia(inicio, iv, i),
      pago: anteriores[i]?.pago ?? false,
    }));
  }

  /** Muda a quantidade; com parcelas personalizadas, mantém as que já existem e completa as novas. */
  function mudarVezes(n: number) {
    const v = Math.max(2, Math.min(maximo, n));
    setVezes(v);
    if (personalizado) {
      setParcelas((ps) =>
        Array.from(
          { length: v },
          (_, i) =>
            ps[i] ?? {
              valor: "",
              data: dataDaOcorrencia(data, intervalo, i),
              pago: false,
            },
        ),
      );
    }
  }

  function mudarIntervalo(iv: Intervalo) {
    setIntervalo(iv);
    const max =
      repeticao === "parcela"
        ? MAXIMO_VEZES.parcela
        : MAXIMO_VEZES.recorrente[iv];
    if (vezes > max) setVezes(max);
    if (personalizado)
      setParcelas((ps) =>
        ps.map((p, i) => ({ ...p, data: dataDaOcorrencia(data, iv, i) })),
      );
  }

  function alternarPersonalizar() {
    if (!personalizar)
      setParcelas(distribuir(paraNumero(valor), vezes, data, intervalo));
    else setValor(paraTexto(somaParcelas, 2));
    setPersonalizar((p) => !p);
  }

  const limpar = (k: string) =>
    setErros(({ [k]: _ignorado, ...resto }) => (void _ignorado, resto));

  function trocarGrupo(g: GrupoFinanceiro) {
    setGrupo(g);
    setPrincipal("");
    setSub("");
    setSubNova("");
  }

  function enviar() {
    const e: Record<string, string> = {};
    if (!contaId) e.contaId = "Escolha a conta.";
    if (!data) e.data = "Informe a data.";
    if (valorNum == null || Number.isNaN(valorNum) || valorNum <= 0)
      e.valor = "Informe um valor maior que zero.";
    if (!principal) e.principalChave = "Escolha a categoria.";
    else if (!sub || (sub === NOVA && !subNova.trim()))
      e.subcategoria = "Escolha a subcategoria.";
    if (repeticao && (nVezes < 2 || nVezes > maximo))
      e.vezes = `De 2 a ${maximo}.`;
    if (personalizado) {
      const ruim = parcelas.findIndex(
        (p) => !((paraNumero(p.valor) ?? 0) > 0) || !p.data,
      );
      if (ruim >= 0)
        e.parcelas = `Confira a parcela ${ruim + 1}: valor maior que zero e data.`;
    }
    if (Object.keys(e).length) return setErros(e);

    const subEscolhida = sub.startsWith("sug:")
      ? { id: "", nome: sub.slice(4) }
      : sub === NOVA
        ? { id: "", nome: subNova.trim() }
        : { id: sub, nome: "" };
    const dados = {
      grupo,
      contaId,
      data,
      valor: valorNum!,
      pessoa: pessoa.trim(),
      formaPagamento: forma,
      descricao: descricao.trim(),
      principalChave: principal,
      subcategoriaId: subEscolhida.id,
      subcategoriaNome: subEscolhida.nome,
      pago,
      repeticao:
        !l && repeticao
          ? {
              tipo: repeticao,
              vezes: nVezes,
              intervalo,
              parcelas: personalizado
                ? parcelas.map((p) => ({
                    valor: paraNumero(p.valor)!,
                    data: p.data,
                    pago: p.pago,
                  }))
                : undefined,
            }
          : undefined,
    };
    start(async () => {
      const r = l
        ? await editarLancamento(l.id, dados)
        : await criarLancamento(dados);
      if (r.ok) {
        const quantidade = (r as { quantidade?: number }).quantidade ?? 0;
        const n = quantidade > 1 ? quantidade : 0;
        onConcluido(
          l
            ? "Lançamento atualizado"
            : entrada
              ? "Recebimento adicionado"
              : "Gasto adicionado",
          n
            ? `${n} lançamentos criados (${repeticao === "parcela" ? "parcelas" : "repetições"} ${INTERVALOS.find((i) => i.valor === intervalo)!.rotulo.toLowerCase()}s).`
            : formatarMoeda(valorNum!),
          grupo,
        );
      } else {
        setErros(r.erros ?? {});
        setErroGeral(r.mensagem);
      }
    });
  }

  return (
    <Dialog open onOpenChange={(a) => !a && onFechar()}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl max-sm:inset-0 max-sm:h-dvh max-sm:max-h-dvh max-sm:w-full max-sm:max-w-full max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none"
      >
        {/* Cabeçalho na cor do grupo */}
        <header
          className="relative shrink-0 px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-4 text-white sm:px-6 sm:pt-5"
          style={{
            background: `linear-gradient(120deg, color-mix(in oklab, ${info.cor} 85%, black), ${info.cor})`,
          }}
        >
          <div className="flex items-center gap-3 pr-8">
            <span className="flex size-11 items-center justify-center rounded-xl bg-white/20">
              <info.icone className="size-5" />
            </span>
            <div>
              <DialogTitle className="text-lg font-semibold">
                {l
                  ? "Editar lançamento"
                  : entrada
                    ? "Novo recebimento"
                    : "Novo gasto"}
              </DialogTitle>
              <DialogDescription className="text-sm text-white/85">
                {info.rotulo}: {info.descricao.toLowerCase()}
              </DialogDescription>
            </div>
          </div>
          <DialogClose
            className="absolute top-3 right-3 rounded-md p-1.5 opacity-80 hover:bg-white/20 hover:opacity-100"
            aria-label="Fechar"
          >
            <X className="size-4" />
          </DialogClose>
          {/* Tipo */}
          {/* Tipo: grade compacta, todos visíveis sem rolar (3 por linha no celular, 6 no computador) */}
          <div
            role="tablist"
            aria-label="Tipo"
            className="mt-4 grid grid-cols-3 gap-1.5 sm:grid-cols-6"
          >
            {GRUPOS_FINANCEIROS.map((g) => {
              const I = GRUPOS[g].icone;
              return (
                <button
                  key={g}
                  type="button"
                  role="tab"
                  aria-selected={g === grupo}
                  title={GRUPOS[g].rotulo}
                  onClick={() => trocarGrupo(g)}
                  className={cn(
                    "flex min-w-0 items-center justify-center gap-1 rounded-lg px-1.5 py-1.5 text-[11px] font-semibold transition-colors",
                    g === grupo
                      ? "bg-white text-foreground shadow"
                      : "bg-white/15 text-white hover:bg-white/25",
                  )}
                >
                  <I
                    className="size-3.5 shrink-0"
                    style={g === grupo ? { color: GRUPOS[g].cor } : undefined}
                  />
                  <span className="truncate">{ROTULO_CURTO[g]}</span>
                </button>
              );
            })}
          </div>
        </header>

        <form
          noValidate
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(e) => {
            e.preventDefault();
            if (!salvando) enviar();
          }}
        >
          <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-contain p-5 sm:p-6">
            {erroGeral && <Aviso tipo="erro">{erroGeral}</Aviso>}

            <Campo id="l-conta" rotulo="Conta" obrigatorio erro={erros.contaId}>
              <SelectNativo
                id="l-conta"
                value={contaId}
                onChange={(e) => (
                  setContaId(e.target.value),
                  limpar("contaId")
                )}
              >
                {contas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                    {c.padrao ? " (padrão)" : ""}
                  </option>
                ))}
              </SelectNativo>
            </Campo>

            <div className="grid gap-5 sm:grid-cols-2">
              <Campo
                id="l-data"
                rotulo={entrada ? "Data do recebimento" : "Data do pagamento"}
                obrigatorio
                erro={erros.data}
              >
                <Input
                  id="l-data"
                  type="date"
                  value={data}
                  onChange={(e) => (setData(e.target.value), limpar("data"))}
                  className="h-10 bg-muted/60"
                />
              </Campo>
              <Campo
                id="l-valor"
                rotulo={repeticao === "parcela" ? "Valor total" : "Valor"}
                obrigatorio
                erro={erros.valor}
              >
                <InputUnidade
                  id="l-valor"
                  prefixo="R$"
                  inputMode="numeric"
                  placeholder="0,00"
                  // Parcelas personalizadas: o total é a soma delas (só leitura).
                  value={personalizado ? paraTexto(valorNum ?? 0, 2) : valor}
                  readOnly={personalizado}
                  title={
                    personalizado
                      ? "Soma das parcelas personalizadas"
                      : undefined
                  }
                  onChange={(e) => (
                    setValor(mascaraMoeda(e.target.value)),
                    limpar("valor")
                  )}
                />
              </Campo>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Campo
                id="l-pessoa"
                rotulo={entrada ? "Recebido de" : "Pago a"}
                dica={
                  entrada
                    ? "Cliente ou quem pagou"
                    : "Fornecedor ou quem recebeu"
                }
                erro={erros.pessoa}
              >
                <Input
                  id="l-pessoa"
                  list={listaId}
                  value={pessoa}
                  maxLength={LIMITES_LANCAMENTO.pessoa}
                  placeholder="Digite ou escolha um fornecedor"
                  onChange={(e) => setPessoa(e.target.value)}
                  className="h-10 bg-muted/60"
                />
                <datalist id={listaId}>
                  {fornecedores.map((f) => (
                    <option key={f.id} value={f.nome} />
                  ))}
                </datalist>
              </Campo>
              <Campo
                id="l-forma"
                rotulo="Forma de pagamento"
                dica="Como foi ou será pago"
              >
                <SelectNativo
                  id="l-forma"
                  value={forma}
                  onChange={(e) =>
                    setForma(e.target.value as FormaPagamento | "")
                  }
                >
                  <option value="">Selecione...</option>
                  {(Object.keys(FORMAS) as FormaPagamento[]).map((f) => (
                    <option key={f} value={f}>
                      {FORMAS[f]}
                    </option>
                  ))}
                </SelectNativo>
              </Campo>
            </div>

            <Campo
              id="l-descricao"
              rotulo="Descrição"
              dica="Opcional"
              erro={erros.descricao}
            >
              <Input
                id="l-descricao"
                value={descricao}
                maxLength={LIMITES_LANCAMENTO.descricao}
                placeholder={
                  entrada
                    ? "Ex.: Encomenda de bolo de aniversário"
                    : "Ex.: Compra de farinha e açúcar"
                }
                onChange={(e) => setDescricao(e.target.value)}
                className="h-10 bg-muted/60"
              />
            </Campo>

            <hr />

            <div className="grid gap-5 sm:grid-cols-2">
              <Campo
                id="l-categoria"
                rotulo="Categoria"
                obrigatorio
                erro={erros.principalChave}
              >
                <SelectNativo
                  id="l-categoria"
                  value={principal}
                  aria-invalid={Boolean(erros.principalChave)}
                  onChange={(e) => {
                    setPrincipal(e.target.value);
                    setSub("");
                    setSubNova("");
                    limpar("principalChave");
                  }}
                >
                  <option value="">Selecione a categoria...</option>
                  {salvas.length > 0 && (
                    <optgroup label="Salvas">
                      {salvas.map((c) => (
                        <option key={c.id} value={c.chave ?? ""}>
                          {c.nome}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {sugeridas.length > 0 && (
                    <optgroup label="Sugestões">
                      {sugeridas.map((c) => (
                        <option key={c.chave} value={c.chave}>
                          {c.nome} (sugestão)
                        </option>
                      ))}
                    </optgroup>
                  )}
                </SelectNativo>
              </Campo>
              <Campo
                id="l-sub"
                rotulo="Subcategoria"
                obrigatorio
                erro={erros.subcategoria}
              >
                <SelectNativo
                  id="l-sub"
                  value={sub}
                  disabled={!principal}
                  aria-invalid={Boolean(erros.subcategoria)}
                  onChange={(e) => (
                    setSub(e.target.value),
                    limpar("subcategoria")
                  )}
                >
                  <option value="">
                    {principal
                      ? "Selecione a subcategoria..."
                      : "Escolha a categoria antes"}
                  </option>
                  {subsSalvas.length > 0 && (
                    <optgroup label="Salvas">
                      {subsSalvas.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nome}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {subsSugeridas.length > 0 && (
                    <optgroup label="Sugestões">
                      {subsSugeridas.map((s) => (
                        <option key={s} value={`sug:${s}`}>
                          {s} (sugestão)
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {principal && (
                    <option value={NOVA}>+ Nova subcategoria...</option>
                  )}
                </SelectNativo>
                {sub === NOVA && (
                  <Input
                    autoFocus
                    value={subNova}
                    maxLength={60}
                    placeholder={`Nova subcategoria em ${principalSalva?.nome ?? CATALOGO.find((p) => p.chave === principal)?.nome}`}
                    onChange={(e) => (
                      setSubNova(e.target.value),
                      limpar("subcategoria")
                    )}
                    className="mt-2 h-10 bg-muted/60"
                    aria-label="Nome da nova subcategoria"
                  />
                )}
              </Campo>
            </div>

            {/* Repetição (só ao criar) */}
            {!l ? (
              <div className="grid gap-2 sm:grid-cols-3">
                {(
                  [
                    ["recorrente", "Recorrente", Repeat, "Repete todo mês"],
                    ["parcela", "Parcelar", CreditCard, "Divide o valor"],
                  ] as const
                ).map(([t, rotulo, Icone, dica]) => (
                  <button
                    key={t}
                    type="button"
                    role="switch"
                    aria-checked={repeticao === t}
                    onClick={() => {
                      const novo = repeticao === t ? "" : t;
                      setRepeticao(novo);
                      setPersonalizar(false);
                      if (novo)
                        setVezes((v) =>
                          Math.min(
                            v,
                            novo === "parcela"
                              ? MAXIMO_VEZES.parcela
                              : MAXIMO_VEZES.recorrente[intervalo],
                          ),
                        );
                    }}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl p-3 text-left ring-1 transition-colors",
                      repeticao === t
                        ? "bg-primary-soft ring-primary/40"
                        : "ring-foreground/10 hover:bg-muted/50",
                    )}
                  >
                    <Icone className="size-4 shrink-0 text-primary" />
                    <span className="flex-1">
                      <span className="block text-sm font-medium">
                        {rotulo}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {dica}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "relative h-5 w-9 shrink-0 rounded-full transition-colors",
                        repeticao === t
                          ? "bg-primary"
                          : "bg-muted-foreground/30",
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform",
                          repeticao === t
                            ? "translate-x-4.5"
                            : "translate-x-0.5",
                        )}
                      />
                    </span>
                  </button>
                ))}
                <label
                  className={cn(
                    "flex cursor-pointer items-center gap-2.5 rounded-xl p-3 ring-1 transition-colors",
                    pago
                      ? "bg-success/10 ring-success/40"
                      : "ring-foreground/10 hover:bg-muted/50",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={pago}
                    onChange={(e) => setPago(e.target.checked)}
                    className="size-4 accent-[var(--success)]"
                  />
                  <span className="text-sm font-medium">
                    {entrada ? "Já recebido" : "Já pago"}
                  </span>
                </label>
              </div>
            ) : (
              <label
                className={cn(
                  "flex w-fit cursor-pointer items-center gap-2.5 rounded-xl p-3 ring-1",
                  pago ? "bg-success/10 ring-success/40" : "ring-foreground/10",
                )}
              >
                <input
                  type="checkbox"
                  checked={pago}
                  onChange={(e) => setPago(e.target.checked)}
                  className="size-4 accent-[var(--success)]"
                />
                <span className="text-sm font-medium">
                  {entrada ? "Recebido" : "Pago"}
                </span>
              </label>
            )}

            {repeticao && !l && (
              <PainelRepeticao
                tipo={repeticao}
                entrada={entrada}
                data={data}
                valor={valorNum}
                vezes={vezes}
                maximo={maximo}
                intervalo={intervalo}
                personalizar={personalizar}
                parcelas={parcelas}
                pago={pago}
                erro={erros.vezes ?? erros.parcelas}
                onVezes={(n) => (mudarVezes(n), limpar("vezes"))}
                onIntervalo={mudarIntervalo}
                onPersonalizar={alternarPersonalizar}
                onParcelas={(ps) => (setParcelas(ps), limpar("parcelas"))}
                onRedistribuir={() =>
                  setParcelas((ps) =>
                    distribuir(somaParcelas, vezes, data, intervalo, ps).map(
                      (p, i) => ({ ...p, data: ps[i]?.data ?? p.data }),
                    ),
                  )
                }
              />
            )}

            {l?.serieTipo && (
              <p className="text-xs text-muted-foreground">
                Este lançamento é{" "}
                {l.serieTipo === "parcela" ? "a parcela" : "a repetição"}{" "}
                {l.serieNumero} de {l.serieTotal}. A alteração vale só para ele.
              </p>
            )}
          </div>

          <div className="flex shrink-0 flex-col-reverse gap-2 border-t bg-muted px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:px-6 sm:pb-4">
            <DialogClose
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="h-11 sm:flex-1"
                />
              }
            >
              Cancelar
            </DialogClose>
            <Button
              type="submit"
              size="lg"
              variant="highlight"
              disabled={salvando}
              className="h-11 sm:flex-1"
            >
              {salvando && (
                <LoaderCircle
                  className="animate-spin"
                  data-icon="inline-start"
                />
              )}
              {salvando ? "Salvando..." : l ? "Salvar alterações" : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Campo({
  id,
  rotulo,
  dica,
  obrigatorio,
  erro,
  children,
}: {
  id: string;
  rotulo: string;
  dica?: string;
  obrigatorio?: boolean;
  erro?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <Label htmlFor={id}>
        {rotulo}
        {obrigatorio && <span className="text-destructive">*</span>}
      </Label>
      {dica && <p className="-mt-1 text-xs text-muted-foreground">{dica}</p>}
      {children}
      {erro && (
        <p id={`${id}-erro`} className="text-xs text-destructive">
          {erro}
        </p>
      )}
    </div>
  );
}
