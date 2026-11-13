import "server-only";

import { and, eq, gte, sql } from "drizzle-orm";

import { db } from "@/db";
import { contasBancarias, lancamentos } from "@/db/schema";

/**
 * Saldo atual de cada conta = saldo inicial + recebimentos pagos − gastos pagos,
 * contando só os lançamentos a partir da data do saldo inicial.
 */
export async function saldosDasContas(
  negocioId: string,
): Promise<Map<string, number>> {
  const linhas = await db
    .select({
      id: contasBancarias.id,
      inicial: contasBancarias.saldoInicial,
      movimento: sql<string>`coalesce(sum(case when ${lancamentos.grupo} = 'recebimentos' then ${lancamentos.valor} else -${lancamentos.valor} end), 0)`,
    })
    .from(contasBancarias)
    .leftJoin(
      lancamentos,
      and(
        eq(lancamentos.contaId, contasBancarias.id),
        eq(lancamentos.pago, true),
        gte(lancamentos.data, contasBancarias.dataSaldoInicial),
      ),
    )
    .where(eq(contasBancarias.negocioId, negocioId))
    .groupBy(contasBancarias.id, contasBancarias.saldoInicial);
  return new Map(
    linhas.map((l) => [
      l.id,
      Math.round((l.inicial + Number(l.movimento)) * 100) / 100,
    ]),
  );
}
