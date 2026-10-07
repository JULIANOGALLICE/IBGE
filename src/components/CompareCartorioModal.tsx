import React from 'react';
import {
  X,
  Upload,
  FileCheck,
  AlertTriangle,
  CheckCircle,
  Archive,
  Download,
  ArrowRight,
  Info,
  HelpCircle,
  FileText,
  Copy,
} from 'lucide-react';
import { CartorioConfig, EscrituraRecord } from '../types/ibge';
import {
  CartinfProfileType,
  downloadBlob,
  generateCartinfZipBlob,
  inspectZipFile,
  InspectedZipResult,
} from '../utils/zipExporter';

interface CompareCartorioModalProps {
  isOpen: boolean;
  onClose: () => void;
  escrituras: EscrituraRecord[];
  config: CartorioConfig;
}

export const CompareCartorioModal: React.FC<CompareCartorioModalProps> = ({
  isOpen,
  onClose,
  escrituras,
  config,
}) => {
  const [dragActive, setDragActive] = React.useState(false);
  const [analyzing, setAnalyzing] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [inspectedResult, setInspectedResult] = React.useState<InspectedZipResult | null>(null);
  const [selectedProfile, setSelectedProfile] = React.useState<CartinfProfileType>('rcpn_completo');
  const [generating, setGenerating] = React.useState(false);

  if (!isOpen) return null;

  const handleProcessZip = async (file: File) => {
    setErrorMsg(null);
    setAnalyzing(true);
    try {
      if (!file.name.toLowerCase().endsWith('.zip')) {
        throw new Error('Por favor, selecione um arquivo compactado (.ZIP).');
      }
      const result = await inspectZipFile(file);
      setInspectedResult(result);
      // Ajusta o perfil sugerido com base no arquivo inspecionado
      setSelectedProfile(result.suggestedProfile);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao analisar o arquivo .ZIP');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessZip(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleProcessZip(e.target.files[0]);
    }
  };

  // Download do arquivo gerado conforme o perfil selecionado
  const handleDownloadProfile = async (profile: CartinfProfileType, mirrorFiles?: string[]) => {
    if (escrituras.length === 0) return;
    try {
      setGenerating(true);
      const blob = await generateCartinfZipBlob(escrituras, config, profile, mirrorFiles);
      const filename = profile === 'tabinf_original' ? 'TABINF.ZIP' : 'CARTINF.ZIP';
      downloadBlob(blob, filename);
    } catch (err: any) {
      setErrorMsg('Erro ao gerar arquivo: ' + (err?.message || 'Falha na compactação'));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Topo do Modal */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-600/30 text-indigo-400 border border-indigo-500/30">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Comparador & Validador de Arquivo do Outro Cartório (IBGE)
              </h2>
              <p className="text-xs text-slate-400">
                Solução para os erros de nome de arquivo e quantidade de arquivos compactados no portal do IBGE
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo com Scroll */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-800 flex-1">
          {/* Card explicativo dos 2 erros que o usuário enfrentou */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 space-y-3">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>Diagnóstico dos Erros Retornados pelo Sistema do IBGE</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white rounded-lg border border-amber-200/80 space-y-1">
                <span className="font-semibold text-rose-700 block">
                  1º Erro: "Selecione um nome de arquivo válido para realizar o upload"
                </span>
                <p className="text-slate-600 leading-relaxed">
                  <strong>Causa:</strong> No portal do Registro Civil do IBGE (<code>registrocivil.ibge.gov.br</code>), o sistema rejeita qualquer nome diferente de <strong>CARTINF.ZIP</strong> (maiúsculo). Ao enviar com nome TABINF.ZIP, o site bloqueia o envio.
                </p>
                <div className="pt-1 text-emerald-700 font-medium flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Nosso sistema agora gera <strong>CARTINF.ZIP</strong> por padrão!</span>
                </div>
              </div>

              <div className="p-3 bg-white rounded-lg border border-amber-200/80 space-y-1">
                <span className="font-semibold text-rose-700 block">
                  2º Erro: "Arquivo de formato inválido. Verificar se a quantidade de arquivos compactados esta incorreta."
                </span>
                <p className="text-slate-600 leading-relaxed">
                  <strong>Causa:</strong> Ao renomear manualmente para CARTINF.ZIP, o validador do IBGE abriu o ZIP e contou quantos arquivos havia dentro. O padrão completo do Registro Civil espera <strong>6 arquivos</strong> (CONTROLE.SIS, CARTINF01 a CARTINF04 e CARTINF10). Se o pacote continha apenas 3 arquivos, o sistema acusa erro de quantidade.
                </p>
              </div>
            </div>
          </div>

          {/* Área de Upload e Inspeção do Arquivo do Outro Cartório */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Archive className="w-4 h-4 text-indigo-600" />
                Inspecione o Arquivo (.ZIP) do Outro Cartório
              </h3>
              {inspectedResult && (
                <button
                  onClick={() => setInspectedResult(null)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 underline"
                >
                  Testar outro arquivo .ZIP
                </button>
              )}
            </div>

            {!inspectedResult ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-6 text-center transition ${
                  dragActive
                    ? 'border-indigo-500 bg-indigo-50/50'
                    : 'border-slate-300 bg-slate-50/70 hover:bg-slate-50 hover:border-slate-400'
                }`}
              >
                <input
                  type="file"
                  id="cartorio-zip-input"
                  accept=".zip,application/zip"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="cartorio-zip-input"
                  className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                >
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-semibold text-slate-800">
                    Clique aqui ou arraste o arquivo .ZIP do outro cartório
                  </div>
                  <p className="text-xs text-slate-500 max-w-md">
                    O aplicativo lerá todos os arquivos internos, verificará os nomes oficiais (CARTINF vs TABINF), os tamanhos e a quantidade exata de arquivos que o IBGE aprovou no outro cartório.
                  </p>
                </label>
              </div>
            ) : (
              /* Resultado da Inspeção Lado a Lado */
              <div className="border border-indigo-200 rounded-xl overflow-hidden bg-indigo-50/30">
                <div className="p-4 bg-indigo-900 text-white flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <span className="font-semibold text-sm">
                      Arquivo Analisado: <code>{inspectedResult.fileName}</code>
                    </span>
                  </div>
                  <span className="text-xs bg-indigo-800 text-indigo-200 px-2.5 py-1 rounded-full border border-indigo-700">
                    {inspectedResult.totalFiles} arquivo(s) compactado(s) • Padrão: {inspectedResult.namingPrefix}
                  </span>
                </div>

                <div className="p-4 space-y-4">
                  <p className="text-xs text-indigo-950 font-medium">
                    {inspectedResult.summary}
                  </p>

                  {/* Tabela de Arquivos Encontrados no Arquivo do Outro Cartório */}
                  <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3 font-semibold">Nome no ZIP do Outro Cartório</th>
                          <th className="py-2 px-3 font-semibold">Tamanho (Bytes)</th>
                          <th className="py-2 px-3 font-semibold">Linhas</th>
                          <th className="py-2 px-3 font-semibold">Finalidade Identificada</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {inspectedResult.files.map((f, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/70 font-mono text-[11px]">
                            <td className="py-2 px-3 font-bold text-slate-900 flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-indigo-600" />
                              {f.name}
                            </td>
                            <td className="py-2 px-3 text-slate-600">{f.size} bytes</td>
                            <td className="py-2 px-3 text-slate-600">{f.linesCount}</td>
                            <td className="py-2 px-3 font-sans text-slate-700">
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 border border-slate-200">
                                {f.detectedType}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Botão de Geração Espelhada */}
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        Gerar CARTINF.ZIP com a Estrutura Exata do Outro Cartório
                      </span>
                      <p className="text-xs text-emerald-800">
                        O sistema empacotará seus {escrituras.length} divórcios replicando os mesmos {inspectedResult.totalFiles} nomes de arquivos do outro cartório.
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        handleDownloadProfile(
                          'custom_mirror',
                          inspectedResult.files.map((f) => f.name)
                        )
                      }
                      disabled={generating || escrituras.length === 0}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-sm transition flex items-center gap-2 whitespace-nowrap disabled:opacity-40"
                    >
                      <Download className="w-4 h-4" />
                      {generating ? 'Gerando...' : 'Baixar CARTINF.ZIP Espelhado'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Opções de Geração Pré-Configuradas */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Download className="w-4 h-4 text-indigo-600" />
              Opções de Pacote para Envio ao IBGE
            </h3>
            <p className="text-xs text-slate-600">
              Caso você não tenha o arquivo do outro cartório em mãos no momento, você pode escolher diretamente uma das configurações oficiais abaixo:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {/* Opção 1: Registro Civil Completo (6+ arquivos) */}
              <div
                onClick={() => setSelectedProfile('rcpn_completo')}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition ${
                  selectedProfile === 'rcpn_completo'
                    ? 'border-indigo-600 bg-indigo-50/40 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-900 text-sm">
                    1. CARTINF.ZIP Completo (Registro Civil)
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Recomendado p/ Portal
                  </span>
                </div>
                <p className="text-slate-600 mb-2">
                  Inclui <strong>CONTROLE.SIS</strong>, os arquivos base de Registro Civil (<code>CARTINF01</code> a <code>04</code>), o resumo <code>CARTINF10.TXT</code> (72 bytes) e as escrituras <code>CARTINF07.TXT</code> e <code>CARTINF12.TXT</code>.
                </p>
                <span className="text-[11px] font-mono text-indigo-700 block">
                  Resolve: "Verificar se a quantidade de arquivos compactados esta incorreta"
                </span>
              </div>

              {/* Opção 2: Híbrido Seguro (5 arquivos) */}
              <div
                onClick={() => setSelectedProfile('hybrid_safe')}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition ${
                  selectedProfile === 'hybrid_safe'
                    ? 'border-indigo-600 bg-indigo-50/40 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-900 text-sm">
                    2. CARTINF.ZIP Híbrido Notarial
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                    5 Arquivos
                  </span>
                </div>
                <p className="text-slate-600 mb-2">
                  Contém <strong>CONTROLE.SIS</strong> + ambos os padrões de nomenclatura: <code>CARTINF07.TXT</code> / <code>CARTINF12.TXT</code> e <code>TABINF07.TXT</code> / <code>TABINF12.TXT</code>.
                </p>
                <span className="text-[11px] font-mono text-indigo-700 block">
                  Compatível com validadores que buscam tanto CARTINF quanto TABINF.
                </span>
              </div>

              {/* Opção 3: CARTINF Notarial Direto (3 arquivos) */}
              <div
                onClick={() => setSelectedProfile('cartinf_notarial')}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition ${
                  selectedProfile === 'cartinf_notarial'
                    ? 'border-indigo-600 bg-indigo-50/40 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-900 text-sm">
                    3. CARTINF.ZIP Notarial Direto
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                    3 Arquivos
                  </span>
                </div>
                <p className="text-slate-600 mb-2">
                  Contém apenas <strong>CONTROLE.SIS</strong>, <strong>CARTINF07.TXT</strong> (121b) e <strong>CARTINF12.TXT</strong> (26b).
                </p>
                <span className="text-[11px] font-mono text-indigo-700 block">
                  Para cartórios cadastrados exclusivamente com módulo de divórcio.
                </span>
              </div>

              {/* Opção 4: TABINF.ZIP Original (Manual IBGE) */}
              <div
                onClick={() => setSelectedProfile('tabinf_original')}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition ${
                  selectedProfile === 'tabinf_original'
                    ? 'border-indigo-600 bg-indigo-50/40 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-900 text-sm">
                    4. TABINF.ZIP Original (Manual)
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                    Manual Oficial
                  </span>
                </div>
                <p className="text-slate-600 mb-2">
                  Arquivo nomeado como <strong>TABINF.ZIP</strong> contendo <code>CONTROLE.SIS</code>, <code>TABINF07.TXT</code> e <code>TABINF12.TXT</code> conforme descrito no Manual de Divórcios.
                </p>
                <span className="text-[11px] font-mono text-indigo-700 block">
                  Para entrega manual em agências ou sistemas legados do IBGE.
                </span>
              </div>
            </div>

            {/* Ação de Download do Perfil Selecionado */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200 flex-wrap gap-2">
              <div className="text-xs text-slate-600">
                Perfil atualmente selecionado: <strong className="text-slate-900">{selectedProfile}</strong> ({escrituras.length} escrituras prontas)
              </div>
              <button
                onClick={() => handleDownloadProfile(selectedProfile)}
                disabled={generating || escrituras.length === 0}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-md transition flex items-center gap-2 disabled:opacity-40"
              >
                <Archive className="w-4 h-4" />
                {generating
                  ? 'Gerando...'
                  : selectedProfile === 'tabinf_original'
                  ? 'Baixar TABINF.ZIP'
                  : 'Baixar CARTINF.ZIP'}
              </button>
            </div>
          </div>
        </div>

        {/* Rodapé do Modal */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Identificação: {config.ufPesquisa}-{config.munPesquisa}-{config.distPesquisa}-{config.codCartorio} ({config.nomeCartorio || 'SERVIÇO DISTRITAL DO UBERABA'})</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
