"use client";

import { useRef, useState, useTransition } from "react";
import { ChevronDown, CirclePlus, Plus, Receipt, ReceiptText, Trash, TrendingUp } from "lucide-react";
import { cn } from "cn";

import {
  Aviso,
  BannerFormulario,
  BarraSalvarCelular,
  CampoNumero,
  CardGrupo,
  InputUnidade,
  ModalSalvo,
} from "@/components/formulario";
import { useCamposNumericos, valoresIguais } from "@/components/formulario/use-campos-numericos";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { formatarMoeda, formatarPercentual, paraNumero, paraTexto } from "@/lib/numero-br";

import { salvarCusteio } from "./actions";
import {
  campoReceita,
  campos,
  grupos,
  LIMITE_CUSTO_FIXO,
  MAX_EXTRAS,
  type CustoExtra,
  type ValoresCusteio,
} from "./campos";

const FORM_ID = "form-custeio";

type LinhaExtra = { id: string; descricao: string; valor: string };

const soma = (valores: (number | null)[]) => valores.reduce<number>((s, v) => s + (v ?? 0), 0);

/** Linhas preenchidas da lista de extras, para comparar com o que foi salvo. */
function extrasNormalizados(linhas: LinhaExtra[]): CustoExtra[] {
  return linhas.flatMap((l) => {
    const valor = paraNumero(l.valor);
    const descricao = l.descricao.trim();
    if (!descricao && valor == null) return [];
    return [{ descricao, valor: valor ?? NaN }];
  });
}

const mesmosExtras = (a: CustoExtra[], b: CustoExtra[]) =>
  a.length === b.length &&
  a.every((e, i) => e.descricao === b[i].descricao && Object.is(e.valor, b[i].valor));

