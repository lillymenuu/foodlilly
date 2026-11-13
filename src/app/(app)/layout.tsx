import { Suspense } from "react";

import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { AppSidebar } from "@/components/app-sidebar";
import { SeloAcesso, SidebarSessao } from "@/components/sessao-app";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

// Área logada do cliente. A sessão é lida dentro dos <Suspense> (exigência do Cache Components);
// sem sessão, vai para /entrar (o proxy já redireciona antes, pelo cookie).
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <SidebarProvider>
      {/* Rotas dinâmicas (ex.: /ficha/[id]) só conhecem o endereço na hora do acesso:
          enquanto isso, o menu aparece sem item marcado. */}
      <Suspense fallback={<AppSidebar />}>
        <SidebarSessao />
      </Suspense>
      <SidebarInset className="min-w-0">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b bg-card/90 px-4 backdrop-blur md:px-6">
          <SidebarTrigger className="-ml-1" />
          <span className="h-5 w-px bg-border" aria-hidden />
          <Suspense fallback={<span className="flex-1" />}>
            <AppBreadcrumb />
          </Suspense>
          <span className="ml-auto hidden shrink-0 sm:inline-flex">
            <Suspense>
              <SeloAcesso />
            </Suspense>
          </span>
        </header>
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-4 md:p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
