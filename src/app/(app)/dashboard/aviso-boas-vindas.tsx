"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { notificar } from "@/components/notificacoes";

/** Depois do cadastro (?bemvindo=1): aviso de boas-vindas e limpa o endereço. */
export function AvisoBoasVindas() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const novo = params.get("bemvindo") === "1";
  useEffect(() => {
    if (!novo) return;
    notificar.sucesso(
      "Conta criada!",
      "Seus 7 dias grátis começaram. Comece pelos Dados de entrada.",
    );
    router.replace(pathname);
  }, [novo, router, pathname]);
  return null;
}
