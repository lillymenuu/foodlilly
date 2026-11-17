"use client";

import { useEffect, useState } from "react";
import {
  Apple,
  ChevronDown,
  Database,
  FileText,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { InputUnidade } from "@/components/formulario";
import { Input } from "@/components/ui/input";
import {
  energiaCalculada,
  NUTRIENTES,
  unidadePrecisaPeso,
  type ChaveNutriente,
  type NutricaoInsumo,
} from "@/lib/nutricao";
import { paraNumero, paraTexto } from "@/lib/numero-br";
import { buscarTaco, carregarTaco, type AlimentoTaco } from "@/lib/taco";
import { cn } from "cn";

/** Estado do formulário da informação nutricional (textos como digitados). */
export type EstadoNutricao = {
  ativo: boolean;
  fonte: "rotulo" | "taco";
  tacoId: number | null;
  textos: Record<ChaveNutriente, string>;
  pesoUnidade: string;
};

const ROTULO_CURTO: Record<ChaveNutriente, string> = {
  kcal: "Valor energético",
  carboidratos: "Carboidratos",
  acucaresTotais: "Açúcares totais",
  acucaresAdicionados: "Açúcares adicionados",
  proteinas: "Proteínas",
  gorduras: "Gorduras totais",
  saturadas: "Gorduras saturadas",
  trans: "Gorduras trans",
  fibras: "Fibras",
  sodio: "Sódio",
};

/** Máximo aceito por 100 g (valores acima disso são erro de digitação). */
const MAXIMO: Record<ChaveNutriente, number> = {
  kcal: 900,
  carboidratos: 100,
  acucaresTotais: 100,
  acucaresAdicionados: 100,
  proteinas: 100,
  gorduras: 100,
  saturadas: 100,
  trans: 100,
  fibras: 100,
  sodio: 40000,
};

const vazio = () =>
  Object.fromEntries(NUTRIENTES.map((n) => [n.chave, ""])) as Record<
    ChaveNutriente,
    string
  >;

export function estadoNutricao(n: NutricaoInsumo | null): EstadoNutricao {
  return {
    ativo: Boolean(n),
    fonte: n?.fonte ?? "rotulo",
    tacoId: n?.tacoId ?? null,
    textos: n
      ? (Object.fromEntries(
          NUTRIENTES.map((x) => [x.chave, paraTexto(n.valores[x.chave])]),
        ) as Record<ChaveNutriente, string>)
      : vazio(),
    pesoUnidade: paraTexto(n?.pesoUnidadeG),
  };
}

/** Valida e converte. Campos vazios valem 0; energia vazia é calculada pelos macronutrientes. */
export function lerNutricao(
  e: EstadoNutricao,
  unidade: string,
): { nutricao: NutricaoInsumo | null; erros: Record<string, string> } {
  if (!e.ativo) return { nutricao: null, erros: {} };
  const erros: Record<string, string> = {};
  const valores = {} as Record<ChaveNutriente, number>;
  let algum = false;
  for (const n of NUTRIENTES) {
    const v = paraNumero(e.textos[n.chave]);
    if (v === null) {
      valores[n.chave] = 0;
      continue;
    }
    if (Number.isNaN(v)) erros[`nut-${n.chave}`] = "Número inválido.";
    else if (v > MAXIMO[n.chave])
      erros[`nut-${n.chave}`] = `Máximo ${MAXIMO[n.chave].toLocaleString("pt-BR")}.`;
    else {
      valores[n.chave] = v;
      algum = true;
    }
  }
  // Nada preenchido: o insumo fica sem informação nutricional.
  if (!algum && !Object.keys(erros).length) return { nutricao: null, erros: {} };
  if (!paraNumero(e.textos.kcal)) valores.kcal = Math.round(energiaCalculada(valores));

  let pesoUnidadeG: number | null = null;
  if (unidadePrecisaPeso(unidade)) {
    const p = paraNumero(e.pesoUnidade);
    if (!p || Number.isNaN(p) || p > 100000)
      erros["nut-peso"] = "Informe quantos gramas tem 1 " + (unidade === "unidade" ? "unidade" : unidade) + ".";
    else pesoUnidadeG = p;
  }
  if (valores.acucaresAdicionados > valores.acucaresTotais && paraNumero(e.textos.acucaresTotais) !== null)
    erros["nut-acucaresAdicionados"] = "Não pode passar dos açúcares totais.";

  return Object.keys(erros).length
    ? { nutricao: null, erros }
    : {
        nutricao: {
          fonte: e.fonte,
          tacoId: e.fonte === "taco" ? e.tacoId : null,
          pesoUnidadeG,
          valores,
        },
        erros: {},
      };
}

/** Seção recolhível "Informação nutricional" do cadastro de insumo. */
export function SecaoNutricao({
  estado,
  onChange,
  unidade,
  nomeInsumo,
  erros,
  limparErro,
}: {
  estado: EstadoNutricao;
  onChange: (e: EstadoNutricao) => void;
  unidade: string;
  nomeInsumo: string;
  erros: Record<string, string>;
  limparErro: (campo: string) => void;
}) {
  const [abertoManual, setAberto] = useState(estado.ativo);
  // Com erro num campo nutricional, a seção abre sozinha para mostrar onde.
  const aberto =
    abertoManual || Object.keys(erros).some((k) => k.startsWith("nut-") && erros[k]);
  const [taco, setTaco] = useState<AlimentoTaco[] | null>(null);
  const [busca, setBusca] = useState("");
  const [buscaEditada, setBuscaEditada] = useState(false);
  const liquido = unidade === "ml" || unidade === "l";
  const base = liquido ? "100 ml" : "100 g";
  const precisaPeso = unidadePrecisaPeso(unidade);

  const usarTaco = aberto && estado.fonte === "taco";
  useEffect(() => {
    if (usarTaco && !taco) carregarTaco().then(setTaco);
  }, [usarTaco, taco]);

  // Busca inicial pelo nome do insumo, até o cliente digitar a dele.
  const termo = buscaEditada ? busca : nomeInsumo;
  let resultados = taco ? buscarTaco(taco, termo) : [];
  if (taco && !resultados.length && !buscaEditada) {
    resultados = buscarTaco(taco, termo.split(/\s+/)[0] ?? "");
  }
  const escolhido = taco?.find((a) => a.id === estado.tacoId);

  const set = (parcial: Partial<EstadoNutricao>) =>
    onChange({ ...estado, ativo: true, ...parcial });

  function escolher(a: AlimentoTaco) {
    set({
      fonte: "taco",
      tacoId: a.id,
      textos: Object.fromEntries(
        NUTRIENTES.map((n) => [n.chave, paraTexto(a.valores[n.chave])]),
      ) as Record<ChaveNutriente, string>,
    });
    for (const n of NUTRIENTES) limparErro(`nut-${n.chave}`);
  }

  const semAcucarTaco =
    estado.fonte === "taco" &&
    escolhido &&
    escolhido.valores.acucaresTotais === null;

  return (
    <div className="rounded-xl border bg-card">
      <button
        type="button"
        onClick={() => {
          setAberto(!aberto);
        }}
        aria-expanded={aberto}
        className="flex w-full items-center gap-3 rounded-xl p-3 text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-highlight-soft text-highlight-strong">
          <Apple className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">
            Informação nutricional
          </span>
          <span className="block text-xs text-muted-foreground">
            {estado.ativo
              ? `Preenchida (${estado.fonte === "taco" ? "TACO" : "rótulo"}). Usada na tabela nutricional dos produtos.`
              : "Opcional: para gerar a tabela nutricional dos produtos."}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            aberto && "rotate-180",
          )}
        />
      </button>

      {aberto && (
        <div className="flex flex-col gap-4 border-t p-3 sm:p-4">
          <div
            role="tablist"
            aria-label="De onde vêm os valores"
            className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1"
          >
            {(
              [
                ["rotulo", "Rótulo da embalagem", FileText],
                ["taco", "Tabela TACO", Database],
              ] as const
            ).map(([valor, rotulo, Icone]) => (
              <button
                key={valor}
                type="button"
                role="tab"
                aria-selected={estado.fonte === valor}
                onClick={() => set({ fonte: valor })}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:text-sm",
                  estado.fonte === valor
                    ? "bg-card text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icone className="size-3.5" />
                {rotulo}
              </button>
            ))}
          </div>

          {estado.fonte === "taco" ? (
            <div className="flex flex-col gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={termo}
                  onChange={(e) => {
                    setBusca(e.target.value);
                    setBuscaEditada(true);
                  }}
                  placeholder="Buscar alimento na TACO"
                  aria-label="Buscar alimento na TACO"
                  autoComplete="off"
                  className="h-10 bg-muted/60 pl-9"
                />
              </div>
              {!taco ? (
                <p className="text-xs text-muted-foreground">Carregando a TACO…</p>
              ) : resultados.length ? (
                <ul className="flex max-h-48 flex-col overflow-y-auto rounded-lg border">
                  {resultados.map((a) => (
                    <li key={a.id}>
                      <button
                        type="button"
                        onClick={() => escolher(a)}
                        className={cn(
                          "flex w-full items-center justify-between gap-3 border-b px-3 py-2 text-left text-sm last:border-b-0 hover:bg-muted focus-visible:bg-muted focus-visible:outline-none",
                          a.id === estado.tacoId && "bg-primary-soft",
                        )}
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{a.nome}</span>
                          <span className="block text-xs text-muted-foreground">{a.categoria}</span>
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                          {a.valores.kcal ?? "–"} kcal
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Nenhum alimento encontrado. Tente outra palavra (ex.: &quot;farinha&quot;, &quot;leite&quot;).
                </p>
              )}
              {escolhido && (
                <p className="flex items-center gap-1.5 rounded-lg bg-primary-soft/60 px-3 py-2 text-xs text-primary">
                  <Database className="size-3.5 shrink-0" />
                  <span className="min-w-0 flex-1">
                    Base: <strong>{escolhido.nome}</strong>. Confira e ajuste se precisar.
                  </span>
                  <button
                    type="button"
                    onClick={() => set({ tacoId: null })}
                    aria-label="Desvincular alimento da TACO"
                    className="rounded p-0.5 hover:bg-primary/10"
                  >
                    <X className="size-3.5" />
                  </button>
                </p>
              )}
              {semAcucarTaco && (
                <p className="text-xs text-amber-700">
                  A TACO não informa açúcares. Se o insumo tiver açúcar, preencha pelo rótulo.
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Copie do rótulo os valores da coluna <strong>{base}</strong>. Campos em branco contam
              como zero; o valor energético, se ficar em branco, é calculado.
            </p>
          )}

          {precisaPeso && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="nut-peso" className="text-sm font-medium">
                Peso de 1 {unidade === "unidade" ? "unidade" : unidade} (g) *
              </label>
              <p className="text-xs text-muted-foreground">
                Para converter a quantidade usada nas receitas (ex.: 1 ovo = 50 g).
              </p>
              <InputUnidade
                id="nut-peso"
                sufixo="g"
                inputMode="decimal"
                value={estado.pesoUnidade}
                onChange={(e) => {
                  set({ pesoUnidade: e.target.value });
                  limparErro("nut-peso");
                }}
                placeholder="Ex.: 50"
                aria-invalid={Boolean(erros["nut-peso"])}
              />
              {erros["nut-peso"] && (
                <p className="text-xs text-destructive">{erros["nut-peso"]}</p>
              )}
            </div>
          )}

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium">
              Valores por {base}
            </legend>
            <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 sm:grid-cols-3">
              {NUTRIENTES.map((n) => {
                const id = `nut-${n.chave}`;
                return (
                  <div key={n.chave} className="flex min-w-0 flex-col gap-1">
                    <label htmlFor={id} className="truncate text-xs font-medium text-muted-foreground">
                      {ROTULO_CURTO[n.chave]}
                    </label>
                    <InputUnidade
                      id={id}
                      sufixo={n.unidade}
                      inputMode="decimal"
                      value={estado.textos[n.chave]}
                      onChange={(e) => {
                        set({ textos: { ...estado.textos, [n.chave]: e.target.value } });
                        limparErro(id);
                      }}
                      placeholder={n.chave === "kcal" ? "auto" : "0"}
                      aria-invalid={Boolean(erros[id])}
                      className="pr-12"
                    />
                    {erros[id] && <p className="text-xs text-destructive">{erros[id]}</p>}
                  </div>
                );
              })}
            </div>
          </fieldset>

          {estado.ativo && (
            <button
              type="button"
              onClick={() => {
                onChange(estadoNutricao(null));
                setAberto(false);
              }}
              className="flex items-center gap-1.5 self-start rounded text-xs font-semibold text-destructive hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <Trash2 className="size-3.5" />
              Remover informação nutricional
            </button>
          )}
        </div>
      )}
    </div>
  );
}
