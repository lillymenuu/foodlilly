import type { FORMAS_PAGAMENTO } from "@/db/schema";

import type { GrupoFinanceiro } from "../contas/catalogo-categorias";

export type FormaPagamento = (typeof FORMAS_PAGAMENTO)[number];

export const FORMAS: Record<FormaPagamento, string> = {
  dinheiro: "Dinheiro",
  pix: "Pix",
  boleto: "Boleto",
  credito: "Cartão de crédito",
  debito: "Cartão de débito",
  transferencia: "Transferência (TED/DOC)",
  cheque: "Cheque",
  outro: "Outro",
};

export type Lancamento = {
  id: string;
  contaId: string;
  grupo: GrupoFinanceiro;
  /** Subcategoria. */
  categoriaId: string;
  data: string;
  valor: number;
  descricao: string | null;
  fornecedorId: string | null;
  /** Nome do fornecedor (cadastrado) ou o nome digitado. */
  pessoa: string | null;
  formaPagamento: FormaPagamento | null;
  pago: boolean;
  serieId: string | null;
  serieTipo: "parcela" | "recorrente" | null;
  serieNumero: number | null;
  serieTotal: number | null;
};

export type ContaOpcao = { id: string; nome: string; padrao: boolean };
export type FornecedorOpcao = { id: string; nome: string };

/** Dados que o formulário envia. A categoria pode ser nova (chave do catálogo) e a subcategoria também (nome). */
export type DadosLancamento = {
  grupo: GrupoFinanceiro;
  contaId: string;
  data: string;
  valor: number;
  pessoa: string;
  formaPagamento: FormaPagamento | "";
  descricao: string;
  /** Chave da categoria principal (do catálogo). */
  principalChave: string;
  /** Subcategoria existente (id) ou nova (nome). */
  subcategoriaId: string;
  subcategoriaNome: string;
  pago: boolean;
  /** Só ao criar. */
  repeticao?: {
    tipo: "parcela" | "recorrente";
    vezes: number;
    intervalo: Intervalo;
    /** Parcelas personalizadas (só parcelamento). */
    parcelas?: { valor: number; data: string; pago: boolean }[];
  };
};

export const LIMITES_LANCAMENTO = {
  valor: 999_999_999.99,
  descricao: 200,
  pessoa: 100,
  vezes: 60,
};

/** Hoje no fuso de Brasília (AAAA-MM-DD). */
export const hojeBr = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(
    new Date(),
  );

/** Soma meses a uma data AAAA-MM-DD, mantendo o dia (ou o último dia do mês). */
export function somarMeses(data: string, meses: number) {
  const [a, m, d] = data.split("-").map(Number);
  const alvo = new Date(Date.UTC(a, m - 1 + meses, 1));
  const ultimo = new Date(
    Date.UTC(alvo.getUTCFullYear(), alvo.getUTCMonth() + 1, 0),
  ).getUTCDate();
  alvo.setUTCDate(Math.min(d, ultimo));
  return alvo.toISOString().slice(0, 10);
}

export const ehEntrada = (g: GrupoFinanceiro) => g === "recebimentos";

export type Intervalo = "mensal" | "quinzenal" | "semanal";

/** Data da ocorrência i (0 = a primeira): mensal mantém o dia; quinzenal soma 15 dias; semanal, 7. */
export function dataDaOcorrencia(
  inicio: string,
  intervalo: Intervalo,
  i: number,
) {
  if (intervalo === "mensal") return somarMeses(inicio, i);
  const d = new Date(`${inicio}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + i * (intervalo === "quinzenal" ? 15 : 7));
  return d.toISOString().slice(0, 10);
}

/** Máximo de ocorrências (recorrência: até 1 ano; parcelas: 48). */
export const MAXIMO_VEZES = {
  parcela: 48,
  recorrente: { mensal: 12, quinzenal: 24, semanal: 52 },
} as const;
