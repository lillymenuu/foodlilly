"use client";

import { useState } from "react";
import { Calculator, ChevronDown, ReceiptText, type LucideIcon } from "lucide-react";
import { cn } from "cn";

import { Aviso } from "@/components/formulario";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { formatarMoeda, formatarPercentual } from "@/lib/numero-br";

import { LIMITE_ATENCAO, LIMITE_CUSTO_FIXO } from "./campos";

export type GrupoResumo = {
  titulo: string;
  icone: LucideIcon;
  itens: { rotulo: string; valor: number }[];
};

type Situacao = { rotulo: string; texto: string; selo: string };

/** Alíquota = custos fixos ÷ receita. */
function situacaoDa(aliquota: number): Situacao {
  if (aliquota > LIMITE_CUSTO_FIXO) {
    return { rotulo: "Crítico", texto: "text-destructive", selo: "bg-destructive/10 text-destructive" };
  }
  if (aliquota > LIMITE_ATENCAO) {
    return { rotulo: "Atenção", texto: "text-amber-700", selo: "bg-highlight-soft text-amber-800" };
  }
  return { rotulo: "Saudável", texto: "text-success", selo: "bg-success/10 text-success" };
}

const somaItens = (g: GrupoResumo) => g.itens.reduce((s, i) => s + i.valor, 0);

export function ResumoFinanceiro({
  receita,
  totalCustos,
  grupos,
}: {
  receita: number;
  totalCustos: number;
  grupos: GrupoResumo[];
}) {
  const [aberto, setAberto] = useState(false);
  const aliquota = receita > 0 ? totalCustos / receita : null;
  const situacao = aliquota != null ? situacaoDa(aliquota) : null;
  const margem = receita - totalCustos;
  const critico = aliquota != null && aliquota > LIMITE_CUSTO_FIXO;

  return (
    <>
      <Collapsible
        open={aberto}
        onOpenChange={setAberto}
        className={cn(
          "rounded-2xl bg-card ring-1 ring-foreground/10",
          critico && "bg-destructive/5 ring-destructive/30",
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
                Total: <strong className="text-foreground">{formatarMoeda(totalCustos)}</strong>
                {aliquota != null && (
                  <>
                    {" · "}Margem: <strong className="text-foreground">{formatarPercentual(1 - aliquota)}</strong>
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 md:justify-end">
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums",
                situacao?.selo ?? "bg-muted text-muted-foreground",
              )}
            >
              {aliquota == null ? "Informe a receita" : `Alíquota: ${formatarPercentual(aliquota)}`}
            </span>
            <CollapsibleTrigger render={<Button type="button" variant="ghost" size="sm" />}>
              {aberto ? "Ocultar" : "Ver detalhes"}
              <ChevronDown data-icon="inline-end" className={cn("transition-transform", aberto && "rotate-180")} />
            </CollapsibleTrigger>
          </div>
        </div>

        <CollapsibleContent>
          <div className="flex flex-col gap-4 px-4 pb-4 sm:px-5 sm:pb-5">
            <div className="grid gap-4 md:grid-cols-2">
              {grupos.map((grupo) => {
                const itens = grupo.itens.filter((i) => i.valor > 0);
                return (
                  <section key={grupo.titulo} className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
                    <header className="mb-3 flex items-center gap-2">
                      <grupo.icone className="size-4 shrink-0 text-primary" />
                      <h3 className="flex-1 text-sm font-semibold">{grupo.titulo}</h3>
                      <span className="text-sm font-semibold text-primary tabular-nums">
                        {formatarMoeda(somaItens(grupo))}
                      </span>
                    </header>
                    {itens.length ? (
                      <dl className="flex flex-col gap-1.5 text-sm">
                        {itens.map((item, i) => (
                          <div key={`${item.rotulo}-${i}`} className="flex items-baseline justify-between gap-4">
                            <dt className="min-w-0 truncate text-muted-foreground">{item.rotulo}</dt>
                            <dd className="shrink-0 font-medium tabular-nums">{formatarMoeda(item.valor)}</dd>
                          </div>
                        ))}
                      </dl>
                    ) : (
                      <p className="text-sm text-muted-foreground">Nenhum custo informado.</p>
                    )}
                  </section>
                );
              })}
            </div>

            <section className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
              <header className="mb-1 flex items-center gap-2">
                <Calculator className="size-4 text-primary" />
                <h3 className="text-sm font-semibold">Resumo dos totais</h3>
              </header>
              <dl className="divide-y text-sm">
                <LinhaTotal rotulo="Receita bruta">
                  <span className="font-semibold text-primary">{formatarMoeda(receita)}</span>
                </LinhaTotal>
                <LinhaTotal rotulo="Custos totais">
                  <span className="font-semibold text-destructive">{formatarMoeda(totalCustos)}</span>
                </LinhaTotal>
                <LinhaTotal rotulo="Margem líquida">
                  <span className={cn("font-semibold", margem >= 0 ? "text-success" : "text-destructive")}>
                    {formatarMoeda(margem)}
                  </span>
                  {aliquota != null && (
                    <span className="ml-1.5 text-xs text-muted-foreground">({formatarPercentual(1 - aliquota)})</span>
                  )}
                </LinhaTotal>
                <LinhaTotal rotulo="Alíquota" dica="Custos fixos ÷ receita bruta">
                  {situacao && aliquota != null ? (
                    <>
                      <span className={cn("font-semibold", situacao.texto)}>{formatarPercentual(aliquota)}</span>
                      <span className={cn("ml-1.5 text-xs", situacao.texto)}>({situacao.rotulo})</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">Informe a receita</span>
                  )}
                </LinhaTotal>
              </dl>
            </section>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {critico && (
        <Aviso tipo="erro">
          Alíquota acima de {formatarPercentual(LIMITE_CUSTO_FIXO, 0)}: os custos fixos estão pesando demais
          no faturamento. Considere reduzir custos ou aumentar a receita para melhorar a margem de lucro.
        </Aviso>
      )}
    </>
  );
}

function LinhaTotal({
  rotulo,
  dica,
  children,
}: {
  rotulo: string;
  dica?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="text-muted-foreground">
        {rotulo}
        {dica && <span className="ml-1.5 hidden text-xs sm:inline">· {dica}</span>}
      </dt>
      <dd className="text-right tabular-nums">{children}</dd>
    </div>
  );
}
