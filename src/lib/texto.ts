/** Para buscar ignorando maiúsculas e acentos. */
export const normalizar = (t: string) =>
  t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** "Aux limpeza" -> "AL", "Confeiteira" -> "C". */
export function iniciais(nome: string) {
  const palavras = nome.trim().split(/\s+/).filter(Boolean);
  return palavras
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export const compararNome = (a: { nome: string }, b: { nome: string }) =>
  a.nome.localeCompare(b.nome, "pt-BR");

/** "1 funcionário" / "2 funcionários". */
export const plural = (n: number, singular: string, pluralForma: string) =>
  `${n} ${n === 1 ? singular : pluralForma}`;
