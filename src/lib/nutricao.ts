/**
 * Informação nutricional (ANVISA: RDC 429/2020 e IN 75/2020).
 * Usado no servidor e no navegador.
 *
 * - Insumo: valores por 100 g (ou 100 ml, considerando 1 ml = 1 g), do rótulo ou da TACO.
 * - Ficha: soma dos ingredientes (embalagens não entram) e das receitas vinculadas
 *   (gramas usadas ÷ peso total da receita). Por 100 g = total ÷ peso total da ficha × 100,
 *   então a perda de água no forno já fica considerada pelo peso final.
 */

export const NUTRIENTES = [
  { chave: "kcal", rotulo: "Valor energético", unidade: "kcal", vd: 2000, minimo: 4 },
  { chave: "carboidratos", rotulo: "Carboidratos totais", unidade: "g", vd: 300, minimo: 0.5 },
  { chave: "acucaresTotais", rotulo: "Açúcares totais", unidade: "g", vd: null, minimo: 0.5, recuo: true },
  { chave: "acucaresAdicionados", rotulo: "Açúcares adicionados", unidade: "g", vd: 50, minimo: 0, recuo: true },
  { chave: "proteinas", rotulo: "Proteínas", unidade: "g", vd: 50, minimo: 0.5 },
  { chave: "gorduras", rotulo: "Gorduras totais", unidade: "g", vd: 65, minimo: 0.5 },
  { chave: "saturadas", rotulo: "Gorduras saturadas", unidade: "g", vd: 20, minimo: 0.1, recuo: true },
  { chave: "trans", rotulo: "Gorduras trans", unidade: "g", vd: 2, minimo: 0.1, recuo: true },
  { chave: "fibras", rotulo: "Fibras alimentares", unidade: "g", vd: 25, minimo: 0.5 },
  { chave: "sodio", rotulo: "Sódio", unidade: "mg", vd: 2000, minimo: 5 },
] as const;

export type ChaveNutriente = (typeof NUTRIENTES)[number]["chave"];
export type Nutrientes = Record<ChaveNutriente, number>;

export const ZERO_NUTRIENTES = Object.fromEntries(
  NUTRIENTES.map((n) => [n.chave, 0]),
) as Nutrientes;

/** Gravado no insumo (coluna `nutricao`). */
export type NutricaoInsumo = {
  fonte: "rotulo" | "taco";
  /** Alimento da TACO usado como base (quando a fonte é a TACO). */
  tacoId?: number | null;
  /** Peso de 1 unidade/cm/m em gramas (insumos que não são comprados em g, kg, ml ou l). */
  pesoUnidadeG?: number | null;
  /** Por 100 g ou 100 ml. */
  valores: Nutrientes;
};

/** Gravado na ficha (coluna `tabela_nutricional`). */
export type ConfigTabela = {
  categoria: string;
  porcaoG: number;
  medidaCaseira: string;
  porcoesEmbalagem: number | null;
  liquido: boolean;
  lupa: { acucar: boolean; saturada: boolean; sodio: boolean };
};

/** Valor energético pelos fatores do Anexo XXII da IN 75 (usado quando o rótulo não traz). */
export const energiaCalculada = (v: Pick<Nutrientes, "carboidratos" | "proteinas" | "gorduras" | "fibras">) =>
  v.carboidratos * 4 + v.proteinas * 4 + v.gorduras * 9 + v.fibras * 2;

/** Quantos gramas há em 1 unidade de compra do insumo (null = falta o peso da unidade). */
export function gramasPorUnidade(unidade: string, pesoUnidadeG?: number | null) {
  if (unidade === "g" || unidade === "ml") return 1;
  if (unidade === "kg" || unidade === "l") return 1000;
  return pesoUnidadeG && pesoUnidadeG > 0 ? pesoUnidadeG : null;
}

export const unidadePrecisaPeso = (unidade: string) => gramasPorUnidade(unidade) === null;

const somar = (a: Nutrientes, b: Nutrientes, fator = 1) => {
  const r = { ...a };
  for (const n of NUTRIENTES) r[n.chave] += b[n.chave] * fator;
  return r;
};
export const escalar = (a: Nutrientes, fator: number) => somar(ZERO_NUTRIENTES, a, fator);

