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

/** Máximo de dígitos da máscara de dinheiro (99.999.999,99). */
const MAX_DIGITOS_MOEDA = 10;

/**
 * Máscara de dinheiro ao digitar: os dígitos entram pela direita, com
 * centavos fixos ("1" -> "0,01", "1500" -> "15,00", "1500000" -> "15.000,00").
 * Ignora tudo que não for dígito, então colar "R$ 1.500,50" também funciona.
 */
export function mascaraMoeda(texto: string) {
  const digitos = texto.replace(/\D/g, "");
  if (!digitos) return "";
  const centavos = Number(digitos.replace(/^0+(?=\d)/, "").slice(0, MAX_DIGITOS_MOEDA));
  return paraTexto(centavos / 100, 2);
}

export const formatarMoeda = (valor: number) =>
  valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Como formatarMoeda, mas com 4 casas para valores pequenos (R$ 0,0012 em vez de R$ 0,00). */
export const formatarMoedaPrecisa = (valor: number) =>
  valor > 0 && valor < 0.1
    ? valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 4, maximumFractionDigits: 4 })
    : formatarMoeda(valor);

/** 0,431 -> "43,1%". Com `sinal`, positivos ganham "+" ("+1,0%"). */
export const formatarPercentual = (fracao: number, casas = 1, sinal = false) =>
  (sinal && fracao > 0 ? "+" : "") +
  (fracao * 100).toLocaleString("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  }) +
  "%";
