/**
 * Regras do cadastro, usadas no formulário (navegador) e no servidor (Better Auth).
 */
import { z } from "zod";

export const somenteDigitos = (v: string) => v.replace(/\D/g, "");

/** Países do cadastro (com o DDI). O CPF só é pedido no Brasil. */
export const PAISES = [
  { codigo: "BR", nome: "Brasil", ddi: "55" },
  { codigo: "PT", nome: "Portugal", ddi: "351" },
  { codigo: "US", nome: "Estados Unidos", ddi: "1" },
  { codigo: "AR", nome: "Argentina", ddi: "54" },
  { codigo: "PY", nome: "Paraguai", ddi: "595" },
  { codigo: "UY", nome: "Uruguai", ddi: "598" },
  { codigo: "CL", nome: "Chile", ddi: "56" },
  { codigo: "AO", nome: "Angola", ddi: "244" },
  { codigo: "MZ", nome: "Moçambique", ddi: "258" },
] as const;
export type CodigoPais = (typeof PAISES)[number]["codigo"];
export const paisPorCodigo = (c: string) =>
  PAISES.find((p) => p.codigo === c) ?? PAISES[0];

/** CPF com dígitos verificadores válidos. */
export function cpfValido(valor: string) {
  const d = somenteDigitos(valor);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const dv = (n: number) => {
    let soma = 0;
    for (let i = 0; i < n; i++) soma += Number(d[i]) * (n + 1 - i);
    const r = (soma * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return dv(9) === Number(d[9]) && dv(10) === Number(d[10]);
}

export function mascaraCpf(valor: string) {
  const d = somenteDigitos(valor).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
}

/** Telefone: no Brasil "(11) 91234-5678"; nos outros países, só dígitos. */
export function mascaraTelefone(valor: string, pais: string) {
  const d = somenteDigitos(valor).slice(0, pais === "BR" ? 11 : 15);
  if (pais !== "BR") return d;
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10)
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function telefoneValido(valor: string, pais: string) {
  const d = somenteDigitos(valor);
  return pais === "BR"
    ? d.length === 10 || d.length === 11
    : d.length >= 6 && d.length <= 15;
}

export const SENHA_MINIMA = 8;

const nome = z
  .string()
  .trim()
  .min(3, "Informe o nome completo.")
  .max(120, "Nome muito longo.")
  .refine((v) => v.split(/\s+/).length >= 2, "Informe nome e sobrenome.");

/** Dados pessoais que o servidor guarda (cadastro e perfil). */
export const esquemaDadosPessoais = z
  .object({
    name: nome,
    pais: z.enum(PAISES.map((p) => p.codigo) as [CodigoPais, ...CodigoPais[]], {
      error: "Escolha o país.",
    }),
    telefone: z.string().trim(),
    cpf: z.string().trim().optional().default(""),
  })
  .superRefine((d, ctx) => {
    if (!telefoneValido(d.telefone, d.pais))
      ctx.addIssue({
        code: "custom",
        path: ["telefone"],
        message: "Telefone inválido.",
      });
    if (d.pais === "BR" && !cpfValido(d.cpf))
      ctx.addIssue({ code: "custom", path: ["cpf"], message: "CPF inválido." });
  });

/** Formulário de cadastro completo (confirmações e termos só existem no navegador). */
export const esquemaCadastro = z
  .object({
    name: nome,
    pais: z.string(),
    telefone: z.string().trim(),
    email: z.email("E-mail inválido.").trim().toLowerCase(),
    confirmarEmail: z.string().trim().toLowerCase(),
    cpf: z.string().trim(),
    password: z
      .string()
      .min(
        SENHA_MINIMA,
        `A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`,
      )
      .max(128, "Senha muito longa."),
    confirmarSenha: z.string(),
    codigoIndicacao: z
      .string()
      .trim()
      .max(40, "Código muito longo.")
      .optional(),
    aceitouTermos: z.literal(true, {
      error: "Aceite os Termos de Uso para continuar.",
    }),
    aceitouPrivacidade: z.literal(true, {
      error: "Aceite a Política de Privacidade para continuar.",
    }),
  })
  .superRefine((d, ctx) => {
    if (d.confirmarEmail !== d.email)
      ctx.addIssue({
        code: "custom",
        path: ["confirmarEmail"],
        message: "Os e-mails não são iguais.",
      });
    if (d.confirmarSenha !== d.password)
      ctx.addIssue({
        code: "custom",
        path: ["confirmarSenha"],
        message: "As senhas não são iguais.",
      });
    const r = esquemaDadosPessoais.safeParse(d);
    if (!r.success)
      for (const i of r.error.issues)
        ctx.addIssue({ code: "custom", path: i.path, message: i.message });
  });

export type DadosCadastro = z.input<typeof esquemaCadastro>;

/** Primeiro erro de cada campo. */
export function errosDoZod(e: z.ZodError) {
  const erros: Record<string, string> = {};
  for (const i of e.issues) {
    const k = String(i.path[0] ?? "geral");
    erros[k] ??= i.message;
  }
  return erros;
}

/**
 * CNPJ com dígitos verificadores válidos. Aceita o CNPJ alfanumérico (letras nas 12
 * primeiras posições, em vigor desde julho de 2026): cada caractere vale código ASCII − 48.
 */
export function cnpjValido(valor: string) {
  const c = valor.toUpperCase().replace(/[^0-9A-Z]/g, "");
  if (!/^[0-9A-Z]{12}\d{2}$/.test(c) || /^(\d)\1{13}$/.test(c)) return false;
  const dv = (n: number) => {
    let soma = 0;
    for (let i = 0; i < n; i++)
      soma += (c.charCodeAt(i) - 48) * (((n - 1 - i) % 8) + 2);
    const r = soma % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return dv(12) === Number(c[12]) && dv(13) === Number(c[13]);
}

/** CPF (até 11 dígitos) ou CNPJ (14 caracteres, pode ter letras) com a máscara certa. */
export function mascaraDocumento(valor: string) {
  const c = valor
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, "")
    .slice(0, 14);
  if (/^\d{0,11}$/.test(c)) return mascaraCpf(c);
  return c
    .replace(/^(\w{2})(\w)/, "$1.$2")
    .replace(/^(\w{2})\.(\w{3})(\w)/, "$1.$2.$3")
    .replace(/^(\w{2})\.(\w{3})\.(\w{3})(\w)/, "$1.$2.$3/$4")
    .replace(/\/(\w{4})(\w{1,2})$/, "/$1-$2");
}

/** Documento vazio, CPF válido ou CNPJ válido. */
export function documentoValido(valor: string) {
  const c = valor.toUpperCase().replace(/[^0-9A-Z]/g, "");
  if (!c) return true;
  return c.length === 11
    ? cpfValido(c)
    : c.length === 14
      ? cnpjValido(c)
      : false;
}
