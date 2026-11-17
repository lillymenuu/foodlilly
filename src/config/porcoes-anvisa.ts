/**
 * Porções de referência da ANVISA (IN 75/2020, Anexo V) para os produtos mais comuns
 * em food service. A porção sugerida pode ser ajustada na tela.
 * `medida`: medida caseira sugerida pela norma (o cliente escreve a dele, ex.: "1 fatia").
 */
export type CategoriaPorcao = {
  chave: string;
  grupo: string;
  nome: string;
  porcao: number;
  medida: string;
  liquido?: boolean;
};

const G1 = "Panificação, cereais e massas";
const G3 = "Frutas, sucos e bebidas";
const G4 = "Leites e derivados";
const G5 = "Carnes e ovos";
const G6 = "Óleos, gorduras e oleaginosas";
const G7 = "Doces, sobremesas e confeitaria";
const G8 = "Molhos, pratos prontos e outros";

export const CATEGORIAS_PORCAO: CategoriaPorcao[] = [
  { chave: "bolo-sem-recheio", grupo: G1, nome: "Bolos, todos os tipos sem recheio", porcao: 60, medida: "1 fatia" },
  { chave: "biscoito-salgado", grupo: G1, nome: "Biscoitos salgados, integrais e grissinis", porcao: 30, medida: "unidades" },
  { chave: "pao-embalado", grupo: G1, nome: "Pães embalados, fatiados ou não, com ou sem recheio", porcao: 50, medida: "1 unidade ou fatia" },
  { chave: "pao-doce", grupo: G1, nome: "Pão doce sem frutas", porcao: 40, medida: "1 unidade" },
  { chave: "panificacao-sem-recheio", grupo: G1, nome: "Croissant e outros produtos de panificação, salgados ou doces, sem recheio", porcao: 40, medida: "1 unidade" },
  { chave: "pao-queijo-recheio", grupo: G1, nome: "Pão de queijo e outros resfriados/congelados com recheio", porcao: 40, medida: "1 unidade" },
  { chave: "pao-queijo", grupo: G1, nome: "Pão de queijo e outros resfriados/congelados sem recheio", porcao: 50, medida: "unidades" },
  { chave: "massa-fresca", grupo: G1, nome: "Massas frescas com e sem recheio", porcao: 100, medida: "1 prato" },
  { chave: "massa-pastel", grupo: G1, nome: "Massas para pastéis e panquecas", porcao: 30, medida: "1 unidade" },
  { chave: "massa-torta-salgada", grupo: G1, nome: "Massa para tortas salgadas", porcao: 30, medida: "1 fração" },
  { chave: "massa-pizza", grupo: G1, nome: "Massa para pizza", porcao: 40, medida: "1 fatia" },
  { chave: "farofa", grupo: G1, nome: "Farofa pronta", porcao: 35, medida: "colheres de sopa" },
  { chave: "torradas", grupo: G1, nome: "Torradas", porcao: 30, medida: "unidades" },

  { chave: "suco", grupo: G3, nome: "Suco, néctar e bebidas de frutas", porcao: 200, medida: "1 copo", liquido: true },
  { chave: "polpa-sobremesa", grupo: G3, nome: "Polpa de frutas para sobremesas", porcao: 50, medida: "colheres de sopa" },
  { chave: "fruta-conserva", grupo: G3, nome: "Fruta em conserva, incluindo salada de frutas", porcao: 140, medida: "colheres de sopa" },
  { chave: "bebida-nao-alcoolica", grupo: G3, nome: "Bebidas não alcoólicas (chás, bebidas à base de soja, refrigerantes)", porcao: 200, medida: "1 copo", liquido: true },

  { chave: "bebida-lactea", grupo: G4, nome: "Bebida láctea, iogurtes e leites fermentados", porcao: 200, medida: "1 copo", liquido: true },
  { chave: "sobremesa-lactea", grupo: G4, nome: "Sobremesas lácteas (pudim, mousse, flan)", porcao: 120, medida: "1 unidade" },
  { chave: "queijo-cremoso", grupo: G4, nome: "Queijos, requeijão e queijo cremoso", porcao: 30, medida: "colheres de sopa ou fatias" },

  { chave: "carne-empanada", grupo: G5, nome: "Preparações de carnes com farinhas ou empanadas", porcao: 130, medida: "1 unidade" },
  { chave: "carne-preparada", grupo: G5, nome: "Preparações de carnes temperadas, defumadas, cozidas ou não", porcao: 100, medida: "1 unidade" },
  { chave: "hamburguer", grupo: G5, nome: "Hambúrguer e almôndegas à base de carnes", porcao: 80, medida: "1 unidade" },

  { chave: "chantilly", grupo: G6, nome: "Chantilly", porcao: 20, medida: "colheres de sopa" },
  { chave: "maionese", grupo: G6, nome: "Maionese e molhos à base de maionese", porcao: 12, medida: "1 colher de sopa" },
  { chave: "oleaginosas", grupo: G6, nome: "Castanhas e sementes oleaginosas", porcao: 15, medida: "colheres de sopa" },

  { chave: "bolo-recheio", grupo: G7, nome: "Bolos e similares com recheio ou cobertura", porcao: 60, medida: "1 fatia" },
  { chave: "bolo-frutas", grupo: G7, nome: "Bolo com frutas", porcao: 60, medida: "1 fatia" },
  { chave: "panificacao-recheio", grupo: G7, nome: "Croissant e produtos de panificação, salgados ou doces, com recheio ou cobertura", porcao: 40, medida: "1 unidade" },
  { chave: "brownie", grupo: G7, nome: "Brownies e alfajores", porcao: 40, medida: "1 unidade" },
  { chave: "biscoito-doce", grupo: G7, nome: "Biscoito doce, com ou sem recheio (cookies)", porcao: 30, medida: "unidades" },
  { chave: "chocolate", grupo: G7, nome: "Chocolates, bombons, brigadeiros e similares", porcao: 25, medida: "unidades" },
  { chave: "confeitos", grupo: G7, nome: "Confeitos de chocolate e drageados", porcao: 25, medida: "colheres de sopa" },
  { chave: "doce-corte", grupo: G7, nome: "Doces em corte (goiabada, marmelada etc.)", porcao: 40, medida: "1 fatia" },
  { chave: "doce-pasta", grupo: G7, nome: "Doces em pasta (doce de leite, de abóbora etc.)", porcao: 20, medida: "1 colher de sopa" },
  { chave: "geleia", grupo: G7, nome: "Geleias", porcao: 20, medida: "1 colher de sopa" },
  { chave: "xarope", grupo: G7, nome: "Mel, leite condensado, coberturas de frutas e xaropes", porcao: 20, medida: "1 colher de sopa" },
  { chave: "mistura-docinho", grupo: G7, nome: "Mistura para docinho e coberturas para bolos, tortas e sorvetes", porcao: 20, medida: "1 colher de sopa" },
  { chave: "sorvete", grupo: G7, nome: "Sorvetes (de massa ou individuais)", porcao: 60, medida: "1 bola ou unidade" },
  { chave: "gelatina", grupo: G7, nome: "Sobremesa de gelatina pronta", porcao: 120, medida: "1 unidade" },
  { chave: "pacoca", grupo: G7, nome: "Paçoca, pé de moleque, torrone e barras com mais de 10% de gordura", porcao: 20, medida: "1 unidade" },
  { chave: "panetone", grupo: G7, nome: "Panetone", porcao: 80, medida: "1 fatia" },
  { chave: "snack", grupo: G7, nome: "Snacks à base de cereais e farinhas para petisco", porcao: 25, medida: "1 xícara" },

  { chave: "prato-pronto", grupo: G8, nome: "Pratos prontos e semiprontos (marmitas, salgados, tortas, pizzas)", porcao: 100, medida: "1 unidade ou fração" },
  { chave: "molho-tomate", grupo: G8, nome: "Molho de tomate ou à base de vegetais", porcao: 60, medida: "colheres de sopa" },
  { chave: "catchup", grupo: G8, nome: "Catchup e mostarda", porcao: 12, medida: "1 colher de sopa" },
];

