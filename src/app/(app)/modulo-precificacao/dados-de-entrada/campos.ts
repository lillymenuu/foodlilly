import {
  Bike,
  CalendarDays,
  Clock,
  CreditCard,
  Flame,
  Landmark,
  Percent,
  ShoppingBag,
  Smartphone,
  Weight,
  Zap,
} from "lucide-react";

import { valoresPadraoDe, type Campo as CampoBase, type Grupo as GrupoBase, type ValoresDe } from "@/lib/campos";
import type { dadosEntrada } from "@/db/schema";

/** Chaves dos campos editáveis (colunas da tabela dados_entrada). */
export type ChaveCampo = keyof Omit<
  typeof dadosEntrada.$inferSelect,
  "negocioId" | "atualizadoEm"
>;

export type Campo = CampoBase<ChaveCampo>;
export type Grupo = GrupoBase<ChaveCampo>;

export const grupos: Grupo[] = [
  {
    titulo: "Custos gerais",
    icone: Zap,
    campos: [
      {
        chave: "energiaKwh",
        rotulo: "Energia elétrica (R$/kWh)",
        dica: "Quanto você paga por kWh. Divida o valor total da conta de luz pelo consumo do mês em kWh.",
        icone: Zap,
        prefixo: "R$",
        padrao: 1.02,
        min: 0,
        max: 50,
      },
      {
        chave: "gasPreco",
        rotulo: "Gás de cozinha (R$)",
        dica: "Preço que você paga no botijão de gás.",
        icone: Flame,
        prefixo: "R$",
        casas: 2,
        padrao: 120,
        min: 0,
        max: 5000,
      },
      {
        chave: "gasPesoKg",
        rotulo: "Peso do gás de cozinha (kg)",
        dica: "Quantidade de gás no botijão. O botijão comum (P13) tem 13 kg.",
        icone: Weight,
        sufixo: "kg",
        padrao: 13,
        min: 0.1,
        max: 500,
      },
    ],
  },
  {
    titulo: "Taxas",
    icone: Percent,
    campos: [
      {
        chave: "taxaIfood",
        rotulo: "Taxa do iFood (%)",
        dica: "Comissão cobrada pelo iFood em cada pedido. Use 0 se você não vende pelo app.",
        icone: Bike,
        sufixo: "%",
        padrao: 12,
        min: 0,
        max: 100,
      },
      {
        chave: "taxa99food",
        rotulo: "Taxa do 99Food (%)",
        dica: "Comissão cobrada pelo 99Food em cada pedido. Use 0 se você não vende pelo app.",
        icone: Smartphone,
        sufixo: "%",
        padrao: 12,
        min: 0,
        max: 100,
      },
      {
        chave: "taxaKeeta",
        rotulo: "Taxa do Keeta (%)",
        dica: "Comissão cobrada pelo Keeta em cada pedido. Use 0 se você não vende pelo app.",
        icone: ShoppingBag,
        sufixo: "%",
        padrao: 12,
        min: 0,
        max: 100,
      },
      {
        chave: "taxaCredito",
        rotulo: "Taxa da maquininha no crédito (%)",
        dica: "Percentual que a maquininha desconta nas vendas no cartão de crédito.",
        icone: CreditCard,
        sufixo: "%",
        padrao: 11,
        min: 0,
        max: 100,
      },
      {
        chave: "aliquotaImposto",
        rotulo: "Alíquota de imposto sobre o faturamento (%)",
        dica: "Percentual de imposto pago sobre as vendas (por exemplo, a alíquota do Simples Nacional).",
        icone: Landmark,
        sufixo: "%",
        padrao: 4,
        min: 0,
        max: 100,
      },
    ],
  },
  {
    titulo: "Horas trabalhadas",
    icone: Clock,
    campos: [
      {
        chave: "diasMes",
        rotulo: "Quantos dias trabalha por mês?",
        dica: "Dias de funcionamento do negócio no mês. Usado para dividir os custos fixos.",
        icone: CalendarDays,
        padrao: 21,
        min: 1,
        max: 31,
        inteiro: true,
      },
      {
        chave: "horasDia",
        rotulo: "Quantas horas trabalha por dia?",
        dica: "Horas de produção por dia. Usado para calcular o custo da mão de obra e dos equipamentos.",
        icone: Clock,
        sufixo: "h",
        padrao: 8,
        min: 0.5,
        max: 24,
      },
    ],
  },
];

export const campos = grupos.flatMap((g) => g.campos);

export type Valores = ValoresDe<ChaveCampo>;

export const valoresPadrao = valoresPadraoDe(campos);
