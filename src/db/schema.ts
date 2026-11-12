// Tabelas do banco (Drizzle).
// Depois de alterar este arquivo: `npm run db:generate` e `npm run db:migrate`.

import { integer, numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/** Negócio do cliente (lanchonete, confeitaria...). Toda informação pertence a um negócio. */
export const negocios = pgTable("negocios", {
  id: uuid().primaryKey().defaultRandom(),
  nome: text().notNull(),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
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
