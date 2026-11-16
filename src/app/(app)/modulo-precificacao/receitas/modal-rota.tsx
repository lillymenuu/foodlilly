"use client";

import { createContext, use, useCallback, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { X } from "lucide-react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

import { BASE } from "./tipos";

type EmModal = {
  /** Fecha voltando à lista; `forcar` pula o aviso de alterações não salvas (ex.: depois de salvar). */
  fechar: (forcar?: boolean) => void;
  /** O editor informa se há alterações não salvas. */
  marcarSujo: (sujo: boolean) => void;
};
const ContextoModal = createContext<EmModal | null>(null);

/** Dentro do modal da lista (rota interceptada): o editor fecha o modal em vez de mudar de página. */
export function useEmModal() {
  return use(ContextoModal);
}

/** Endereços que abrem como modal sobre a lista. */
const ROTA_MODAL = new RegExp(`^${BASE}/(ficha/[^/]+|[^/]+/nova)$`);

/**
 * Modal de rota: mostra a ficha técnica por cima da lista. Fechar = voltar no histórico.
 * Fica aberto só enquanto o endereço é o da ficha (ao navegar para outra tela, some).
 */
export function ModalRota({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const aberto = ROTA_MODAL.test(pathname);
  const sujo = useRef(false);

  const fechar = useCallback(
    (forcar?: boolean) => {
      if (
        !forcar &&
        sujo.current &&
        !window.confirm("Há alterações não salvas. Deseja descartá-las?")
      )
        return;
      sujo.current = false;
      router.back();
    },
    [router],
  );
  const marcarSujo = useCallback((s: boolean) => {
    sujo.current = s;
  }, []);

  return (
    <Dialog open={aberto} onOpenChange={(a) => !a && fechar()}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden bg-background p-0 sm:max-w-6xl max-sm:inset-0 max-sm:h-dvh max-sm:max-h-dvh max-sm:w-full max-sm:max-w-full max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none"
      >
        <DialogTitle className="sr-only">{titulo}</DialogTitle>
        <button
          type="button"
          onClick={() => fechar()}
          aria-label="Fechar"
          className="absolute top-3 right-3 z-20 flex size-9 items-center justify-center rounded-full bg-card text-muted-foreground shadow-md ring-1 ring-foreground/10 transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <X className="size-4" />
        </button>
        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overscroll-contain p-4 pt-14 sm:p-6 sm:pt-14">
          {/* Só renderiza o editor aberto: a cópia que o Next guarda escondida fica vazia (sem ids repetidos). */}
          {aberto && (
            <ContextoModal value={{ fechar, marcarSujo }}>
              {children}
            </ContextoModal>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
