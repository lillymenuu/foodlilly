/** Números no formato brasileiro (vírgula decimal, ponto de milhar). */

/** Número -> texto do campo. Com `casas`, formata como "1.234,50". */
export function paraTexto(valor: number | null | undefined, casas?: number) {
  if (valor == null) return "";
  if (casas != null) {
    return valor.toLocaleString("pt-BR", {
      minimumFractionDigits: casas,
      maximumFractionDigits: casas,
    });
  }
  return String(valor).replace(".", ",");
}

/**
 * Texto digitado -> número. Aceita "1,02", "1.02", "15.000", "15.000,50" e "R$ 10".
 * Vazio = null; inválido = NaN.
 */
export function paraNumero(texto: string): number | null {
  const t = texto.trim().replace(/R\$|\s/g, "");
  if (!t) return null;
  let normalizado: string;
  if (t.includes(",")) normalizado = t.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(t)) normalizado = t.replace(/\./g, "");
  else normalizado = t;
  return /^\d+(\.\d+)?$/.test(normalizado) ? Number(normalizado) : NaN;
}

export const formatarMoeda = (valor: number) =>
  valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const formatarPercentual = (fracao: number, casas = 1) =>
  (fracao * 100).toLocaleString("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  }) + "%";
