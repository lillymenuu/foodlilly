"use client";

import { CircleCheck, CircleX, Info, LoaderCircle, TriangleAlert } from "lucide-react";
import { toast, Toaster } from "sonner";

/**
 * Notificações flutuantes no topo, centralizadas, que somem sozinhas.
 * Colocado uma vez no layout raiz; para disparar, use `notificar`.
 */
export function Notificacoes() {
  return (
    <Toaster
      position="top-center"
      duration={4000}
      visibleToasts={3}
      offset={16}
      mobileOffset={12}
      containerAriaLabel="Notificações"
      // Largura do container = largura do card (o padrão do Sonner é 356px).
      style={{ "--width": "24rem" } as React.CSSProperties}
      icons={{
        success: <CircleCheck className="size-5 text-success" />,
        error: <CircleX className="size-5 text-destructive" />,
        info: <Info className="size-5 text-primary" />,
        warning: <TriangleAlert className="size-5 text-amber-700" />,
        loading: <LoaderCircle className="size-5 animate-spin text-primary" />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex w-full items-center gap-3 rounded-xl border-l-4 bg-card px-4 py-3.5 text-sm text-foreground shadow-lg ring-1 ring-foreground/10",
          success: "border-l-success",
          error: "border-l-destructive",
          info: "border-l-primary",
          warning: "border-l-amber-600",
          title: "font-medium leading-snug",
          description: "mt-0.5 text-xs text-muted-foreground",
          icon: "shrink-0",
        },
      }}
    />
  );
}

export const notificar = {
  sucesso: (mensagem: string, descricao?: string) => toast.success(mensagem, { description: descricao }),
  erro: (mensagem: string, descricao?: string) => toast.error(mensagem, { description: descricao }),
  info: (mensagem: string, descricao?: string) => toast.info(mensagem, { description: descricao }),
};
