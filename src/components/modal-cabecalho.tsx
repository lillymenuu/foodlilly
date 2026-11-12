"use client";

import { X, type LucideIcon } from "lucide-react";
import { cn } from "cn";

import { DialogClose, DialogDescription, DialogTitle } from "@/components/ui/dialog";

const cores = {
  /** Criar: laranja com texto marinho. */
  novo: "bg-gradient-to-r from-highlight-strong to-highlight text-highlight-foreground",
  /** Editar: marinho com texto branco. */
  editar: "bg-gradient-to-r from-primary-strong to-primary text-primary-foreground",
  /** Excluir: vermelho com texto branco. */
  excluir: "bg-gradient-to-r from-[#a82c24] to-destructive text-white",
};

/** Cabeçalho colorido dos modais de cadastro (usar com DialogContent showCloseButton={false}). */
export function ModalCabecalho({
  tipo,
  icone: Icone,
  titulo,
  descricao,
}: {
  tipo: keyof typeof cores;
  icone: LucideIcon;
  titulo: string;
  descricao: string;
}) {
  return (
    <div className={cn("relative flex items-center gap-4 p-5 pr-12 sm:p-6 sm:pr-14", cores[tipo])}>
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/25">
        <Icone className="size-5" />
      </span>
      <div className="min-w-0">
        <DialogTitle className="text-lg font-semibold">{titulo}</DialogTitle>
        <DialogDescription className="text-sm text-current opacity-85">{descricao}</DialogDescription>
      </div>
      <DialogClose
        className="absolute top-3 right-3 rounded-md p-1.5 opacity-80 transition hover:bg-white/20 hover:opacity-100 focus-visible:ring-2 focus-visible:ring-current focus-visible:outline-none"
        aria-label="Fechar"
      >
        <X className="size-4" />
      </DialogClose>
    </div>
  );
}
