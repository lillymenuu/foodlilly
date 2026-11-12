"use server";

import { refresh } from "next/cache";

import { db } from "@/db";
import { dadosEntrada } from "@/db/schema";
import { garantirNegocioQuery, obterNegocioAtualId } from "@/lib/negocio-atual";
import { errosPorCampo, esquemaNumeros, type ResultadoSalvar } from "@/lib/validacao";

import { campos, type Valores } from "./campos";

const esquema = esquemaNumeros(campos);

export async function salvarDadosEntrada(valores: Valores): Promise<ResultadoSalvar> {
  const negocioId = await obterNegocioAtualId();

  const validado = esquema.safeParse(valores);
  if (!validado.success) {
    return { ok: false, mensagem: "Confira os campos destacados.", erros: errosPorCampo(validado.error) };
  }

  const dados = { ...validado.data, atualizadoEm: new Date() };

  try {
    // Lote único (transação): cria o negócio se preciso e grava os dados.
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