// ----------------------------------------------------------------- Fichas

export type InsumoNutricao = {
  id: string;
  nome: string;
  unidade: string;
  embalagem: boolean;
  nutricao: NutricaoInsumo | null;
};

export type FichaNutricao = {
  id: string;
  nome: string;
  pesoTotalG: number | null;
  itens: { tipo: string; refId: string; quantidade: number }[];
};

export type Pendencia =
  | { tipo: "insumo"; id: string; nome: string; motivo: "sem_dados" | "sem_peso" }
  | { tipo: "ficha"; id: string; nome: string; motivo: "sem_peso" };

export type ResultadoNutricao = {
  /** Total da ficha inteira (todo o peso total). */
  total: Nutrientes;
  /** Por 100 g do produto pronto (null sem peso total). */
  por100: Nutrientes | null;
  pendencias: Pendencia[];
  completa: boolean;
};

const chavePendencia = (p: Pendencia) => `${p.tipo}:${p.id}:${p.motivo}`;

/** Calcula a nutrição de todas as fichas (vínculos resolvidos; ciclos ignorados). */
export function calcularNutricaoTodas(
  fichas: FichaNutricao[],
  insumos: Map<string, InsumoNutricao>,
) {
  const porId = new Map(fichas.map((f) => [f.id, f]));
  const prontas = new Map<string, ResultadoNutricao>();
  const emAndamento = new Set<string>();

  function calcular(id: string): ResultadoNutricao | undefined {
    const pronta = prontas.get(id);
    if (pronta) return pronta;
    if (emAndamento.has(id)) return undefined;
    const f = porId.get(id);
    if (!f) return undefined;
    emAndamento.add(id);

    let total = ZERO_NUTRIENTES;
    const pendencias = new Map<string, Pendencia>();
    const pendente = (p: Pendencia) => pendencias.set(chavePendencia(p), p);

    for (const item of f.itens) {
      if (item.tipo === "ingrediente") {
        const i = insumos.get(item.refId);
        if (!i) continue;
        if (!i.nutricao) {
          pendente({ tipo: "insumo", id: i.id, nome: i.nome, motivo: "sem_dados" });
          continue;
        }
        const gramas = gramasPorUnidade(i.unidade, i.nutricao.pesoUnidadeG);
        if (gramas === null) {
          pendente({ tipo: "insumo", id: i.id, nome: i.nome, motivo: "sem_peso" });
          continue;
        }
        total = somar(total, i.nutricao.valores, (item.quantidade * gramas) / 100);
      } else if (item.tipo === "receita" || item.tipo === "produto") {
        const ref = porId.get(item.refId);
        const r = calcular(item.refId);
        if (!ref || !r) continue;
        for (const p of r.pendencias) pendente(p);
        if (!ref.pesoTotalG) continue; // já listada como pendência dela
        total = somar(total, r.total, item.quantidade / ref.pesoTotalG);
      }
      // Embalagens, mão de obra e equipamentos não têm valor nutricional.
    }

    const peso = f.pesoTotalG && f.pesoTotalG > 0 ? f.pesoTotalG : null;
    if (!peso) pendente({ tipo: "ficha", id: f.id, nome: f.nome, motivo: "sem_peso" });
    const temIngrediente = f.itens.some((i) => i.tipo === "ingrediente" || i.tipo === "receita" || i.tipo === "produto");

    emAndamento.delete(id);
    const lista = [...pendencias.values()];
    const r: ResultadoNutricao = {
      total,
      por100: peso ? escalar(total, 100 / peso) : null,
      pendencias: lista,
      completa: Boolean(peso) && temIngrediente && lista.length === 0,
    };
    prontas.set(id, r);
    return r;
  }

  for (const f of fichas) calcular(f.id);
  return prontas;
}

// ------------------------------------------------- Tabela (arredondamentos)

/** Arredondamento "meio para cima" com n casas. */
const arred = (v: number, casas: number) => {
  const f = 10 ** casas;
  return Math.round((v + Number.EPSILON) * f) / f;
};

