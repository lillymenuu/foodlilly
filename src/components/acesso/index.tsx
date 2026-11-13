"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChefHat,
  Eye,
  EyeOff,
  LoaderCircle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";

/** Logo do foodlilly (chapéu de chef no quadrado laranja + nome). */
export function Logo({
  claro,
  className,
}: {
  claro?: boolean;
  className?: string;
}) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center gap-2 rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        className,
      )}
    >
      <span className="flex size-9 items-center justify-center rounded-xl bg-highlight text-highlight-foreground shadow-sm">
        <ChefHat className="size-5" />
      </span>
      <span
        className={cn(
          "text-lg font-bold tracking-tight",
          claro ? "text-white" : "text-primary",
        )}
      >
        foodlilly
      </span>
    </Link>
  );
}

/** Desenho do painel marinho: curvas de nível, círculos, cruzes e pontos. */
export function Decoracao() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 size-full"
      preserveAspectRatio="xMidYMid slice"
      viewBox="0 0 400 600"
      fill="none"
    >
      <defs>
        <radialGradient id="dec-brilho" cx="0.2" cy="0.1" r="0.9">
          <stop offset="0" stopColor="var(--highlight)" stopOpacity="0.28" />
          <stop offset="0.6" stopColor="var(--highlight)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="600" fill="url(#dec-brilho)" />
      <circle cx="330" cy="120" r="150" fill="white" fillOpacity="0.04" />
      <circle cx="40" cy="520" r="190" fill="white" fillOpacity="0.035" />
      {/* curvas de nível */}
      <g stroke="white" strokeOpacity="0.22" strokeWidth="1.2">
        {[0, 14, 28, 42, 56].map((d) => (
          <path
            key={d}
            d={`M${-20 + d} ${-10 + d * 0.4} C ${40 + d} ${60 + d}, ${-10 + d} ${130 + d}, ${70 + d * 0.6} ${190 + d * 0.5}`}
          />
        ))}
        {[0, 13, 26, 39, 52].map((d) => (
          <path
            key={`b${d}`}
            d={`M${420 - d} ${430 + d * 0.3} C ${330 - d} ${470 + d}, ${380 - d} ${540 + d * 0.5}, ${300 - d * 0.5} ${620}`}
          />
        ))}
      </g>
      {/* cruzes e círculos */}
      <g
        stroke="white"
        strokeOpacity="0.3"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <path
          d="M120 70v18M111 79h18"
          className="animate-[girar_14s_linear_infinite] origin-[120px_79px] motion-reduce:animate-none"
        />
        <path d="M250 470v16M242 478h16" />
        <circle cx="300" cy="230" r="7" />
        </g>
      {/* grade de pontos */}
      <g fill="white" fillOpacity="0.5">
        {Array.from({ length: 4 }, (_, c) =>
          Array.from({ length: 6 }, (_, l) => (
            <circle
              key={`${c}-${l}`}
              cx={330 + c * 12}
              cy={36 + l * 12}
              r="1.8"
            />
          )),
        )}
      </g>
    </svg>
  );
}

