"use server";

import { and, eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { fichas } from "@/db/schema";
import { obterNegocioAtualId } from "@/lib/negocio-atual";
import type { ConfigTabela } from "@/lib/nutricao";
import { errosPorCampo, type ResultadoSalvar } from "@/lib/validacao";

const esquema = z.object({
  categoria: z.string().trim().min(1).max(40),
  porcaoG: z
    .number({ error: "Informe a porção." })
    .positive("A porção deve ser maior que zero.")
    .max(5000, "Porção muito grande."),
  medidaCaseira: z
    .string()
    .trim()
    .min(1, "Informe a medida caseira (ex.: 1 fatia).")
    .max(40, "Use no máximo 40 caracteres."),
  porcoesEmbalagem: z
    .number()
    .positive("Deve ser maior que zero.")
    .max(1000, "Número muito alto.")
    .nullable(),
  liquido: z.boolean(),
  lupa: z.object({
    acucar: z.boolean(),
    saturada: z.boolean(),
    sodio: z.boolean(),
  }),
});

/** Salva a porção, a medida caseira e a lupa da tabela nutricional de um produto. */
export async function salvarTabela(
  fichaId: string,
  config: ConfigTabela,
): Promise<ResultadoSalvar> {
  const negocioId = await obterNegocioAtualId();
  if (!z.uuid().safeParse(fichaId).success)
    return { ok: false, mensagem: "Produto não encontrado." };
  const validado = esquema.safeParse(config);
  if (!validado.success)
    return {
      ok: false,
      mensagem: "Confira os campos destacados.",
      erros: errosPorCampo(validado.error),
    };

  try {
    const alterados = await db
      .update(fichas)
      .set({ tabelaNutricional: validado.data })
      .where(
        and(
          eq(fichas.id, fichaId),
          eq(fichas.negocioId, negocioId),
          eq(fichas.tipo, "produto"),
        ),
      )
      .returning({ id: fichas.id });
    if (!alterados.length)
      return { ok: false, mensagem: "Produto não encontrado." };
  } catch (e) {
    console.error("Erro ao salvar tabela nutricional", e);
    return { ok: false, mensagem: "Não foi possível salvar. Tente novamente." };
  }
  refresh();
  return { ok: true };
}
