/**
 * Motor de cálculo das fichas técnicas (receitas e produtos).
 * Usado no servidor (listas, fichas) e no navegador (cálculo ao vivo na edição).
 *
 * Fórmulas (conferidas com fichas reais):
 * - Mão de obra: salário ÷ (dias/mês × horas/dia × 60) × minutos
 * - Equipamento elétrico: kW × horas × R$/kWh; a gás: kg/h × horas × (R$ botijão ÷ kg)
 * - Insumo: quantidade × custo real da unidade (já com a perda)
 * - Receita/produto vinculado: gramas usadas ÷ peso total da ficha × custo total dela
 * - CMV: só insumos (ingredientes + embalagens), inclusive os das fichas vinculadas
 * - Produto:
 *   fabricação = custo/porção ÷ (1 − alíquota de custo fixo do Custeio)
 *   preço = fabricação ÷ (1 − margem − imposto − taxa do cartão)
 *   revenda = fabricação ÷ (1 − margem de revenda − imposto)
 *   marketplace = preço ÷ (1 − taxa do app)
 */

export type TipoFicha = "massa" | "recheio" | "produto";
export type TipoItem = "ingrediente" | "embalagem" | "receita" | "produto" | "mao_obra" | "equipamento";

export type ItemFicha = { tipo: TipoItem; refId: string; quantidade: number };

export type FichaBase = {
  id: string;
  tipo: TipoFicha;
  nome: string;
  categoriaId: string | null;
  rendimento: number;
  pesoTotalG: number | null;
  tempoPreparoMin: number | null;
  margem: number | null;
  margemRevenda: number | null;
  favorito: boolean;
  modoPreparo: string[];
  itens: ItemFicha[];
  atualizadoEm: string;
};

export type InsumoRef = {
  id: string;
  nome: string;
  unidade: string;
  categoria: string;
  embalagem: boolean;
  /** Custo real por unidade do insumo (g, ml, un...), já com a perda. */
  custoUnitario: number;
};
export type FuncionarioRef = { id: string; nome: string; custoMinuto: number };
export type EquipamentoRef = { id: string; nome: string; detalhe: string; custoMinuto: number };

export type Parametros = {
  /** Custos fixos ÷ receita bruta (Custeio), 0 a 1. */
  aliquotaFixa: number;
  imposto: number;
  taxaCredito: number;
  apps: { nome: string; taxa: number }[];
  margemRevendaPadrao: number;
};

export type Contexto = {
  insumos: Map<string, InsumoRef>;
  funcionarios: Map<string, FuncionarioRef>;
  equipamentos: Map<string, EquipamentoRef>;
  parametros: Parametros;
};

/** Custo e CMV totais + peso de uma ficha, para quem a usa como ingrediente. */
export type ResumoRef = { nome: string; tipo: TipoFicha; custoTotal: number; cmvTotal: number; pesoTotalG: number | null };

export type ItemCalculado = ItemFicha & { nome: string; detalhe: string; custo: number; valido: boolean };

export type Preco = {
  fabricacao: number;
  preco: number;
  lucro: number;
  revenda: number;
  marketplace: { nome: string; preco: number }[];
  precoKg: number | null;
  cmvPct: number;
  /** false quando margem + impostos + taxas >= 100%. */
  valido: boolean;
};

export type Resultado = {
  custos: Record<TipoItem, number>;
  custoTotal: number;
  cmvTotal: number;
  custoPorcao: number;
  cmvPorcao: number;
  custoKg: number | null;
  pesoPorcaoG: number | null;
  itens: ItemCalculado[];
  preco: Preco | null;
};

const ZERO: Record<TipoItem, number> = {
  ingrediente: 0,
  embalagem: 0,
  receita: 0,
  produto: 0,
  mao_obra: 0,
  equipamento: 0,
};

const UNIDADE_CURTA: Record<string, string> = { unidade: "un." };
const qtd = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 3 });

/** Calcula uma ficha. `refs` dá o resumo das fichas vinculadas (já calculadas). */
export function calcularFicha(
  ficha: Pick<FichaBase, "tipo" | "rendimento" | "pesoTotalG" | "margem" | "margemRevenda" | "itens">,
  ctx: Contexto,
  refs: (id: string) => ResumoRef | undefined,
): Resultado {
  const custos = { ...ZERO };
  let cmvTotal = 0;

  const itens: ItemCalculado[] = ficha.itens.map((item) => {
    let nome = "Item removido";
    let detalhe = "";
    let custo = 0;
    let valido = false;

    if (item.tipo === "ingrediente" || item.tipo === "embalagem") {
      const insumo = ctx.insumos.get(item.refId);
      if (insumo) {
        nome = insumo.nome;
        detalhe = `${qtd(item.quantidade)} ${UNIDADE_CURTA[insumo.unidade] ?? insumo.unidade}`;
        custo = item.quantidade * insumo.custoUnitario;
        cmvTotal += custo;
        valido = true;
      }
    } else if (item.tipo === "receita" || item.tipo === "produto") {
      const ref = refs(item.refId);
      if (ref) {
        nome = ref.nome;
        detalhe = `${qtd(item.quantidade)} g`;
        const fracao = ref.pesoTotalG ? item.quantidade / ref.pesoTotalG : 0;
        custo = ref.custoTotal * fracao;
        cmvTotal += ref.cmvTotal * fracao;
        valido = Boolean(ref.pesoTotalG);
        if (!ref.pesoTotalG) detalhe += " · ficha sem peso total";
      }
    } else if (item.tipo === "mao_obra") {
      const f = ctx.funcionarios.get(item.refId);
      if (f) {
        nome = f.nome;
        detalhe = `${qtd(item.quantidade)} min`;
        custo = f.custoMinuto * item.quantidade;
        valido = true;
      }
    } else {
      const e = ctx.equipamentos.get(item.refId);
      if (e) {
        nome = e.nome;
        detalhe = `${qtd(item.quantidade)} min`;
        custo = e.custoMinuto * item.quantidade;
        valido = true;
      }
    }
    custos[item.tipo] += custo;
    return { ...item, nome, detalhe, custo, valido };
  });

  const custoTotal = Object.values(custos).reduce((s, v) => s + v, 0);
  const rendimento = ficha.rendimento > 0 ? ficha.rendimento : 1;
  const custoPorcao = custoTotal / rendimento;
  const cmvPorcao = cmvTotal / rendimento;
  const peso = ficha.pesoTotalG && ficha.pesoTotalG > 0 ? ficha.pesoTotalG : null;
  const pesoPorcaoG = peso ? peso / rendimento : null;

  return {
    custos,
    custoTotal,
    cmvTotal,
    custoPorcao,
    cmvPorcao,
    custoKg: peso ? custoTotal / (peso / 1000) : null,
    pesoPorcaoG,
    itens,
    preco: ficha.tipo === "produto" ? calcularPreco(ficha, custoPorcao, cmvPorcao, pesoPorcaoG, ctx.parametros) : null,
  };
}

