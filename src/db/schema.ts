// Tabelas do banco (Drizzle).
// Depois de alterar este arquivo: `npm run db:generate` e `npm run db:migrate`.

import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/** Negócio do cliente (lanchonete, confeitaria...). Toda informação pertence a um negócio. */
export const negocios = pgTable("negocios", {
  id: uuid().primaryKey().defaultRandom(),
  nome: text().notNull(),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  /** Quando os equipamentos padrão foram criados (null = ainda não). Evita recriá-los se o cliente excluir. */
  equipamentosPadraoEm: timestamp("equipamentos_padrao_em", { withTimezone: true }),
  /** Idem para os funcionários padrão. */
  funcionariosPadraoEm: timestamp("funcionarios_padrao_em", { withTimezone: true }),
  /** Idem para as categorias de insumo padrão. */
  categoriasInsumoPadraoEm: timestamp("categorias_insumo_padrao_em", { withTimezone: true }),
});

/**
 * Precificar > Dados de entrada: parâmetros usados nos cálculos de custo.
 * Um registro por negócio. Campos nulos = ainda não preenchidos.
 */
export const dadosEntrada = pgTable("dados_entrada", {
  negocioId: uuid("negocio_id")
    .primaryKey()
    .references(() => negocios.id, { onDelete: "cascade" }),

  // Custos gerais
  energiaKwh: numeric("energia_kwh", { precision: 10, scale: 4, mode: "number" }),
  gasPreco: numeric("gas_preco", { precision: 10, scale: 2, mode: "number" }),
  gasPesoKg: numeric("gas_peso_kg", { precision: 8, scale: 3, mode: "number" }),

  // Taxas (%)
  taxaIfood: numeric("taxa_ifood", { precision: 5, scale: 2, mode: "number" }),
  taxa99food: numeric("taxa_99food", { precision: 5, scale: 2, mode: "number" }),
  taxaKeeta: numeric("taxa_keeta", { precision: 5, scale: 2, mode: "number" }),
  taxaCredito: numeric("taxa_credito", { precision: 5, scale: 2, mode: "number" }),
  aliquotaImposto: numeric("aliquota_imposto", { precision: 5, scale: 2, mode: "number" }),

  // Horas trabalhadas
  diasMes: integer("dias_mes"),
  horasDia: numeric("horas_dia", { precision: 4, scale: 2, mode: "number" }),

  atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow(),
});

const moeda = (nome: string) => numeric(nome, { precision: 12, scale: 2, mode: "number" });

/**
 * Precificar > Custeio: receita e custos fixos mensais. Um registro por negócio.
 * Campos nulos = ainda não preenchidos.
 */
export const custeio = pgTable("custeio", {
  negocioId: uuid("negocio_id")
    .primaryKey()
    .references(() => negocios.id, { onDelete: "cascade" }),

  receitaBruta: moeda("receita_bruta"),

  // Energia e infraestrutura
  aluguel: moeda("aluguel"),
  energia: moeda("energia"),
  agua: moeda("agua"),
  gas: moeda("gas"),
  internet: moeda("internet"),
  telefone: moeda("telefone"),

  // Funcionários
  salarios: moeda("salarios"),
  proLabore: moeda("pro_labore"),

  // Sistemas
  sistemas: moeda("sistemas"),
  mensalidadeIfood: moeda("mensalidade_ifood"),

  // Serviços
  marketing: moeda("marketing"),
  contador: moeda("contador"),
  motoboy: moeda("motoboy"),

  atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow(),
});

/** Custos fixos livres do Custeio ("Custos extras"). Vários por negócio. */
export const custosExtras = pgTable(
  "custos_extras",
  {
    id: uuid().primaryKey().defaultRandom(),
    negocioId: uuid("negocio_id")
      .notNull()
      .references(() => negocios.id, { onDelete: "cascade" }),
    descricao: text().notNull(),
    valor: moeda("valor").notNull(),
    ordem: integer().notNull().default(0),
  },
  (t) => [index("custos_extras_negocio_idx").on(t.negocioId)],
);

/** Precificar > Equipamentos: máquinas usadas no preparo (custo de energia ou gás). */
export const equipamentos = pgTable(
  "equipamentos",
  {
    id: uuid().primaryKey().defaultRandom(),
    negocioId: uuid("negocio_id")
      .notNull()
      .references(() => negocios.id, { onDelete: "cascade" }),
    nome: text().notNull(),
    tipo: text({ enum: ["eletrico", "gas"] }).notNull(),
    /** Elétricos: potência em watts. */
    potenciaW: numeric("potencia_w", { precision: 10, scale: 2, mode: "number" }),
    /** A gás: consumo em kg por hora. */
    vazaoKgH: numeric("vazao_kg_h", { precision: 10, scale: 4, mode: "number" }),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
    atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("equipamentos_negocio_idx").on(t.negocioId)],
);

/** Precificar > Funcionários: equipe e salário bruto mensal (custo de mão de obra). */
export const funcionarios = pgTable(
  "funcionarios",
  {
    id: uuid().primaryKey().defaultRandom(),
    negocioId: uuid("negocio_id")
      .notNull()
      .references(() => negocios.id, { onDelete: "cascade" }),
    /** Nome ou função (ex.: "Confeiteira"). */
    nome: text().notNull(),
    /** Salário bruto mensal, sem encargos. */
    salario: moeda("salario").notNull(),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
    atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("funcionarios_negocio_idx").on(t.negocioId)],
);

/** Categorias dos insumos. `sistema` = criada pelo foodlilly, não pode ser editada nem excluída. */
export const categoriasInsumo = pgTable(
  "categorias_insumo",
  {
    id: uuid().primaryKey().defaultRandom(),
    negocioId: uuid("negocio_id")
      .notNull()
      .references(() => negocios.id, { onDelete: "cascade" }),
    nome: text().notNull(),
    sistema: boolean().notNull().default(false),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  // Nome único por negócio, sem diferenciar maiúsculas.
  (t) => [uniqueIndex("categorias_insumo_nome_unico").on(t.negocioId, sql`lower(${t.nome})`)],
);

export const UNIDADES = ["unidade", "g", "kg", "ml", "l", "cm", "m"] as const;

/** Precificar > Insumos: matérias-primas, ingredientes e embalagens. */
export const insumos = pgTable(
  "insumos",
  {
    id: uuid().primaryKey().defaultRandom(),
    negocioId: uuid("negocio_id")
      .notNull()
      .references(() => negocios.id, { onDelete: "cascade" }),
    /** No action: a categoria só pode ser excluída depois de mover os insumos (checado no fim do comando, então excluir o negócio inteiro funciona). */
    categoriaId: uuid("categoria_id")
      .notNull()
      .references(() => categoriasInsumo.id, { onDelete: "no action" }),
    nome: text().notNull(),
    codigoBarras: text("codigo_barras"),
    /** Volume bruto comprado, na `unidade`. */
    volume: numeric({ precision: 12, scale: 3, mode: "number" }).notNull(),
    unidade: text({ enum: UNIDADES }).notNull(),
    /** Custo médio pago pelo volume bruto. */
    custo: moeda("custo").notNull(),
    /** Fator de perda em % (casca, aparas, evaporação...). */
    perda: numeric({ precision: 5, scale: 2, mode: "number" }).notNull().default(0),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
    atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("insumos_negocio_idx").on(t.negocioId), index("insumos_categoria_idx").on(t.categoriaId)],
);