export const OUTRA_PORCAO: CategoriaPorcao = {
  chave: "outra",
  grupo: "Outro",
  nome: "Outro (definir a porção)",
  porcao: 100,
  medida: "1 unidade",
};

export const categoriaPorcao = (chave: string) =>
  CATEGORIAS_PORCAO.find((c) => c.chave === chave) ?? OUTRA_PORCAO;

/** Sugestão de categoria pelo nome do produto (o cliente confirma ou troca). */
export function sugerirCategoria(nome: string): CategoriaPorcao {
  const n = nome.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const regras: [RegExp, string][] = [
    [/achocolatado|milk ?shake|frape|frappe|vitamina|iogurte|cafe gelado|bebida lactea/, "bebida-lactea"],
    [/suco|refresco|limonada|cha gelado|refrigerante/, "suco"],
    [/brownie|alfajor/, "brownie"],
    [/brigadeiro|bombom|beijinho|trufa|docinho|chocolate/, "chocolate"],
    [/cookie|biscoito|bolacha/, "biscoito-doce"],
    [/bolo|cake|torta doce|cheesecake/, "bolo-recheio"],
    [/pudim|mousse|flan|pave/, "sobremesa-lactea"],
    [/sorvete|picole|gelato/, "sorvete"],
    [/geleia/, "geleia"],
    [/doce de leite/, "doce-pasta"],
    [/pao de queijo/, "pao-queijo"],
    [/croissant|folhado/, "panificacao-recheio"],
    [/pao/, "pao-embalado"],
    [/hamburguer|burger/, "hamburguer"],
    [/coxinha|empada|esfiha|pastel|salgado|quiche|pizza|torta|marmita|lasanha/, "prato-pronto"],
  ];
  const achou = regras.find(([r]) => r.test(n));
  return achou ? categoriaPorcao(achou[1]) : CATEGORIAS_PORCAO.find((c) => c.chave === "prato-pronto")!;
}
