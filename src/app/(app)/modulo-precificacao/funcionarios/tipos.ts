export type Funcionario = {
  id: string;
  nome: string;
  salario: number;
  criadoEm: string;
};

export type DadosFuncionario = { nome: string; salario: number };

export const LIMITES = {
  nome: 60,
  salario: 1_000_000,
  funcionariosPorNegocio: 200,
};

/** Cadastrados automaticamente na primeira visita do negócio à tela. */
export const FUNCIONARIOS_PADRAO: DadosFuncionario[] = [
  { nome: "Aux. limpeza", salario: 1000 },
  { nome: "Confeiteira", salario: 1200 },
];
