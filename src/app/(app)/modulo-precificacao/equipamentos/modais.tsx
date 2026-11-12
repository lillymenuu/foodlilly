"use client";

import { useState, useTransition } from "react";
import { CirclePlus, LoaderCircle, Pencil, Trash, TriangleAlert } from "lucide-react";

import { Aviso, InputUnidade } from "@/components/formulario";
import { ModalCabecalho } from "@/components/modal-cabecalho";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { paraNumero, paraTexto } from "@/lib/numero-br";

import { criarEquipamento, editarEquipamento, excluirEquipamento } from "./actions";
import { LIMITES, medida, type Equipamento } from "./tipos";

/** Remove o erro de um campo. */
const sem = (chave: string) => (erros: Record<string, string>) => {
  const resto = { ...erros };
  delete resto[chave];
  return resto;
};

/** Modal de cadastro (sem `equipamento`) ou edição (com `equipamento`). */
export function ModalEquipamento({
  equipamento,
  onFechar,
  onConcluido,
}: {
  equipamento?: Equipamento;
  onFechar: () => void;
  onConcluido: (mensagem: string) => void;
}) {
  const editando = Boolean(equipamento);
  const [nome, setNome] = useState(equipamento?.nome ?? "");
  const [gas, setGas] = useState(equipamento?.tipo === "gas");
  // Guarda os dois valores para não perder o digitado ao alternar o tipo.
  const [potencia, setPotencia] = useState(paraTexto(equipamento?.potenciaW));
  const [vazao, setVazao] = useState(paraTexto(equipamento?.vazaoKgH));
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState<string>();
  const [salvando, startTransition] = useTransition();

  const textoValor = gas ? vazao : potencia;

  function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    if (salvando) return;

    const errosLocais: Record<string, string> = {};
    const valor = paraNumero(textoValor);
    if (!nome.trim()) errosLocais.nome = "Informe o nome do equipamento.";
    if (valor == null) errosLocais.valor = gas ? "Informe a vazão." : "Informe a potência.";
    else if (Number.isNaN(valor)) errosLocais.valor = "Informe um número válido.";
    if (Object.keys(errosLocais).length || valor == null || Number.isNaN(valor)) {
      setErros(errosLocais);
      return;
    }

    const dados = { nome: nome.trim(), tipo: gas ? ("gas" as const) : ("eletrico" as const), valor };
    startTransition(async () => {
      const resultado = equipamento
        ? await editarEquipamento(equipamento.id, dados)
        : await criarEquipamento(dados);
      if (resultado.ok) {
        onConcluido(editando ? `"${dados.nome}" foi atualizado.` : `"${dados.nome}" foi adicionado.`);
      } else {
        setErros(resultado.erros ?? {});
        setErroGeral(resultado.mensagem);
      }
    });
  }

  return (
    <Dialog open onOpenChange={(aberto) => !aberto && onFechar()}>
      <DialogContent showCloseButton={false} className="gap-0 overflow-hidden p-0 sm:max-w-md">
        <ModalCabecalho
          tipo={editando ? "editar" : "novo"}
          icone={editando ? Pencil : CirclePlus}
          titulo={editando ? "Editar equipamento" : "Adicionar novo equipamento"}
          descricao={
            editando
              ? "Atualize as informações do equipamento."
              : "Preencha os dados abaixo para cadastrar um novo equipamento."
          }
        />

        <form onSubmit={enviar} noValidate>
          <div className="flex flex-col gap-5 p-5 sm:p-6">
            {erroGeral && <Aviso tipo="erro">{erroGeral}</Aviso>}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="equipamento-nome">Nome do equipamento</Label>
              <p className="text-xs text-muted-foreground">Como você identifica este equipamento.</p>
              <Input
                id="equipamento-nome"
                value={nome}
                onChange={(e) => {
                  setNome(e.target.value);
                  setErros(sem("nome"));
                }}
                placeholder="Ex.: Forno industrial"
                maxLength={LIMITES.nome}
                autoComplete="off"
                autoFocus={!editando}
                aria-invalid={Boolean(erros.nome)}
                className="h-10 bg-muted/60"
              />
              {erros.nome && <p className="text-xs text-destructive">{erros.nome}</p>}
            </div>

            <Label
              htmlFor="equipamento-gas"
              className="flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 font-normal hover:bg-muted/50"
            >
              <Checkbox
                id="equipamento-gas"
                checked={gas}
                onCheckedChange={(marcado) => {
                  setGas(marcado === true);
                  setErros(sem("valor"));
                }}
              />
              <span>
                <span className="block text-sm font-medium">É um equipamento a gás?</span>
                <span className="block text-xs text-muted-foreground">
                  Marque para informar o consumo de gás em vez da potência elétrica.
                </span>
              </span>
            </Label>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="equipamento-valor">{gas ? "Vazão (kg/h)" : "Potência (watts)"}</Label>
              <p className="text-xs text-muted-foreground">
                {gas
                  ? "Consumo de gás por hora de uso. Veja no manual ou na etiqueta do equipamento."
                  : "Potência elétrica em watts (W). Veja na etiqueta ou no manual do equipamento."}
              </p>
              <InputUnidade
                id="equipamento-valor"
                sufixo={gas ? "kg/h" : "W"}
                inputMode="decimal"
                value={textoValor}
                onChange={(e) => {
                  (gas ? setVazao : setPotencia)(e.target.value);
                  setErros(sem("valor"));
                }}
                placeholder={gas ? "Ex.: 0,5" : "Ex.: 2000"}
                aria-invalid={Boolean(erros.valor)}
              />
              {erros.valor && <p className="text-xs text-destructive">{erros.valor}</p>}
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t bg-muted/50 px-5 py-4 sm:flex-row sm:px-6">
            {editando && (
              <DialogClose render={<Button type="button" variant="outline" size="lg" className="h-11 flex-1" />}>
                Cancelar
              </DialogClose>
            )}
            <Button
              type="submit"
              size="lg"
              variant={editando ? "default" : "highlight"}
              disabled={salvando}
              className="h-11 flex-1"
            >
              {salvando ? (
                <LoaderCircle className="animate-spin" data-icon="inline-start" />
              ) : editando ? null : (
                <CirclePlus data-icon="inline-start" />
              )}
              {salvando ? "Salvando..." : editando ? "Confirmar alterações" : "Adicionar equipamento"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ModalExcluirEquipamento({
  equipamento,
  onFechar,
  onConcluido,
}: {
  equipamento: Equipamento;
  onFechar: () => void;
  onConcluido: (mensagem: string) => void;
}) {
  const [erro, setErro] = useState<string>();
  const [excluindo, startTransition] = useTransition();
  const { rotulo, valor } = medida(equipamento);

  function confirmar() {
    startTransition(async () => {
      const resultado = await excluirEquipamento(equipamento.id);
      if (resultado.ok) onConcluido(`"${equipamento.nome}" foi excluído.`);
      else setErro(resultado.mensagem);
    });
  }

  return (
    <Dialog open onOpenChange={(aberto) => !aberto && onFechar()}>
      <DialogContent showCloseButton={false} className="gap-0 overflow-hidden p-0 sm:max-w-md">
        <ModalCabecalho
          tipo="excluir"
          icone={Trash}
          titulo="Confirmar exclusão"
          descricao="Esta ação não pode ser desfeita."
        />

        <div className="flex flex-col gap-4 p-5 sm:p-6">
          {erro && <Aviso tipo="erro">{erro}</Aviso>}
          <div className="flex gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
            <TriangleAlert className="mt-0.5 size-5 shrink-0 text-destructive" />
            <div className="flex flex-col gap-1.5">
              <p className="font-semibold text-destructive">Atenção!</p>
              <p>
                Você está prestes a excluir o equipamento <strong>{equipamento.nome}</strong>.
              </p>
              <p className="text-muted-foreground">
                Receitas e produtos que usam este equipamento deixarão de considerar o custo dele.
              </p>
            </div>
          </div>
          <dl className="flex flex-col gap-2 rounded-xl border p-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Nome</dt>
              <dd className="text-right font-medium">{equipamento.nome}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{rotulo}</dt>
              <dd className="font-medium tabular-nums">{valor}</dd>
            </div>
          </dl>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t bg-muted/50 px-5 py-4 sm:flex-row sm:px-6">
          <DialogClose render={<Button type="button" variant="outline" size="lg" className="h-11 flex-1" />}>
            Cancelar
          </DialogClose>
          <Button
            type="button"
            size="lg"
            disabled={excluindo}
            onClick={confirmar}
            className="h-11 flex-1 bg-destructive text-white hover:bg-destructive/90"
          >
            {excluindo && <LoaderCircle className="animate-spin" data-icon="inline-start" />}
            {excluindo ? "Excluindo..." : "Confirmar exclusão"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
