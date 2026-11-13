import {
  CreditCard,
  Landmark,
  PiggyBank,
  Smartphone,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import type { CORES_CONTA, TIPOS_CONTA } from "@/db/schema";

export type TipoConta = (typeof TIPOS_CONTA)[number];
export type CorConta = (typeof CORES_CONTA)[number];

export const TIPOS: Record<TipoConta, { rotulo: string; icone: LucideIcon }> = {
  corrente: { rotulo: "Conta corrente", icone: Landmark },
  poupanca: { rotulo: "Poupança", icone: PiggyBank },
  carteira_digital: { rotulo: "Carteira digital", icone: Smartphone },
  pagamento: { rotulo: "Conta de pagamento", icone: CreditCard },
  outro: { rotulo: "Outro", icone: Wallet },
};

export const CORES: Record<CorConta, { rotulo: string; valor: string }> = {
  grafite: { rotulo: "Grafite", valor: "var(--cartao-grafite)" },
  azul: { rotulo: "Azul", valor: "var(--cartao-azul)" },
  roxo: { rotulo: "Roxo", valor: "var(--cartao-roxo)" },
  verde: { rotulo: "Verde", valor: "var(--cartao-verde)" },
  bronze: { rotulo: "Bronze", valor: "var(--cartao-bronze)" },
  vinho: { rotulo: "Vinho", valor: "var(--cartao-vinho)" },
  petroleo: { rotulo: "Petróleo", valor: "var(--cartao-petroleo)" },
  indigo: { rotulo: "Índigo", valor: "var(--cartao-indigo)" },
};

export const LIMITES = {
  nome: 60,
  contasPorNegocio: 30,
  saldo: 999_999_999.99,
};

/** Conta como a tela usa. */
export type Conta = {
  id: string;
  nome: string;
  tipo: TipoConta;
  saldoInicial: number;
  /** AAAA-MM-DD */
  dataSaldoInicial: string;
  /** Saldo inicial + lançamentos desde a data (por enquanto, sem lançamentos). */
  saldoAtual: number;
  padrao: boolean;
  cor: CorConta;
};

/** Categoria financeira: principal (com `chave`) ou subcategoria (com `paiId`). */
export type CategoriaFinanceira = {
  id: string;
  grupo: import("./catalogo-categorias").GrupoFinanceiro;
  nome: string;
  chave: string | null;
  paiId: string | null;
};

/** Dados enviados pelo formulário. */
export type DadosConta = {
  nome: string;
  tipo: TipoConta;
  saldoInicial: number;
  dataSaldoInicial: string;
  padrao: boolean;
  cor: CorConta;
};
