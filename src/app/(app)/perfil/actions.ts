"use server";

import { and, eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import { db } from "@/db";
import { contasAcesso, negocios, usuarios } from "@/db/schema";
import { auth } from "@/lib/auth";
import {
  errosDoZod,
  esquemaDadosPessoais,
  SENHA_MINIMA,
  somenteDigitos,
} from "@/lib/cadastro";
import { obterNegocioAtual, obterUsuarioAtual } from "@/lib/negocio-atual";

type Resultado =
  | { ok: true }
  | { ok: false; mensagem: string; erros?: Record<string, string> };

export async function salvarDadosPessoais(dados: unknown): Promise<Resultado> {
  const usuario = await obterUsuarioAtual();
  const r = esquemaDadosPessoais.safeParse(dados);
  if (!r.success)
    return {
      ok: false,
      mensagem: "Confira os campos destacados.",
      erros: errosDoZod(r.error),
    };
  await db
    .update(usuarios)
    .set({
      name: r.data.name,
      pais: r.data.pais,
      telefone: somenteDigitos(r.data.telefone),
      cpf: r.data.pais === "BR" ? somenteDigitos(r.data.cpf) : null,
      updatedAt: new Date(),
    })
    .where(eq(usuarios.id, usuario.id));
  refresh();
  return { ok: true };
}

const esquemaNegocio = z.object({
  nome: z
    .string()
    .trim()
    .min(2, "Informe o nome do negócio.")
    .max(80, "Nome muito longo."),
});

export async function salvarNegocio(dados: unknown): Promise<Resultado> {
  const negocio = await obterNegocioAtual();
  const r = esquemaNegocio.safeParse(dados);
  if (!r.success)
    return {
      ok: false,
      mensagem: r.error.issues[0].message,
      erros: errosDoZod(r.error),
    };
  await db
    .update(negocios)
    .set({ nome: r.data.nome })
    .where(eq(negocios.id, negocio.id));
  refresh();
  return { ok: true };
}

const novaSenha = z
  .string()
  .min(
    SENHA_MINIMA,
    `A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`,
  )
  .max(128, "Senha muito longa.");

/**
 * Criação de senha para quem só entra com o Google (a troca de senha de quem já tem
 * senha é feita pelo cliente do login, que renova a sessão no navegador).
 */
export async function criarSenha(dados: unknown): Promise<Resultado> {
  const usuario = await obterUsuarioAtual();
  const [conta] = await db
    .select({ id: contasAcesso.id })
    .from(contasAcesso)
    .where(
      and(
        eq(contasAcesso.userId, usuario.id),
        eq(contasAcesso.providerId, "credential"),
      ),
    )
    .limit(1);
  if (conta)
    return {
      ok: false,
      mensagem: "Sua conta já tem senha. Use a opção de alterar senha.",
    };
  const r = z
    .object({ nova: novaSenha, confirmar: z.string() })
    .refine((d) => d.nova === d.confirmar, {
      path: ["confirmar"],
      message: "As senhas não são iguais.",
    })
    .safeParse(dados);
  if (!r.success)
    return {
      ok: false,
      mensagem: "Confira os campos destacados.",
      erros: errosDoZod(r.error),
    };
  try {
    await auth.api.setPassword({
      body: { newPassword: r.data.nova },
      headers: await headers(),
    });
  } catch {
    return { ok: false, mensagem: "Não foi possível criar a senha agora." };
  }
  return { ok: true };
}
