import type { LucideIcon } from "lucide-react";

/** Campo numérico de um formulário de parâmetros (Dados de entrada, Custeio...). */
export type Campo<K extends string = string> = {
  chave: K;
  rotulo: string;
  dica: string;
  icone: LucideIcon;
  prefixo?: string;
  sufixo?: string;
  /** Valor sugerido quando o negócio ainda não salvou nada. */
  padrao: number;
  min: number;
  max: number;
  inteiro?: boolean;
  /** Casas decimais fixas na exibição (2 para dinheiro). */
  casas?: number;
  /** "moeda": formata ao digitar, com centavos fixos (1500 -> 15,00). */
  mascara?: "moeda";
};

export type Grupo<K extends string = string> = {
  titulo: string;
  icone: LucideIcon;
  campos: Campo<K>[];
};

export type ValoresDe<K extends string> = Record<K, number | null>;

export function valoresPadraoDe<K extends string>(campos: Campo<K>[]) {
  return Object.fromEntries(campos.map((c) => [c.chave, c.padrao])) as ValoresDe<K>;
}

/** Campo de dinheiro (R$, 2 casas). */
export function campoMoeda<K extends string>(
  chave: K,
  rotulo: string,
  dica: string,
  icone: LucideIcon,
  padrao: number,
): Campo<K> {
  return {
    chave,
    rotulo,
    dica,
    icone,
    prefixo: "R$",
    casas: 2,
    mascara: "moeda",
    padrao,
    min: 0,
    max: 10_000_000,
  };
}
