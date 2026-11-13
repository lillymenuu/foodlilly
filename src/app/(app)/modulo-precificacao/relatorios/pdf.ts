/**
 * PDF do relatório (A4 paisagem): página 1 com os resumos, página 2 em diante com a
 * tabela de produtos. Gerado no navegador; as bibliotecas só carregam ao clicar.
 */
import { formatarMoeda } from "@/lib/numero-br";

import { COMPOSICAO, type AppEntrega, type ProdutoRelatorio } from "./tipos";

type RGB = [number, number, number];
/** Cores do tema (espelham os tokens de globals.css; o PDF precisa delas em RGB). */
const COR = {
  marinho: [20, 58, 93],
  marinhoSuave: [221, 229, 238],
  laranja: [247, 156, 24],
  laranjaForte: [224, 129, 27],
  laranjaSuave: [253, 236, 205],
  texto: [30, 42, 58],
  textoSuave: [91, 107, 127],
  verde: [31, 122, 77],
  verdeSuave: [223, 239, 230],
  vermelho: [200, 55, 45],
  azul: [42, 120, 214],
  azulSuave: [226, 237, 250],
  borda: [215, 221, 229],
  branco: [255, 255, 255],
  linhaZebra: [246, 248, 250],
} satisfies Record<string, RGB>;

export type DadosPdf = {
  produtos: ProdutoRelatorio[];
  meta: number;
  negocio: string;
  apps: AppEntrega[];
  resumo: {
    receita: number;
    custo: number;
    lucro: number;
    media: number;
    variancia: number;
    desvio: number;
    foraMeta: number;
    maior?: ProdutoRelatorio;
    menor?: ProdutoRelatorio;
    composicao: Record<(typeof COMPOSICAO)[number]["chave"], number>;
  };
};

