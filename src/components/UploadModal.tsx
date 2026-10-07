import React from 'react';
import {
  Upload,
  X,
  FileSpreadsheet,
  CheckCircle,
  Download,
  AlertCircle,
  Table,
} from 'lucide-react';
import { RawCsvRow } from '../types/ibge';
import {
  generateImportTemplateXlsx,
  parseExcelFileToRawRows,
} from '../utils/excelImporter';
import { downloadBlob } from '../utils/zipExporter';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportRawRows: (rows: RawCsvRow[], sourceName: string) => void;
  onImportCsvText: (csvText: string) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onImportRawRows,
  onImportCsvText,
}) => {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [parsedRows, setParsedRows] = React.useState<RawCsvRow[]>([]);
  const [sheetName, setSheetName] = React.useState<string>('');
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [dragActive, setDragActive] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'excel' | 'csv_text'>('excel');
  const [csvTextInput, setCsvTextInput] = React.useState('');

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const blob = generateImportTemplateXlsx();
    downloadBlob(blob, 'Modelo_Importacao_Divorcios_Cartorio.xlsx');
  };

  const processFile = async (file: File) => {
    setSelectedFile(file);
    setErrorMsg(null);
    setLoading(true);

    try {
      const isXlsx =
        file.name.endsWith('.xlsx') ||
        file.name.endsWith('.xls') ||
        file.type.includes('spreadsheet') ||
        file.type.includes('excel');

      if (isXlsx) {
        const { rawRows, sheetName } = await parseExcelFileToRawRows(file);
        if (rawRows.length === 0) {
          setErrorMsg(
            'Nenhuma linha válida encontrada na planilha. Verifique se o arquivo possui as colunas esperadas (Livro, Folha, Cônjuge, Nome, etc.).'
          );
        } else {
          setParsedRows(rawRows);
          setSheetName(sheetName);
        }
      } else {
        // Arquivo CSV/TXT
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          if (text) {
            onImportCsvText(text);
            onClose();
          }
        };
        reader.readAsText(file);
      }
    } catch (err: any) {
      setErrorMsg(
        'Erro ao processar o arquivo: ' + (err?.message || 'Formato inválido')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmImport = () => {
    if (parsedRows.length > 0) {
      onImportRawRows(
        parsedRows,
        selectedFile?.name || 'Planilha_Importada.xlsx'
      );
      onClose();
    }
  };

  const handleConfirmCsvText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvTextInput.trim()) return;
    onImportCsvText(csvTextInput);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Cabeçalho do Modal */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
                Importação por Planilha Excel (.xlsx)
                <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                  Mesmos Moldes do CSV
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Selecione sua planilha .xlsx ou arraste o arquivo gerado pelo seu sistema
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas do Modal */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 bg-slate-50 text-xs shrink-0">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('excel')}
              className={`py-3 border-b-2 font-semibold transition ${
                activeTab === 'excel'
                  ? 'border-emerald-600 text-emerald-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Upload de Arquivo XLSX / XLS
            </button>
            <button
              onClick={() => setActiveTab('csv_text')}
              className={`py-3 border-b-2 font-semibold transition ${
                activeTab === 'csv_text'
                  ? 'border-blue-600 text-blue-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Colar Texto CSV (Opcional)
            </button>
          </div>

          <button
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg transition"
            title="Baixar planilha Excel com cabeçalhos e exemplos para preenchimento"
          >
            <Download className="w-3.5 h-3.5" />
            Baixar Modelo (.xlsx)
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {activeTab === 'excel' ? (
            <>
              {/* Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition ${
                  dragActive
                    ? 'border-emerald-500 bg-emerald-50/50'
                    : 'border-slate-300 hover:border-emerald-400 bg-slate-50/60'
                }`}
              >
                <FileSpreadsheet className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-slate-800">
                    Arraste sua planilha Excel (.xlsx) aqui
                  </div>
                  <div className="text-xs text-slate-500">
                    ou{' '}
                    <label className="text-emerald-600 hover:text-emerald-700 font-semibold cursor-pointer underline">
                      <span>clique para selecionar do seu computador</span>
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            processFile(e.target.files[0]);
                          }
                        }}
                      />
                    </label>
                  </div>
                  <div className="text-[11px] text-slate-400 pt-1">
                    Compatível com planilhas Excel (.xlsx, .xls) contendo as colunas: Livro, Folha, Data, Cônjuge, Sexo, CESDI, Nome, Data Casamento, Regime, etc.
                  </div>
                </div>

                {loading && (
                  <div className="mt-3 text-xs text-blue-600 font-medium animate-pulse">
                    Lendo arquivo Excel e processando datas...
                  </div>
                )}
              </div>

              {/* Erro */}
              {errorMsg && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Pré-visualização da planilha importada */}
              {parsedRows.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-semibold text-emerald-900 block">
                          {selectedFile?.name} (Aba: &quot;{sheetName}&quot;)
                        </span>
                        <span className="text-[11px] text-emerald-700">
                          {parsedRows.length} linhas de cônjuges identificadas • Prontas para conversão ao layout do IBGE
                        </span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white font-mono">
                      {Math.ceil(parsedRows.length / 2)} escrituras estimadas
                    </span>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                      <Table className="w-3.5 h-3.5 text-slate-500" />
                      Prévia dos primeiros registros detectados no Excel:
                    </div>
                    <div className="max-h-48 overflow-auto border border-slate-200 rounded-lg text-[11px]">
                      <table className="w-full text-left divide-y divide-slate-200">
                        <thead className="bg-slate-100 text-slate-700 font-mono text-[10px] uppercase sticky top-0">
                          <tr>
                            <th className="py-2 px-2.5">Livro</th>
                            <th className="py-2 px-2.5">Folha</th>
                            <th className="py-2 px-2.5">Data Ato</th>
                            <th className="py-2 px-2.5">Cônj.</th>
                            <th className="py-2 px-2.5">Nome</th>
                            <th className="py-2 px-2.5">Regime</th>
                            <th className="py-2 px-2.5">Residência (Mun / UF)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-sans">
                          {parsedRows.slice(0, 8).map((r, i) => (
                            <tr key={i} className="hover:bg-slate-50">
                              <td className="py-1.5 px-2.5 font-mono font-medium text-slate-800">
                                {r.livro}
                              </td>
                              <td className="py-1.5 px-2.5 font-mono text-slate-600">
                                {r.folha}
                              </td>
                              <td className="py-1.5 px-2.5 font-mono text-slate-600">
                                {r.data}
                              </td>
                              <td className="py-1.5 px-2.5 font-mono text-center text-slate-600">
                                {r.conjugeNum || (i % 2 === 0 ? '1' : '2')}
                              </td>
                              <td className="py-1.5 px-2.5 font-medium text-slate-900">
                                {r.nome}
                              </td>
                              <td className="py-1.5 px-2.5 text-slate-600">
                                {r.regime}
                              </td>
                              <td className="py-1.5 px-2.5 text-slate-600">
                                {r.residencia} ({r.ufRes})
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {parsedRows.length > 8 && (
                      <div className="text-[11px] text-slate-400 text-center mt-1">
                        ... e mais {parsedRows.length - 8} linhas de cônjuges no arquivo
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <form onSubmit={handleConfirmCsvText} className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700">
                Cole o conteúdo em formato CSV:
              </label>
              <textarea
                rows={8}
                value={csvTextInput}
                onChange={(e) => setCsvTextInput(e.target.value)}
                placeholder="Livro;Folha;;Data;Cônjuge;Sexo;CESDI;Nome;Data Casamento;Regime..."
                className="w-full p-3 font-mono text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!csvTextInput.trim()}
                className="w-full py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition disabled:opacity-50"
              >
                Processar Texto CSV
              </button>
            </form>
          )}
        </div>

        {/* Rodapé com Ações */}
        {activeTab === 'excel' && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
            <div className="text-[11px] text-slate-500">
              * A planilha será convertida para os 31 parâmetros do Layout IBGE MAIO/2020
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={parsedRows.length === 0}
                onClick={handleConfirmImport}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle className="w-4 h-4" />
                Converter Planilha para o Layout IBGE ({parsedRows.length} linhas)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