export function FormCusteio({
  inicial,
  extrasIniciais,
  jaSalvo,
}: {
  inicial: ValoresCusteio;
  extrasIniciais: CustoExtra[];
  jaSalvo: boolean;
}) {
  const form = useCamposNumericos(campos, inicial);
  const proximoId = useRef(extrasIniciais.length + 1);
  const [extras, setExtras] = useState<LinhaExtra[]>(() =>
    (extrasIniciais.length ? extrasIniciais : [{ descricao: "", valor: null }]).map((e, i) => ({
      id: `extra-${i}`,
      descricao: e.descricao,
      valor: paraTexto(e.valor, 2),
    })),
  );
  const [salvos, setSalvos] = useState(
    jaSalvo ? { fixos: inicial, extras: extrasIniciais } : null,
  );
  const [erroGeral, setErroGeral] = useState<string>();
  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, startTransition] = useTransition();

  const alterado =
    !salvos ||
    !valoresIguais(form.numeros, salvos.fixos) ||
    !mesmosExtras(extrasNormalizados(extras), salvos.extras);
  const completos = campos.filter((c) => form.preenchido(c.chave)).length;

  // Resumo ao vivo
  const subtotais = grupos.map((g) => ({
    titulo: g.titulo,
    valor: soma(g.campos.map((c) => form.numeros[c.chave])),
  }));
  const totalExtras = soma(extras.map((e) => {
    const n = paraNumero(e.valor);
    return n == null || Number.isNaN(n) ? 0 : n;
  }));
  if (totalExtras > 0) subtotais.push({ titulo: "Custos extras", valor: totalExtras });
  const totalCustos = soma(subtotais.map((s) => s.valor));
  const receita = form.numeros.receitaBruta ?? 0;

  function alterarExtra(id: string, campo: "descricao" | "valor", valor: string) {
    setExtras((linhas) => linhas.map((l) => (l.id === id ? { ...l, [campo]: valor } : l)));
    form.limparErro(`${id}.${campo}`);
  }

  function formatarExtra(id: string) {
    setExtras((linhas) =>
      linhas.map((l) => {
        const n = paraNumero(l.valor);
        return l.id === id && n != null && !Number.isNaN(n) ? { ...l, valor: paraTexto(n, 2) } : l;
      }),
    );
  }

  function adicionarExtra() {
    const id = `extra-${proximoId.current++}`;
    setExtras((linhas) => [...linhas, { id, descricao: "", valor: "" }]);
    requestAnimationFrame(() => document.getElementById(`${id}-descricao`)?.focus());
  }

  function removerExtra(id: string) {
    setExtras((linhas) => linhas.filter((l) => l.id !== id));
  }

  function salvar(evento: React.FormEvent) {
    evento.preventDefault();
    if (salvando) return;

    const fixos = form.coletar();

    // Extras: ignora linhas vazias; exige descrição e valor nas preenchidas.
    const errosExtras: Record<string, string> = {};
    const enviados: { id: string; extra: CustoExtra }[] = [];
    for (const l of extras) {
      const descricao = l.descricao.trim();
      const valor = paraNumero(l.valor);
      if (!descricao && valor == null) continue;
      if (!descricao) errosExtras[`${l.id}.descricao`] = "Informe a descrição.";
      if (valor == null) errosExtras[`${l.id}.valor`] = "Informe o valor.";
      else if (Number.isNaN(valor)) errosExtras[`${l.id}.valor`] = "Valor inválido.";
      if (descricao && valor != null && !Number.isNaN(valor)) {
        enviados.push({ id: l.id, extra: { descricao, valor } });
      }
    }

    if (!fixos || Object.keys(errosExtras).length) {
      form.setErros((e) => ({ ...e, ...errosExtras }));
      setErroGeral("Confira os campos destacados.");
      return;
    }

    const listaExtras = enviados.map((e) => e.extra);
    startTransition(async () => {
      const resultado = await salvarCusteio(fixos, listaExtras);
      if (resultado.ok) {
        setSalvos({ fixos, extras: listaExtras });
        form.setErros({});
        setErroGeral(undefined);
        setModalAberto(true);
      } else {
        // "extras.2.valor" -> id da linha correspondente.
        const erros = Object.fromEntries(
          Object.entries(resultado.erros ?? {}).map(([k, v]) => {
            const m = k.match(/^extras\.(\d+)\.(descricao|valor)$/);
            return [m ? `${enviados[Number(m[1])]?.id}.${m[2]}` : k, v];
          }),
        );
        form.setErros(erros);
        setErroGeral(resultado.mensagem);
      }
    });
  }

  const campoProps = (chave: (typeof campos)[number]["chave"]) => ({
    valor: form.textos[chave],
    erro: form.erros[chave],
    onAlterar: form.alterar,
    onFormatar: form.formatar,
  });

  return (
    <form id={FORM_ID} onSubmit={salvar} noValidate className="contents">
      <BannerFormulario
        titulo="Custeio mensal"
        descricao="Receita e custos fixos do mês. Eles definem quanto cada venda precisa cobrir."
        icone={Receipt}
        completos={completos}
        total={campos.length}
        formId={FORM_ID}
        alterado={alterado}
        salvando={salvando}
      />

      {(erroGeral || alterado) && (
        <Aviso tipo={erroGeral ? "erro" : "info"}>
          {erroGeral ??
            (!salvos
              ? "Estes são valores sugeridos. Revise e clique em Salvar para usá-los nos cálculos."
              : "Você tem alterações não salvas.")}
        </Aviso>
      )}

      <ResumoFinanceiro receita={receita} totalCustos={totalCustos} subtotais={subtotais} />

      <section className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10 sm:p-5">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <TrendingUp className="size-5" />
          </span>
          <div>
            <h2 className="font-semibold">Receita bruta mensal</h2>
            <p className="text-xs text-muted-foreground">Faturamento médio mensal da operação.</p>
          </div>
        </div>
        <CampoNumero campo={campoReceita} {...campoProps(campoReceita.chave)} />
      </section>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        {grupos.map((grupo) => {
          const inteiro = grupo.largura === "inteiro";
          return (
            <CardGrupo
              key={grupo.titulo}
              titulo={grupo.titulo}
              icone={grupo.icone}
              total={grupo.campos.length}
              completos={grupo.campos.filter((c) => form.preenchido(c.chave)).length}
              detalhe={formatarMoeda(soma(grupo.campos.map((c) => form.numeros[c.chave])))}
              className={cn(inteiro && "lg:col-span-2")}
            >
              <div
                className={cn(
                  "grid gap-3 sm:grid-cols-2",
                  inteiro ? "xl:grid-cols-3" : "lg:grid-cols-1 xl:grid-cols-2",
                )}
              >
                {grupo.campos.map((campo) => (
                  <CampoNumero key={campo.chave} campo={campo} {...campoProps(campo.chave)} />
                ))}
              </div>
            </CardGrupo>
          );
        })}
      </div>

      <section className="rounded-2xl bg-card ring-1 ring-foreground/10">
        <div className="flex flex-wrap items-center gap-3 border-b p-4 sm:p-5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-highlight-soft text-highlight-foreground">
            <CirclePlus className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold">Custos extras</h2>
            <p className="text-xs text-muted-foreground">
              Outros custos fixos que não se encaixam nas categorias acima.
            </p>
          </div>
          <span className="text-sm font-medium tabular-nums">{formatarMoeda(totalExtras)}</span>
        </div>

        <div className="flex flex-col gap-3 p-4 sm:p-5">
          {extras.map((linha, i) => {
            const erroDescricao = form.erros[`${linha.id}.descricao`];
            const erroValor = form.erros[`${linha.id}.valor`];
            return (
              <div
                key={linha.id}
                className={cn(
                  "grid grid-cols-[1fr_auto] gap-2 rounded-xl border p-3 sm:grid-cols-[1fr_11rem_auto] sm:items-start",
                  (erroDescricao || erroValor) && "border-destructive/60 bg-destructive/5",
                )}
              >
                <div className="col-span-2 sm:col-span-1">
                  <label htmlFor={`${linha.id}-descricao`} className="sr-only">
                    Descrição do custo extra {i + 1}
                  </label>
                  <Input
                    id={`${linha.id}-descricao`}
                    value={linha.descricao}
                    onChange={(e) => alterarExtra(linha.id, "descricao", e.target.value)}
                    placeholder="Ex.: Manutenção de equipamentos"
                    maxLength={80}
                    aria-invalid={Boolean(erroDescricao)}
                    className="h-10 scroll-mb-24 bg-muted/60"
                  />
                  {erroDescricao && <p className="mt-1 text-xs text-destructive">{erroDescricao}</p>}
                </div>
                <div>
                  <label htmlFor={`${linha.id}-valor`} className="sr-only">
                    Valor do custo extra {i + 1}
                  </label>
                  <InputUnidade
                    id={`${linha.id}-valor`}
                    prefixo="R$"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={linha.valor}
                    onChange={(e) => alterarExtra(linha.id, "valor", e.target.value)}
                    onBlur={() => formatarExtra(linha.id)}
                    aria-invalid={Boolean(erroValor)}
                  />
                  {erroValor && <p className="mt-1 text-xs text-destructive">{erroValor}</p>}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-lg"
                  className="size-10 text-muted-foreground hover:text-destructive"
                  onClick={() => removerExtra(linha.id)}
                  aria-label={`Remover custo extra ${i + 1}`}
                >
                  <Trash />
                </Button>
              </div>
            );
          })}

          {extras.length < MAX_EXTRAS && (
            <Button type="button" variant="outline" size="lg" className="h-10 self-start" onClick={adicionarExtra}>
              <Plus data-icon="inline-start" />
              Adicionar custo extra
            </Button>
          )}
        </div>
      </section>

      <BarraSalvarCelular formId={FORM_ID} alterado={alterado} salvando={salvando} />
      <ModalSalvo
        aberto={modalAberto}
        onAbertoChange={setModalAberto}
        voltarHref="/modulo-precificacao"
        voltarRotulo="Precificar"
      />
    </form>
  );
}

