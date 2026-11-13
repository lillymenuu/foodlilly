// Tabelas do banco (Drizzle).
// Depois de alterar este arquivo: `npm run db:generate` e `npm run db:migrate`.

import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------- Acesso (Better Auth)
// Nomes dos campos (chaves JS) seguem o Better Auth; tabelas e colunas em português.

export const usuarios = pgTable("usuarios", {
  id: text().primaryKey(),
  name: text("nome").notNull(),
  email: text().notNull().unique(),
  emailVerified: boolean("email_verificado").notNull().default(false),
  image: text("imagem"),
  createdAt: timestamp("criado_em", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("atualizado_em", { withTimezone: true })
    .notNull()
    .defaultNow(),
  // Campos do cadastro
  telefone: text(),
  cpf: text(),
  pais: text().notNull().default("BR"),
  codigoIndicacao: text("codigo_indicacao"),
  /** Quando aceitou os Termos de Uso e a Política de Privacidade. */
  termosAceitosEm: timestamp("termos_aceitos_em", { withTimezone: true }),
});

export const sessoes = pgTable(
  "sessoes",
  {
    id: text().primaryKey(),
    expiresAt: timestamp("expira_em", { withTimezone: true }).notNull(),
    token: text().notNull().unique(),
    createdAt: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("atualizado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
    ipAddress: text("ip"),
    userAgent: text("navegador"),
    userId: text("usuario_id")
      .notNull()
      .references(() => usuarios.id, { onDelete: "cascade" }),
  },
  (t) => [index("sessoes_usuario_idx").on(t.userId)],
);

/** Formas de entrar de cada usuário (senha ou Google). */
export const contasAcesso = pgTable(
  "contas_acesso",
  {
    id: text().primaryKey(),
    accountId: text("conta_id").notNull(),
    providerId: text("provedor").notNull(),
    userId: text("usuario_id")
      .notNull()
      .references(() => usuarios.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expira_em", {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expira_em", {
      withTimezone: true,
    }),
    scope: text("escopo"),
    password: text("senha_hash"),
    createdAt: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("atualizado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("contas_acesso_usuario_idx").on(t.userId)],
);

export const verificacoes = pgTable(
  "verificacoes",
  {
    id: text().primaryKey(),
    identifier: text("identificador").notNull(),
    value: text("valor").notNull(),
    expiresAt: timestamp("expira_em", { withTimezone: true }).notNull(),
    createdAt: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("atualizado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("verificacoes_identificador_idx").on(t.identifier)],
);

export const PLANOS = ["basico", "completo"] as const;

/** Negócio do cliente (lanchonete, confeitaria...). Toda informação pertence a um negócio. */
export const negocios = pgTable("negocios", {
  id: uuid().primaryKey().defaultRandom(),
  nome: text().notNull(),
  criadoEm: timestamp("criado_em", { withTimezone: true })
    .notNull()
    .defaultNow(),
  /** Dono do negócio (um negócio por usuário). */
  usuarioId: text("usuario_id")
    .unique()
    .references(() => usuarios.id, { onDelete: "set null" }),
  /** Plano escolhido (ou de interesse, durante o teste). */
  plano: text({ enum: PLANOS }).notNull().default("basico"),
  /** Fim do teste grátis de 7 dias. */
  testeAte: timestamp("teste_ate", { withTimezone: true }),
  /** Acesso pago até esta data (renovado pelo Pix). */
  pagoAte: timestamp("pago_ate", { withTimezone: true }),
  /** Acesso liberado sem cobrança (ex.: o dono do sistema). */
  isento: boolean().notNull().default(false),
  /** Quando os equipamentos padrão foram criados (null = ainda não). Evita recriá-los se o cliente excluir. */
  equipamentosPadraoEm: timestamp("equipamentos_padrao_em", {
    withTimezone: true,
  }),
  /** Idem para os funcionários padrão. */
  funcionariosPadraoEm: timestamp("funcionarios_padrao_em", {
    withTimezone: true,
  }),
  /** Idem para as categorias de insumo padrão. */
  categoriasInsumoPadraoEm: timestamp("categorias_insumo_padrao_em", {
    withTimezone: true,
  }),
  /** Quando as categorias financeiras padrão foram criadas (null = ainda não). */
  categoriasFinanceirasPadraoEm: timestamp("categorias_financeiras_padrao_em", {
    withTimezone: true,
  }),
  /** Relatórios: margem de lucro que o negócio quer atingir (%). */
  margemMeta: numeric("margem_meta", { precision: 5, scale: 2, mode: "number" })
    .notNull()
    .default(30),
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
  energiaKwh: numeric("energia_kwh", {
    precision: 10,
    scale: 4,
    mode: "number",
  }),
  gasPreco: numeric("gas_preco", { precision: 10, scale: 2, mode: "number" }),
  gasPesoKg: numeric("gas_peso_kg", { precision: 8, scale: 3, mode: "number" }),

  // Taxas (%)
  taxaIfood: numeric("taxa_ifood", { precision: 5, scale: 2, mode: "number" }),
  taxa99food: numeric("taxa_99food", {
    precision: 5,
    scale: 2,
    mode: "number",
  }),
  taxaKeeta: numeric("taxa_keeta", { precision: 5, scale: 2, mode: "number" }),
  taxaCredito: numeric("taxa_credito", {
    precision: 5,
    scale: 2,
    mode: "number",
  }),
  aliquotaImposto: numeric("aliquota_imposto", {
    precision: 5,
    scale: 2,
    mode: "number",
  }),

  // Horas trabalhadas
  diasMes: integer("dias_mes"),
  horasDia: numeric("horas_dia", { precision: 4, scale: 2, mode: "number" }),

  atualizadoEm: timestamp("atualizado_em", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

const moeda = (nome: string) =>
  numeric(nome, { precision: 12, scale: 2, mode: "number" });

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

  atualizadoEm: timestamp("atualizado_em", { withTimezone: true })
    .notNull()
    .defaultNow(),
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
    potenciaW: numeric("potencia_w", {
      precision: 10,
      scale: 2,
      mode: "number",
    }),
    /** A gás: consumo em kg por hora. */
    vazaoKgH: numeric("vazao_kg_h", {
      precision: 10,
      scale: 4,
      mode: "number",
    }),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
    atualizadoEm: timestamp("atualizado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
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
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
    atualizadoEm: timestamp("atualizado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
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
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  // Nome único por negócio, sem diferenciar maiúsculas.
  (t) => [
    uniqueIndex("categorias_insumo_nome_unico").on(
      t.negocioId,
      sql`lower(${t.nome})`,
    ),
  ],
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
    perda: numeric({ precision: 5, scale: 2, mode: "number" })
      .notNull()
      .default(0),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
    atualizadoEm: timestamp("atualizado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("insumos_negocio_idx").on(t.negocioId),
    index("insumos_categoria_idx").on(t.categoriaId),
  ],
);

export const TIPOS_FICHA = ["massa", "recheio", "produto"] as const;

/** Categorias de massas, recheios e produtos (cada tipo tem as suas). */
export const categoriasFicha = pgTable(
  "categorias_ficha",
  {
    id: uuid().primaryKey().defaultRandom(),
    negocioId: uuid("negocio_id")
      .notNull()
      .references(() => negocios.id, { onDelete: "cascade" }),
    tipo: text({ enum: TIPOS_FICHA }).notNull(),
    nome: text().notNull(),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("categorias_ficha_nome_unico").on(
      t.negocioId,
      t.tipo,
      sql`lower(${t.nome})`,
    ),
  ],
);

/**
 * Ficha técnica: receitas (massa, recheio) e produtos. A composição fica em
 * `ficha_itens`; os custos são calculados (não ficam gravados).
 */
export const fichas = pgTable(
  "fichas",
  {
    id: uuid().primaryKey().defaultRandom(),
    negocioId: uuid("negocio_id")
      .notNull()
      .references(() => negocios.id, { onDelete: "cascade" }),
    tipo: text({ enum: TIPOS_FICHA }).notNull(),
    nome: text().notNull(),
    /** Sem categoria quando a categoria é excluída. */
    categoriaId: uuid("categoria_id").references(() => categoriasFicha.id, {
      onDelete: "set null",
    }),
    /** Quantas porções/unidades a ficha rende. */
    rendimento: numeric({ precision: 10, scale: 2, mode: "number" })
      .notNull()
      .default(1),
    /** Peso final pronto, em gramas (base do custo por kg e do uso em outras fichas). */
    pesoTotalG: numeric("peso_total_g", {
      precision: 12,
      scale: 2,
      mode: "number",
    }),
    tempoPreparoMin: integer("tempo_preparo_min"),
    /** Produtos: margem de lucro desejada sobre o preço (%). */
    margem: numeric({ precision: 5, scale: 2, mode: "number" }),
    /** Produtos: margem para revenda (%); nulo = padrão. */
    margemRevenda: numeric("margem_revenda", {
      precision: 5,
      scale: 2,
      mode: "number",
    }),
    favorito: boolean().notNull().default(false),
    /** Passos do modo de preparo, em ordem. */
    modoPreparo: jsonb("modo_preparo").$type<string[]>().notNull().default([]),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
    atualizadoEm: timestamp("atualizado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("fichas_negocio_idx").on(t.negocioId, t.tipo)],
);

export const TIPOS_ITEM_FICHA = [
  "ingrediente",
  "embalagem",
  "receita",
  "produto",
  "mao_obra",
  "equipamento",
] as const;

/**
 * Composição de uma ficha. Só uma referência é preenchida, conforme o tipo:
 * ingrediente/embalagem -> insumo (quantidade na unidade do insumo);
 * receita/produto -> ficha (quantidade em gramas);
 * mao_obra -> funcionário e equipamento -> equipamento (quantidade em minutos).
 * Excluir o item referenciado remove a linha da composição (cascade).
 */
export const fichaItens = pgTable(
  "ficha_itens",
  {
    id: uuid().primaryKey().defaultRandom(),
    fichaId: uuid("ficha_id")
      .notNull()
      .references(() => fichas.id, { onDelete: "cascade" }),
    tipo: text({ enum: TIPOS_ITEM_FICHA }).notNull(),
    insumoId: uuid("insumo_id").references(() => insumos.id, {
      onDelete: "cascade",
    }),
    fichaRefId: uuid("ficha_ref_id").references(() => fichas.id, {
      onDelete: "cascade",
    }),
    funcionarioId: uuid("funcionario_id").references(() => funcionarios.id, {
      onDelete: "cascade",
    }),
    equipamentoId: uuid("equipamento_id").references(() => equipamentos.id, {
      onDelete: "cascade",
    }),
    quantidade: numeric({ precision: 12, scale: 3, mode: "number" }).notNull(),
    ordem: integer().notNull().default(0),
  },
  (t) => [
    index("ficha_itens_ficha_idx").on(t.fichaId),
    index("ficha_itens_ref_idx").on(t.fichaRefId),
  ],
);

// ---------------------------------------------------------------- Financeiro

export const TIPOS_CONTA = [
  "corrente",
  "poupanca",
  "carteira_digital",
  "pagamento",
  "outro",
] as const;
export const CORES_CONTA = [
  "grafite",
  "azul",
  "roxo",
  "verde",
  "bronze",
  "vinho",
  "petroleo",
  "indigo",
] as const;

/** Financeiro > Contas: contas bancárias e carteiras do negócio. */
export const contasBancarias = pgTable(
  "contas_bancarias",
  {
    id: uuid().primaryKey().defaultRandom(),
    negocioId: uuid("negocio_id")
      .notNull()
      .references(() => negocios.id, { onDelete: "cascade" }),
    nome: text().notNull(),
    tipo: text({ enum: TIPOS_CONTA }).notNull(),
    /** Pode ser negativo (conta no vermelho). */
    saldoInicial: numeric("saldo_inicial", {
      precision: 14,
      scale: 2,
      mode: "number",
    })
      .notNull()
      .default(0),
    /** Só lançamentos a partir desta data entram no saldo. */
    dataSaldoInicial: date("data_saldo_inicial", { mode: "string" }).notNull(),
    padrao: boolean().notNull().default(false),
    cor: text({ enum: CORES_CONTA }).notNull().default("grafite"),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
    atualizadoEm: timestamp("atualizado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("contas_bancarias_negocio_idx").on(t.negocioId),
    // No máximo uma conta padrão por negócio.
    uniqueIndex("contas_bancarias_padrao_unica")
      .on(t.negocioId)
      .where(sql`${t.padrao}`),
  ],
);

export const GRUPOS_FINANCEIROS = [
  "recebimentos",
  "operacionais",
  "variaveis",
  "pessoas",
  "impostos",
  "aquisicoes",
] as const;

/**
 * Financeiro > Categorias: principais (com `chave` do catálogo, sem pai) e subcategorias
 * (com `paiId`, nome livre). Ver `modulo-financeiro/contas/catalogo-categorias.ts`.
 */
export const categoriasFinanceiras = pgTable(
  "categorias_financeiras",
  {
    id: uuid().primaryKey().defaultRandom(),
    negocioId: uuid("negocio_id")
      .notNull()
      .references(() => negocios.id, { onDelete: "cascade" }),
    grupo: text({ enum: GRUPOS_FINANCEIROS }).notNull(),
    nome: text().notNull(),
    /** Chave do catálogo (só nas principais). */
    chave: text(),
    paiId: uuid("pai_id").references(
      (): AnyPgColumn => categoriasFinanceiras.id,
      { onDelete: "cascade" },
    ),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("categorias_financeiras_negocio_idx").on(t.negocioId),
    uniqueIndex("categorias_financeiras_chave_unica")
      .on(t.negocioId, t.chave)
      .where(sql`${t.chave} is not null`),
    uniqueIndex("categorias_financeiras_sub_unica")
      .on(t.paiId, sql`lower(${t.nome})`)
      .where(sql`${t.paiId} is not null`),
  ],
);

/** Financeiro > Fornecedores (e clientes) do negócio. */
export const fornecedores = pgTable(
  "fornecedores",
  {
    id: uuid().primaryKey().defaultRandom(),
    negocioId: uuid("negocio_id")
      .notNull()
      .references(() => negocios.id, { onDelete: "cascade" }),
    nome: text().notNull(),
    /** Só dígitos. */
    telefone: text(),
    /** CPF ou CNPJ, sem máscara (o CNPJ pode ter letras). */
    documento: text(),
    email: text(),
    observacoes: text(),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
    atualizadoEm: timestamp("atualizado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("fornecedores_negocio_idx").on(t.negocioId)],
);
