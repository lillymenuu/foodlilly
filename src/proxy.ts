import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

/** Páginas abertas sem login (o resto é área do cliente). */
const PUBLICAS = ["/", "/entrar", "/cadastro", "/termos", "/privacidade"];

/**
 * Verificação rápida: sem o cookie de sessão, a área do cliente vai para /entrar.
 * A conferência de verdade (sessão válida, acesso vencido) acontece no servidor,
 * em `src/lib/negocio-atual.ts`.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (PUBLICAS.includes(pathname)) return NextResponse.next();
  if (getSessionCookie(request)) return NextResponse.next();
  const url = new URL("/entrar", request.url);
  url.searchParams.set("voltar", `${pathname}${search}`);
  return NextResponse.redirect(url);
}

export const config = {
  // Fora: rotas de API (o login tem as suas), arquivos do Next e arquivos com extensão.
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
};
