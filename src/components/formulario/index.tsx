"use client";

import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
  Circle,
  CircleCheck,
  Info,
  LoaderCircle,
  Save,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Campo } from "@/lib/campos";

/*
 * Peças dos formulários de parâmetros (Dados de entrada, Custeio...).
 * Padrão visual: banner marinho com progresso + Salvar, grupos em cards,
 * campos com ícone, dica, unidade e ✓; barra fixa de salvar no celular.
 */

export function BannerFormulario({
  titulo,
  descricao,
  icone: Icone,
  completos,
  total,
  formId,
  alterado,
  salvando,
}: {
  titulo: string;
  descricao: string;
  icone: LucideIcon;
  completos: number;
  total: number;
  formId: string;
  alterado: boolean;
  salvando: boolean;
}) {
  return (
    <section className="flex flex-col gap-5 rounded-2xl bg-primary p-5 text-primary-foreground sm:p-6">
      <div className="flex items-start gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-highlight text-highlight-foreground">
          <Icone className="size-6" />
        </span>
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{titulo}</h1>
          <p className="mt-0.5 max-w-xl text-sm text-primary-foreground/75">{descricao}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-3 rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/15">
          <CircleCheck className="size-4 shrink-0 text-emerald-400" />
          <span className="shrink-0 text-sm font-medium tabular-nums">
            {completos} de {total} campos
          </span>
          <BarraProgresso valor={total ? completos / total : 0} className="bg-white/15" />
        </div>
        <BotaoSalvar
          formId={formId}
          alterado={alterado}
          salvando={salvando}
          className="hidden h-11 px-5 sm:inline-flex"
        />
      </div>
    </section>
  );
}

export function BotaoSalvar({
  formId,
  alterado,
  salvando,
  className,
}: {
  formId: string;
  alterado: boolean;
  salvando: boolean;
  className?: string;
}) {
  return (
    <Button
      type="submit"
      form={formId}
      variant="highlight"
      size="lg"
      disabled={!alterado || salvando}
      className={className}
    >
      {salvando ? (
        <LoaderCircle className="animate-spin" data-icon="inline-start" />
      ) : (
        <Save data-icon="inline-start" />
      )}
      {salvando ? "Salvando..." : "Salvar"}
    </Button>
  );
}

/** Celular: botão Salvar fixo no rodapé enquanto houver alterações. */
export function BarraSalvarCelular(props: { formId: string; alterado: boolean; salvando: boolean }) {
  if (!props.alterado) return null;
  return (
    <>
      <div className="h-16 sm:hidden" aria-hidden />
      <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-card/95 p-3 backdrop-blur sm:hidden">
        <BotaoSalvar {...props} className="h-11 w-full" />
      </div>
    </>
  );
}

export function BarraProgresso({ valor, className }: { valor: number; className?: string }) {
  const pct = Math.max(0, Math.min(1, valor)) * 100;
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      className={cn("h-1.5 w-full overflow-hidden rounded-full", className)}
    >
      <div
        className="h-full rounded-full bg-emerald-500 transition-[width] duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function Aviso({
  tipo,
  children,
}: {
  tipo: "info" | "erro";
  children: React.ReactNode;
}) {
  return (
    <p
      role={tipo === "erro" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2 rounded-xl px-4 py-3 text-sm",
        tipo === "erro"
          ? "bg-destructive/10 text-destructive"
          : "bg-highlight-soft text-highlight-foreground",
      )}
    >
      {tipo === "erro" ? (
        <TriangleAlert className="mt-0.5 size-4 shrink-0" />
      ) : (
        <Info className="mt-0.5 size-4 shrink-0" />
      )}
      <span>{children}</span>
    </p>
  );
}

