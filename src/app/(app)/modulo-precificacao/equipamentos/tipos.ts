export type TipoEquipamento = "eletrico" | "gas";

export type Equipamento = {
  id: string;
  nome: string;
  tipo: TipoEquipamento;
  potenciaW: number | null;
  vazaoKgH: number | null;
  criadoEm: string;
};

/** Dados do formulário: `valor` é a potência (W) ou a vazão (kg/h), conforme o tipo. */
export type DadosEquipamento = { nome: string; tipo: TipoEquipamento; valor: number };

export const LIMITES = {
  nome: 60,
  potenciaW: 100_000,
  vazaoKgH: 100,
  equipamentosPorNegocio: 200,
};

/** Cadastrados automaticamente na primeira visita do negócio à tela. */
export const EQUIPAMENTOS_PADRAO: DadosEquipamento[] = [
  { nome: "Forno elétrico", tipo: "eletrico", valor: 2080 },
  { nome: "Micro-ondas", tipo: "eletrico", valor: 1000 },
  { nome: "Liquidificador", tipo: "eletrico", valor: 550 },
  { nome: "Batedeira planetária", tipo: "eletrico", valor: 750 },
  { nome: "Panela mexedora", tipo: "eletrico", valor: 26 },
  { nome: "Geladeira", tipo: "eletrico", valor: 54 },
  { nome: "Fogão a gás", tipo: "gas", valor: 0.148 },
  { nome: "Forno a gás", tipo: "gas", valor: 0.957 },
  { nome: "Forno do fogão", tipo: "gas", valor: 0.592 },
];

const numero = (valor: number, casas: number) =>
  valor.toLocaleString("pt-BR", { maximumFractionDigits: casas });

/** "Potência: 2.080 W" ou "Vazão: 0,148 kg/h". */
export function medida(e: Pick<Equipamento, "tipo" | "potenciaW" | "vazaoKgH">) {
  return e.tipo === "eletrico"
    ? { rotulo: "Potência", valor: `${numero(e.potenciaW ?? 0, 2)} W` }
    : { rotulo: "Vazão", valor: `${numero(e.vazaoKgH ?? 0, 4)} kg/h` };
}
