import { z } from "zod";

import type { Campo } from "@/lib/campos";

const formatar = (n: number) => String(n).replace(".", ",");

/** Esquema zod para os campos numéricos (todos opcionais/nulos). */
export function esquemaNumeros<K extends string>(campos: Campo<K>[]) {
  return z.object(
    Object.fromEntries(
      campos.map((c) => {
        let numero = z
          .number({ error: "Informe um número." })
          .min(c.min, `Mínimo: ${formatar(c.min)}`)
          .max(c.max, `Máximo: ${formatar(c.max)}`);
        if (c.inteiro) numero = numero.int("Use um número inteiro.");
        return [c.chave, numero.nullable()];
      }),
    ) as Record<K, z.ZodNullable<z.ZodNumber>>,
  );
}

/** Erros do zod -> { caminho: mensagem }, com o caminho unido por ponto ("extras.0.valor"). */
export function errosPorCampo(erro: z.ZodError) {
  const erros: Record<string, string> = {};
  for (const issue of erro.issues) {
    const chave = issue.path.join(".");
    erros[chave] ??= issue.message;
  }
  return erros;
}

export type ResultadoSalvar =
  | { ok: true }
  | { ok: false; mensagem: string; erros?: Record<string, string> };
