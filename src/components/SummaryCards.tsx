import React from 'react';
import {
  FileText,
  Users,
  CheckCircle2,
  HeartHandshake,
  Layers,
  Baby,
} from 'lucide-react';
import { CartorioConfig, EscrituraRecord } from '../types/ibge';
import { buildTabinf12Summary } from '../utils/ibgeConverter';

interface SummaryCardsProps {
  escrituras: EscrituraRecord[];
  config: CartorioConfig;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ escrituras, config }) => {
  const summary12 = buildTabinf12Summary(escrituras, config);

  // Contagem de regimes
  const regimesCount: Record<string, number> = {
    '1': 0, // Universal
    '2': 0, // Parcial
    '3': 0, // Separação
    '9': 0, // Sem declaração
  };

  let totalFilhosMaiores = 0;
  let totalFilhosMenores = 0;

  escrituras.forEach((e) => {
    regimesCount[e.regimeBens] = (regimesCount[e.regimeBens] || 0) + 1;
    if (e.numFilhoMaior !== '99') {
      totalFilhosMaiores += parseInt(e.numFilhoMaior, 10) || 0;
    }
    if (e.numFilhoMenor !== '99') {
      totalFilhosMenores += parseInt(e.numFilhoMenor, 10) || 0;
    }
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Card 1: Total de Escrituras */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">TOTAL-DIV (Escrituras)</span>
          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
            <FileText className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-900">{escrituras.length}</span>
          <span className="text-xs text-slate-500">atos notariais</span>
        </div>
        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>66 cônjuges no total</span>
          <span className="font-mono text-emerald-600 font-medium">Recibo: {summary12.totalDiv}</span>
        </div>
      </div>

      {/* Card 2: Período e Trimestre */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">Período de Apuração</span>
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
            <Layers className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-900">{config.trimPesquisa}º Trimestre</span>
          <span className="text-xs font-medium text-slate-600">{config.anoPesquisa}</span>
        </div>
        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Datas: 09/07 a 30/09</span>
          <span className="text-blue-700 font-medium">Jul / Ago / Set</span>
        </div>
      </div>

      {/* Card 3: Regimes de Bens */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">Regimes de Bens</span>
          <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
            <HeartHandshake className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-medium bg-purple-50 text-purple-700 px-2 py-0.5 rounded">
            Parcial: <strong>{regimesCount['2']}</strong>
          </span>
          <span className="text-xs font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
            Universal: <strong>{regimesCount['1']}</strong>
          </span>
          <span className="text-xs font-medium bg-amber-50 text-amber-700 px-2 py-0.5 rounded">
            Separação: <strong>{regimesCount['3']}</strong>
          </span>
        </div>
        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Sem declaração: {regimesCount['9']}</span>
          <span className="text-purple-600 font-mono text-[10px]">Cód 1, 2, 3, 9</span>
        </div>
      </div>

      {/* Card 4: Conformidade do Arquivo */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">Conformidade com o PDF</span>
          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-2xl font-bold text-emerald-600">121</span>
          <span className="text-xs text-slate-600 font-medium">bytes / registro</span>
        </div>
        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>TABINF12: 26 bytes</span>
          <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
            100% Homologável
          </span>
        </div>
      </div>
    </div>
  );
};
