import { Search } from "lucide-react";

import {
  formatarDeclarado,
  LIMITES_LUPA,
  linhasTabela,
  textoPorcoesEmbalagem,
  type ChaveLupa,
  type ConfigTabela,
  type Nutrientes,
} from "@/lib/nutricao";

const numero = (v: number) =>
  v.toLocaleString("pt-BR", { maximumFractionDigits: 1 });

/**
 * Tabela de informação nutricional no modelo da IN 75/2020 (preto no branco),
 * com 100 g/ml, porção e %VD. Por ser o desenho exigido no rótulo, não usa as cores do tema.
 */
export function TabelaNutricional({
  por100,
  config,
}: {
  por100: Nutrientes;
  config: ConfigTabela;
}) {
  const u = config.liquido ? "ml" : "g";
  const linhas = linhasTabela(por100, config.porcaoG);
  return (
    <div className="w-full max-w-[400px] border-2 border-black bg-white font-sans text-[13px] leading-tight text-black">
      <p className="border-b-[3px] border-black px-2 py-1.5 text-center text-base font-extrabold tracking-wide">
        INFORMAÇÃO NUTRICIONAL
      </p>
      <div className="space-y-0.5 border-b-2 border-black px-2 py-1.5">
        {config.porcoesEmbalagem ? (
          <p>
            Porções por embalagem:{" "}
            {textoPorcoesEmbalagem(config.porcoesEmbalagem)}
          </p>
        ) : null}
        <p>
          Porção: {numero(config.porcaoG)} {u} ({config.medidaCaseira})
        </p>
      </div>
      <table className="w-full table-fixed border-collapse">
        <colgroup>
          <col />
          <col className="w-[18%]" />
          <col className="w-[18%]" />
          <col className="w-[14%]" />
        </colgroup>
        <thead>
          <tr className="border-b-[3px] border-black font-bold whitespace-nowrap">
            <th className="px-2 py-1.5 text-left">
              <span className="sr-only">Nutriente</span>
            </th>
            <th className="border-l border-black px-1.5 py-1.5 text-right">
              100 {u}
            </th>
            <th className="border-l border-black px-1.5 py-1.5 text-right">
              {numero(config.porcaoG)} {u}
            </th>
            <th className="border-l border-black px-1.5 py-1.5 text-right">
              %VD*
            </th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => (
            <tr key={l.chave} className="border-b border-black last:border-b-0">
              <th
                scope="row"
                className={`py-1 pr-1 text-left align-middle sm:whitespace-nowrap ${l.recuo ? "pl-4 font-normal" : "pl-2 font-semibold"}`}
              >
                {l.rotulo} ({l.unidade})
              </th>
              <td className="border-l border-black px-1.5 py-1 text-right align-middle tabular-nums">
                {formatarDeclarado(l.por100)}
              </td>
              <td className="border-l border-black px-1.5 py-1 text-right align-middle tabular-nums">
                {formatarDeclarado(l.porcao)}
              </td>
              <td className="border-l border-black px-1.5 py-1 text-right align-middle tabular-nums">
                {l.vd === null ? "" : l.vd}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t-[3px] border-black px-2 py-1.5 text-[11px]">
        *Percentual de valores diários fornecidos pela porção.
      </p>
    </div>
  );
}

/** Rotulagem frontal (lupa): só as advertências marcadas pelo cliente. */
export function Lupa({ lupa }: { lupa: ConfigTabela["lupa"] }) {
  const itens = (Object.keys(LIMITES_LUPA) as ChaveLupa[]).filter((k) => lupa[k]);
  if (!itens.length) return null;
  return (
    <div className="inline-flex items-stretch border-2 border-black bg-white text-black">
      <span className="flex items-center bg-black px-2 text-white">
        <Search className="size-7" strokeWidth={3} aria-hidden />
      </span>
      <div className="flex flex-col justify-center px-3 py-1.5">
        <span className="text-xs font-extrabold tracking-wide">ALTO EM</span>
        {itens.map((k) => (
          <span key={k} className="text-sm leading-tight font-extrabold uppercase">
            {LIMITES_LUPA[k].rotulo}
          </span>
        ))}
      </div>
    </div>
  );
}
