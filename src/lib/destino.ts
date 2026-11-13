/** Endereço de retorno seguro depois do login (só caminhos internos). */
export function destinoSeguro(v: unknown, padrao = "/dashboard") {
  return typeof v === "string" &&
    v.startsWith("/") &&
    !v.startsWith("//") &&
    !v.startsWith("/entrar") &&
    !v.startsWith("/cadastro")
    ? v
    : padrao;
}
