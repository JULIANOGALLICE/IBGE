import React from 'react';
import {
  Download,
  FileSpreadsheet,
  Archive,
  FileText,
  Upload,
  RotateCcw,
  FileDown,
  Trash2,
} from 'lucide-react';
import { CartorioConfig, EscrituraRecord } from '../types/ibge';
import { generateIbgeExcelBlob } from '../utils/excelExporter';
import { generateImportTemplateXlsx } from '../utils/excelImporter';
import {
  downloadBlob,
  generateTabinf07Content,
  generateTabinf12Content,
  generateTabinfZipBlob,
} from '../utils/zipExporter';

interface HeaderProps {
  escrituras: EscrituraRecord[];
  config: CartorioConfig;
  rawCsvText: string;
  onOpenUpload: () => void;
  onClearData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  escrituras,
  config,
  rawCsvText,
  onOpenUpload,
  onClearData,
}) => {
  const [downloadingZip, setDownloadingZip] = React.useState(false);
  const [showDropdown, setShowDropdown] = React.useState(false);

  const handleDownloadExcel = () => {
    if (escrituras.length === 0) return;
    const blob = generateIbgeExcelBlob(escrituras, config, rawCsvText);
    const filename = `DIVORCIOS_IBGE_MODELO7_${config.anoPesquisa}_T${config.trimPesquisa}.xlsx`;
    downloadBlob(blob, filename);
  };

  const handleDownloadTemplate = () => {
    const blob = generateImportTemplateXlsx();
    downloadBlob(blob, 'Modelo_Importacao_Divorcios_Cartorio.xlsx');
  };

  const handleDownloadZip = async () => {
    if (escrituras.length === 0) return;
    try {
      setDownloadingZip(true);
      const blob = await generateTabinfZipBlob(escrituras, config);
      downloadBlob(blob, 'TABINF.ZIP');
    } finally {
      setDownloadingZip(false);
    }
  };

  const handleDownloadTxt07 = () => {
    if (escrituras.length === 0) return;
    const content = generateTabinf07Content(escrituras, config);
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, 'TABINF07.TXT');
    setShowDropdown(false);
  };

  const handleDownloadTxt12 = () => {
    if (escrituras.length === 0) return;
    const content = generateTabinf12Content(escrituras, config);
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, 'TABINF12.TXT');
    setShowDropdown(false);
  };

  const handleDownloadControleSis = () => {
    const blob = new Blob([''], { type: 'application/octet-stream' });
    downloadBlob(blob, 'CONTROLE.SIS');
    setShowDropdown(false);
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold bg-blue-600 text-white tracking-wide">
                IBGE REGISTRO CIVIL
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                Modelo 7 • Divórcios Extrajudiciais
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-slate-800 text-slate-200 border border-slate-700">
                {config.ufPesquisa}-{config.munPesquisa}-{config.distPesquisa}-{config.codCartorio} • SERVIÇO DISTRITAL DO UBERABA
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
              Conversor de Planilha Excel (.xlsx) para Layout IBGE
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Importação direta por planilha <strong>.xlsx</strong> e geração da planilha oficial com os 31 parâmetros do IBGE e pacote TABINF.ZIP
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            {/* Botão Importar XLSX */}
            <button
              onClick={onOpenUpload}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition hover:shadow-blue-900/40"
              title="Importar planilha Excel (.xlsx) com os dados de divórcio do cartório"
            >
              <Upload className="w-4 h-4 text-white" />
              Importar Planilha (.xlsx)
            </button>

            {/* Botão Baixar Modelo XLSX */}
            <button
              onClick={handleDownloadTemplate}
              title="Baixar planilha modelo Excel (.xlsx) pronta para preenchimento"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              <FileDown className="w-3.5 h-3.5 text-emerald-400" />
              Modelo (.xlsx)
            </button>

            {/* Botão Principal Excel Convertido */}
            <button
              onClick={handleDownloadExcel}
              disabled={escrituras.length === 0}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition hover:shadow-emerald-900/40 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Baixar planilha Excel com os 31 parâmetros oficiais do IBGE"
            >
              <FileSpreadsheet className="w-4 h-4 text-white" />
              Baixar Excel IBGE (.xlsx)
            </button>

            {/* Botão Pacote ZIP IBGE */}
            <button
              onClick={handleDownloadZip}
              disabled={downloadingZip || escrituras.length === 0}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg bg-indigo-700 hover:bg-indigo-600 text-white shadow-sm transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Archive className="w-4 h-4 text-white" />
              {downloadingZip ? 'Gerando...' : 'TABINF.ZIP'}
            </button>

            {/* Menu Outros Arquivos TXT */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                disabled={escrituras.length === 0}
                className="inline-flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Download className="w-3.5 h-3.5" />
                TXT
              </button>

              {showDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 rounded-lg bg-slate-800 border border-slate-700 shadow-xl z-50 py-1 text-xs">
                    <button
                      onClick={handleDownloadTxt07}
                      className="w-full text-left px-3 py-2 hover:bg-slate-700 text-slate-200 flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2 font-mono">
                        <FileText className="w-3.5 h-3.5 text-emerald-400" />
                        TABINF07.TXT
                      </span>
                      <span className="text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded">
                        121 bytes
                      </span>
                    </button>
                    <button
                      onClick={handleDownloadTxt12}
                      className="w-full text-left px-3 py-2 hover:bg-slate-700 text-slate-200 flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2 font-mono">
                        <FileText className="w-3.5 h-3.5 text-blue-400" />
                        TABINF12.TXT
                      </span>
                      <span className="text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded">
                        26 bytes
                      </span>
                    </button>
                    <button
                      onClick={handleDownloadControleSis}
                      className="w-full text-left px-3 py-2 hover:bg-slate-700 text-slate-200 flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2 font-mono">
                        <FileText className="w-3.5 h-3.5 text-amber-400" />
                        CONTROLE.SIS
                      </span>
                      <span className="text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded">
                        0 byte
                      </span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Botão Esvaziar Dados (Solicitado pelo usuário) */}
            {escrituras.length > 0 && (
              <button
                onClick={onClearData}
                title="Esvaziar todos os dados da tela"
                className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-lg bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-800 transition"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                Esvaziar Dados
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

