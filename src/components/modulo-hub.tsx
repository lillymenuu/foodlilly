import Link from "next/link";
import { ChevronRight, Lock } from "lucide-react";

import { buscarModulo, type Pagina } from "@/config/navegacao";

/** Página central de um módulo: cabeçalho + cards para cada subpágina. */
export function ModuloHub({ href }: { href: string }) {
  const modulo = buscarModulo(href);
  const paginas = modulo.paginas ?? [];

  const grupos = new Map<string, Pagina[]>();
  for (const pagina of paginas) {
    const nome = pagina.grupo ?? "";
    grupos.set(nome, [...(grupos.get(nome) ?? []), pagina]);
  }

  return (
    <>
      <section className="flex items-center gap-4 rounded-2xl bg-primary p-5 text-primary-foreground sm:p-6">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-highlight text-highlight-foreground">
          <modulo.icone className="size-6" />
        </span>
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight sm:text-2xl">
            {modulo.titulo}
            {modulo.selo && (
              <span className="rounded bg-highlight px-1.5 py-px text-[10px] font-semibold uppercase text-highlight-foreground">
                {modulo.selo}
              </span>
            )}
          </h1>
          <p className="mt-0.5 text-sm text-primary-foreground/75">{modulo.descricao}</p>
        </div>
      </section>

      {[...grupos].map(([grupo, itens]) => (
        <section key={grupo || "itens"} className="flex flex-col gap-3">
          {grupo && (
            <h2 className="text-sm font-semibold text-muted-foreground">{grupo}</h2>
          )}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {itens.map((pagina) => (
              <CardPagina key={pagina.href} pagina={pagina} />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

function CardPagina({ pagina }: { pagina: Pagina }) {
  const conteudo = (
    <>
      <span
        className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${
          pagina.bloqueado
            ? "bg-muted text-muted-foreground"
            : "bg-primary-soft text-primary group-hover:bg-highlight group-hover:text-highlight-foreground"
        } transition-colors`}
      >
        {pagina.bloqueado ? <Lock className="size-5" /> : <pagina.icone className="size-5" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 font-medium">
          {pagina.titulo}
          {pagina.bloqueado && (
            <span className="rounded bg-muted px-1.5 py-px text-[10px] font-medium uppercase text-muted-foreground">
              Em breve
            </span>
          )}
        </span>
        <span className="mt-0.5 block text-sm text-muted-foreground">{pagina.descricao}</span>
      </span>
      {!pagina.bloqueado && (
        <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      )}
    </>
  );

  const base = "group flex items-center gap-4 rounded-xl bg-card p-4 ring-1 ring-foreground/10";

  if (pagina.bloqueado) {
    return (
      <div aria-disabled="true" className={`${base} opacity-70`}>
        {conteudo}
      </div>
    );
  }

  return (
    <Link
      href={pagina.href}
      className={`${base} transition-shadow hover:ring-2 hover:ring-highlight focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none`}
    >
      {conteudo}
    </Link>
  );
}
