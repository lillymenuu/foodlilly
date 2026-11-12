"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
  Circle,
  CircleCheck,
  Info,
  LoaderCircle,
  Save,
  Settings2,
  TriangleAlert,
} from "lucide-react";
import { cn } from "cn";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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

import { salvarDadosEntrada } from "./actions";
import { campos, grupos, type Campo, type ChaveCampo, type Grupo, type Valores } from "./campos";

type Textos = Record<ChaveCampo, string>;
type Erros = Partial<Record<ChaveCampo, string>>;

const FORM_ID = "form-dados-entrada";

function paraTexto(valor: number | null) {
  return valor == null ? "" : String(valor).replace(".", ",");
}

/** Aceita "1,02", "1.02" e "1.234,5". Vazio = null; inválido = NaN. */
function paraNumero(texto: string): number | null {
  const t = texto.trim();
  if (!t) return null;
  const normalizado = t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : t;
  return /^-?\d+(\.\d+)?$/.test(normalizado) ? Number(normalizado) : NaN;
}

const preenchido = (texto: string) => texto.trim() !== "";

export function FormDadosEntrada({ inicial, jaSalvo }: { inicial: Valores; jaSalvo: boolean }) {
  const textosIniciais = Object.fromEntries(
    campos.map((c) => [c.chave, paraTexto(inicial[c.chave])]),
  ) as Textos;

  const [textos, setTextos] = useState(textosIniciais);
  const [salvos, setSalvos] = useState(jaSalvo ? textosIniciais : null);
  const [erros, setErros] = useState<Erros>({});
  const [erroGeral, setErroGeral] = useState<string>();
  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, startTransition] = useTransition();

  const alterado = !salvos || campos.some((c) => textos[c.chave] !== salvos[c.chave]);
  const total = campos.length;
  const completos = campos.filter((c) => preenchido(textos[c.chave])).length;

  function alterar(chave: ChaveCampo, valor: string) {
    setTextos((t) => ({ ...t, [chave]: valor }));
    if (erros[chave]) {
      setErros((atuais) => {
        const resto = { ...atuais };
        delete resto[chave];
        return resto;
      });
    }
  }

  function salvar(evento: React.FormEvent) {
    evento.preventDefault();
    if (salvando) return;

    const valores = {} as Valores;
    const errosLocais: Erros = {};
    for (const c of campos) {
      const numero = paraNumero(textos[c.chave]);
      if (Number.isNaN(numero)) errosLocais[c.chave] = "Informe um número válido.";
      else valores[c.chave] = numero;
    }
    if (Object.keys(errosLocais).length) {
      setErros(errosLocais);
      setErroGeral("Confira os campos destacados.");
      return;
    }

    startTransition(async () => {
      const resultado = await salvarDadosEntrada(valores);
      if (resultado.ok) {
        setSalvos(textos);
        setErros({});
        setErroGeral(undefined);
        setModalAberto(true);
      } else {
        setErros(resultado.erros ?? {});
        setErroGeral(resultado.mensagem);
      }
    });
  }

  const botaoSalvar = (className?: string) => (
    <Button
      type="submit"
      form={FORM_ID}
      variant="highlight"
      size="lg"
      disabled={!alterado || salvando}
      className={className}
    >
      {salvando ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : <Save data-icon="inline-start" />}
      {salvando ? "Salvando..." : "Salvar"}
    </Button>
  );

  return (
    <form id={FORM_ID} onSubmit={salvar} noValidate className="contents">
      <section className="flex flex-col gap-5 rounded-2xl bg-primary p-5 text-primary-foreground sm:p-6">
        <div className="flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-highlight text-highlight-foreground">
            <Settings2 className="size-6" />
          </span>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Dados de entrada</h1>
            <p className="mt-0.5 max-w-xl text-sm text-primary-foreground/75">
              Parâmetros usados no cálculo de custos e preços. Ajuste quando quiser e salve.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-3 rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/15">
            <CircleCheck className="size-4 shrink-0 text-emerald-400" />
            <span className="shrink-0 text-sm font-medium tabular-nums">
              {completos} de {total} campos
            </span>
            <BarraProgresso valor={completos / total} className="bg-white/15" />
          </div>
          {botaoSalvar("hidden h-11 px-5 sm:inline-flex")}
        </div>
      </section>

      {(erroGeral || !jaSalvo || alterado) && (
        <Aviso tipo={erroGeral ? "erro" : "info"}>
          {erroGeral ??
            (!salvos
              ? "Estes são valores sugeridos. Revise e clique em Salvar para usá-los nos cálculos."
              : "Você tem alterações não salvas.")}
        </Aviso>
      )}

      <div className="grid items-start gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {grupos.map((grupo) => (
          <CardGrupo key={grupo.titulo} grupo={grupo} textos={textos} erros={erros} onAlterar={alterar} />
        ))}
      </div>

      {/* Celular: botão fixo no rodapé enquanto houver alterações. */}
      {alterado && (
        <>
          <div className="h-16 sm:hidden" aria-hidden />
          <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-card/95 p-3 backdrop-blur sm:hidden">
            {botaoSalvar("w-full h-11")}
          </div>
        </>
      )}

      <ModalSucesso aberto={modalAberto} onAbertoChange={setModalAberto} />
    </form>
  );
}