function calcularPreco(
  ficha: Pick<FichaBase, "margem" | "margemRevenda">,
  custoPorcao: number,
  cmvPorcao: number,
  pesoPorcaoG: number | null,
  p: Parametros,
): Preco {
  const margem = (ficha.margem ?? 0) / 100;
  const margemRevenda = (ficha.margemRevenda ?? p.margemRevendaPadrao) / 100;
  const fabricacao = p.aliquotaFixa < 1 ? custoPorcao / (1 - p.aliquotaFixa) : custoPorcao;
  const divisor = 1 - margem - p.imposto - p.taxaCredito;
  const valido = divisor > 0.0001;
  const preco = valido ? fabricacao / divisor : 0;
  const divisorRevenda = 1 - margemRevenda - p.imposto;
  return {
    fabricacao,
    preco,
    lucro: preco * margem,
    revenda: divisorRevenda > 0.0001 ? fabricacao / divisorRevenda : 0,
    marketplace: p.apps
      .filter((a) => a.taxa > 0 && a.taxa < 1)
      .map((a) => ({ nome: a.nome, preco: preco / (1 - a.taxa) })),
    precoKg: pesoPorcaoG ? preco / (pesoPorcaoG / 1000) : null,
    cmvPct: preco > 0 ? cmvPorcao / preco : 0,
    valido,
  };
}

/** Classificação da margem de lucro sobre o preço (como na referência: 30% = Regular, 50% = Boa). */
export function classificarMargem(margemPct: number) {
  if (margemPct >= 40) return { rotulo: "Boa", classe: "bg-success/15 text-success" };
  if (margemPct >= 20) return { rotulo: "Regular", classe: "bg-highlight text-highlight-foreground" };
  return { rotulo: "Baixa", classe: "bg-destructive/10 text-destructive" };
}

/**
 * Calcula todas as fichas, resolvendo vínculos (receita dentro de receita,
 * produto dentro de produto). Vínculos circulares são ignorados com segurança.
 */
export function calcularTodas(fichas: FichaBase[], ctx: Contexto) {
  const porId = new Map(fichas.map((f) => [f.id, f]));
  const prontas = new Map<string, Resultado>();
  const emAndamento = new Set<string>();

  const resolver = (id: string): ResumoRef | undefined => {
    const f = porId.get(id);
    if (!f) return undefined;
    const r = calcular(id);
    if (!r) return undefined;
    return { nome: f.nome, tipo: f.tipo, custoTotal: r.custoTotal, cmvTotal: r.cmvTotal, pesoTotalG: f.pesoTotalG };
  };

  function calcular(id: string): Resultado | undefined {
    const pronta = prontas.get(id);
    if (pronta) return pronta;
    if (emAndamento.has(id)) return undefined; // ciclo
    const f = porId.get(id);
    if (!f) return undefined;
    emAndamento.add(id);
    const r = calcularFicha(f, ctx, resolver);
    emAndamento.delete(id);
    prontas.set(id, r);
    return r;
  }

  for (const f of fichas) calcular(f.id);
  return { resultados: prontas, resolver };
}

/** Fichas que usam `id` direta ou indiretamente (não podem ser vinculadas a ela: criaria ciclo). */
export function dependentesDe(id: string, fichas: Pick<FichaBase, "id" | "itens">[]) {
  const usadoPor = new Map<string, string[]>();
  for (const f of fichas) {
    for (const i of f.itens) {
      if (i.tipo === "receita" || i.tipo === "produto") {
        usadoPor.set(i.refId, [...(usadoPor.get(i.refId) ?? []), f.id]);
      }
    }
  }
  const resultado = new Set<string>([id]);
  const fila = [id];
  while (fila.length) {
    for (const pai of usadoPor.get(fila.shift()!) ?? []) {
      if (!resultado.has(pai)) {
        resultado.add(pai);
        fila.push(pai);
      }
    }
  }
  return resultado;
}
