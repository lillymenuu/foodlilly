"use server";

import { refresh } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { dadosEntrada } from "@/db/schema";
import { garantirNegocioQuery, obterNegocioAtualId } from "@/lib/negocio-atual";

import { campos, type ChaveCampo, type Valores } from "./campos";

const esquema = z.object(
  Object.fromEntries(
    campos.map((c) => {
      let numero = z
        .number({ error: "Informe um número." })
        .min(c.min, `Mínimo: ${String(c.min).replace(".", ",")}`)
        .max(c.max, `Máximo: ${String(c.max).replace(".", ",")}`);
      if (c.inteiro) numero = numero.int("Use um número inteiro.");
      return [c.chave, numero.nullable()];
    }),
  ) as Record<ChaveCampo, z.ZodNullable<z.ZodNumber>>,
);

export type ResultadoSalvar =
  | { ok: true }
  | { ok: false; mensagem: string; erros?: Partial<Record<ChaveCampo, string>> };

export async function salvarDadosEntrada(valores: Valores): Promise<ResultadoSalvar> {
  const negocioId = await obterNegocioAtualId();

  const validado = esquema.safeParse(valores);
  if (!validado.success) {
    const erros: Partial<Record<ChaveCampo, string>> = {};
    for (const issue of validado.error.issues) {
      const chave = issue.path[0] as ChaveCampo;
      erros[chave] ??= issue.message;
    }
    return { ok: false, mensagem: "Confira os campos destacados.", erros };
  }

  const dados = { ...validado.data, atualizadoEm: new Date() };

  try {
    // Lote único: cria o negócio (se preciso) e grava os dados juntos.
    await db.batch([
      garantirNegocioQuery(negocioId),
      db
        .insert(dadosEntrada)
        .values({ negocioId, ...dados })
        .onConflictDoUpdate({ target: dadosEntrada.negocioId, set: dados }),
    ]);
  } catch (erro) {
    console.error("Erro ao salvar dados de entrada", erro);
    return { ok: false, mensagem: "Não foi possível salvar. Tente novamente." };
  }

  refresh();
  return { ok: true };
}
