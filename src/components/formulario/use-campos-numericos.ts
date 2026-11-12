"use client";

import { useState } from "react";

import type { Campo, ValoresDe } from "@/lib/campos";
import { paraNumero, paraTexto } from "@/lib/numero-br";

/** Estado dos campos numéricos de um formulário: texto digitado, erros e valores. */
export function useCamposNumericos<K extends string>(campos: Campo<K>[], inicial: ValoresDe<K>) {
  const [textos, setTextos] = useState(
    () =>
      Object.fromEntries(
        campos.map((c) => [c.chave, paraTexto(inicial[c.chave], c.casas)]),
      ) as Record<K, string>,
  );
  const [erros, setErros] = useState<Record<string, string>>({});

  function alterar(chave: K, valor: string) {
    setTextos((t) => ({ ...t, [chave]: valor }));
    limparErro(chave);
  }

  function limparErro(chave: string) {
    setErros((atuais) => {
      if (!(chave in atuais)) return atuais;
      const resto = { ...atuais };
      delete resto[chave];
      return resto;
    });
  }

  /** Ao sair do campo, padroniza a escrita ("700" -> "700,00"). */
  function formatar(chave: K) {
    const campo = campos.find((c) => c.chave === chave);
    const numero = paraNumero(textos[chave]);
    if (campo && numero != null && !Number.isNaN(numero)) {
      setTextos((t) => ({ ...t, [chave]: paraTexto(numero, campo.casas) }));
    }
  }

  /** Valores atuais (inválido = null), para cálculos ao vivo. */
  const numeros = Object.fromEntries(
    campos.map((c) => {
      const n = paraNumero(textos[c.chave]);
      return [c.chave, n == null || Number.isNaN(n) ? null : n];
    }),
  ) as ValoresDe<K>;

  /** Valida o formato. Devolve os valores ou marca os erros e devolve null. */
  function coletar(): ValoresDe<K> | null {
    const errosLocais: Record<string, string> = {};
    const valores = {} as ValoresDe<K>;
    for (const c of campos) {
      const n = paraNumero(textos[c.chave]);
      if (Number.isNaN(n)) errosLocais[c.chave] = "Informe um número válido.";
      else valores[c.chave] = n;
    }
    if (Object.keys(errosLocais).length) {
      setErros((e) => ({ ...e, ...errosLocais }));
      return null;
    }
    return valores;
  }

  const preenchido = (chave: K) => textos[chave].trim() !== "";

  return { textos, erros, setErros, alterar, formatar, numeros, coletar, preenchido, limparErro };
}

/** Compara dois conjuntos de valores numéricos. */
export function valoresIguais(a: Record<string, number | null>, b: Record<string, number | null>) {
  const chaves = new Set([...Object.keys(a), ...Object.keys(b)]);
  return [...chaves].every((k) => (a[k] ?? null) === (b[k] ?? null));
}