const num = (v: number, casas = 1) =>
  v.toLocaleString("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });
const pct = (v: number) => `${num(v)}%`;

export async function gerarPdfRelatorio(d: DadosPdf) {
  const [{ jsPDF }, { autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const L = doc.internal.pageSize.getWidth();
  const A = doc.internal.pageSize.getHeight();
  const M = 14; // margem
  const larguraUtil = L - 2 * M;
  const agora = new Date();
  const geradoEm = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  })
    .format(agora)
    .replace(",", " às");

  const cor = (c: RGB, tipo: "fill" | "text" | "draw") =>
    tipo === "fill"
      ? doc.setFillColor(...c)
      : tipo === "text"
        ? doc.setTextColor(...c)
        : doc.setDrawColor(...c);
  const texto = (
    t: string,
    x: number,
    y: number,
    o: {
      tam?: number;
      negrito?: boolean;
      c?: RGB;
      alinhar?: "left" | "right" | "center";
      maxW?: number;
    } = {},
  ) => {
    doc.setFont("helvetica", o.negrito ? "bold" : "normal");
    doc.setFontSize(o.tam ?? 10);
    cor(o.c ?? COR.texto, "text");
    let s = t;
    if (o.maxW && doc.getTextWidth(s) > o.maxW) {
      while (s.length > 1 && doc.getTextWidth(`${s}...`) > o.maxW)
        s = s.slice(0, -1);
      s = `${s.trimEnd()}...`;
    }
    doc.text(s, x, y, { align: o.alinhar ?? "left" });
  };

  /** Marca do foodlilly: quadrado laranja com "f" marinho + nome. */
  const marca = (x: number, y: number, tam: number) => {
    cor(COR.laranja, "fill");
    doc.roundedRect(x, y, tam, tam, tam * 0.25, tam * 0.25, "F");
    texto("f", x + tam / 2, y + tam * 0.74, {
      tam: tam * 2.3,
      negrito: true,
      c: COR.marinho,
      alinhar: "center",
    });
    texto("foodlilly", x + tam + 2, y + tam * 0.72, {
      tam: tam * 1.55,
      negrito: true,
      c: COR.marinho,
    });
  };

  // ------------------------------------------------ Página 1: cabeçalho
  marca(M, M, 9);
  texto("RELATÓRIO DE PRECIFICAÇÃO", M + 44, M + 4.5, {
    tam: 13,
    negrito: true,
  });
  texto("Análise de custos, preços e rentabilidade", M + 44, M + 9.5, {
    tam: 9,
    c: COR.textoSuave,
  });
  if (d.negocio)
    texto(d.negocio, L - M, M + 4.5, {
      tam: 11,
      negrito: true,
      alinhar: "right",
    });
  texto(`Gerado em ${geradoEm}`, L - M, M + 9.5, {
    tam: 9,
    c: COR.textoSuave,
    alinhar: "right",
  });
  cor(COR.laranja, "fill");
  doc.rect(M, M + 14, larguraUtil, 0.8, "F");

  /** Seção com fundo suave, título e uma linha de cards. */
  let y = M + 20;
  const secao = (
    titulo: string,
    fundo: RGB,
    destaque: RGB,
    cards: { rotulo: string; valor: string; extra?: string; corValor?: RGB }[],
  ) => {
    const alturaCard = cards.some((c) => c.extra) ? 19 : 15;
    const altura = 11 + alturaCard + 5;
    cor(fundo, "fill");
    doc.roundedRect(M, y, larguraUtil, altura, 3, 3, "F");
    cor(destaque, "fill");
    doc.roundedRect(M, y, 1.6, altura, 0.8, 0.8, "F");
    texto(titulo, M + 6, y + 7.5, { tam: 12, negrito: true, c: COR.marinho });
    const gap = 4;
    const w = (larguraUtil - 12 - gap * (cards.length - 1)) / cards.length;
    cards.forEach((c, i) => {
      const x = M + 6 + i * (w + gap);
      const yc = y + 11;
      cor(COR.branco, "fill");
      cor(COR.borda, "draw");
      doc.setLineWidth(0.2);
      doc.roundedRect(x, yc, w, alturaCard, 2, 2, "FD");
      texto(c.rotulo, x + 3.5, yc + 5, {
        tam: 8,
        c: COR.textoSuave,
        maxW: w - 7,
      });
      if (c.extra) {
        texto(c.valor, x + 3.5, yc + 10.5, {
          tam: 10,
          negrito: true,
          maxW: w - 7,
        });
        texto(c.extra, x + 3.5, yc + 16, {
          tam: 10,
          negrito: true,
          c: c.corValor ?? COR.texto,
          maxW: w - 7,
        });
      } else {
        texto(c.valor, x + 3.5, yc + 11.5, {
          tam: 12,
          negrito: true,
          c: c.corValor ?? COR.texto,
          maxW: w - 7,
        });
      }
    });
    y += altura + 5;
  };

  const n = d.produtos.length;
  const r = d.resumo;
  secao("Resumo financeiro", COR.marinhoSuave, COR.marinho, [
    { rotulo: "Total de produtos", valor: String(n) },
    { rotulo: "Receita total", valor: formatarMoeda(r.receita) },
    { rotulo: "Custo total", valor: formatarMoeda(r.custo) },
    {
      rotulo: "Lucro total",
      valor: formatarMoeda(r.lucro),
      corValor: r.lucro >= 0 ? COR.verde : COR.vermelho,
    },
    {
      rotulo: `Margem média (meta ${num(d.meta, 0)}%)`,
      valor: pct(r.media),
      corValor: r.media >= d.meta ? COR.verde : COR.vermelho,
    },
  ]);

  const somaComp = COMPOSICAO.reduce((s, c) => s + r.composicao[c.chave], 0);
  secao(
    "Composição de custos",
    COR.laranjaSuave,
    COR.laranja,
    COMPOSICAO.map((c) => ({
      rotulo: `${c.rotulo} (${somaComp ? num((r.composicao[c.chave] / somaComp) * 100) : "0,0"}%)`,
      valor: formatarMoeda(r.composicao[c.chave]),
    })),
  );

  const lucrativos = d.produtos.filter((p) => p.lucro > 0).length;
  secao("Destaques", COR.verdeSuave, COR.verde, [
    {
      rotulo: "Maior margem",
      valor: r.maior?.nome ?? "-",
      extra: r.maior ? pct(r.maior.margem) : "-",
      corValor: COR.verde,
    },
    {
      rotulo: "Menor margem",
      valor: r.menor?.nome ?? "-",
      extra: r.menor ? pct(r.menor.margem) : "-",
      corValor: r.menor && r.menor.margem < d.meta ? COR.vermelho : COR.verde,
    },
    {
      rotulo: "Produtos lucrativos",
      valor: `${lucrativos} de ${n}`,
      extra: pct(n ? (lucrativos / n) * 100 : 0),
      corValor: COR.verde,
    },
  ]);

  secao("Análise estatística", COR.azulSuave, COR.azul, [
    { rotulo: "Variância da margem", valor: num(r.variancia, 2) },
    { rotulo: "Desvio padrão", valor: num(r.desvio, 2) },
    {
      rotulo: `Fora da meta (abaixo de ${num(d.meta, 0)}%)`,
      valor: String(r.foraMeta),
      corValor: r.foraMeta ? COR.vermelho : COR.verde,
    },
    { rotulo: "Custo médio", valor: formatarMoeda(n ? r.custo / n : 0) },
    { rotulo: "Preço médio", valor: formatarMoeda(n ? r.receita / n : 0) },
  ]);

  // ------------------------------------------------ Página 2+: tabela
  doc.addPage();
  texto(`Detalhamento dos produtos (${n})`, M, M + 6, {
    tam: 13,
    negrito: true,
    c: COR.marinho,
  });

  const ordenados = [...d.produtos].sort((a, b) =>
    a.nome.localeCompare(b.nome, "pt-BR"),
  );
  const colunasApps = d.apps.map(
    (a) => `${a.nome}\nTaxa ${num(a.taxa * 100, 0)}%`,
  );
  autoTable(doc, {
    startY: M + 11,
    margin: { left: M, right: M, top: M, bottom: 24 },
    head: [
      [
        "Produto",
        "Peso (g)",
        "Rend.",
        "Custo fabr.",
        "Preço venda",
        "P. revenda",
        ...colunasApps,
        "Preço/kg",
        "Margem",
        "Margem %",
        "Receitas",
      ],
    ],
    body: ordenados.map((p) => [
      p.nome,
      p.pesoTotalG != null
        ? p.pesoTotalG.toLocaleString("pt-BR", { maximumFractionDigits: 1 })
        : "-",
      p.rendimento.toLocaleString("pt-BR", { maximumFractionDigits: 2 }),
      formatarMoeda(p.custo),
      formatarMoeda(p.preco),
      formatarMoeda(p.revenda),
      ...p.marketplace.map((v) => formatarMoeda(v)),
      p.precoKg != null ? formatarMoeda(p.precoKg) : "-",
      formatarMoeda(p.margemValor),
      pct(p.margem),
      String(p.receitas),
    ]),
    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: { top: 2.6, bottom: 2.6, left: 2, right: 2 },
      textColor: COR.texto,
      lineColor: COR.borda,
      lineWidth: { bottom: 0.2 },
    },
    headStyles: {
      fillColor: COR.marinho,
      textColor: COR.branco,
      fontStyle: "bold",
      fontSize: 8,
      valign: "middle",
    },
    alternateRowStyles: { fillColor: COR.linhaZebra },
    columnStyles: { 0: { cellWidth: 46, fontStyle: "bold" } },
    didParseCell: (c) => {
      if (c.section !== "body") return;
      const ultima = c.table.columns.length - 1;
      // Margem % em verde/vermelho conforme a meta
      if (c.column.index === ultima - 1) {
        const p = ordenados[c.row.index];
        c.cell.styles.textColor = p.margem >= d.meta ? COR.verde : COR.vermelho;
        c.cell.styles.fontStyle = "bold";
      }
      if (c.column.index === 4) c.cell.styles.fontStyle = "bold";
    },
  });

  // ------------------------------------------------ Rodapé em todas as páginas
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    const yr = A - 16;
    cor(COR.borda, "draw");
    doc.setLineWidth(0.3);
    doc.line(M, yr, L - M, yr);
    marca(M, yr + 3.5, 5.5);
    const xr = M + 30;
    texto(
      d.negocio ? `Relatório de ${d.negocio}` : "Relatório de precificação",
      xr,
      yr + 6,
      { tam: 8, negrito: true },
    );
    texto(
      `Gerado pelo foodlilly em ${geradoEm}. Valores por unidade vendida, calculados pelas fichas técnicas.`,
      xr,
      yr + 10.5,
      { tam: 7.5, c: COR.textoSuave },
    );
    texto(`${i} / ${total}`, L - M, yr + 8, {
      tam: 9,
      c: COR.textoSuave,
      alinhar: "right",
    });
  }

  // Data no fuso de Brasília (en-CA dá AAAA-MM-DD), não em UTC.
  const dia = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(agora);
  doc.save(`relatorio-precificacao-${dia}.pdf`);
}