/** Página de acesso: fundo suave + cartão com painel marinho (esquerda) e formulário (direita). */
export function MolduraAcesso({
  painel,
  children,
}: {
  painel: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <main className="relative flex min-h-dvh flex-1 items-center justify-center overflow-hidden bg-primary-soft px-4 py-8 sm:py-12">
      {/* manchas de fundo */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-40 size-[32rem] rounded-full bg-primary/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 -bottom-40 size-[32rem] rounded-full bg-highlight/20 blur-3xl"
      />
      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl bg-card shadow-2xl shadow-primary/20 ring-1 ring-foreground/5 animate-in fade-in zoom-in-95 duration-500 motion-reduce:animate-none md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary-strong px-6 py-8 text-primary-foreground sm:px-10 md:flex md:flex-col md:py-12">
          <Decoracao />
          <div className="relative flex flex-1 flex-col gap-6">{painel}</div>
        </section>
        <section className="px-5 py-8 sm:px-10 sm:py-12">{children}</section>
      </div>
    </main>
  );
}

/** Campo com rótulo, ícone à esquerda e mensagem de erro. */
export function CampoAcesso({
  id,
  rotulo,
  icone: Icone,
  erro,
  dica,
  prefixo,
  sufixo,
  className,
  ...input
}: React.InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  rotulo: string;
  icone?: LucideIcon;
  erro?: string;
  dica?: string;
  prefixo?: React.ReactNode;
  sufixo?: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium">
        {rotulo}
      </label>
      <div
        className={cn(
          "flex h-11 items-center gap-2 rounded-xl border bg-background/60 px-3 transition-[border-color,box-shadow] focus-within:border-primary focus-within:bg-card focus-within:ring-3 focus-within:ring-primary/15",
          erro ? "border-destructive/70" : "border-input",
        )}
      >
        {Icone && (
          <Icone
            className="size-4 shrink-0 text-muted-foreground"
            aria-hidden
          />
        )}
        {prefixo}
        <input
          id={id}
          aria-invalid={Boolean(erro)}
          aria-describedby={
            erro ? `${id}-erro` : dica ? `${id}-dica` : undefined
          }
          className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
          {...input}
        />
        {sufixo}
      </div>
      {erro ? (
        <p id={`${id}-erro`} className="text-xs text-destructive">
          {erro}
        </p>
      ) : (
        dica && (
          <p id={`${id}-dica`} className="text-xs text-muted-foreground">
            {dica}
          </p>
        )
      )}
    </div>
  );
}

/** Campo de senha com botão de mostrar/esconder. */
export function CampoSenha(
  props: Omit<React.ComponentProps<typeof CampoAcesso>, "type" | "sufixo">,
) {
  const [ver, setVer] = useState(false);
  return (
    <CampoAcesso
      {...props}
      type={ver ? "text" : "password"}
      sufixo={
        <button
          type="button"
          onClick={() => setVer((v) => !v)}
          className="-mr-1 rounded-md p-1 text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          aria-label={ver ? "Esconder senha" : "Mostrar senha"}
          aria-pressed={ver}
        >
          {ver ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      }
    />
  );
}

/** Botão principal dos formulários de acesso. */
export function BotaoAcesso({
  carregando,
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { carregando?: boolean }) {
  return (
    <button
      {...props}
      disabled={carregando || props.disabled}
      className={cn(
        "group relative flex h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-primary to-primary-strong text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-[transform,box-shadow] hover:-translate-y-px hover:shadow-xl hover:shadow-primary/30 focus-visible:ring-3 focus-visible:ring-primary/30 focus-visible:outline-none active:translate-y-0 disabled:pointer-events-none disabled:opacity-70 motion-reduce:hover:translate-y-0",
        className,
      )}
    >
      {/* reflexo que passa no hover */}
      <span
        aria-hidden
        className="absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-white/15 transition-transform duration-700 group-hover:translate-x-[400%] motion-reduce:hidden"
      />
      {carregando && <LoaderCircle className="size-4 animate-spin" />}
      {children}
    </button>
  );
}

/** Logo oficial do Google (padrão exigido pelo Google para o botão de login). */
function LogoGoogle() {
  return (
    <svg viewBox="0 0 48 48" className="size-5" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}

export function BotaoGoogle({
  carregando,
  onClick,
  children,
}: {
  carregando?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={carregando}
      className="flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-input bg-card text-sm font-medium shadow-sm transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-primary/20 focus-visible:outline-none disabled:opacity-70"
    >
      {carregando ? (
        <LoaderCircle className="size-5 animate-spin" />
      ) : (
        <LogoGoogle />
      )}
      {children}
    </button>
  );
}

export function Divisor({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span className="h-px flex-1 bg-border" />
      {children}
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

/** Mensagens do servidor de login em português. */
export function mensagemErroAcesso(
  e: { code?: string; message?: string; status?: number } | null | undefined,
) {
  switch (e?.code) {
    case "INVALID_EMAIL_OR_PASSWORD":
      return "E-mail ou senha incorretos.";
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return "Já existe uma conta com este e-mail. Tente entrar.";
    case "PASSWORD_TOO_SHORT":
      return "Senha muito curta.";
    case "INVALID_EMAIL":
      return "E-mail inválido.";
  }
  if (e?.status === 429)
    return "Muitas tentativas. Aguarde um minuto e tente de novo.";
  return e?.message && /[ãçéíóú]/i.test(e.message)
    ? e.message
    : "Não foi possível concluir agora. Tente de novo.";
}
