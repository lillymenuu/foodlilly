"use client";

import {
  CalendarClock,
  Equal,
  Minus,
  Plus,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "cn";

import { InputUnidade } from "@/components/formulario";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatarMoeda, mascaraMoeda } from "@/lib/numero-br";

import { dataDaOcorrencia, type Intervalo } from "./tipos";

export type Parcela = { valor: string; data: string; pago: boolean };

export const INTERVALOS: {
  valor: Intervalo;
  rotulo: string;
  detalhe: string;
  unidade: [string, string];
}[] = [
  { valor: "mensal", rotulo: "Mensal", detalhe: "", unidade: ["mês", "meses"] },
  {
    valor: "quinzenal",
    rotulo: "Quinzenal",
    detalhe: "a cada 15 dias",
    unidade: ["quinzena", "quinzenas"],
  },
  {
    valor: "semanal",
    rotulo: "Semanal",
    detalhe: "a cada 7 dias",
    unidade: ["semana", "semanas"],
  },
];

const dataBr = (d: string) => d.split("-").reverse().join("/");
const MOSTRAR = 6;

/** Recorrência ou parcelamento: intervalo, quantidade (− / +), prévia e parcelas personalizadas. */
export function PainelRepeticao({
  tipo,
  entrada,
  data,
  valor,
  vezes,
  maximo,
  intervalo,
  personalizar,
  parcelas,
  pago,
  erro,
  onVezes,
  onIntervalo,
  onPersonalizar,
  onParcelas,
  onRedistribuir,
}: {
  tipo: "parcela" | "recorrente";
  entrada: boolean;
  data: string;
  valor: number | null;
  vezes: number;
  maximo: number;
  intervalo: Intervalo;
  personalizar: boolean;
  parcelas: Parcela[];
  pago: boolean;
  erro?: string;
  onVezes: (n: number) => void;
  onIntervalo: (i: Intervalo) => void;
  onPersonalizar: () => void;
  onParcelas: (ps: Parcela[]) => void;
  onRedistribuir: () => void;
}) {
  const parcela = tipo === "parcela";
  const iv = INTERVALOS.find((i) => i.valor === intervalo)!;
  const personalizado = parcela && personalizar;
  const v = valor ?? 0;
  // Prévia: datas e valores (parcelas iguais, centavos de sobra na 1ª).
  const centavos = Math.round(v * 100);
  const base = Math.floor(centavos / vezes);
  const previa = Array.from({ length: vezes }, (_, i) => ({
    data: dataDaOcorrencia(data, intervalo, i),
    valor: parcela ? (base + (i === 0 ? centavos - base * vezes : 0)) / 100 : v,
  }));
  const alterar = (i: number, muda: Partial<Parcela>) =>
    onParcelas(parcelas.map((p, j) => (j === i ? { ...p, ...muda } : p)));
  const ok = entrada ? "recebido" : "pago";

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-primary-soft/40 p-4 ring-1 ring-primary/15 animate-in fade-in slide-in-from-top-1 motion-reduce:animate-none">
      {/* Intervalo */}
      <div>
        <p className="mb-2 text-sm font-medium">
          {parcela ? "Intervalo entre parcelas" : "Frequência"}
        </p>
        <div
          role="radiogroup"
          aria-label={parcela ? "Intervalo entre parcelas" : "Frequência"}
          className="grid grid-cols-3 gap-1.5"
        >
          {INTERVALOS.map((i) => (
            <button
              key={i.valor}
              type="button"
              role="radio"
              aria-checked={intervalo === i.valor}
              onClick={() => onIntervalo(i.valor)}
              className={cn(
                "rounded-lg px-2 py-2 text-sm font-semibold ring-1 transition-colors",
                intervalo === i.valor
                  ? "bg-highlight text-highlight-foreground ring-highlight"
                  : "bg-card ring-foreground/10 hover:ring-foreground/30",
              )}
            >
              {i.rotulo}
              <span className="block text-[10px] font-medium opacity-80">
                {i.valor === "mensal"
                  ? `todo dia ${Number(data.slice(8, 10)) || "—"}`
                  : i.detalhe}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Quantidade */}
      <div>
        <p className="mb-2 text-sm font-medium">
          {parcela
            ? "Número de parcelas"
            : `Repetir por quantas ${iv.unidade[1]}?`}
        </p>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            className="bg-card"
            onClick={() => onVezes(vezes - 1)}
            disabled={vezes <= 2}
            aria-label="Diminuir"
          >
            <Minus />
          </Button>
          <div className="flex-1 text-center" aria-live="polite">
            <p className="text-3xl font-bold tabular-nums">
              {parcela ? `${vezes}x` : vezes}
            </p>
            <p className="text-xs text-muted-foreground">
              {parcela
                ? personalizado
                  ? `total de ${formatarMoeda(v)}`
                  : `de ${formatarMoeda(v / vezes)}`
                : vezes === 1
                  ? iv.unidade[0]
                  : iv.unidade[1]}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            className="bg-card"
            onClick={() => onVezes(vezes + 1)}
            disabled={vezes >= maximo}
            aria-label="Aumentar"
          >
            <Plus />
          </Button>
        </div>
        <p className="mt-1 text-center text-xs text-muted-foreground">
          Mínimo 2 · Máximo {maximo}
          {parcela ? "x" : ` ${iv.unidade[1]}`}
        </p>
      </div>

      {parcela && (
        <button
          type="button"
          role="switch"
          aria-checked={personalizar}
          onClick={onPersonalizar}
          className={cn(
            "flex items-center gap-2.5 rounded-xl bg-card p-3 text-left ring-1 transition-colors",
            personalizar
              ? "ring-primary/40"
              : "ring-foreground/10 hover:ring-foreground/25",
          )}
        >
          <SlidersHorizontal className="size-4 shrink-0 text-primary" />
          <span className="flex-1">
            <span className="block text-sm font-medium">
              Personalizar parcelas
            </span>
            <span className="block text-xs text-muted-foreground">
              Valor, data e {ok} de cada uma
            </span>
          </span>
          <span
            className={cn(
              "relative h-5 w-9 shrink-0 rounded-full transition-colors",
              personalizar ? "bg-primary" : "bg-muted-foreground/30",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform",
                personalizar ? "translate-x-4.5" : "translate-x-0.5",
              )}
            />
          </span>
        </button>
      )}

      {personalizado ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">
            Edite cada parcela. O valor total é a soma delas.
          </p>
          <Button
            type="button"
            variant="outline"
            className="h-9 bg-card"
            onClick={onRedistribuir}
          >
            <Equal data-icon="inline-start" />
            Dividir o total igualmente entre as {vezes} parcelas
          </Button>
          <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
            <div className="hidden grid-cols-[3rem_1fr_1fr_3.5rem] gap-2 border-b px-3 py-2 text-xs font-semibold text-muted-foreground sm:grid">
              <span>#</span>
              <span>Valor</span>
              <span>Data</span>
              <span className="text-center">{entrada ? "Receb." : "Pago"}</span>
            </div>
            <ul className="max-h-72 divide-y overflow-y-auto">
              {parcelas.map((p, i) => (
                <li
                  key={i}
                  className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-2 px-3 py-2 sm:grid-cols-[3rem_1fr_1fr_3.5rem]"
                >
                  <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                    {i + 1}/{vezes}
                  </span>
                  <InputUnidade
                    prefixo="R$"
                    inputMode="numeric"
                    placeholder="0,00"
                    aria-label={`Valor da parcela ${i + 1}`}
                    value={p.valor}
                    onChange={(e) =>
                      alterar(i, { valor: mascaraMoeda(e.target.value) })
                    }
                    className="h-9"
                  />
                  <label className="flex items-center justify-center gap-1.5 text-xs sm:order-last">
                    <input
                      type="checkbox"
                      checked={p.pago}
                      onChange={(e) => alterar(i, { pago: e.target.checked })}
                      className="size-4 accent-[var(--success)]"
                      aria-label={`Parcela ${i + 1} ${entrada ? "recebida" : "paga"}`}
                    />
                    <span className="sm:hidden">
                      {entrada ? "Receb." : "Pago"}
                    </span>
                  </label>
                  <Input
                    type="date"
                    aria-label={`Data da parcela ${i + 1}`}
                    value={p.data}
                    onChange={(e) => alterar(i, { data: e.target.value })}
                    className="col-span-2 col-start-2 h-9 bg-muted/60 sm:col-span-1 sm:col-start-auto"
                  />
                </li>
              ))}
            </ul>
            <div className="flex justify-between border-t bg-muted/40 px-3 py-2 text-sm font-semibold">
              <span>Total</span>
              <span className="tabular-nums">{formatarMoeda(v)}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl bg-card p-3 ring-1 ring-foreground/10">
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <CalendarClock className="size-4 text-primary" />
            {parcela ? "Parcelas" : "Lançamentos que serão criados"}
          </p>
          {v > 0 ? (
            <>
              <ul className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                {previa.slice(0, MOSTRAR).map((o, i) => (
                  <li
                    key={i}
                    className="flex justify-between gap-3 tabular-nums"
                  >
                    <span className="text-muted-foreground">
                      {i + 1}. {dataBr(o.data)}
                    </span>
                    <span className="font-medium">
                      {formatarMoeda(o.valor)}
                    </span>
                  </li>
                ))}
              </ul>
              {vezes > MOSTRAR && (
                <p className="mt-1 text-xs text-muted-foreground">
                  … e mais {vezes - MOSTRAR}, até {dataBr(previa.at(-1)!.data)}.
                </p>
              )}
              <p className="mt-2 text-xs font-medium text-success">
                {vezes} lançamentos · total{" "}
                {formatarMoeda(previa.reduce((s, o) => s + o.valor, 0))}
                {pago && ` · só o 1º fica marcado como ${ok}`}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Informe o valor para ver as datas e os valores.
            </p>
          )}
        </div>
      )}
      {erro && <p className="text-xs text-destructive">{erro}</p>}
    </div>
  );
}
