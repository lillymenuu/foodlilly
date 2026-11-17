"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  LoaderCircle,
  Printer,
  Save,
  Sparkles,
} from "lucide-react";

import { CampoModal } from "@/components/cadastro";
import { SelectNativo } from "@/components/cadastro/select-nativo";
import { InputUnidade } from "@/components/formulario";
import { notificar } from "@/components/notificacoes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  categoriaPorcao,
  CATEGORIAS_PORCAO,
  OUTRA_PORCAO,
  sugerirCategoria,
} from "@/config/porcoes-anvisa";
import {
  LIMITES_LUPA,
  lupaSugerida,
  type ChaveLupa,
  type ConfigTabela,
  type Nutrientes,
} from "@/lib/nutricao";
import { paraNumero, paraTexto } from "@/lib/numero-br";
import { cn } from "cn";

import { salvarTabela } from "./actions";
import { imprimirRotulo } from "./imprimir";
import { Lupa, TabelaNutricional } from "./rotulo";
import { BASE_TABELA } from "./tipos";

/** Comparação estável (o banco devolve o JSON com as chaves em outra ordem). */
const assinatura = (c: ConfigTabela) =>
  JSON.stringify([
    c.categoria,
    c.porcaoG,
    c.medidaCaseira,
    c.porcoesEmbalagem,
    c.liquido,
    c.lupa.acucar,
    c.lupa.saturada,
    c.lupa.sodio,
  ]);

const GRUPOS = [...new Set(CATEGORIAS_PORCAO.map((c) => c.grupo))];

function configInicial(nome: string, por100: Nutrientes): ConfigTabela {
  const c = sugerirCategoria(nome);
  const liquido = Boolean(c.liquido);
  return {
    categoria: c.chave,
    porcaoG: c.porcao,
    medidaCaseira: c.medida,
    porcoesEmbalagem: null,
    liquido,
    lupa: lupaSugerida(por100, liquido),
  };
}

