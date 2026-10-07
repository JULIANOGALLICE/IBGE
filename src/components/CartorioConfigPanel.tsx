import React from 'react';
import { Settings2, Building, Calendar, HelpCircle, CheckCircle } from 'lucide-react';
import { CartorioConfig } from '../types/ibge';
import { UF_NAME_MAP } from '../utils/ibgeConverter';

interface CartorioConfigPanelProps {
  config: CartorioConfig;
  onChangeConfig: (newConfig: CartorioConfig) => void;
  totalEscrituras: number;
}

export const CartorioConfigPanel: React.FC<CartorioConfigPanelProps> = ({
  config,
  onChangeConfig,
  totalEscrituras,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleChange = (field: keyof CartorioConfig, value: any) => {
    onChangeConfig({
      ...config,
      [field]: value,
    });
  };

  const ufSigla = UF_NAME_MAP[config.ufPesquisa] || 'PR';

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs mb-6 overflow-hidden">
      <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2 flex-wrap">
              <span>{config.nomeCartorio || 'SERVIÇO DISTRITAL DO UBERABA'}</span>
              <span className="text-[11px] font-mono font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Chave Ativa: {config.ufPesquisa}-{config.munPesquisa}-{config.distPesquisa}-{config.codCartorio}
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Coleta de divórcios: {config.ufPesquisa}-{config.munPesquisa}-{config.distPesquisa}-{config.codCartorio} • {config.nomeCartorio || 'SERVIÇO DISTRITAL DO UBERABA'} (Colunas 1 a 6)
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
        >
          <Settings2 className="w-3.5 h-3.5 text-slate-500" />
          {isOpen ? 'Ocultar Parâmetros' : 'Editar Parâmetros'}
        </button>
      </div>

      {isOpen ? (
        <div className="p-5 bg-white space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 text-xs">
            {/* UF */}
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                UF da Pesquisa (02)
                <span className="text-slate-400 font-normal ml-1">#1</span>
              </label>
              <input
                type="text"
                maxLength={2}
                value={config.ufPesquisa}
                onChange={(e) => handleChange('ufPesquisa', e.target.value.replace(/\D/g, ''))}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md font-mono focus:ring-1 focus:ring-blue-500 focus:outline-none"
                placeholder="41"
              />
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                {ufSigla} (Paraná = 41)
              </span>
            </div>

            {/* Município */}
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Município Pesquisa (05)
                <span className="text-slate-400 font-normal ml-1">#2</span>
              </label>
              <input
                type="text"
                maxLength={5}
                value={config.munPesquisa}
                onChange={(e) => handleChange('munPesquisa', e.target.value.replace(/\D/g, ''))}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md font-mono focus:ring-1 focus:ring-blue-500 focus:outline-none"
                placeholder="06902"
              />
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                06902 = Curitiba
              </span>
            </div>

            {/* Distrito */}
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Distrito Pesquisa (02)
                <span className="text-slate-400 font-normal ml-1">#3</span>
              </label>
              <input
                type="text"
                maxLength={2}
                value={config.distPesquisa}
                onChange={(e) => handleChange('distPesquisa', e.target.value.replace(/\D/g, ''))}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md font-mono focus:ring-1 focus:ring-blue-500 focus:outline-none"
                placeholder="05"
              />
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                05 = Uberaba
              </span>
            </div>

            {/* Código Cartório */}
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Código Cartório (02)
                <span className="text-slate-400 font-normal ml-1">#4</span>
              </label>
              <input
                type="text"
                maxLength={2}
                value={config.codCartorio}
                onChange={(e) => handleChange('codCartorio', e.target.value.replace(/\D/g, ''))}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md font-mono focus:ring-1 focus:ring-blue-500 focus:outline-none"
                placeholder="19"
              />
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                19 = Serv. Distrital Uberaba
              </span>
            </div>

            {/* Ano */}
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Ano da Pesquisa (04)
                <span className="text-slate-400 font-normal ml-1">#5</span>
              </label>
              <input
                type="text"
                maxLength={4}
                value={config.anoPesquisa}
                onChange={(e) => handleChange('anoPesquisa', e.target.value.replace(/\D/g, ''))}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md font-mono focus:ring-1 focus:ring-blue-500 focus:outline-none"
                placeholder="2026"
              />
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Ano do ato notarial
              </span>
            </div>

            {/* Trimestre */}
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Trimestre (01)
                <span className="text-slate-400 font-normal ml-1">#6</span>
              </label>
              <select
                value={config.trimPesquisa}
                onChange={(e) => handleChange('trimPesquisa', e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md font-mono focus:ring-1 focus:ring-blue-500 focus:outline-none"
              >
                <option value="1">1º Trimestre (Jan-Mar)</option>
                <option value="2">2º Trimestre (Abr-Jun)</option>
                <option value="3">3º Trimestre (Jul-Set)</option>
                <option value="4">4º Trimestre (Out-Dez)</option>
              </select>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Atos de Jul a Set = 3
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="emptyChildren"
                checked={config.emptyChildrenAs99}
                onChange={(e) => handleChange('emptyChildrenAs99', e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="emptyChildren" className="text-slate-700">
                Preencher filhos não declarados com <strong>'99'</strong> (conforme Regra 9 do PDF para campos numéricos sem valor). Desmarcar preenche com '00'.
              </label>
            </div>

            <div className="text-[11px] text-slate-500">
              * Conforme Item 4 do manual: Chave do Tabelionato = UF + MUNICÍPIO + DISTRITO + CÓDIGO CARTÓRIO
            </div>
          </div>
        </div>
      ) : (
        <div className="px-5 py-3 bg-white text-xs flex flex-wrap items-center justify-between gap-3 text-slate-600">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Cartório:</span>
              <span className="font-semibold text-slate-800">
                {config.nomeCartorio || 'SERVIÇO DISTRITAL DO UBERABA'} ({config.ufPesquisa}-{config.munPesquisa}-{config.distPesquisa}-{config.codCartorio})
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Período:</span>
              <span className="font-semibold text-slate-800">
                {config.trimPesquisa}º Trimestre de {config.anoPesquisa}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Filhos vazios:</span>
              <span className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                {config.emptyChildrenAs99 ? '99 (Regra 9)' : '00'}
              </span>
            </div>
          </div>
          <div className="text-[11px] text-emerald-700 flex items-center gap-1 font-medium">
            <CheckCircle className="w-3.5 h-3.5" />
            {totalEscrituras} escrituras prontas para exportação
          </div>
        </div>
      )}
    </div>
  );
};
