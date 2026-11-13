"use client";

import { useEffect, useRef, useState } from "react";

/** Valor que sobe suavemente até o alvo (parado para quem prefere menos movimento). */
export function useContagem(alvo: number, duracao = 900) {
  const [valor, setValor] = useState(0);
  const anterior = useRef(0);
  useEffect(() => {
    const inicio = anterior.current;
    const reduzir = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let t0: number | null = null;
    let id = 0;
    const passo = (t: number) => {
      t0 ??= t;
      const p = reduzir ? 1 : Math.min(1, (t - t0) / duracao);
      const suave = 1 - (1 - p) ** 3;
      setValor(inicio + (alvo - inicio) * suave);
      if (p < 1) id = requestAnimationFrame(passo);
      else anterior.current = alvo;
    };
    id = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(id);
  }, [alvo, duracao]);
  return valor;
}

/** Número animado; leitores de tela recebem só o valor final. */
export function NumeroAnimado({
  valor,
  formato,
}: {
  valor: number;
  formato: (v: number) => string;
}) {
  const v = useContagem(valor);
  return (
    <span className="tabular-nums" aria-label={formato(valor)}>
      <span aria-hidden>{formato(v)}</span>
    </span>
  );
}