export function EditorTabela({
  id,
  nome,
  pesoTotalG,
  por100,
  config: salva,
}: {
  id: string;
  nome: string;
  pesoTotalG: number;
  por100: Nutrientes;
  config: ConfigTabela | null;
}) {
  const inicial = salva ?? configInicial(nome, por100);
  const [categoria, setCategoria] = useState(inicial.categoria);
  const [porcao, setPorcao] = useState(paraTexto(inicial.porcaoG));
  const [medida, setMedida] = useState(inicial.medidaCaseira);
  const [porcoesEmb, setPorcoesEmb] = useState(
    paraTexto(inicial.porcoesEmbalagem),
  );
  const [liquido, setLiquido] = useState(inicial.liquido);
  const [lupa, setLupa] = useState(inicial.lupa);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [salvando, startTransition] = useTransition();
  const [salvoAgora, setSalvoAgora] = useState<string | null>(null);
  const rotulo = useRef<HTMLDivElement>(null);

  const nPorcao = paraNumero(porcao);
  const nEmb = paraNumero(porcoesEmb);
  const porcaoValida = nPorcao !== null && !Number.isNaN(nPorcao) && nPorcao > 0;
  const atual: ConfigTabela = {
    categoria,
    porcaoG: porcaoValida ? nPorcao : 0,
    medidaCaseira: medida.trim(),
    porcoesEmbalagem: nEmb && !Number.isNaN(nEmb) ? nEmb : null,
    liquido,
    lupa,
  };
  const serializado = assinatura(atual);
  const alterado = !salva || serializado !== (salvoAgora ?? assinatura(salva));
  const sugerida = lupaSugerida(por100, liquido);
  const ref = categoriaPorcao(categoria);
  const u = liquido ? "ml" : "g";

  function trocarCategoria(chave: string) {
    setCategoria(chave);
    const c = categoriaPorcao(chave);
    if (c.chave === OUTRA_PORCAO.chave) return;
    setPorcao(paraTexto(c.porcao));
    setMedida(c.medida);
    setLiquido(Boolean(c.liquido));
    setErros({});
  }

  function salvar() {
    const e: Record<string, string> = {};
    if (!porcaoValida) e.porcaoG = "Informe a porção.";
    if (!medida.trim()) e.medidaCaseira = "Informe a medida caseira (ex.: 1 fatia).";
    if (porcoesEmb.trim() && (!nEmb || Number.isNaN(nEmb)))
      e.porcoesEmbalagem = "Número inválido.";
    if (Object.keys(e).length) {
      setErros(e);
      return;
    }
    startTransition(async () => {
      const r = await salvarTabela(id, atual);
      if (r.ok) {
        setSalvoAgora(serializado);
        notificar.sucesso("Tabela salva", nome);
      } else {
        setErros(r.erros ?? {});
        notificar.erro("Não foi possível salvar", r.mensagem);
      }
    });
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            render={<Link href={BASE_TABELA} />}
            aria-label="Voltar para a lista"
          >
            <ArrowLeft />
          </Button>
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">
              Tabela nutricional
            </p>
            <h1 className="truncate text-xl font-semibold tracking-tight">
              {nome}
            </h1>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => rotulo.current && imprimirRotulo(rotulo.current, nome)}
            disabled={!porcaoValida}>
            <Printer data-icon="inline-start" />
            Imprimir
          </Button>
          <Button onClick={salvar} disabled={salvando || !alterado}>
            {salvando ? (
              <LoaderCircle className="animate-spin" data-icon="inline-start" />
            ) : (
              <Save data-icon="inline-start" />
            )}
            Salvar
          </Button>
        </div>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="flex flex-col gap-5 print:hidden">
          <section className="flex flex-col gap-4 rounded-2xl bg-card p-4 ring-1 ring-foreground/10 sm:p-5">
            <div>
              <h2 className="font-semibold">Porção</h2>
              <p className="text-sm text-muted-foreground">
                A categoria traz a porção de referência da ANVISA (IN 75/2020,
                Anexo V). Ajuste se precisar.
              </p>
            </div>

            <CampoModal id="tab-categoria" rotulo="Categoria do produto">
              <SelectNativo
                id="tab-categoria"
                value={categoria}
                onChange={(e) => trocarCategoria(e.target.value)}
              >
                {GRUPOS.map((g) => (
                  <optgroup key={g} label={g}>
                    {CATEGORIAS_PORCAO.filter((c) => c.grupo === g).map((c) => (
                      <option key={c.chave} value={c.chave}>
                        {c.nome} ({c.porcao} {c.liquido ? "ml" : "g"})
                      </option>
                    ))}
                  </optgroup>
                ))}
                <option value={OUTRA_PORCAO.chave}>{OUTRA_PORCAO.nome}</option>
              </SelectNativo>
            </CampoModal>

            <div className="grid gap-3 sm:grid-cols-2">
              <CampoModal
                id="tab-porcao"
                rotulo={`Porção (${u}) *`}
                descricao={
                  ref.chave !== OUTRA_PORCAO.chave
                    ? `Referência: ${ref.porcao} ${ref.liquido ? "ml" : "g"}.`
                    : "Quanto se come de uma vez."
                }
                erro={erros.porcaoG}
              >
                <InputUnidade
                  id="tab-porcao"
                  sufixo={u}
                  inputMode="decimal"
                  value={porcao}
                  onChange={(e) => {
                    setPorcao(e.target.value);
                    setErros((x) => ({ ...x, porcaoG: "" }));
                  }}
                  aria-invalid={Boolean(erros.porcaoG)}
                />
              </CampoModal>
              <CampoModal
                id="tab-medida"
                rotulo="Medida caseira *"
                descricao="Como o cliente reconhece a porção."
                erro={erros.medidaCaseira}
              >
                <Input
                  id="tab-medida"
                  value={medida}
                  onChange={(e) => {
                    setMedida(e.target.value);
                    setErros((x) => ({ ...x, medidaCaseira: "" }));
                  }}
                  maxLength={40}
                  placeholder="Ex.: 1 fatia"
                  aria-invalid={Boolean(erros.medidaCaseira)}
                  className="h-10 bg-muted/60"
                />
              </CampoModal>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <CampoModal
                id="tab-embalagem"
                rotulo="Porções por embalagem"
                descricao="Opcional. Ex.: bolo inteiro de 1 kg em fatias de 60 g = cerca de 17."
                erro={erros.porcoesEmbalagem}
              >
                <Input
                  id="tab-embalagem"
                  value={porcoesEmb}
                  onChange={(e) => {
                    setPorcoesEmb(e.target.value);
                    setErros((x) => ({ ...x, porcoesEmbalagem: "" }));
                  }}
                  inputMode="decimal"
                  placeholder="Ex.: 10"
                  aria-invalid={Boolean(erros.porcoesEmbalagem)}
                  className="h-10 bg-muted/60 tabular-nums"
                />
              </CampoModal>
              <label className="flex cursor-pointer items-start gap-3 self-end rounded-xl border p-3">
                <input
                  type="checkbox"
                  checked={liquido}
                  onChange={(e) => setLiquido(e.target.checked)}
                  className="mt-0.5 size-4 accent-primary"
                />
                <span className="text-sm">
                  <span className="block font-medium">Produto líquido</span>
                  <span className="block text-xs text-muted-foreground">
                    Valores por 100 ml (1 ml = 1 g).
                  </span>
                </span>
              </label>
            </div>
          </section>

          <section className="flex flex-col gap-4 rounded-2xl bg-card p-4 ring-1 ring-foreground/10 sm:p-5">
            <div>
              <h2 className="font-semibold">Rotulagem frontal (lupa)</h2>
              <p className="text-sm text-muted-foreground">
                Marque as advertências que vão no rótulo. O selo
                &quot;indicado&quot; mostra o que passou do limite da ANVISA
                (Anexo XV) pelo cálculo.
              </p>
            </div>
            <ul className="flex flex-col gap-2">
              {(Object.keys(LIMITES_LUPA) as ChaveLupa[]).map((k) => {
                const l = LIMITES_LUPA[k];
                const limite = liquido ? l.liquido : l.solido;
                const unidade = k === "sodio" ? "mg" : "g";
                const valor = por100[l.chave];
                return (
                  <li key={k}>
                    <label
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors",
                        lupa[k] && "border-primary bg-primary-soft/50",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={lupa[k]}
                        onChange={(e) =>
                          setLupa((x) => ({ ...x, [k]: e.target.checked }))
                        }
                        className="size-4 accent-primary"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium">
                          Alto em {l.rotulo.toLowerCase()}
                        </span>
                        <span className="block text-xs text-muted-foreground tabular-nums">
                          {valor.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}{" "}
                          {unidade} por 100 {u} · limite{" "}
                          {limite.toLocaleString("pt-BR")} {unidade}
                        </span>
                      </span>
                      {sugerida[k] && (
                        <span className="flex shrink-0 items-center gap-1 rounded-full bg-highlight-soft px-2 py-0.5 text-[11px] font-semibold text-highlight-foreground">
                          <Sparkles className="size-3" />
                          Indicado
                        </span>
                      )}
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>

          <p className="text-xs text-muted-foreground">
            Base do cálculo: peso total da ficha ({pesoTotalG.toLocaleString("pt-BR")} g,
            já com a perda no preparo) e a informação nutricional de cada
            ingrediente. Embalagens não entram.
          </p>
        </div>

        <section className="flex flex-col items-center gap-4 rounded-2xl bg-card p-4 ring-1 ring-foreground/10 sm:p-6 lg:sticky lg:top-4 print:ring-0">
          <p className="self-start text-sm font-semibold print:hidden">Prévia</p>
          <div ref={rotulo} className="flex flex-col items-center gap-4">
            <Lupa lupa={lupa} />
            {porcaoValida ? (
              <TabelaNutricional
                por100={por100}
                config={{ ...atual, medidaCaseira: atual.medidaCaseira || "–" }}
              />
            ) : (
              <p className="py-10 text-sm text-muted-foreground">
                Informe a porção para ver a tabela.
              </p>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
