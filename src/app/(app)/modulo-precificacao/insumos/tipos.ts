import type { UNIDADES } from "@/db/schema";

export type Unidade = (typeof UNIDADES)[number];

export type Categoria = {
  id: string;
  nome: string;
  sistema: boolean;
  /** Quantos insumos usam esta categoria. */
  insumos: number;
};

export type Insumo = {
  id: string;
  nome: string;
  categoriaId: string;
  codigoBarras: string | null;
  volume: number;
  unidade: Unidade;
  custo: number;
  perda: number;
  criadoEm: string;
};

export type DadosInsumo = Omit<Insumo, "id" | "criadoEm">;

export const LIMITES = {
  nome: 80,
  categoria: 50,
  volume: 1_000_000,
  custo: 1_000_000,
  perdaMax: 99,
  insumosPorNegocio: 2000,
  categoriasPorNegocio: 100,
};

/** Opções do campo Unidade, na ordem do seletor. */
export const OPCOES_UNIDADE: { valor: Unidade; rotulo: string }[] = [
  { valor: "unidade", rotulo: "Unidade" },
  { valor: "g", rotulo: "g (grama)" },
  { valor: "kg", rotulo: "kg (quilo)" },
  { valor: "ml", rotulo: "ml (mililitro)" },
  { valor: "l", rotulo: "l (litro)" },
  { valor: "cm", rotulo: "cm (centímetro)" },
  { valor: "m", rotulo: "m (metro)" },
];

/** Unidade em que o preço é mostrado no card (preço por kg em vez de por grama). */
const EXIBICAO: Record<Unidade, { unidade: string; fator: number }> = {
  unidade: { unidade: "unidade", fator: 1 },
  g: { unidade: "kg", fator: 1000 },
  kg: { unidade: "kg", fator: 1 },
  ml: { unidade: "l", fator: 1000 },
  l: { unidade: "l", fator: 1 },
  cm: { unidade: "m", fator: 100 },
  m: { unidade: "m", fator: 1 },
};

/** Categorias criadas na primeira visita. A marcada como sistema não pode ser alterada. */
export const CATEGORIAS_PADRAO: { nome: string; sistema?: boolean }[] = [
  { nome: "Açúcares e adoçantes" },
  { nome: "Bebidas" },
  { nome: "Carnes e embutidos" },
  { nome: "Chocolates e cacau" },
  { nome: "Embalagens e descartáveis", sistema: true },
  { nome: "Farinhas e amidos" },
  { nome: "Fermentos e aditivos" },
  { nome: "Frutas e polpas" },
  { nome: "Gorduras e óleos" },
  { nome: "Laticínios e derivados" },
  { nome: "Oleaginosas e castanhas" },
  { nome: "Ovos" },
  { nome: "Temperos e condimentos" },
  { nome: "Outros" },
];

const numero = (v: number, casas = 3) => v.toLocaleString("pt-BR", { maximumFractionDigits: casas });

/** "1.000 g", "9 unidades", "1 unidade". */
export function formatarVolume(volume: number, unidade: Unidade) {
  if (unidade === "unidade") return `${numero(volume)} ${volume === 1 ? "unidade" : "unidades"}`;
  return `${numero(volume)} ${unidade}`;
}

/** Volume que sobra depois da perda. */
export const volumeAproveitavel = (volume: number, perda: number) => volume * (1 - perda / 100);

/** Custo por unidade comprada (g, ml, cm...), sem e com a perda. */
export function custosUnitarios(i: Pick<Insumo, "volume" | "custo" | "perda">) {
  const semPerda = i.volume > 0 ? i.custo / i.volume : 0;
  const aproveitavel = volumeAproveitavel(i.volume, i.perda);
  const comPerda = aproveitavel > 0 ? i.custo / aproveitavel : 0;
  return { semPerda, comPerda };
}

/** Preço real (com perda) na unidade de exibição: "Valor/kg", "Valor/unidade". */
export function valorExibicao(i: Pick<Insumo, "volume" | "custo" | "perda" | "unidade">) {
  const { unidade, fator } = EXIBICAO[i.unidade];
  return { rotulo: `Valor/${unidade}`, valor: custosUnitarios(i).comPerda * fator };
}
