/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CartorioConfig, EscrituraRecord, RawCsvRow, ValidationItem } from './types/ibge';
import {
  DEFAULT_CONFIG,
  parseCsvToEscrituras,
  parseRawRowsToEscrituras,
  computeEscrituraAlerts,
  generateValidationSummary,
} from './utils/ibgeConverter';
import { Header } from './components/Header';
import { SummaryCards } from './components/SummaryCards';
import { CartorioConfigPanel } from './components/CartorioConfigPanel';
import { ValidationAlerts } from './components/ValidationAlerts';
import { DataTableTabs } from './components/DataTableTabs';
import { UploadModal } from './components/UploadModal';
import { EditEscrituraModal } from './components/EditEscrituraModal';
import { parseExcelFileToRawRows } from './utils/excelImporter';

export default function App() {
  const [config, setConfig] = React.useState<CartorioConfig>(DEFAULT_CONFIG);
  const [rawCsvText, setRawCsvText] = React.useState<string>('');
  const [currentRawRows, setCurrentRawRows] = React.useState<RawCsvRow[]>([]);
  const [importedFileName, setImportedFileName] = React.useState<string>('');
  const [escrituras, setEscrituras] = React.useState<EscrituraRecord[]>([]);
  const [validations, setValidations] = React.useState<ValidationItem[]>([]);
  const [activeAlertFilter, setActiveAlertFilter] = React.useState<string | null>(null);
  const [isUploadOpen, setIsUploadOpen] = React.useState(false);
  const [editingEscritura, setEditingEscritura] = React.useState<EscrituraRecord | null>(null);
  const [windowDragActive, setWindowDragActive] = React.useState(false);

  // Inicializa o aplicativo vazio conforme solicitação expressa do usuário

  // Quando a configuração do cartório muda (ex: UF, Município, Trimestre, 99 vs 00)
  const handleConfigChange = (newConfig: CartorioConfig) => {
    setConfig(newConfig);
    if (currentRawRows.length > 0) {
      const { escrituras: parsed, validations: valids } = parseRawRowsToEscrituras(
        currentRawRows,
        newConfig
      );
      setEscrituras(parsed);
      setValidations(valids);
    } else if (rawCsvText) {
      const { escrituras: parsed, validations: valids } = parseCsvToEscrituras(
        rawCsvText,
        newConfig
      );
      setEscrituras(parsed);
      setValidations(valids);
    }
  };

  // Quando um arquivo Excel (.xlsx) é importado
  const handleImportRawRows = (rows: RawCsvRow[], fileName: string) => {
    setCurrentRawRows(rows);
    setImportedFileName(fileName);
    setActiveAlertFilter(null);
    const { escrituras: parsed, validations: valids } = parseRawRowsToEscrituras(
      rows,
      config
    );
    setEscrituras(parsed);
    setValidations([
      {
        id: 'val-xlsx-success',
        tipo: 'sucesso',
        titulo: `Planilha Excel "${fileName}" Importada com Sucesso`,
        mensagem: `Foram carregadas ${rows.length} linhas de cônjuges do arquivo Excel nos mesmos moldes do layout e consolidadas em ${parsed.length} escrituras para o IBGE.`,
      },
      ...valids,
    ]);
  };

  // Quando um novo CSV é importado via texto
  const handleImportCsvText = (newCsvContent: string) => {
    setRawCsvText(newCsvContent);
    setCurrentRawRows([]);
    setImportedFileName('Arquivo CSV Importado');
    setActiveAlertFilter(null);
    const { escrituras: parsed, validations: valids } = parseCsvToEscrituras(
      newCsvContent,
      config
    );
    setEscrituras(parsed);
    setValidations(valids);
  };

  // Esvaziar todos os dados (Solicitado pelo usuário)
  const handleClearData = () => {
    setEscrituras([]);
    setRawCsvText('');
    setCurrentRawRows([]);
    setValidations([]);
    setImportedFileName('');
    setActiveAlertFilter(null);
  };

  // Salvar escritura editada e reavaliar auditorias
  const handleSaveEscritura = (updated: EscrituraRecord) => {
    const refreshed: EscrituraRecord = {
      ...updated,
      alerts: computeEscrituraAlerts(updated),
    };
    const nextEscrituras = escrituras.map((item) =>
      item.id === updated.id ? refreshed : item
    );
    setEscrituras(nextEscrituras);
    setValidations(generateValidationSummary(nextEscrituras));
  };

  // Drag and drop global na tela
  const handleWindowDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setWindowDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const isXlsx =
        file.name.endsWith('.xlsx') ||
        file.name.endsWith('.xls') ||
        file.type.includes('spreadsheet') ||
        file.type.includes('excel');

      if (isXlsx) {
        const { rawRows } = await parseExcelFileToRawRows(file);
        if (rawRows.length > 0) {
          handleImportRawRows(rawRows, file.name);
        }
      } else {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const text = ev.target?.result as string;
          if (text) {
            handleImportCsvText(text);
          }
        };
        reader.readAsText(file);
      }
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setWindowDragActive(true);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setWindowDragActive(false);
      }}
      onDrop={handleWindowDrop}
      className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 antialiased selection:bg-blue-600 selection:text-white relative"
    >
      {/* Overlay ao arrastar arquivo para a página */}
      {windowDragActive && (
        <div className="fixed inset-0 z-50 bg-blue-900/80 backdrop-blur-xs flex items-center justify-center p-6 text-white text-center">
          <div className="p-8 rounded-2xl border-4 border-dashed border-white/60 max-w-lg space-y-3">
            <div className="text-2xl font-bold">Solte seu arquivo .xlsx aqui</div>
            <p className="text-sm text-blue-100">
              O sistema processará a planilha nos mesmos moldes do CSV e a converterá instantaneamente para os parâmetros do IBGE!
            </p>
          </div>
        </div>
      )}

      {/* Cabeçalho com ações de download e esvaziar */}
      <Header
        escrituras={escrituras}
        config={config}
        rawCsvText={rawCsvText}
        onOpenUpload={() => setIsUploadOpen(true)}
        onClearData={handleClearData}
      />

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Painel de Identificação do Tabelionato */}
        <CartorioConfigPanel
          config={config}
          onChangeConfig={handleConfigChange}
          totalEscrituras={escrituras.length}
        />

        {/* Resumo Estatístico */}
        <SummaryCards escrituras={escrituras} config={config} />

        {/* Avisos e Validações */}
        <ValidationAlerts
          validations={validations}
          escrituras={escrituras}
          activeAlertFilter={activeAlertFilter}
          onSelectAlertFilter={setActiveAlertFilter}
          onEditEscritura={(e) => setEditingEscritura(e)}
        />

        {/* Tabelas e Abas */}
        <DataTableTabs
          escrituras={escrituras}
          config={config}
          activeAlertFilter={activeAlertFilter}
          onSelectAlertFilter={setActiveAlertFilter}
          onEditEscritura={(e) => setEditingEscritura(e)}
          onOpenUpload={() => setIsUploadOpen(true)}
          onClearData={handleClearData}
        />
      </main>

      {/* Rodapé informativo */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-6 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center md:text-left">
            <p className="font-semibold text-slate-300">
              Sistema Registro Civil IBGE • Diretoria de Informática CINPR/GESIP
            </p>
            <p className="text-[11px] text-slate-500">
              Emenda Constitucional nº 66/2010 e Resolução nº 175/2013 do CNJ.
              Arquivos gerados: <code>TABINF07.TXT</code> (121 bytes), <code>TABINF12.TXT</code> (26 bytes) e <code>CONTROLE.SIS</code> (0 byte).
            </p>
          </div>
          <div className="text-center md:text-right text-[11px] text-slate-500">
            <span>Para envio ao IBGE: compacte os 3 arquivos em <strong>TABINF.ZIP</strong> e entregue na Unidade mais próxima ou via Internet.</span>
          </div>
        </div>
      </footer>

      {/* Modais */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onImportRawRows={handleImportRawRows}
        onImportCsvText={handleImportCsvText}
      />

      <EditEscrituraModal
        escritura={editingEscritura}
        onClose={() => setEditingEscritura(null)}
        onSave={handleSaveEscritura}
      />
    </div>
  );
}
