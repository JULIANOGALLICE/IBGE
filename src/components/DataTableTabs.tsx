import React from 'react';
import {
  FileSpreadsheet,
  Users,
  Code2,
  FileCheck,
  BookOpen,
  Search,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Calendar,
  AlertTriangle,
  Upload,
  FileDown,
  Filter,
  X,
  Trash2,
  Pencil,
} from 'lucide-react';
import { CartorioConfig, EscrituraRecord } from '../types/ibge';
import {
  buildTabinf07Row,
  buildTabinf12Summary,
  formatDDMMAAAAToDisplay,
  parseDDMMAAAAToDate,
} from '../utils/ibgeConverter';
import { generateImportTemplateXlsx } from '../utils/excelImporter';
import { downloadBlob } from '../utils/zipExporter';

interface DataTableTabsProps {
  escrituras: EscrituraRecord[];
  config: CartorioConfig;
  activeAlertFilter: string | null;
  onSelectAlertFilter: (filter: string | null) => void;
  onEditEscritura?: (escritura: EscrituraRecord) => void;
  onOpenUpload: () => void;
  onClearData?: () => void;
}

export const DataTableTabs: React.FC<DataTableTabsProps> = ({
  escrituras,
  config,
  activeAlertFilter,
  onSelectAlertFilter,
  onEditEscritura,
  onOpenUpload,
  onClearData,
}) => {
  const [activeTab, setActiveTab] = React.useState<
    'planilha' | 'conferencia' | 'txt07' | 'recibo12' | 'manual'
  >('planilha');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [pageSize, setPageSize] = React.useState(15);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set());
  const [planilhaViewMode, setPlanilhaViewMode] = React.useState<'comum' | 'todas'>('comum');

  // Troca automaticamente para a aba de conferência e alertas se um filtro for acionado
  React.useEffect(() => {
    if (activeAlertFilter) {
      setActiveTab('conferencia');
    }
  }, [activeAlertFilter]);

  // Filtro de busca e filtro de alertas
  const filteredEscrituras = React.useMemo(() => {
    let list = escrituras;

    if (activeAlertFilter) {
      list = list.filter((e) =>
        e.alerts?.some((a) => a.type === activeAlertFilter)
      );
    }

    if (!searchTerm.trim()) return list;
    const term = searchTerm.toLowerCase();
    return list.filter(
      (e) =>
        e.livro.toLowerCase().includes(term) ||
        e.folhaInicial.includes(term) ||
        e.conjuge1.nome.toLowerCase().includes(term) ||
        e.conjuge2.nome.toLowerCase().includes(term) ||
        e.regimeBensNome.toLowerCase().includes(term) ||
        e.conjuge1.cidadeRes.toLowerCase().includes(term) ||
        e.conjuge2.cidadeRes.toLowerCase().includes(term)
    );
  }, [escrituras, activeAlertFilter, searchTerm]);

  // Paginação
  const totalPages = Math.ceil(filteredEscrituras.length / pageSize) || 1;
  const paginatedEscrituras = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEscrituras.slice(start, start + pageSize);
  }, [filteredEscrituras, currentPage, pageSize]);

  const handleCopyLine = (line: string, index: number) => {
    navigator.clipboard.writeText(line);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleDownloadTemplate = () => {
    const blob = generateImportTemplateXlsx();
    downloadBlob(blob, 'Modelo_Importacao_Divorcios_Cartorio.xlsx');
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const isAllExpanded =
    paginatedEscrituras.length > 0 &&
    paginatedEscrituras.every((e) => expandedIds.has(e.id));

  const toggleExpandAll = () => {
    if (isAllExpanded) {
      setExpandedIds(new Set());
    } else {
      setExpandedIds(new Set(paginatedEscrituras.map((e) => e.id)));
    }
  };

  const getAgeAtMarriage = (dataNasc?: string, dataCasam?: string) => {
    if (!dataNasc || !dataCasam || dataNasc === '99999999' || dataCasam === '99999999') return null;
    const dN = parseDDMMAAAAToDate(dataNasc);
    const dC = parseDDMMAAAAToDate(dataCasam);
    if (!dN || !dC) return null;
    const diffYears = (dC.getTime() - dN.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    if (diffYears < 0) return 'Inconsistente (nascido após casamento)';
    return `${Math.floor(diffYears)} anos ao casar`;
  };

  const summary12 = buildTabinf12Summary(escrituras, config);

  // Rótulo do filtro ativo
  const alertFilterLabels: Record<string, string> = {
    mesmo_sexo: 'Casais com o mesmo sexo (M/M ou F/F)',
    casamento_recente: 'Casamento recente (< 3 meses da data do divórcio)',
    casamento_longo_sem_filhos: 'Casamento > 18 anos sem filhos declarados',
    diferenca_idade_maior_10: 'Diferença de idade do casal superior a 10 anos',
    menor_18_no_casamento: 'Cônjuge menor de 18 anos na data do casamento',
    sem_regime: 'Sem regime de bens informado (código 9)',
    sem_data_casamento: 'Sem data de casamento informada',
    sem_data_nascimento: 'Sem data de nascimento informada',
    sem_cidade_nascimento: 'Sem cidade de nascimento informada',
    sem_cidade_residencia: 'Sem cidade de residência informada',
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Barra de Abas */}
      <div className="flex border-b border-slate-200 bg-slate-50 overflow-x-auto text-xs font-medium">
        <button
          onClick={() => setActiveTab('planilha')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition whitespace-nowrap ${
            activeTab === 'planilha'
              ? 'border-emerald-600 text-emerald-800 bg-white font-semibold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          Planilha Excel / Layout IBGE (31 Colunas)
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-mono">
            {escrituras.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('conferencia')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition whitespace-nowrap ${
            activeTab === 'conferencia'
              ? 'border-blue-600 text-blue-800 bg-white font-semibold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
          }`}
        >
          <Users className="w-4 h-4 text-blue-600" />
          Conferência Detalhada de Cônjuges & Alertas
        </button>

        <button
          onClick={() => setActiveTab('txt07')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition whitespace-nowrap ${
            activeTab === 'txt07'
              ? 'border-indigo-600 text-indigo-800 bg-white font-semibold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
          }`}
        >
          <Code2 className="w-4 h-4 text-indigo-600" />
          TABINF07.TXT (121 bytes)
        </button>

        <button
          onClick={() => setActiveTab('recibo12')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition whitespace-nowrap ${
            activeTab === 'recibo12'
              ? 'border-purple-600 text-purple-800 bg-white font-semibold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
          }`}
        >
          <FileCheck className="w-4 h-4 text-purple-600" />
          TABINF12.TXT (Recibo / Resumo)
        </button>

        <button
          onClick={() => setActiveTab('manual')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition whitespace-nowrap ${
            activeTab === 'manual'
              ? 'border-amber-600 text-amber-800 bg-white font-semibold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
          }`}
        >
          <BookOpen className="w-4 h-4 text-amber-600" />
          Dicionário e Regras do PDF
        </button>
      </div>

      {/* Conteúdo das Abas */}
      <div className="p-4 sm:p-5">
        {/* Caso Estado Vazio (Zero Escrituras) */}
        {escrituras.length === 0 && activeTab !== 'manual' ? (
          <div className="text-center py-12 px-4 max-w-xl mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100 shadow-xs">
              <FileSpreadsheet className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-800">
                Nenhum dado carregado no momento
              </h3>
              <p className="text-xs text-slate-500">
                Importe sua planilha de divórcios <strong>.xlsx</strong> ou <strong>.csv</strong> para validar e gerar os arquivos oficiais do IBGE.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={onOpenUpload}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-sm transition"
              >
                <Upload className="w-4 h-4" />
                Importar Planilha (.xlsx / .csv)
              </button>

              <button
                onClick={handleDownloadTemplate}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition"
              >
                <FileDown className="w-4 h-4 text-emerald-600" />
                Baixar Modelo (.xlsx)
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Controles de Busca, Filtro Ativo e Paginação */}
            {(activeTab === 'planilha' || activeTab === 'conferencia' || activeTab === 'txt07') && (
              <div className="mb-4 space-y-2.5">
                {/* Indicador de Filtro de Alerta Ativo */}
                {activeAlertFilter && (
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-300 flex items-center justify-between text-xs text-amber-900">
                    <div className="flex items-center gap-2">
                      <Filter className="w-3.5 h-3.5 text-amber-700" />
                      <span>
                        Exibindo apenas registros com o alerta:{' '}
                        <strong>{alertFilterLabels[activeAlertFilter] || activeAlertFilter}</strong>{' '}
                        ({filteredEscrituras.length} encontrados)
                      </span>
                    </div>
                    <button
                      onClick={() => onSelectAlertFilter(null)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 hover:text-amber-950 underline"
                    >
                      <X className="w-3 h-3" />
                      Remover filtro
                    </button>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <div className="relative w-full sm:w-80">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder="Buscar por livro, cônjuge, cidade, regime..."
                      className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <span>Exibir:</span>
                      <select
                        value={pageSize}
                        onChange={(e) => {
                          setPageSize(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="px-2 py-1 border border-slate-300 rounded-md font-medium text-slate-700 focus:outline-none"
                      >
                        <option value={10}>10</option>
                        <option value={15}>15</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>Todos</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">
                        {filteredEscrituras.length > 0 ? (
                          <>
                            Pág. {currentPage} de {totalPages} ({filteredEscrituras.length} registros)
                          </>
                        ) : (
                          'Nenhum resultado'
                        )}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          disabled={currentPage <= 1}
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          className="p-1 rounded border border-slate-300 text-slate-600 disabled:opacity-40 hover:bg-slate-100 transition"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          disabled={currentPage >= totalPages}
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          className="p-1 rounded border border-slate-300 text-slate-600 disabled:opacity-40 hover:bg-slate-100 transition"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {onClearData && (
                      <button
                        onClick={onClearData}
                        title="Esvaziar todos os dados da tabela"
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition shrink-0"
                      >
                        <Trash2 className="w-3 h-3 text-rose-600" />
                        Esvaziar Dados
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ABA 1: Planilha Excel Layout Oficial */}
            {activeTab === 'planilha' && (
              <div>
                {/* Barra Superior da Planilha: Explicação, Expandir Partes e Alternador de Modo */}
                <div className="mb-3 p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold text-slate-800">
                        Listagem da Planilha • Dados em Comum na Linha
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {planilhaViewMode === 'comum'
                        ? 'Linha de exibição com os dados em comum da escritura (Colunas 1 a 17). Botão Editar no início da linha. Clique em "Partes" para expandir e conferir os cônjuges (Colunas 18 a 31).'
                        : 'Modo auditoria direta com todas as 31 colunas lado a lado (conforme Seção 6.1 do IBGE). Botão Editar no início da linha.'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {/* Botão Expandir / Recolher Todas as Partes (visível no modo comum) */}
                    {planilhaViewMode === 'comum' && (
                      <button
                        type="button"
                        onClick={toggleExpandAll}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold shadow-xs transition"
                        title={isAllExpanded ? 'Recolher os dados das partes de todas as escrituras' : 'Expandir os dados das partes de todas as escrituras'}
                      >
                        <ChevronsUpDown className="w-3.5 h-3.5 text-slate-500" />
                        <span>{isAllExpanded ? 'Recolher Todas as Partes' : 'Expandir Todas as Partes'}</span>
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600 font-mono font-normal">
                          {expandedIds.size}/{paginatedEscrituras.length}
                        </span>
                      </button>
                    )}

                    {/* Alternador de Modo de Exibição */}
                    <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5 text-[11px] font-medium text-slate-600 shadow-xs">
                      <button
                        type="button"
                        onClick={() => setPlanilhaViewMode('comum')}
                        className={`px-2.5 py-1 rounded-md transition ${
                          planilhaViewMode === 'comum'
                            ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                            : 'hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        Dados em Comum + Partes Expansíveis
                      </button>
                      <button
                        type="button"
                        onClick={() => setPlanilhaViewMode('todas')}
                        className={`px-2.5 py-1 rounded-md transition ${
                          planilhaViewMode === 'todas'
                            ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                            : 'hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        Todas as 31 Colunas
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tabela de Dados */}
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-[11px] text-left border-collapse">
                    <thead className="bg-slate-800 text-slate-200 font-mono text-[10px] tracking-wider uppercase sticky top-0 z-10">
                      <tr>
                        {/* BOTÃO EDITAR NO INÍCIO DA LINHA */}
                        <th className="py-2.5 px-2 text-center border-r border-slate-700 w-20 bg-slate-900 sticky left-0 z-20">
                          EDITAR
                        </th>

                        {planilhaViewMode === 'comum' && (
                          <th className="py-2.5 px-2 text-center border-r border-slate-700 w-24">
                            PARTES
                          </th>
                        )}

                        <th className="py-2.5 px-2 text-center border-r border-slate-700 w-10">#</th>
                        <th className="py-2.5 px-2 border-r border-slate-700 min-w-28">ALERTAS</th>

                        {/* COLUNAS 1 A 17 (DADOS EM COMUM DA ESCRITURA) */}
                        <th className="py-2.5 px-2 border-r border-slate-700" title="1: UF-PESQUISA (02)">1. UF</th>
                        <th className="py-2.5 px-2 border-r border-slate-700" title="2: MUN-PESQUISA (05)">2. MUN</th>
                        <th className="py-2.5 px-2 border-r border-slate-700" title="3: DIST-PESQUISA (02)">3. DIST</th>
                        <th className="py-2.5 px-2 border-r border-slate-700" title="4: COD_CARTORIO (02)">4. CART</th>
                        <th className="py-2.5 px-2 border-r border-slate-700" title="5: ANO-PESQUISA (04)">5. ANO</th>
                        <th className="py-2.5 px-2 border-r border-slate-700" title="6: TRIM-PESQUISA (01)">6. TRIM</th>
                        <th className="py-2.5 px-2 border-r border-slate-700 min-w-24" title="7: NUM-LIVRO (18)">7. LIVRO</th>
                        <th className="py-2.5 px-2 border-r border-slate-700" title="8: NUM-INICIAL-FOLHA (04)">8. FOLHA-INI</th>
                        <th className="py-2.5 px-2 border-r border-slate-700" title="9: NUM-FINAL-FOLHA (04)">9. FOLHA-FIM</th>
                        <th className="py-2.5 px-2 border-r border-slate-700" title="10: COMPL-FOLHA (01)">10. CMPL</th>
                        <th className="py-2.5 px-2 border-r border-slate-700 min-w-20" title="11: DATA-ABERT-ESCRIT (08)">11. D-ABERT</th>
                        <th className="py-2.5 px-2 border-r border-slate-700 min-w-20" title="12: DATA-ATO-NOTARIAL (08)">12. D-NOTARIAL</th>
                        <th className="py-2.5 px-2 border-r border-slate-700 min-w-20" title="13: DATA-CASAMENTO (08)">13. D-CASAM</th>
                        <th className="py-2.5 px-2 border-r border-slate-700" title="14: REGIME-BENS (01)">14. REGIME</th>
                        <th className="py-2.5 px-2 border-r border-slate-700" title="15: NUM-FILHO-MAIOR (02)">15. F-MAIOR</th>
                        <th className="py-2.5 px-2 border-r border-slate-700" title="16: NUM-FILHO-MENOR (02)">16. F-MENOR</th>
                        <th className="py-2.5 px-2 border-r border-slate-700" title="17: COD_RESP_FILHO (01)">17. RESP-F</th>

                        {/* SE ESTIVER NO MODO TODAS AS 31 COLUNAS, ADICIONA AS COLUNAS 18 A 31 */}
                        {planilhaViewMode === 'todas' && (
                          <>
                            <th className="py-2.5 px-2 border-r border-slate-700" title="18: COD-UF-RES-CONJ1 (02)">18. UF-R1</th>
                            <th className="py-2.5 px-2 border-r border-slate-700" title="19: COD-MUN-RES-CONJ1 (05)">19. MUN-R1</th>
                            <th className="py-2.5 px-2 border-r border-slate-700" title="20: COD-PAIS-RES-CONJ1 (03)">20. PAIS-R1</th>
                            <th className="py-2.5 px-2 border-r border-slate-700" title="21: COD-UF-RES-CONJ2 (02)">21. UF-R2</th>
                            <th className="py-2.5 px-2 border-r border-slate-700" title="22: COD-MUN-RES-CONJ2 (05)">22. MUN-R2</th>
                            <th className="py-2.5 px-2 border-r border-slate-700" title="23: COD-PAIS-RES-CONJ2 (03)">23. PAIS-R2</th>
                            <th className="py-2.5 px-2 border-r border-slate-700" title="24: COD-UF-NASC-CONJ1 (02)">24. UF-N1</th>
                            <th className="py-2.5 px-2 border-r border-slate-700" title="25: COD-PAIS-NASC-CONJ1 (03)">25. PAIS-N1</th>
                            <th className="py-2.5 px-2 border-r border-slate-700" title="26: COD-UF-NASC-CONJ2 (02)">26. UF-N2</th>
                            <th className="py-2.5 px-2 border-r border-slate-700" title="27: COD-PAIS-NASC-CONJ2 (03)">27. PAIS-N2</th>
                            <th className="py-2.5 px-2 border-r border-slate-700 min-w-20" title="28: DATA-NASC-CONJ1 (08)">28. D-NASC1</th>
                            <th className="py-2.5 px-2 border-r border-slate-700 min-w-20" title="29: DATA-NASC-CONJ2 (08)">29. D-NASC2</th>
                            <th className="py-2.5 px-2 border-r border-slate-700" title="30: SEXO-CONJ1 (01)">30. SX1</th>
                            <th className="py-2.5 px-2 border-r border-slate-700" title="31: SEXO-CONJ2 (01)">31. SX2</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono">
                      {paginatedEscrituras.map((e, idx) => {
                        const row = buildTabinf07Row(e, config);
                        const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                        const hasAlerts = e.alerts && e.alerts.length > 0;
                        const isSameSex = e.alerts?.some((a) => a.type === 'mesmo_sexo');
                        const isExpanded = expandedIds.has(e.id);
                        const colSpanCount = planilhaViewMode === 'comum' ? 21 : 34;

                        const age1AtMarriage = getAgeAtMarriage(e.conjuge1.dataNascimento, e.dataCasamento);
                        const age2AtMarriage = getAgeAtMarriage(e.conjuge2.dataNascimento, e.dataCasamento);

                        return (
                          <React.Fragment key={e.id}>
                            <tr
                              onClick={() => {
                                if (planilhaViewMode === 'comum') toggleExpand(e.id);
                              }}
                              className={`transition cursor-pointer select-none ${
                                isExpanded
                                  ? 'bg-blue-50/70 border-l-4 border-blue-600'
                                  : isSameSex
                                  ? 'bg-amber-50/40 hover:bg-amber-100/50'
                                  : hasAlerts
                                  ? 'hover:bg-slate-50'
                                  : 'hover:bg-blue-50/40'
                              }`}
                            >
                              {/* 1. BOTÃO EDITAR NO INÍCIO DA LINHA */}
                              <td
                                className="py-2 px-2 text-center border-r border-slate-200 bg-white sticky left-0 z-10"
                                onClick={(ev) => ev.stopPropagation()}
                              >
                                {onEditEscritura && (
                                  <button
                                    type="button"
                                    onClick={() => onEditEscritura(e)}
                                    title="Editar dados desta escritura"
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold font-sans text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 shadow-2xs transition"
                                  >
                                    <Pencil className="w-3 h-3 text-blue-600" />
                                    <span>Editar</span>
                                  </button>
                                )}
                              </td>

                              {/* 2. BOTÃO EXPANDIR PARTES (NO MODO COMUM) */}
                              {planilhaViewMode === 'comum' && (
                                <td
                                  className="py-2 px-2 text-center border-r border-slate-100 whitespace-nowrap"
                                  onClick={(ev) => {
                                    ev.stopPropagation();
                                    toggleExpand(e.id);
                                  }}
                                >
                                  <button
                                    type="button"
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-sans font-medium transition border ${
                                      isExpanded
                                        ? 'bg-slate-800 text-white border-slate-800 shadow-2xs'
                                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                                    }`}
                                  >
                                    <span>{isExpanded ? 'Recolher' : 'Partes'}</span>
                                    {isExpanded ? (
                                      <ChevronUp className="w-3 h-3" />
                                    ) : (
                                      <ChevronDown className="w-3 h-3" />
                                    )}
                                  </button>
                                </td>
                              )}

                              {/* 3. ÍNDICE # */}
                              <td className="py-2 px-2 text-center text-slate-400 bg-slate-50 border-r border-slate-200 font-bold">
                                {globalIdx}
                              </td>

                              {/* 4. ALERTAS */}
                              <td className="py-2 px-2 border-r border-slate-100 whitespace-nowrap">
                                {hasAlerts ? (
                                  <div className="flex items-center gap-1">
                                    {e.alerts?.map((al, ai) => (
                                      <span
                                        key={ai}
                                        title={al.label}
                                        className={`px-1.5 py-0.5 rounded text-[9px] font-sans font-bold flex items-center gap-0.5 ${
                                          al.type === 'mesmo_sexo'
                                            ? 'bg-amber-200 text-amber-900 border border-amber-300'
                                            : al.type === 'casamento_recente'
                                            ? 'bg-rose-200 text-rose-950 border border-rose-400'
                                            : al.type === 'casamento_longo_sem_filhos'
                                            ? 'bg-orange-100 text-orange-900 border border-orange-300'
                                            : al.type === 'diferenca_idade_maior_10'
                                            ? 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                                            : al.type === 'menor_18_no_casamento'
                                            ? 'bg-red-200 text-red-950 border border-red-400'
                                            : al.type === 'sem_regime'
                                            ? 'bg-purple-100 text-purple-800'
                                            : al.type === 'sem_data_casamento'
                                            ? 'bg-rose-100 text-rose-800'
                                            : al.type === 'sem_data_nascimento'
                                            ? 'bg-slate-200 text-slate-800'
                                            : 'bg-blue-100 text-blue-900'
                                        }`}
                                      >
                                        <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                                        {al.type === 'mesmo_sexo'
                                          ? `Mesmo Sexo (${e.conjuge1.sexo === '1' ? 'M/M' : 'F/F'})`
                                          : al.type === 'casamento_recente'
                                          ? 'Casam < 3m'
                                          : al.type === 'casamento_longo_sem_filhos'
                                          ? '> 18a Sem Filhos'
                                          : al.type === 'diferenca_idade_maior_10'
                                          ? 'Dif Idade > 10a'
                                          : al.type === 'menor_18_no_casamento'
                                          ? 'Menor ao Casar'
                                          : al.type === 'sem_regime'
                                          ? 'Sem Regime'
                                          : al.type === 'sem_data_casamento'
                                          ? 'Sem Casamento'
                                          : al.type === 'sem_data_nascimento'
                                          ? 'Sem Nasc'
                                          : 'Sem Cidade'}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-emerald-600 font-sans flex items-center gap-0.5">
                                    <Check className="w-3 h-3" /> OK
                                  </span>
                                )}
                              </td>

                              {/* COLUNAS 1 A 17 (DADOS EM COMUM DA ESCRITURA) */}
                              <td className="py-2 px-2 border-r border-slate-100 text-slate-700 font-semibold">{row.ufPesquisa}</td>
                              <td className="py-2 px-2 border-r border-slate-100 text-slate-700">{row.munPesquisa}</td>
                              <td className="py-2 px-2 border-r border-slate-100 text-slate-700">{row.distPesquisa}</td>
                              <td className="py-2 px-2 border-r border-slate-100 text-slate-700">{row.codCartorio}</td>
                              <td className="py-2 px-2 border-r border-slate-100 text-slate-700">{row.anoPesquisa}</td>
                              <td className="py-2 px-2 border-r border-slate-100 text-slate-700">{row.trimPesquisa}</td>
                              <td className="py-2 px-2 border-r border-slate-100 text-blue-700 font-semibold">
                                {row.numLivro.trim()}
                              </td>
                              <td className="py-2 px-2 border-r border-slate-100 text-slate-700">{row.numInicialFolha}</td>
                              <td className="py-2 px-2 border-r border-slate-100 text-slate-700">{row.numFinalFolha}</td>
                              <td className="py-2 px-2 border-r border-slate-100 text-slate-700">{row.complFolha}</td>
                              <td className="py-2 px-2 border-r border-slate-100 text-slate-700">{row.dataAbertEscrit}</td>
                              <td className="py-2 px-2 border-r border-slate-100 text-slate-700">{row.dataAtoNotarial}</td>
                              <td
                                className={`py-2 px-2 border-r border-slate-100 ${
                                  row.dataCasamento === '99999999'
                                    ? 'bg-rose-50 text-rose-700 font-bold'
                                    : 'text-slate-700'
                                }`}
                              >
                                {row.dataCasamento}
                              </td>
                              <td
                                className={`py-2 px-2 border-r border-slate-100 text-center font-bold ${
                                  row.regimeBens === '9'
                                    ? 'bg-purple-100 text-purple-900'
                                    : 'text-purple-700'
                                }`}
                              >
                                {row.regimeBens}
                              </td>
                              <td className="py-2 px-2 border-r border-slate-100 text-center">{row.numFilhoMaior}</td>
                              <td className="py-2 px-2 border-r border-slate-100 text-center">{row.numFilhoMenor}</td>
                              <td className="py-2 px-2 border-r border-slate-100 text-center">{row.codRespFilho}</td>

                              {/* COLUNAS 18 A 31 QUANDO NO MODO TODAS AS 31 COLUNAS */}
                              {planilhaViewMode === 'todas' && (
                                <>
                                  <td className="py-2 px-2 border-r border-slate-100 text-slate-700">{row.codUfResConj1}</td>
                                  <td
                                    className={`py-2 px-2 border-r border-slate-100 ${
                                      row.codMunResConj1 === '99999' ? 'text-amber-700 font-bold' : 'text-slate-700'
                                    }`}
                                  >
                                    {row.codMunResConj1}
                                  </td>
                                  <td className="py-2 px-2 border-r border-slate-100 text-slate-700">{row.codPaisResConj1}</td>
                                  <td className="py-2 px-2 border-r border-slate-100 text-slate-700">{row.codUfResConj2}</td>
                                  <td
                                    className={`py-2 px-2 border-r border-slate-100 ${
                                      row.codMunResConj2 === '99999' ? 'text-amber-700 font-bold' : 'text-slate-700'
                                    }`}
                                  >
                                    {row.codMunResConj2}
                                  </td>
                                  <td className="py-2 px-2 border-r border-slate-100 text-slate-700">{row.codPaisResConj2}</td>
                                  <td className="py-2 px-2 border-r border-slate-100 text-slate-700">{row.codUfNascConj1}</td>
                                  <td className="py-2 px-2 border-r border-slate-100 text-slate-700">{row.codPaisNascConj1}</td>
                                  <td className="py-2 px-2 border-r border-slate-100 text-slate-700">{row.codUfNascConj2}</td>
                                  <td className="py-2 px-2 border-r border-slate-100 text-slate-700">{row.codPaisNascConj2}</td>
                                  <td
                                    className={`py-2 px-2 border-r border-slate-100 ${
                                      row.dataNascConj1 === '99999999' ? 'text-orange-700 font-bold' : 'text-slate-700'
                                    }`}
                                  >
                                    {row.dataNascConj1}
                                  </td>
                                  <td
                                    className={`py-2 px-2 border-r border-slate-100 ${
                                      row.dataNascConj2 === '99999999' ? 'text-orange-700 font-bold' : 'text-slate-700'
                                    }`}
                                  >
                                    {row.dataNascConj2}
                                  </td>
                                  <td
                                    className={`py-2 px-2 border-r border-slate-100 text-center font-bold ${
                                      isSameSex ? 'bg-amber-100 text-amber-900' : 'text-blue-600'
                                    }`}
                                  >
                                    {row.sexoConj1}
                                  </td>
                                  <td
                                    className={`py-2 px-2 border-r border-slate-100 text-center font-bold ${
                                      isSameSex ? 'bg-amber-100 text-amber-900' : 'text-rose-600'
                                    }`}
                                  >
                                    {row.sexoConj2}
                                  </td>
                                </>
                              )}
                            </tr>

                            {/* SUB-LINHA EXPANDIDA: MOSTRA AS PARTES E SEUS DADOS */}
                            {planilhaViewMode === 'comum' && isExpanded && (
                              <tr className="bg-slate-50 border-b-2 border-blue-200">
                                <td colSpan={colSpanCount} className="p-4 font-sans text-xs">
                                  <div className="bg-white border border-blue-200 rounded-xl p-4 shadow-xs space-y-3">
                                    {/* Cabeçalho da Expansão */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
                                      <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                                          <Users className="w-4 h-4" />
                                        </div>
                                        <div>
                                          <span className="font-bold text-slate-900 text-sm">
                                            Partes da Escritura • Livro {e.livro} • Folha {e.folhaInicial}
                                          </span>
                                          <span className="block text-[11px] text-slate-500">
                                            Dados individuais dos cônjuges (Colunas 18 a 31 do Manual Oficial TABINF07)
                                          </span>
                                        </div>
                                      </div>

                                      {onEditEscritura && (
                                        <button
                                          type="button"
                                          onClick={() => onEditEscritura(e)}
                                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition shrink-0"
                                        >
                                          <Pencil className="w-3.5 h-3.5" />
                                          <span>Editar Dados desta Escritura</span>
                                        </button>
                                      )}
                                    </div>

                                    {/* Cards das Partes (Cônjuge 1 e Cônjuge 2) */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {/* Cônjuge 1 */}
                                      <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 space-y-2.5">
                                        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                                          <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                                            <span className="w-5 h-5 rounded-md bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                                              1
                                            </span>
                                            CÔNJUGE 1: {e.conjuge1.nome}
                                          </span>
                                          <span
                                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                              e.conjuge1.sexo === '1'
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-rose-100 text-rose-800'
                                            }`}
                                          >
                                            Col. 30 (Sexo): {e.conjuge1.sexo === '1' ? '1 (Masc)' : '2 (Fem)'}
                                          </span>
                                        </div>

                                        <div className="space-y-1.5 text-[11px] text-slate-700">
                                          <div className="flex justify-between py-0.5 border-b border-slate-100">
                                            <span className="text-slate-500">Col. 28 - Data de Nascimento:</span>
                                            <span className="font-semibold font-mono">
                                              {formatDDMMAAAAToDisplay(e.conjuge1.dataNascimento)}
                                              {age1AtMarriage && (
                                                <span className="ml-1 text-[10px] text-slate-500 font-sans font-normal">
                                                  ({age1AtMarriage})
                                                </span>
                                              )}
                                            </span>
                                          </div>

                                          <div className="flex justify-between py-0.5 border-b border-slate-100">
                                            <span className="text-slate-500">Cols. 18-20 - Residência:</span>
                                            <span className="font-medium text-right">
                                              {e.conjuge1.cidadeRes ? `${e.conjuge1.cidadeRes} / ` : ''}
                                              <span className="font-mono text-slate-800">
                                                UF: {row.codUfResConj1} • Mun: {row.codMunResConj1} • País: {row.codPaisResConj1}
                                              </span>
                                            </span>
                                          </div>

                                          <div className="flex justify-between py-0.5">
                                            <span className="text-slate-500">Cols. 24-25 - Naturalidade:</span>
                                            <span className="font-medium text-right">
                                              {e.conjuge1.cidadeNasc ? `${e.conjuge1.cidadeNasc} / ` : ''}
                                              <span className="font-mono text-slate-800">
                                                UF: {row.codUfNascConj1} • País: {row.codPaisNascConj1}
                                              </span>
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Cônjuge 2 */}
                                      <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 space-y-2.5">
                                        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                                          <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                                            <span className="w-5 h-5 rounded-md bg-purple-600 text-white text-[10px] font-bold flex items-center justify-center">
                                              2
                                            </span>
                                            CÔNJUGE 2: {e.conjuge2.nome}
                                          </span>
                                          <span
                                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                              e.conjuge2.sexo === '1'
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-rose-100 text-rose-800'
                                            }`}
                                          >
                                            Col. 31 (Sexo): {e.conjuge2.sexo === '1' ? '1 (Masc)' : '2 (Fem)'}
                                          </span>
                                        </div>

                                        <div className="space-y-1.5 text-[11px] text-slate-700">
                                          <div className="flex justify-between py-0.5 border-b border-slate-100">
                                            <span className="text-slate-500">Col. 29 - Data de Nascimento:</span>
                                            <span className="font-semibold font-mono">
                                              {formatDDMMAAAAToDisplay(e.conjuge2.dataNascimento)}
                                              {age2AtMarriage && (
                                                <span className="ml-1 text-[10px] text-slate-500 font-sans font-normal">
                                                  ({age2AtMarriage})
                                                </span>
                                              )}
                                            </span>
                                          </div>

                                          <div className="flex justify-between py-0.5 border-b border-slate-100">
                                            <span className="text-slate-500">Cols. 21-23 - Residência:</span>
                                            <span className="font-medium text-right">
                                              {e.conjuge2.cidadeRes ? `${e.conjuge2.cidadeRes} / ` : ''}
                                              <span className="font-mono text-slate-800">
                                                UF: {row.codUfResConj2} • Mun: {row.codMunResConj2} • País: {row.codPaisResConj2}
                                              </span>
                                            </span>
                                          </div>

                                          <div className="flex justify-between py-0.5">
                                            <span className="text-slate-500">Cols. 26-27 - Naturalidade:</span>
                                            <span className="font-medium text-right">
                                              {e.conjuge2.cidadeNasc ? `${e.conjuge2.cidadeNasc} / ` : ''}
                                              <span className="font-mono text-slate-800">
                                                UF: {row.codUfNascConj2} • País: {row.codPaisNascConj2}
                                              </span>
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Faixa com as Colunas Oficiais 18 a 31 do IBGE */}
                                    <div className="pt-2 border-t border-slate-200">
                                      <div className="flex items-center gap-1.5 mb-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                                        <span>Layout Oficial TABINF07 (Colunas 18 a 31):</span>
                                      </div>
                                      <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10px]">
                                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
                                          18.UF-R1: <strong>{row.codUfResConj1}</strong>
                                        </span>
                                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
                                          19.MUN-R1: <strong>{row.codMunResConj1}</strong>
                                        </span>
                                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
                                          20.PAIS-R1: <strong>{row.codPaisResConj1}</strong>
                                        </span>
                                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
                                          21.UF-R2: <strong>{row.codUfResConj2}</strong>
                                        </span>
                                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
                                          22.MUN-R2: <strong>{row.codMunResConj2}</strong>
                                        </span>
                                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
                                          23.PAIS-R2: <strong>{row.codPaisResConj2}</strong>
                                        </span>
                                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
                                          24.UF-N1: <strong>{row.codUfNascConj1}</strong>
                                        </span>
                                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
                                          25.PAIS-N1: <strong>{row.codPaisNascConj1}</strong>
                                        </span>
                                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
                                          26.UF-N2: <strong>{row.codUfNascConj2}</strong>
                                        </span>
                                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
                                          27.PAIS-N2: <strong>{row.codPaisNascConj2}</strong>
                                        </span>
                                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
                                          28.D-NASC1: <strong>{row.dataNascConj1}</strong>
                                        </span>
                                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
                                          29.D-NASC2: <strong>{row.dataNascConj2}</strong>
                                        </span>
                                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
                                          30.SX1: <strong>{row.sexoConj1}</strong>
                                        </span>
                                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
                                          31.SX2: <strong>{row.sexoConj2}</strong>
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ABA 2: Listagem de Alertas & Conferência Detalhada de Cônjuges */}
            {activeTab === 'conferencia' && (
              <div className="space-y-3">
                {/* Barra de Controle de Expansão e Informações */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                  <div>
                    <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-blue-600" />
                      Listagem de Alertas &amp; Dados em Comum
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Cada linha exibe apenas os <strong>dados em comum da escritura</strong> (Livro, Folha, Datas, Regime e Alertas). Expanda individualmente para visualizar as partes e seus dados.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={toggleExpandAll}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold shadow-xs transition"
                      title={isAllExpanded ? 'Recolher os dados das partes de todas as escrituras' : 'Expandir os dados das partes de todas as escrituras'}
                    >
                      <ChevronsUpDown className="w-3.5 h-3.5 text-slate-500" />
                      <span>{isAllExpanded ? 'Recolher Todas as Partes' : 'Expandir Todas as Partes'}</span>
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600 font-mono font-normal">
                        {expandedIds.size}/{paginatedEscrituras.length}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  {paginatedEscrituras.map((e, idx) => {
                    const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                    const isExpanded = expandedIds.has(e.id);
                    const isSameSex = e.conjuge1.sexo === e.conjuge2.sexo;
                    const semRegime = e.regimeBens === '9';
                    const semCasam = e.dataCasamento === '99999999' || !e.dataCasamento;
                    const hasAlerts = e.alerts && e.alerts.length > 0;

                    const age1AtMarriage = getAgeAtMarriage(e.conjuge1.dataNascimento, e.dataCasamento);
                    const age2AtMarriage = getAgeAtMarriage(e.conjuge2.dataNascimento, e.dataCasamento);

                    return (
                      <div
                        key={e.id}
                        className={`transition ${
                          isSameSex
                            ? 'bg-amber-50/20'
                            : hasAlerts
                            ? 'bg-white'
                            : 'bg-white'
                        }`}
                      >
                        {/* LINHA DE EXIBIÇÃO: APENAS OS DADOS EM COMUM DA ESCRITURA */}
                        <div
                          onClick={() => toggleExpand(e.id)}
                          className="p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/80 transition select-none"
                        >
                          <div className="space-y-2 flex-1">
                            {/* Linha Superior: Botão Editar no início, Item, Livro, Folha, Data do Ato e Resumo das Partes */}
                            <div className="flex flex-wrap items-center gap-2">
                              {onEditEscritura && (
                                <button
                                  type="button"
                                  onClick={(ev) => {
                                    ev.stopPropagation();
                                    onEditEscritura(e);
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md font-semibold transition shadow-2xs shrink-0"
                                  title="Editar dados desta escritura"
                                >
                                  <Pencil className="w-3 h-3 text-blue-600" />
                                  <span>Editar</span>
                                </button>
                              )}
                              <span className="w-5 h-5 rounded-full bg-slate-800 text-white font-mono text-[11px] flex items-center justify-center font-bold">
                                {globalIdx}
                              </span>
                              <span className="font-bold text-slate-900 text-xs sm:text-sm">
                                Livro {e.livro} • Folha {e.folhaInicial}
                              </span>
                              <span className="text-[11px] text-slate-500 font-mono">
                                (Ato: {formatDDMMAAAAToDisplay(e.dataAtoNotarial)})
                              </span>
                              <span className="text-slate-300 hidden sm:inline">•</span>
                              <span className="text-xs text-slate-700 font-medium">
                                Partes: <strong className="text-slate-900">{e.conjuge1.nome}</strong> &amp; <strong className="text-slate-900">{e.conjuge2.nome}</strong>
                              </span>
                            </div>

                            {/* Linha Intermediária: Dados em Comum (Casamento, Regime de Bens, Filhos) */}
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              {/* Data do Casamento */}
                              <span
                                className={`px-2 py-0.5 rounded border text-[11px] font-medium flex items-center gap-1 ${
                                  semCasam
                                    ? 'bg-rose-50 text-rose-900 border-rose-300 font-bold'
                                    : 'bg-slate-100 text-slate-700 border-slate-200'
                                }`}
                              >
                                <Calendar className="w-3 h-3 text-slate-500" />
                                Casamento: <strong>{formatDDMMAAAAToDisplay(e.dataCasamento)}</strong>
                              </span>

                              {/* Regime de Bens */}
                              <span
                                className={`px-2 py-0.5 rounded border text-[11px] font-medium ${
                                  semRegime
                                    ? 'bg-purple-100 text-purple-900 border-purple-300 font-bold'
                                    : 'bg-purple-50 text-purple-700 border-purple-200'
                                }`}
                              >
                                Regime: <strong>{e.regimeBensNome}</strong> {semRegime && '(Cód 9)'}
                              </span>

                              {/* Filhos */}
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[11px]">
                                Filhos: <strong>{e.numFilhoMaior === '99' ? '0' : e.numFilhoMaior} maiores</strong>, <strong>{e.numFilhoMenor === '99' ? '0' : e.numFilhoMenor} menores</strong>
                              </span>

                              {/* Responsável pelos Filhos */}
                              {e.codRespFilho && e.codRespFilho !== '9' && (
                                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[11px]">
                                  Guarda: Cônjuge {e.codRespFilho}
                                </span>
                              )}
                            </div>

                            {/* Linha de Alertas Específicos Detectados nesta Escritura */}
                            {hasAlerts && (
                              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                {e.alerts!.map((al, ai) => (
                                  <span
                                    key={ai}
                                    className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 border ${
                                      al.type === 'mesmo_sexo'
                                        ? 'bg-amber-100 text-amber-950 border-amber-300'
                                        : al.type === 'casamento_recente' || al.type === 'menor_18_no_casamento'
                                        ? 'bg-rose-100 text-rose-950 border-rose-300'
                                        : al.type === 'casamento_longo_sem_filhos'
                                        ? 'bg-orange-100 text-orange-950 border-orange-300'
                                        : al.type === 'diferenca_idade_maior_10'
                                        ? 'bg-indigo-100 text-indigo-950 border-indigo-300'
                                        : 'bg-slate-100 text-slate-800 border-slate-300'
                                    }`}
                                  >
                                    <AlertTriangle className="w-3 h-3 shrink-0" />
                                    {al.label}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Ações da Linha: Editar e Expandir Partes */}
                          <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                            {onEditEscritura && (
                              <button
                                type="button"
                                onClick={(ev) => {
                                  ev.stopPropagation();
                                  onEditEscritura(e);
                                }}
                                className="px-2.5 py-1 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md font-medium transition"
                              >
                                Editar
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={(ev) => {
                                ev.stopPropagation();
                                toggleExpand(e.id);
                              }}
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition border ${
                                isExpanded
                                  ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                              }`}
                            >
                              <span>{isExpanded ? 'Recolher partes' : 'Expandir partes'}</span>
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* SEÇÃO EXPANSÍVEL: MOSTRA AS PARTES E SEUS DADOS INDIVIDUAIS */}
                        {isExpanded && (
                          <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3 animate-fadeIn">
                            <div className="flex items-center justify-between text-slate-500 text-[11px] pb-1 border-b border-slate-200">
                              <span className="font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-blue-600" />
                                Detalhamento das Partes (Cônjuge 1 e Cônjuge 2)
                              </span>
                              <span>Livro {e.livro} • Folha {e.folhaInicial}</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                              {/* Cônjuge 1 */}
                              <div className="p-3.5 rounded-xl bg-white border border-blue-200 shadow-xs space-y-2">
                                <div className="flex items-center justify-between pb-2 border-b border-blue-100">
                                  <span className="font-bold text-blue-900 text-xs flex items-center gap-1.5">
                                    <span className="w-5 h-5 rounded-md bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                                      1
                                    </span>
                                    CÔNJUGE 1: {e.conjuge1.nome}
                                  </span>
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                      e.conjuge1.sexo === '1'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-rose-100 text-rose-800'
                                    }`}
                                  >
                                    Sexo: {e.conjuge1.sexo === '1' ? '1 (Masculino)' : '2 (Feminino)'}
                                  </span>
                                </div>

                                <div className="space-y-1.5 text-[11px] text-slate-700">
                                  <div className="flex justify-between py-0.5 border-b border-slate-100">
                                    <span className="text-slate-500">Data de Nascimento:</span>
                                    <span className="font-semibold">
                                      {formatDDMMAAAAToDisplay(e.conjuge1.dataNascimento)}
                                      {age1AtMarriage && (
                                        <span className="ml-1 text-[10px] text-slate-500 font-normal">
                                          ({age1AtMarriage})
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex justify-between py-0.5 border-b border-slate-100">
                                    <span className="text-slate-500">Naturalidade:</span>
                                    <span className="font-medium text-right">
                                      {e.conjuge1.cidadeNasc || 'Não informada'} (UF {e.conjuge1.ufNasc})
                                      <span className="text-[10px] text-slate-400 block font-mono">
                                        IBGE: {e.conjuge1.codMunNasc} • País: {e.conjuge1.codPaisNasc}
                                      </span>
                                    </span>
                                  </div>
                                  <div className="flex justify-between py-0.5">
                                    <span className="text-slate-500">Residência Atual:</span>
                                    <span className="font-medium text-right">
                                      {e.conjuge1.cidadeRes || 'Não informada'} (UF {e.conjuge1.ufRes})
                                      <span className="text-[10px] text-slate-400 block font-mono">
                                        IBGE: {e.conjuge1.codMunRes} • País: {e.conjuge1.codPaisRes}
                                      </span>
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Cônjuge 2 */}
                              <div className="p-3.5 rounded-xl bg-white border border-rose-200 shadow-xs space-y-2">
                                <div className="flex items-center justify-between pb-2 border-b border-rose-100">
                                  <span className="font-bold text-rose-900 text-xs flex items-center gap-1.5">
                                    <span className="w-5 h-5 rounded-md bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
                                      2
                                    </span>
                                    CÔNJUGE 2: {e.conjuge2.nome}
                                  </span>
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                      e.conjuge2.sexo === '1'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-rose-100 text-rose-800'
                                    }`}
                                  >
                                    Sexo: {e.conjuge2.sexo === '1' ? '1 (Masculino)' : '2 (Feminino)'}
                                  </span>
                                </div>

                                <div className="space-y-1.5 text-[11px] text-slate-700">
                                  <div className="flex justify-between py-0.5 border-b border-slate-100">
                                    <span className="text-slate-500">Data de Nascimento:</span>
                                    <span className="font-semibold">
                                      {formatDDMMAAAAToDisplay(e.conjuge2.dataNascimento)}
                                      {age2AtMarriage && (
                                        <span className="ml-1 text-[10px] text-slate-500 font-normal">
                                          ({age2AtMarriage})
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex justify-between py-0.5 border-b border-slate-100">
                                    <span className="text-slate-500">Naturalidade:</span>
                                    <span className="font-medium text-right">
                                      {e.conjuge2.cidadeNasc || 'Não informada'} (UF {e.conjuge2.ufNasc})
                                      <span className="text-[10px] text-slate-400 block font-mono">
                                        IBGE: {e.conjuge2.codMunNasc} • País: {e.conjuge2.codPaisNasc}
                                      </span>
                                    </span>
                                  </div>
                                  <div className="flex justify-between py-0.5">
                                    <span className="text-slate-500">Residência Atual:</span>
                                    <span className="font-medium text-right">
                                      {e.conjuge2.cidadeRes || 'Não informada'} (UF {e.conjuge2.ufRes})
                                      <span className="text-[10px] text-slate-400 block font-mono">
                                        IBGE: {e.conjuge2.codMunRes} • País: {e.conjuge2.codPaisRes}
                                      </span>
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ABA 3: Visualizador do Arquivo TABINF07.TXT (121 bytes) */}
            {activeTab === 'txt07' && (
              <div>
                <div className="mb-3 p-3 bg-slate-900 rounded-lg text-slate-300 text-xs flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="font-bold text-white font-mono">TABINF07.TXT</span>
                    <span className="ml-2 text-emerald-400 font-mono">
                      Registro posicional de largura fixa • Exatamente 121 bytes por linha
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Total de registros: {escrituras.length}
                  </div>
                </div>

                {/* Régua de posições */}
                <div className="overflow-x-auto border border-slate-800 rounded-lg bg-slate-950 p-3 font-mono text-[11px] text-slate-300">
                  <div className="text-slate-500 pb-1 mb-2 border-b border-slate-800 text-[10px] select-none whitespace-pre">
                    {'RÉGUA: 001....010....020....030....040....050....060....070....080....090....100....110....120.121'}
                  </div>

                  <div className="space-y-1.5">
                    {paginatedEscrituras.map((e, idx) => {
                      const r = buildTabinf07Row(e, config);
                      const line = r.rawLine || '';
                      const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                      return (
                        <div
                          key={e.id}
                          className="flex items-center gap-3 hover:bg-slate-900 p-1 rounded group transition"
                        >
                          <span className="text-slate-600 select-none w-8 text-right shrink-0">
                            {globalIdx}
                          </span>
                          <div className="font-mono text-emerald-300 tracking-wider whitespace-pre selection:bg-emerald-800 select-all overflow-x-auto">
                            {line}
                          </div>
                          <div className="ml-auto shrink-0 flex items-center gap-2">
                            <span className="text-[10px] text-slate-500">
                              {line.length} bytes
                            </span>
                            <button
                              onClick={() => handleCopyLine(line, idx)}
                              title="Copiar linha"
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                            >
                              {copiedIndex === idx ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ABA 4: Recibo TABINF12.TXT */}
            {activeTab === 'recibo12' && (
              <div className="space-y-4">
                <div className="p-4 bg-purple-50 rounded-xl border border-purple-200 text-xs text-purple-950 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-sm text-purple-900 flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-purple-700" />
                      Arquivo de Resumo dos Dados (Recibo): TABINF12.TXT
                    </h3>
                    <p className="text-purple-800 mt-0.5">
                      Conforme Item 5 do PDF, este arquivo comprova a quantidade de divórcios e registros com chaves repetidas.
                    </p>
                  </div>
                  <div className="font-mono bg-purple-900 text-purple-100 px-3 py-1.5 rounded-lg text-xs font-semibold">
                    Registro Único: 26 bytes
                  </div>
                </div>

                {/* Linha Bruta */}
                <div className="bg-slate-900 p-4 rounded-xl text-white font-mono text-xs">
                  <span className="text-slate-400 text-[11px] block mb-1">
                    Linha física gravada no arquivo TABINF12.TXT (26 bytes):
                  </span>
                  <div className="text-emerald-400 text-sm tracking-widest bg-slate-950 p-3 rounded-lg border border-slate-800 select-all overflow-x-auto">
                    {summary12.rawLine}
                  </div>
                  <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Comprimento: {summary12.rawLine.length} caracteres / 26 bytes</span>
                    <button
                      onClick={() => handleCopyLine(summary12.rawLine, -1)}
                      className="inline-flex items-center gap-1 text-slate-300 hover:text-white"
                    >
                      <Copy className="w-3 h-3" />
                      Copiar Linha
                    </button>
                  </div>
                </div>

                {/* Tabela do Recibo */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Nº</th>
                        <th className="py-2.5 px-3">Nome Campo</th>
                        <th className="py-2.5 px-3">Tipo & Tamanho</th>
                        <th className="py-2.5 px-3">Valor Gravado</th>
                        <th className="py-2.5 px-3">Descrição da Norma (Item 5.2)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono text-xs">
                      <tr>
                        <td className="py-2 px-3 text-slate-500">1</td>
                        <td className="py-2 px-3 font-semibold text-slate-900">UF-PESQUISA</td>
                        <td className="py-2 px-3 text-slate-600">CHAR (02)</td>
                        <td className="py-2 px-3 font-bold text-blue-700">{summary12.ufPesquisa}</td>
                        <td className="py-2 px-3 font-sans text-slate-600">Fornecido pelo IBGE (ex: 41 para Paraná)</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-slate-500">2</td>
                        <td className="py-2 px-3 font-semibold text-slate-900">MUN-PESQUISA</td>
                        <td className="py-2 px-3 text-slate-600">CHAR (05)</td>
                        <td className="py-2 px-3 font-bold text-blue-700">{summary12.munPesquisa}</td>
                        <td className="py-2 px-3 font-sans text-slate-600">Fornecido pelo IBGE (ex: 06902 para Curitiba)</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-slate-500">3</td>
                        <td className="py-2 px-3 font-semibold text-slate-900">DIST-PESQUISA</td>
                        <td className="py-2 px-3 text-slate-600">CHAR (02)</td>
                        <td className="py-2 px-3 font-bold text-blue-700">{summary12.distPesquisa}</td>
                        <td className="py-2 px-3 font-sans text-slate-600">Fornecido pelo IBGE (ex: 05 para Uberaba)</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-slate-500">4</td>
                        <td className="py-2 px-3 font-semibold text-slate-900">COD_CARTORIO</td>
                        <td className="py-2 px-3 text-slate-600">CHAR (02)</td>
                        <td className="py-2 px-3 font-bold text-blue-700">{summary12.codCartorio}</td>
                        <td className="py-2 px-3 font-sans text-slate-600">Fornecido pelo IBGE (ex: 19 para Serviço Distrital do Uberaba)</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-slate-500">5</td>
                        <td className="py-2 px-3 font-semibold text-slate-900">ANO-PESQUISA</td>
                        <td className="py-2 px-3 text-slate-600">CHAR (04)</td>
                        <td className="py-2 px-3 font-bold text-blue-700">{summary12.anoPesquisa}</td>
                        <td className="py-2 px-3 font-sans text-slate-600">Ano da pesquisa (quatro posições)</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-slate-500">6</td>
                        <td className="py-2 px-3 font-semibold text-slate-900">TRIM-PESQUISA</td>
                        <td className="py-2 px-3 text-slate-600">CHAR (01)</td>
                        <td className="py-2 px-3 font-bold text-blue-700">{summary12.trimPesquisa}</td>
                        <td className="py-2 px-3 font-sans text-slate-600">Trimestre em questão: 1, 2, 3 ou 4</td>
                      </tr>
                      <tr className="bg-emerald-50/50">
                        <td className="py-2 px-3 text-slate-500">7</td>
                        <td className="py-2 px-3 font-bold text-emerald-900">TOTAL-DIV</td>
                        <td className="py-2 px-3 text-slate-600">CHAR (06)</td>
                        <td className="py-2 px-3 font-bold text-emerald-700 text-sm">{summary12.totalDiv}</td>
                        <td className="py-2 px-3 font-sans text-slate-700">
                          Total de Escrituras Válidas = Qtde Total ({escrituras.length}) – Repetidos ({summary12.totalRepetidos})
                        </td>
                      </tr>
                      <tr className="bg-slate-50">
                        <td className="py-2 px-3 text-slate-500">8</td>
                        <td className="py-2 px-3 font-bold text-slate-900">TOTAL-REPETIDOS</td>
                        <td className="py-2 px-3 text-slate-600">CHAR (04)</td>
                        <td className="py-2 px-3 font-bold text-slate-700">{summary12.totalRepetidos}</td>
                        <td className="py-2 px-3 font-sans text-slate-600">
                          Escrituras com a mesma chave (livro, folha, ano, etc.)
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* ABA 5: Dicionário e Regras do PDF */}
        {activeTab === 'manual' && (
          <div className="space-y-6 text-xs text-slate-700">
            {/* Regra 10 - Países e Municípios */}
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200">
              <h4 className="font-bold text-sm text-amber-950 mb-1 flex items-center gap-1.5">
                Item 10 – Regras para Preenchimento dos Campos de UF, Município e País
              </h4>
              <p className="text-amber-800 text-[11px] mb-3">
                <strong>ATENÇÃO (do manual):</strong> Não utilizar o código 076 da Tabela de Países da ONU. Deverá ser utilizado o código 999.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-2.5 bg-white rounded-lg border border-amber-200">
                  <span className="font-bold text-slate-800 block mb-1">Regra 1 (Estrangeiro):</span>
                  <p className="text-slate-600">
                    Se <strong>UF = 98</strong> &rarr; MUNICÍPIO = <strong>99999</strong> e PAÍS = Código do País existente no Território Mundial (Tabela ONU) ou <strong>999</strong>.
                  </p>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-amber-200">
                  <span className="font-bold text-slate-800 block mb-1">Regra 2 (Brasil sem detalhar):</span>
                  <p className="text-slate-600">
                    Se <strong>UF = 59</strong> &rarr; MUNICÍPIO = <strong>99999</strong> e PAÍS = <strong>999</strong>.
                  </p>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-amber-200">
                  <span className="font-bold text-slate-800 block mb-1">Regra 3 (Ignorado):</span>
                  <p className="text-slate-600">
                    Se <strong>UF = 99</strong> &rarr; MUNICÍPIO = <strong>99999</strong> e PAÍS = <strong>999</strong>.
                  </p>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-amber-200">
                  <span className="font-bold text-slate-800 block mb-1">Regra 4 (UF Normal do Brasil):</span>
                  <p className="text-slate-600">
                    Se <strong>UF &ne; (98, 59, 99)</strong> &rarr; MUNICÍPIO = Código IBGE de 5 dígitos (ou 99999) e <strong>PAÍS = 999</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* Regra 9 - Zeros e Brancos */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <h4 className="font-bold text-sm text-slate-900 mb-2">
                Item 9 – Regras para Campos Numéricos, Alfanuméricos e Sem Valor
              </h4>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                <li>
                  <strong>Campos Numéricos:</strong> quando o valor for menor que o tamanho do campo, acrescentar <strong>zeros à esquerda</strong> (Ex: folha 96 vira <code>0096</code>).
                </li>
                <li>
                  <strong>Campos Alfanuméricos:</strong> quando o valor for menor que o tamanho do campo, acrescentar <strong>espaços em branco à direita</strong> (Ex: livro 830N vira <code>'830N              '</code> com 18 caracteres).
                </li>
                <li>
                  <strong>Campos Sem Valor:</strong> preencher com o dígito <strong>9</strong> em todo o tamanho do campo (Ex: Data de nascimento não informada vira <code>99999999</code>).
                </li>
              </ul>
            </div>

            {/* Codificação dos Campos Notariais */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3.5 bg-white rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 block mb-2">Regime de Bens (Campo 14):</span>
                <ul className="space-y-1 font-mono text-[11px] text-slate-700">
                  <li><strong>1</strong> = Comunhão Universal</li>
                  <li><strong>2</strong> = Comunhão Parcial</li>
                  <li><strong>3</strong> = Separação de Bens</li>
                  <li><strong>9</strong> = Sem declaração</li>
                </ul>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 block mb-2">Responsável Filhos (Campo 17):</span>
                <ul className="space-y-1 font-mono text-[11px] text-slate-700">
                  <li><strong>1</strong> = Cônjuge 1</li>
                  <li><strong>2</strong> = Cônjuge 2</li>
                  <li><strong>3</strong> = Ambos os cônjuges</li>
                  <li><strong>4</strong> = Outro</li>
                  <li><strong>9</strong> = Sem declaração</li>
                </ul>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 block mb-2">Complemento Folha (Campo 10):</span>
                <ul className="space-y-1 font-mono text-[11px] text-slate-700">
                  <li><strong>1</strong> = Frente</li>
                  <li><strong>2</strong> = Verso</li>
                  <li><strong>9</strong> = Sem complemento</li>
                </ul>
              </div>
            </div>

            {/* Arquivo CONTROLE.SIS */}
            <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-200 text-blue-950">
              <h5 className="font-bold mb-1">Item 7 – Arquivo para Controle do IBGE (CONTROLE.SIS):</h5>
              <p className="text-[11px] text-blue-800">
                Criar um arquivo físico chamado <code>CONTROLE.SIS</code> com tamanho igual a <strong>0 byte</strong> (sem informação), que servirá para o IBGE identificar o arquivo compactado <code>TABINF.ZIP</code>.
                O nosso gerador já inclui este arquivo automaticamente no ZIP!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
