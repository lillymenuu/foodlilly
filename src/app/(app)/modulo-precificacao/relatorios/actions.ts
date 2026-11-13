"use server";

import { eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { negocios } from "@/db/schema";
import { garantirNegocioQuery, obterNegocioAtualId } from "@/lib/negocio-atual";

const esquema = z
  .number({ error: "Informe a margem meta." })
  .min(1, "Use pelo menos 1%.")
  .max(95, "Use no máximo 95%.");

export async function salvarMargemMeta(
  valor: unknown,
): Promise<{ ok: true } | { ok: false; mensagem: string }> {
  const r = esquema.safeParse(valor);
  if (!r.success)
    return {
      ok: false,
      mensagem: r.error.issues[0]?.message ?? "Valor inválido.",
    };
  const negocioId = await obterNegocioAtualId();
  await db.batch([
    garantirNegocioQuery(negocioId),
    db
      .update(negocios)
      .set({ margemMeta: r.data })
      .where(eq(negocios.id, negocioId)),
  ]);
  refresh();
  return { ok: true };
}
