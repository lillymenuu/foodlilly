import { AppSidebar } from "@/components/app-sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

// Área logada do cliente. Por enquanto sem autenticação: o nome do negócio
// abaixo é fixo e será trocado pelos dados da sessão.
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-w-0">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b bg-card/90 px-4 backdrop-blur md:px-6">
          <SidebarTrigger className="-ml-1" />
          <span className="font-semibold tracking-tight text-primary md:hidden">
            foodlilly
          </span>
          <div className="ml-auto flex items-center gap-3">
            <Badge variant="secondary" className="hidden sm:inline-flex">
              Plano mensal · ativo
            </Badge>
            <div className="hidden text-right leading-tight sm:block">
              <p className="text-sm font-medium">Cantina da Ana</p>
              <p className="text-xs text-muted-foreground">ana@exemplo.com</p>
            </div>
            <Avatar>
              <AvatarFallback className="bg-primary font-medium text-primary-foreground">
                CA
              </AvatarFallback>
            </Avatar>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
