"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

/** Telas que continuam abertas com o acesso vencido (para pagar ou ajustar os dados). */
const LIBERADAS = ["/assinatura", "/perfil"];

/** Com o teste ou o plano vencido, leva para a Assinatura. As ações no servidor também são bloqueadas. */
export function BloqueioVencido() {
  const pathname = usePathname();
  const router = useRouter();
  const liberada = LIBERADAS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  useEffect(() => {
    if (!liberada) router.replace("/assinatura?vencido=1");
  }, [liberada, router]);
  return null;
}
