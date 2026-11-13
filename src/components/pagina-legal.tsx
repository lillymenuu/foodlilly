import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Logo } from "@/components/acesso";

/** Moldura das páginas de Termos de Uso e Política de Privacidade. */
export function PaginaLegal({
  titulo,
  atualizadoEm,
  children,
}: {
  titulo: string;
  atualizadoEm: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col bg-background">
      <header className="bg-gradient-to-br from-primary to-primary-strong px-4 pt-6 pb-14 text-primary-foreground sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <Logo claro />
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-white/80 hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="size-4" />
            Página inicial
          </Link>
        </div>
        <div className="mx-auto mt-10 max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {titulo}
          </h1>
          <p className="mt-2 text-sm text-primary-foreground/70">
            Última atualização: {atualizadoEm}
          </p>
        </div>
      </header>
      <main className="mx-auto -mt-8 w-full max-w-3xl px-4 pb-16 sm:px-6">
        <article className="flex flex-col gap-6 rounded-3xl bg-card p-6 text-[15px] leading-relaxed shadow-lg ring-1 ring-foreground/10 sm:p-10 [&_h2]:mt-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-primary [&_li]:ml-5 [&_li]:list-disc [&_p]:text-foreground/85 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5">
          {children}
        </article>
      </main>
    </div>
  );
}
