import React from 'react';
import {
  X,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Archive,
  HelpCircle,
  ArrowRight,
  Info,
} from 'lucide-react';
import { CartorioConfig, EscrituraRecord } from '../types/ibge';
import {
  downloadBlob,
  generateTabinfZipBlob,
  generateCartinfZipBlob,
} from '../utils/zipExporter';

interface IbgeUploadHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  escrituras: EscrituraRecord[];
  config: CartorioConfig;
}

export const IbgeUploadHelpModal: React.FC<IbgeUploadHelpModalProps> = ({
  isOpen,
  onClose,
  escrituras,
  config,
}) => {
  const [downloading, setDownloading] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownloadTabinf = async () => {
    if (escrituras.length === 0) return;
    try {
      setDownloading('tabinf');
      const blob = await generateTabinfZipBlob(escrituras, config);
      downloadBlob(blob, 'TABINF.ZIP');
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadCartinf = async () => {
    if (escrituras.length === 0) return;
    try {
      setDownloading('cartinf');
      const blob = await generateCartinfZipBlob(escrituras, config);
      downloadBlob(blob, 'CARTINF.ZIP');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Cabeçalho */}
        <div className="px-6 py-4 bg-amber-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-700/50 text-white">
              <AlertTriangle className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                Como Resolver: "Selecione um nome de arquivo válido"
              </h3>
              <p className="text-xs text-amber-100">
                Solução para a validação de upload no portal do IBGE (Coleta Web / Registro Civil)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-amber-100 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-slate-700">
          {/* Alerta Destacado */}
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200">
            <div className="flex items-start gap-2.5">
              <Info className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-rose-900 block text-xs uppercase tracking-wide">
                  Mensagem exibida no site do IBGE:
                </span>
                <p className="font-mono text-xs text-rose-800 font-semibold mt-1 bg-white/80 p-2 rounded border border-rose-200">
                  "Verifique os erros encontrados, abaixo:<br />
                  Selecione um nome de arquivo válido para realizar o upload"
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              Por que esse erro acontece e como corrigir:
            </h4>

            {/* Motivo 1 */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                  1
                </span>
                <h5 className="font-bold text-slate-900">
                  Tentativa de enviar a planilha Excel (.xlsx) ou CSV
                </h5>
              </div>
              <p className="text-xs text-slate-600 pl-8">
                O portal do IBGE <strong>NÃO aceita planilhas Excel (.xlsx) nem arquivos CSV</strong>. A planilha Excel que o sistema gera serve unicamente para conferência interna do cartório. No site do IBGE, você deve fazer o upload exclusivamente do arquivo <strong>.ZIP</strong>.
              </p>
            </div>

            {/* Motivo 2 */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                  2
                </span>
                <h5 className="font-bold text-slate-900">
                  Arquivo baixado com sufixo automático (Ex: TABINF (1).ZIP)
                </h5>
              </div>
              <p className="text-xs text-slate-600 pl-8">
                Se você clicou para baixar mais de uma vez, o Windows renomeou o arquivo para <code className="bg-amber-100 text-amber-900 px-1 rounded">TABINF (1).ZIP</code> ou similar. O sistema do IBGE rejeita qualquer caractere extra. O nome precisa ser <strong>rigorosamente exato:</strong> <code className="bg-emerald-100 text-emerald-900 font-bold px-1 rounded">TABINF.ZIP</code> (sem parênteses, sem espaços e em maiúsculas).
              </p>
            </div>

            {/* Motivo 3 */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                  3
                </span>
                <h5 className="font-bold text-slate-900">
                  O formulário do seu portal exige o nome CARTINF.ZIP
                </h5>
              </div>
              <p className="text-xs text-slate-600 pl-8">
                Em muitos cartórios e serventias mistas (Distritais como Uberaba), o portal <code className="text-blue-700 font-mono">registrocivil.ibge.gov.br</code> valida estritamente o nome padrão <strong>CARTINF.ZIP</strong>. Se o envio com TABINF.ZIP for rejeitado, envie como CARTINF.ZIP.
              </p>
            </div>
          </div>

          {/* Botões de Ação Imediata */}
          <div className="pt-2 border-t border-slate-200 space-y-3">
            <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
              Baixe novamente com o nome correto:
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleDownloadTabinf}
                disabled={downloading !== null || escrituras.length === 0}
                className="flex items-center justify-between p-3.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 transition text-left group"
              >
                <div>
                  <span className="font-bold text-indigo-950 block text-xs">
                    Opção A: TABINF.ZIP
                  </span>
                  <span className="text-[11px] text-indigo-700">
                    Padrão oficial do Manual de Divórcios
                  </span>
                </div>
                <Archive className="w-5 h-5 text-indigo-600 group-hover:scale-110 transition shrink-0" />
              </button>

              <button
                onClick={handleDownloadCartinf}
                disabled={downloading !== null || escrituras.length === 0}
                className="flex items-center justify-between p-3.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition text-left group"
              >
                <div>
                  <span className="font-bold text-emerald-950 block text-xs">
                    Opção B: CARTINF.ZIP
                  </span>
                  <span className="text-[11px] text-emerald-700">
                    Padrão do Portal Coleta Web Registro Civil
                  </span>
                </div>
                <Archive className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition shrink-0" />
              </button>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            Certifique-se de que o arquivo na pasta de Downloads não possui o sufixo "(1)".
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition"
          >
            Entendido, fechar
          </button>
        </div>
      </div>
    </div>
  );
};
