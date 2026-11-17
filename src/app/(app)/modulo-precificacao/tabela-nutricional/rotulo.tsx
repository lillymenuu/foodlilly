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
    <div className="w-full max-w-[360px] border-2 border-black bg-white p-2 font-sans text-[13px] leading-tight text-black">
      <p className="border-b-[3px] border-black pb-1 text-center text-base font-extrabold tracking-wide">
        INFORMAÇÃO NUTRICIONAL
      </p>
      <div className="border-b border-black py-1">
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
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b-[3px] border-black text-right font-bold whitespace-nowrap">
            <th className="py-1 text-left font-bold">
              <span className="sr-only">Nutriente</span>
            </th>
            <th className="px-1 py-1">100 {u}</th>
            <th className="px-1 py-1">
              {numero(config.porcaoG)} {u}
            </th>
            <th className="py-1 pl-1">%VD*</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => (
            <tr key={l.chave} className="border-b border-black last:border-b-[3px]">
              <th
                scope="row"
                className={`py-[3px] text-left font-normal ${l.recuo ? "pl-3" : "font-semibold"}`}
              >
                {l.rotulo} ({l.unidade})
              </th>
              <td className="px-1 text-right tabular-nums">
                {formatarDeclarado(l.por100)}
              </td>
              <td className="px-1 text-right tabular-nums">
                {formatarDeclarado(l.porcao)}
              </td>
              <td className="pl-1 text-right tabular-nums">
                {l.vd === null ? "" : l.vd}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="pt-1 text-[11px]">
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
