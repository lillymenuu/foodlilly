"use server";

import { eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { custeio, custosExtras } from "@/db/schema";
import { garantirNegocioQuery, obterNegocioAtualId } from "@/lib/negocio-atual";
import { errosPorCampo, esquemaNumeros, type ResultadoSalvar } from "@/lib/validacao";

import { campos, MAX_EXTRAS, type CustoExtra, type ValoresCusteio } from "./campos";

const esquema = z.object({
  fixos: esquemaNumeros(campos),
  extras: z
    .array(
      z.object({
        descricao: z
          .string()
          .trim()
          .min(1, "Informe a descrição.")
          .max(80, "Use no máximo 80 caracteres."),
        valor: z
          .number({ error: "Informe um valor." })
          .min(0, "O valor não pode ser negativo.")
          .max(10_000_000, "Valor muito alto."),
      }),
    )
    .max(MAX_EXTRAS, `Use no máximo ${MAX_EXTRAS} custos extras.`),
});

export async function salvarCusteio(
  fixos: ValoresCusteio,
  extras: CustoExtra[],
): Promise<ResultadoSalvar> {
  const negocioId = await obterNegocioAtualId();

  const validado = esquema.safeParse({ fixos, extras });
  if (!validado.success) {
    // Campos fixos voltam pela chave ("aluguel"); extras como "extras.0.valor".
    const erros = Object.fromEntries(
      Object.entries(errosPorCampo(validado.error)).map(([k, v]) => [k.replace(/^fixos\./, ""), v]),
    );
    return { ok: false, mensagem: "Confira os campos destacados.", erros };
  }

  const dados = { ...validado.data.fixos, atualizadoEm: new Date() };
  const linhasExtras = validado.data.extras.map((e, ordem) => ({ negocioId, ...e, ordem }));

  try {
    // Lote único (transação): os custos extras são substituídos pela lista atual.
    await db.batch([
      garantirNegocioQuery(negocioId),
      db
        .insert(custeio)
        .values({ negocioId, ...dados })
        .onConflictDoUpdate({ target: custeio.negocioId, set: dados }),
      db.delete(custosExtras).where(eq(custosExtras.negocioId, negocioId)),
      ...(linhasExtras.length ? [db.insert(custosExtras).values(linhasExtras)] : []),
    ]);
  } catch (erro) {
    console.error("Erro ao salvar custeio", erro);
    return { ok: false, mensagem: "Não foi possível salvar. Tente novamente." };
  }

  refresh();
  return { ok: true };
}