function ResumoFinanceiro({
  receita,
  totalCustos,
  subtotais,
}: {
  receita: number;
  totalCustos: number;
  subtotais: { titulo: string; valor: number }[];
}) {
  const proporcao = receita > 0 ? totalCustos / receita : null;
  const acimaDoLimite = proporcao != null && proporcao > LIMITE_CUSTO_FIXO;

  return (
    <>
      <Collapsible
        className={cn(
          "rounded-2xl bg-card ring-1 ring-foreground/10",
          acimaDoLimite && "bg-destructive/5 ring-destructive/30",
        )}
      >
        <div className="flex flex-col gap-3 p-4 sm:p-5 md:flex-row md:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
              <ReceiptText className="size-5" />
            </span>
            <div className="min-w-0">
              <h2 className="font-semibold">Resumo financeiro</h2>
              <p className="text-sm text-muted-foreground tabular-nums">
                <span className="block sm:inline">
                  Custos fixos: <strong className="text-foreground">{formatarMoeda(totalCustos)}</strong>
                </span>
                {proporcao != null && (
                  <span className="block sm:inline">
                    <span className="hidden sm:inline">{" · "}</span>
                    Margem após custos fixos:{" "}
                    <strong className="text-foreground">{formatarPercentual(1 - proporcao)}</strong>
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 md:justify-end">
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums",
                proporcao == null
                  ? "bg-muted text-muted-foreground"
                  : acimaDoLimite
                    ? "bg-destructive/10 text-destructive"
                    : "bg-success/10 text-success",
              )}
            >
              {proporcao == null
                ? "Informe a receita"
                : `Custo fixo: ${formatarPercentual(proporcao)} da receita`}
            </span>
            <CollapsibleTrigger
              render={<Button type="button" variant="ghost" size="sm" className="group/det" />}
            >
              Ver detalhes
              <ChevronDown
                data-icon="inline-end"
                className="transition-transform group-data-[panel-open]/det:rotate-180"
              />
            </CollapsibleTrigger>
          </div>
        </div>

        <CollapsibleContent>
          <ul className="flex flex-col gap-3 border-t px-4 py-4 sm:px-5">
            {subtotais.map((s) => (
              <li key={s.titulo} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5 text-sm">
                <span>{s.titulo}</span>
                <span className="text-right tabular-nums">
                  <strong>{formatarMoeda(s.valor)}</strong>
                  {receita > 0 && (
                    <span className="ml-2 text-muted-foreground">{formatarPercentual(s.valor / receita)}</span>
                  )}
                </span>
                <span className="col-span-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <span
                    className="block h-full rounded-full bg-primary"
                    style={{ width: `${totalCustos ? (s.valor / totalCustos) * 100 : 0}%` }}
                  />
                </span>
              </li>
            ))}
          </ul>
        </CollapsibleContent>
      </Collapsible>

      {acimaDoLimite && (
        <Aviso tipo="erro">
          O custo fixo está acima de {formatarPercentual(LIMITE_CUSTO_FIXO, 0)} da receita. Considere
          reduzir custos ou aumentar o faturamento para melhorar a margem de lucro.
        </Aviso>
      )}
    </>
  );
}
