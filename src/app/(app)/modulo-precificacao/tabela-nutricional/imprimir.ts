/**
 * Imprime só o rótulo (lupa + tabela): copia o elemento para um iframe escondido,
 * com os estilos da página, e imprime o iframe. Pelo diálogo de impressão o
 * cliente também pode "Salvar como PDF".
 */
export async function imprimirRotulo(elemento: HTMLElement, titulo: string) {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument;
  const janela = iframe.contentWindow;
  if (!doc || !janela) return iframe.remove();

  const estilos = [
    ...document.querySelectorAll('link[rel="stylesheet"], style'),
  ]
    .map((e) => e.outerHTML)
    .join("");
  // Mesmas classes de <html> e <body>: trazem a fonte (Geist) e as variáveis do tema.
  const seguro = titulo.replace(/[<>&"]/g, "");
  doc.open();
  doc.write(
    `<!doctype html><html lang="pt-BR" class="${document.documentElement.className}"><head><meta charset="utf-8"><title>Tabela nutricional - ${seguro}</title>${estilos}` +
      `<style>@page{margin:1cm}html,body{background:white;margin:0}body{padding:8px;print-color-adjust:exact;-webkit-print-color-adjust:exact}</style>` +
      `</head><body class="${document.body.className}">${elemento.outerHTML}</body></html>`,
  );
  doc.close();

  // Espera as folhas de estilo e as fontes carregarem no iframe.
  await Promise.all(
    [...doc.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].map(
      (l) =>
        l.sheet
          ? null
          : new Promise((ok) => {
              l.addEventListener("load", ok, { once: true });
              l.addEventListener("error", ok, { once: true });
            }),
    ),
  );
  await doc.fonts?.ready;

  janela.addEventListener("afterprint", () => iframe.remove(), { once: true });
  janela.focus();
  janela.print();
  // Navegadores que não disparam "afterprint": remove depois de um tempo.
  setTimeout(() => iframe.isConnected && iframe.remove(), 60_000);
}
