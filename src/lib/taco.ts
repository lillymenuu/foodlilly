import type { Nutrientes } from "./nutricao";

/**
 * TACO: Tabela Brasileira de Composição de Alimentos, 4ª ed. (NEPA/Unicamp, 2011).
 * Dados em `src/data/taco.json` (convertidos de raulfdm/taco-api, licença MIT),
 * carregados só quando o cliente abre a busca.
 * Linha: [id, nome, categoria, kcal, carboidratos, açúcares totais, açúcares adicionados,
 *         proteínas, gorduras, saturadas, trans, fibras, sódio (mg)]; null = não analisado.
 */
type Linha = [number, string, number, ...(number | null)[]];

export type AlimentoTaco = {
  id: number;
  nome: string;
  categoria: string;
  /** Valores por 100 g; null quando a TACO não traz (ex.: açúcares). */
  valores: Record<keyof Nutrientes, number | null>;
};

const ORDEM: (keyof Nutrientes)[] = [
  "kcal",
  "carboidratos",
  "acucaresTotais",
  "acucaresAdicionados",
  "proteinas",
  "gorduras",
  "saturadas",
  "trans",
  "fibras",
  "sodio",
];

let cache: Promise<AlimentoTaco[]> | null = null;

export function carregarTaco() {
  cache ??= import("@/data/taco.json").then((m) => {
    const dados = m.default as unknown as {
      categorias: [number, string][];
      alimentos: Linha[];
    };
    const categorias = new Map(dados.categorias);
    return dados.alimentos.map(([id, nome, categoria, ...v]) => ({
      id,
      nome,
      categoria: categorias.get(categoria) ?? "",
      valores: Object.fromEntries(
        ORDEM.map((k, i) => [k, v[i] ?? null]),
      ) as AlimentoTaco["valores"],
    }));
  });
  return cache;
}

const normalizar = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/** Busca por palavras (todas precisam aparecer), priorizando quem começa com a primeira. */
export function buscarTaco(lista: AlimentoTaco[], termo: string, limite = 8) {
  const palavras = normalizar(termo)
    .split(/[\s,]+/)
    .filter((p) => p.length > 1);
  if (!palavras.length) return [];
  return lista
    .map((a) => ({ a, n: normalizar(a.nome) }))
    .filter(({ n }) => palavras.every((p) => n.includes(p)))
    .sort(
      (x, y) =>
        Number(!x.n.startsWith(palavras[0])) -
          Number(!y.n.startsWith(palavras[0])) || x.n.length - y.n.length,
    )
    .slice(0, limite)
    .map(({ a }) => a);
}
