import { Suspense } from "react";

import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { AppSidebar, AppSidebarAtual } from "@/components/app-sidebar";
import { Badge } from "@/components/ui/badge";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

// Área logada do cliente. Por enquanto sem autenticação: os dados do usuário
// no menu são fixos e serão trocados pelos dados da sessão.
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <SidebarProvider>
      {/* Rotas dinâmicas (ex.: /ficha/[id]) só conhecem o endereço na hora do acesso:
          enquanto isso, o menu aparece sem item marcado. */}
      <Suspense fallback={<AppSidebar />}>
        <AppSidebarAtual />
      </Suspense>
      <SidebarInset className="min-w-0">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b bg-card/90 px-4 backdrop-blur md:px-6">
          <SidebarTrigger className="-ml-1" />
          <span className="h-5 w-px bg-border" aria-hidden />
          <Suspense fallback={<span className="flex-1" />}>
            <AppBreadcrumb />
          </Suspense>
          <Badge variant="secondary" className="ml-auto hidden shrink-0 sm:inline-flex">
            Plano mensal · ativo
          </Badge>
        </header>
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-4 md:p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
