import {
  Bike,
  BriefcaseBusiness,
  Calculator,
  Droplet,
  Flame,
  HandCoins,
  House,
  IdCard,
  Megaphone,
  Monitor,
  MonitorSmartphone,
  Phone,
  Smartphone,
  TrendingUp,
  Users,
  Wifi,
  Zap,
} from "lucide-react";

import type { custeio } from "@/db/schema";
import { campoMoeda, valoresPadraoDe, type Campo, type Grupo, type ValoresDe } from "@/lib/campos";

/** Chaves dos campos fixos (colunas da tabela custeio). */
export type ChaveCusteio = keyof Omit<typeof custeio.$inferSelect, "negocioId" | "atualizadoEm">;

/** Acima deste percentual da receita, o custo fixo gera alerta. */
export const LIMITE_CUSTO_FIXO = 0.3;

export const campoReceita: Campo<ChaveCusteio> = campoMoeda(
  "receitaBruta",
  "Receita bruta média mensal",
  "Quanto o negócio fatura por mês, em média, antes de descontar qualquer custo.",
  TrendingUp,
  15000,
);

export type GrupoCusteio = Grupo<ChaveCusteio> & {
  /** "inteiro" ocupa a largura toda; "metade" divide a linha com outro grupo. */
  largura: "inteiro" | "metade";
};

export const grupos: GrupoCusteio[] = [
  {
    titulo: "Energia e infraestrutura",
    icone: Zap,
    largura: "inteiro",
    campos: [
      campoMoeda("aluguel", "Aluguel", "Aluguel mensal do ponto ou da cozinha. Use 0 se o imóvel é próprio.", House, 700),
      campoMoeda("energia", "Energia elétrica", "Valor médio da conta de luz por mês.", Zap, 680),
      campoMoeda("agua", "Água", "Valor médio da conta de água por mês.", Droplet, 90),
      campoMoeda("gas", "Gás", "Gasto médio com gás de cozinha por mês.", Flame, 120),
      campoMoeda("internet", "Internet", "Mensalidade da internet.", Wifi, 116),
      campoMoeda("telefone", "Telefone", "Mensalidade do telefone fixo ou do celular do negócio.", Phone, 50),
    ],
  },
  {
    titulo: "Funcionários",
    icone: Users,
    largura: "metade",
    campos: [
      campoMoeda("salarios", "Salário de funcionários", "Soma dos salários da equipe no mês, incluindo encargos.", IdCard, 2100),
      campoMoeda("proLabore", "Pró-labore", "Retirada mensal do(s) dono(s) do negócio.", HandCoins, 1700),
    ],
  },
  {
    titulo: "Sistemas",
    icone: MonitorSmartphone,
    largura: "metade",
    campos: [
      campoMoeda("sistemas", "Custos com sistemas", "Mensalidades de sistemas e aplicativos (PDV, cardápio digital, gestão).", Monitor, 170),
      campoMoeda(
        "mensalidadeIfood",
        "Mensalidade iFood",
        "Mensalidade fixa do plano do iFood, se houver. A comissão por pedido fica em Dados de entrada.",
        Smartphone,
        0,
      ),
    ],
  },
  {
    titulo: "Serviços",
    icone: BriefcaseBusiness,
    largura: "inteiro",
    campos: [
      campoMoeda("marketing", "Marketing", "Gasto mensal com anúncios, panfletos e redes sociais.", Megaphone, 100),
      campoMoeda("contador", "Contador", "Honorários mensais do contador.", Calculator, 350),
      campoMoeda("motoboy", "Mensal motoboy", "Valor fixo mensal pago a entregadores.", Bike, 300),
    ],
  },
];

/** Todos os campos fixos (receita + custos). */
export const campos: Campo<ChaveCusteio>[] = [campoReceita, ...grupos.flatMap((g) => g.campos)];

export type ValoresCusteio = ValoresDe<ChaveCusteio>;
export const valoresPadrao = valoresPadraoDe(campos);

export type CustoExtra = { descricao: string; valor: number };
export const MAX_EXTRAS = 50;