function CardGrupo({
  grupo,
  textos,
  erros,
  onAlterar,
}: {
  grupo: Grupo;
  textos: Textos;
  erros: Erros;
  onAlterar: (chave: ChaveCampo, valor: string) => void;
}) {
  const total = grupo.campos.length;
  const completos = grupo.campos.filter((c) => preenchido(textos[c.chave])).length;
  const completo = completos === total;

  return (
    <Collapsible defaultOpen className="rounded-2xl bg-card ring-1 ring-foreground/10">
      <CollapsibleTrigger className="group/grupo flex w-full flex-col gap-3 rounded-2xl p-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-5">
        <div className="flex w-full items-center gap-3">
          <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[panel-open]/grupo:rotate-0 -rotate-90" />
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <grupo.icone className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">{grupo.titulo}</span>
            <span className="block text-xs text-muted-foreground">
              {completos} de {total} campos · {Math.round((completos / total) * 100)}% completo
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
        <div className="flex flex-col gap-3 px-4 pb-4 sm:px-5 sm:pb-5">
          {grupo.campos.map((campo) => (
            <CampoNumero
              key={campo.chave}
              campo={campo}
              valor={textos[campo.chave]}
              erro={erros[campo.chave]}
              onAlterar={onAlterar}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function CampoNumero({
  campo,
  valor,
  erro,
  onAlterar,
}: {
  campo: Campo;
  valor: string;
  erro?: string;
  onAlterar: (chave: ChaveCampo, valor: string) => void;
}) {
  const id = `campo-${campo.chave}`;
  const ok = preenchido(valor) && !erro;

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
          <Popover>
            <PopoverTrigger
              className="shrink-0 rounded-full p-0.5 text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              aria-label={`Ajuda: ${campo.rotulo}`}
            >
              <Info className="size-3.5" />
            </PopoverTrigger>
            <PopoverContent className="w-64 text-sm">{campo.dica}</PopoverContent>
          </Popover>
        </div>

        <div className="relative mt-1.5">
          {campo.prefixo && (
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
              {campo.prefixo}
            </span>
          )}
          <Input
            id={id}
            name={campo.chave}
            inputMode={campo.inteiro ? "numeric" : "decimal"}
            autoComplete="off"
            value={valor}
            onChange={(e) => onAlterar(campo.chave, e.target.value)}
            aria-invalid={Boolean(erro)}
            aria-describedby={erro ? `${id}-erro` : undefined}
            className={cn(
              // scroll-mb: no celular, o campo em foco não fica atrás da barra "Salvar".
              "h-10 scroll-mb-24 bg-muted/60 tabular-nums",
              campo.prefixo && "pl-10",
              campo.sufixo && "pr-10",
            )}
          />
          {campo.sufixo && (
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
              {campo.sufixo}
            </span>
          )}
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

function BarraProgresso({ valor, className }: { valor: number; className?: string }) {
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(valor * 100)}
      className={cn("h-1.5 w-full overflow-hidden rounded-full", className)}
    >
      <div
        className="h-full rounded-full bg-emerald-500 transition-[width] duration-300"
        style={{ width: `${valor * 100}%` }}
      />
    </div>
  );
}

function Aviso({ tipo, children }: { tipo: "info" | "erro"; children: React.ReactNode }) {
  return (
    <p
      role={tipo === "erro" ? "alert" : "status"}
      className={cn(
        "flex items-center gap-2 rounded-xl px-4 py-3 text-sm",
        tipo === "erro"
          ? "bg-destructive/10 text-destructive"
          : "bg-highlight-soft text-highlight-foreground",
      )}
    >
      {tipo === "erro" ? <TriangleAlert className="size-4 shrink-0" /> : <Info className="size-4 shrink-0" />}
      {children}
    </p>
  );
}

function ModalSucesso({
  aberto,
  onAbertoChange,
}: {
  aberto: boolean;
  onAbertoChange: (aberto: boolean) => void;
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
          Você deseja permanecer nesta página ou voltar para Precificar?
        </DialogDescription>
        <div className="flex flex-col-reverse gap-2 border-t bg-muted/50 px-6 py-4 sm:flex-row">
          <DialogClose render={<Button variant="outline" size="lg" className="h-11 flex-1" />}>
            Permanecer na página
          </DialogClose>
          <Button
            variant="highlight"
            size="lg"
            className="h-11 flex-1"
            render={<Link href="/precificar" />}
          >
            Voltar para Precificar
            <ArrowRight data-icon="inline-end" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