/** Anexo III da IN 75: >= 10 inteiro; 1 a 10 uma casa (sem ",0"); < 1 g uma casa; < 1 mg duas casas. */
export function valorDeclarado(v: number, unidade: string): number {
  if (v >= 10) return arred(v, 0);
  if (v >= 1) return arred(v, 1);
  return unidade === "mg" ? arred(v, 2) : arred(v, 1);
}

export function formatarDeclarado(v: number) {
  return v.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

export type LinhaTabela = {
  chave: ChaveNutriente;
  rotulo: string;
  unidade: string;
  recuo: boolean;
  por100: number;
  porcao: number;
  /** %VD da porção (null quando não há VDR, como açúcares totais). */
  vd: number | null;
};

/**
 * Linhas da tabela com as regras da ANVISA: arredondamento (Anexo III) e
 * quantidades não significativas declaradas como zero (Anexo IV), avaliadas por 100 g e por porção.
 */
export function linhasTabela(por100: Nutrientes, porcaoG: number): LinhaTabela[] {
  const porcao = escalar(por100, porcaoG / 100);
  const insignificante = (c: ChaveNutriente) => {
    const n = NUTRIENTES.find((x) => x.chave === c)!;
    if (c === "acucaresAdicionados") return por100[c] <= 0;
    return por100[c] <= n.minimo && porcao[c] <= n.minimo;
  };
  const zero = new Set<ChaveNutriente>(NUTRIENTES.map((n) => n.chave).filter(insignificante));
  // Carboidratos só viram zero se os açúcares também; gorduras totais, se saturadas e trans também.
  if (zero.has("carboidratos") && !(zero.has("acucaresTotais") && zero.has("acucaresAdicionados"))) zero.delete("carboidratos");
  if (zero.has("acucaresTotais") && !zero.has("acucaresAdicionados")) zero.delete("acucaresTotais");
  if (zero.has("gorduras") && !(zero.has("saturadas") && zero.has("trans"))) zero.delete("gorduras");

  return NUTRIENTES.map((n) => {
    const nulo = zero.has(n.chave);
    const v100 = nulo ? 0 : valorDeclarado(por100[n.chave], n.unidade);
    const vPorcao = nulo ? 0 : valorDeclarado(porcao[n.chave], n.unidade);
    return {
      chave: n.chave,
      rotulo: n.rotulo,
      unidade: n.unidade,
      recuo: "recuo" in n && n.recuo === true,
      por100: v100,
      porcao: vPorcao,
      vd: n.vd === null ? null : nulo ? 0 : Math.round((porcao[n.chave] / n.vd) * 100),
    };
  });
}

/** Anexo XV da IN 75: limites da rotulagem frontal (lupa), por 100 g ou 100 ml. */
export const LIMITES_LUPA = {
  acucar: { solido: 15, liquido: 7.5, rotulo: "Açúcar adicionado", chave: "acucaresAdicionados" },
  saturada: { solido: 6, liquido: 3, rotulo: "Gordura saturada", chave: "saturadas" },
  sodio: { solido: 600, liquido: 300, rotulo: "Sódio", chave: "sodio" },
} as const;
export type ChaveLupa = keyof typeof LIMITES_LUPA;

/** Quais advertências o cálculo indica (o cliente decide o que mostrar). */
export function lupaSugerida(por100: Nutrientes, liquido: boolean): Record<ChaveLupa, boolean> {
  const r = {} as Record<ChaveLupa, boolean>;
  for (const [k, l] of Object.entries(LIMITES_LUPA) as [ChaveLupa, (typeof LIMITES_LUPA)[ChaveLupa]][]) {
    r[k] = por100[l.chave] >= (liquido ? l.liquido : l.solido);
  }
  return r;
}

/** Anexo VI: 3 ou mais porções inteiras = número inteiro; senão "Cerca de N". */
export function textoPorcoesEmbalagem(n: number) {
  const inteiro = Math.abs(n - Math.round(n)) < 0.001;
  return inteiro ? String(Math.round(n)) : `Cerca de ${Math.round(n)}`;
}