/** Card de um grupo de campos, recolhível, com progresso. */
export function CardGrupo({
  titulo,
  icone: Icone,
  completos,
  total,
  detalhe,
  className,
  children,
}: {
  titulo: string;
  icone: LucideIcon;
  completos: number;
  total: number;
  /** Texto após "x de y campos" (ex.: subtotal em R$). */
  detalhe?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const completo = completos === total;
  return (
    <Collapsible defaultOpen className={cn("rounded-2xl bg-card ring-1 ring-foreground/10", className)}>
      <CollapsibleTrigger className="group/grupo flex w-full flex-col gap-3 rounded-2xl p-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-5">
        <div className="flex w-full items-center gap-3">
          <ChevronDown className="size-4 shrink-0 -rotate-90 text-muted-foreground transition-transform group-data-[panel-open]/grupo:rotate-0" />
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <Icone className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">{titulo}</span>
            <span className="block text-xs text-muted-foreground">
              {completos} de {total} campos · {detalhe ?? `${Math.round((completos / total) * 100)}% completo`}
            </span>
          </span>
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
              completo ? "bg-success/10 text-success" : "bg-highlight-soft text-highlight-foreground",
            )}
          >
            {completo ? <CircleCheck className="size-3.5" /> : <Circle className="size-3.5" />}
            {completo ? "Completo" : "Pendente"}
          </span>
        </div>
        <BarraProgresso valor={completos / total} className="bg-muted" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-4 pb-4 sm:px-5 sm:pb-5">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

/** Dica (ⓘ) que abre com clique ou toque. */
export function Dica({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <Popover>
      <PopoverTrigger
        className="shrink-0 rounded-full p-0.5 text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        aria-label={`Ajuda: ${rotulo}`}
      >
        <Info className="size-3.5" />
      </PopoverTrigger>
      <PopoverContent className="w-64 text-sm">{children}</PopoverContent>
    </Popover>
  );
}

/** Campo de texto com prefixo/sufixo de unidade (R$, %, kg). */
export function InputUnidade({
  prefixo,
  sufixo,
  className,
  ...props
}: React.ComponentProps<typeof Input> & { prefixo?: string; sufixo?: string }) {
  return (
    <div className="relative">
      {prefixo && (
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
          {prefixo}
        </span>
      )}
      <Input
        autoComplete="off"
        // scroll-mb: no celular, o campo em foco não fica atrás da barra "Salvar".
        className={cn(
          "h-10 scroll-mb-24 bg-muted/60 tabular-nums",
          prefixo && "pl-10",
          sufixo && "pr-10",
          className,
        )}
        {...props}
      />
      {sufixo && (
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
          {sufixo}
        </span>
      )}
    </div>
  );
}

export function CampoNumero<K extends string>({
  campo,
  valor,
  erro,
  onAlterar,
  onFormatar,
}: {
  campo: Campo<K>;
  valor: string;
  erro?: string;
  onAlterar: (chave: K, valor: string) => void;
  onFormatar?: (chave: K) => void;
}) {
  const id = `campo-${campo.chave}`;
  const ok = valor.trim() !== "" && !erro;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border p-3 transition-colors",
        erro ? "border-destructive/60 bg-destructive/5" : ok ? "border-success/35" : "border-border",
      )}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-highlight-soft text-highlight-foreground">
        <campo.icone className="size-5" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <Label htmlFor={id} className="text-sm leading-snug font-medium">
            {campo.rotulo}
          </Label>
          <Dica rotulo={campo.rotulo}>{campo.dica}</Dica>
        </div>
        <div className="mt-1.5">
          <InputUnidade
            id={id}
            name={campo.chave}
            prefixo={campo.prefixo}
            sufixo={campo.sufixo}
            inputMode={campo.inteiro || campo.mascara === "moeda" ? "numeric" : "decimal"}
            placeholder={campo.mascara === "moeda" ? "0,00" : undefined}
            value={valor}
            onChange={(e) => onAlterar(campo.chave, e.target.value)}
            onBlur={() => onFormatar?.(campo.chave)}
            aria-invalid={Boolean(erro)}
            aria-describedby={erro ? `${id}-erro` : undefined}
          />
        </div>
        {erro && (
          <p id={`${id}-erro`} className="mt-1 text-xs text-destructive">
            {erro}
          </p>
        )}
      </div>

      {ok ? (
        <CircleCheck className="size-5 shrink-0 text-success" aria-label="Preenchido" />
      ) : (
        <Circle className="size-5 shrink-0 text-muted-foreground/40" aria-label="Não preenchido" />
      )}
    </div>
  );
}

export function ModalSalvo({
  aberto,
  onAbertoChange,
  voltarHref,
  voltarRotulo,
}: {
  aberto: boolean;
  onAbertoChange: (aberto: boolean) => void;
  voltarHref: string;
  voltarRotulo: string;
}) {
  return (
    <Dialog open={aberto} onOpenChange={onAbertoChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
        <div className="flex items-center gap-4 bg-gradient-to-r from-highlight-strong to-highlight p-6 pr-12 text-highlight-foreground">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/30">
            <CircleCheck className="size-6" />
          </span>
          <div>
            <DialogTitle className="text-lg font-semibold">Dados salvos com sucesso!</DialogTitle>
            <p className="text-sm text-highlight-foreground/80">Suas configurações foram atualizadas.</p>
          </div>
        </div>
        <DialogDescription className="px-6 py-5 text-sm text-foreground">
          Você deseja permanecer nesta página ou voltar para {voltarRotulo}?
        </DialogDescription>
        <div className="flex flex-col-reverse gap-2 border-t bg-muted/50 px-6 py-4 sm:flex-row">
          <DialogClose render={<Button variant="outline" size="lg" className="h-11 flex-1" />}>
            Permanecer na página
          </DialogClose>
          <Button variant="highlight" size="lg" className="h-11 flex-1" render={<Link href={voltarHref} />}>
            Voltar para {voltarRotulo}
            <ArrowRight data-icon="inline-end" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
