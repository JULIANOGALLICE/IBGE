import React from 'react';
import {
  Info,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Users2,
  CalendarX,
  FileQuestion,
  MapPinOff,
  UserX,
  Clock,
  HeartCrack,
  CalendarDays,
  ShieldAlert,
} from 'lucide-react';
import { EscrituraRecord, ValidationItem } from '../types/ibge';

interface ValidationAlertsProps {
  validations: ValidationItem[];
  escrituras: EscrituraRecord[];
  activeAlertFilter: string | null;
  onSelectAlertFilter: (filter: string | null) => void;
  onEditEscritura?: (escritura: EscrituraRecord) => void;
}

export const ValidationAlerts: React.FC<ValidationAlertsProps> = ({
  validations,
  escrituras,
  activeAlertFilter,
  onSelectAlertFilter,
}) => {
  const [collapsed, setCollapsed] = React.useState(false);

  // Contagens dos alertas solicitados pelo usuário
  const countMesmoSexo = escrituras.filter((e) =>
    e.alerts?.some((a) => a.type === 'mesmo_sexo')
  ).length;

  const countSemRegime = escrituras.filter((e) =>
    e.alerts?.some((a) => a.type === 'sem_regime')
  ).length;

  const countSemDataCasamento = escrituras.filter((e) =>
    e.alerts?.some((a) => a.type === 'sem_data_casamento')
  ).length;

  const countSemDataNasc = escrituras.filter((e) =>
    e.alerts?.some((a) => a.type === 'sem_data_nascimento')
  ).length;

  const countSemCidadeNasc = escrituras.filter((e) =>
    e.alerts?.some((a) => a.type === 'sem_cidade_nascimento')
  ).length;

  const countSemCidadeRes = escrituras.filter((e) =>
    e.alerts?.some((a) => a.type === 'sem_cidade_residencia')
  ).length;

  // Novos alertas solicitados
  const countCasamentoRecente = escrituras.filter((e) =>
    e.alerts?.some((a) => a.type === 'casamento_recente')
  ).length;

  const countCasamentoLongoSemFilhos = escrituras.filter((e) =>
    e.alerts?.some((a) => a.type === 'casamento_longo_sem_filhos')
  ).length;

  const countDiferencaIdadeMaior10 = escrituras.filter((e) =>
    e.alerts?.some((a) => a.type === 'diferenca_idade_maior_10')
  ).length;

  const countMenor18NoCasamento = escrituras.filter((e) =>
    e.alerts?.some((a) => a.type === 'menor_18_no_casamento')
  ).length;

  const totalAlertasEspecificos =
    countMesmoSexo +
    countSemRegime +
    countSemDataCasamento +
    countSemDataNasc +
    countSemCidadeNasc +
    countSemCidadeRes +
    countCasamentoRecente +
    countCasamentoLongoSemFilhos +
    countDiferencaIdadeMaior10 +
    countMenor18NoCasamento;

  if (validations.length === 0 && escrituras.length === 0) return null;

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl mb-6 overflow-hidden">
      {/* Cabeçalho do Card */}
      <div
        onClick={() => setCollapsed(!collapsed)}
        className="px-5 py-3.5 bg-slate-100 flex items-center justify-between cursor-pointer hover:bg-slate-200/70 transition"
      >
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="p-1.5 rounded-md bg-blue-600 text-white">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
              Auditoria de Dados & Alertas do Cartório / IBGE
              {totalAlertasEspecificos > 0 ? (
                <span className="bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  {totalAlertasEspecificos} alerta(s) de conferência
                </span>
              ) : (
                <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                  Nenhum alerta crítico encontrado
                </span>
              )}
            </span>
            <p className="text-[11px] text-slate-500">
              Verificações automáticas de casais do mesmo sexo, dados ausentes e regras temporais (casamento &lt; 3 meses, &gt; 18 anos sem filhos, diferença de idade &gt; 10 anos, menores de 18 anos).
            </p>
          </div>
        </div>

        <button className="text-slate-500 hover:text-slate-800 text-xs flex items-center gap-1">
          {collapsed ? 'Expandir' : 'Recolher'}
          {collapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>
      </div>

      {!collapsed && (
        <div className="p-5 space-y-4">
          {/* Botões de Filtro Rápido por Categoria de Alerta */}
          {escrituras.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Filtrar escrituras por tipo de alerta:</span>
                {activeAlertFilter && (
                  <button
                    onClick={() => onSelectAlertFilter(null)}
                    className="text-blue-600 hover:underline text-[11px] font-normal"
                  >
                    Limpar filtro (Ver todos)
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-xs">
                {/* 1. Casal Mesmo Sexo */}
                <button
                  onClick={() =>
                    onSelectAlertFilter(
                      activeAlertFilter === 'mesmo_sexo' ? null : 'mesmo_sexo'
                    )
                  }
                  className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between ${
                    activeAlertFilter === 'mesmo_sexo'
                      ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-400'
                      : countMesmoSexo > 0
                      ? 'border-amber-200 bg-amber-50/60 hover:bg-amber-100/60 text-amber-950'
                      : 'border-slate-200 bg-white text-slate-400 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Users2 className="w-3.5 h-3.5 text-amber-700" />
                    <span className="font-bold font-mono text-xs">
                      {countMesmoSexo}
                    </span>
                  </div>
                  <span className="text-[11px] font-medium leading-tight">
                    Mesmo Sexo (M/M ou F/F)
                  </span>
                </button>

                {/* 2. Casamento Recente (< 3 meses) */}
                <button
                  onClick={() =>
                    onSelectAlertFilter(
                      activeAlertFilter === 'casamento_recente'
                        ? null
                        : 'casamento_recente'
                    )
                  }
                  className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between ${
                    activeAlertFilter === 'casamento_recente'
                      ? 'border-rose-500 bg-rose-50 ring-2 ring-rose-400'
                      : countCasamentoRecente > 0
                      ? 'border-rose-300 bg-rose-50/70 hover:bg-rose-100/70 text-rose-950'
                      : 'border-slate-200 bg-white text-slate-400 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Clock className="w-3.5 h-3.5 text-rose-700" />
                    <span className="font-bold font-mono text-xs">
                      {countCasamentoRecente}
                    </span>
                  </div>
                  <span className="text-[11px] font-medium leading-tight">
                    Casamento &lt; 3 meses
                  </span>
                </button>

                {/* 3. Casamento > 18 anos sem filhos */}
                <button
                  onClick={() =>
                    onSelectAlertFilter(
                      activeAlertFilter === 'casamento_longo_sem_filhos'
                        ? null
                        : 'casamento_longo_sem_filhos'
                    )
                  }
                  className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between ${
                    activeAlertFilter === 'casamento_longo_sem_filhos'
                      ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-400'
                      : countCasamentoLongoSemFilhos > 0
                      ? 'border-orange-300 bg-orange-50/70 hover:bg-orange-100/70 text-orange-950'
                      : 'border-slate-200 bg-white text-slate-400 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <HeartCrack className="w-3.5 h-3.5 text-orange-700" />
                    <span className="font-bold font-mono text-xs">
                      {countCasamentoLongoSemFilhos}
                    </span>
                  </div>
                  <span className="text-[11px] font-medium leading-tight">
                    Casamento &gt; 18a sem filhos
                  </span>
                </button>

                {/* 4. Diferença de idade > 10 anos */}
                <button
                  onClick={() =>
                    onSelectAlertFilter(
                      activeAlertFilter === 'diferenca_idade_maior_10'
                        ? null
                        : 'diferenca_idade_maior_10'
                    )
                  }
                  className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between ${
                    activeAlertFilter === 'diferenca_idade_maior_10'
                      ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-400'
                      : countDiferencaIdadeMaior10 > 0
                      ? 'border-indigo-300 bg-indigo-50/70 hover:bg-indigo-100/70 text-indigo-950'
                      : 'border-slate-200 bg-white text-slate-400 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <CalendarDays className="w-3.5 h-3.5 text-indigo-700" />
                    <span className="font-bold font-mono text-xs">
                      {countDiferencaIdadeMaior10}
                    </span>
                  </div>
                  <span className="text-[11px] font-medium leading-tight">
                    Dif. Idade &gt; 10 anos
                  </span>
                </button>

                {/* 5. Menor de 18 anos no casamento */}
                <button
                  onClick={() =>
                    onSelectAlertFilter(
                      activeAlertFilter === 'menor_18_no_casamento'
                        ? null
                        : 'menor_18_no_casamento'
                    )
                  }
                  className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between ${
                    activeAlertFilter === 'menor_18_no_casamento'
                      ? 'border-red-600 bg-red-50 ring-2 ring-red-400'
                      : countMenor18NoCasamento > 0
                      ? 'border-red-300 bg-red-50/70 hover:bg-red-100/70 text-red-950'
                      : 'border-slate-200 bg-white text-slate-400 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-red-700" />
                    <span className="font-bold font-mono text-xs">
                      {countMenor18NoCasamento}
                    </span>
                  </div>
                  <span className="text-[11px] font-medium leading-tight">
                    Menor de 18a ao casar
                  </span>
                </button>

                {/* 6. Sem Regime de Bens */}
                <button
                  onClick={() =>
                    onSelectAlertFilter(
                      activeAlertFilter === 'sem_regime' ? null : 'sem_regime'
                    )
                  }
                  className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between ${
                    activeAlertFilter === 'sem_regime'
                      ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-400'
                      : countSemRegime > 0
                      ? 'border-purple-200 bg-purple-50/60 hover:bg-purple-100/60 text-purple-950'
                      : 'border-slate-200 bg-white text-slate-400 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <FileQuestion className="w-3.5 h-3.5 text-purple-700" />
                    <span className="font-bold font-mono text-xs">
                      {countSemRegime}
                    </span>
                  </div>
                  <span className="text-[11px] font-medium leading-tight">
                    Sem Regime de Bens
                  </span>
                </button>

                {/* 7. Sem Data Casamento */}
                <button
                  onClick={() =>
                    onSelectAlertFilter(
                      activeAlertFilter === 'sem_data_casamento'
                        ? null
                        : 'sem_data_casamento'
                    )
                  }
                  className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between ${
                    activeAlertFilter === 'sem_data_casamento'
                      ? 'border-rose-500 bg-rose-50 ring-2 ring-rose-400'
                      : countSemDataCasamento > 0
                      ? 'border-rose-200 bg-rose-50/60 hover:bg-rose-100/60 text-rose-950'
                      : 'border-slate-200 bg-white text-slate-400 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <CalendarX className="w-3.5 h-3.5 text-rose-700" />
                    <span className="font-bold font-mono text-xs">
                      {countSemDataCasamento}
                    </span>
                  </div>
                  <span className="text-[11px] font-medium leading-tight">
                    Sem Data Casamento
                  </span>
                </button>

                {/* 8. Sem Data Nascimento */}
                <button
                  onClick={() =>
                    onSelectAlertFilter(
                      activeAlertFilter === 'sem_data_nascimento'
                        ? null
                        : 'sem_data_nascimento'
                    )
                  }
                  className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between ${
                    activeAlertFilter === 'sem_data_nascimento'
                      ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-400'
                      : countSemDataNasc > 0
                      ? 'border-orange-200 bg-orange-50/60 hover:bg-orange-100/60 text-orange-950'
                      : 'border-slate-200 bg-white text-slate-400 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <UserX className="w-3.5 h-3.5 text-orange-700" />
                    <span className="font-bold font-mono text-xs">
                      {countSemDataNasc}
                    </span>
                  </div>
                  <span className="text-[11px] font-medium leading-tight">
                    Sem Data Nascimento
                  </span>
                </button>

                {/* 9. Sem Cidade Nascimento */}
                <button
                  onClick={() =>
                    onSelectAlertFilter(
                      activeAlertFilter === 'sem_cidade_nascimento'
                        ? null
                        : 'sem_cidade_nascimento'
                    )
                  }
                  className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between ${
                    activeAlertFilter === 'sem_cidade_nascimento'
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-400'
                      : countSemCidadeNasc > 0
                      ? 'border-blue-200 bg-blue-50/60 hover:bg-blue-100/60 text-blue-950'
                      : 'border-slate-200 bg-white text-slate-400 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <MapPinOff className="w-3.5 h-3.5 text-blue-700" />
                    <span className="font-bold font-mono text-xs">
                      {countSemCidadeNasc}
                    </span>
                  </div>
                  <span className="text-[11px] font-medium leading-tight">
                    Sem Cidade Nascimento
                  </span>
                </button>

                {/* 10. Sem Cidade Residência */}
                <button
                  onClick={() =>
                    onSelectAlertFilter(
                      activeAlertFilter === 'sem_cidade_residencia'
                        ? null
                        : 'sem_cidade_residencia'
                    )
                  }
                  className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between ${
                    activeAlertFilter === 'sem_cidade_residencia'
                      ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-400'
                      : countSemCidadeRes > 0
                      ? 'border-teal-200 bg-teal-50/60 hover:bg-teal-100/60 text-teal-950'
                      : 'border-slate-200 bg-white text-slate-400 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <MapPinOff className="w-3.5 h-3.5 text-teal-700" />
                    <span className="font-bold font-mono text-xs">
                      {countSemCidadeRes}
                    </span>
                  </div>
                  <span className="text-[11px] font-medium leading-tight">
                    Sem Cidade Residência
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Caixa de Alerta Ativo */}
          {activeAlertFilter && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-amber-950">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Filtro selecionado: <strong>{activeAlertFilter}</strong>. A listagem abaixo exibe apenas os atos afetados, com os <strong>dados em comum na linha de exibição</strong> e opção de expandir para ver as partes.
                </span>
              </div>
              <button
                type="button"
                onClick={() => onSelectAlertFilter(null)}
                className="px-2.5 py-1 text-xs bg-amber-200/80 hover:bg-amber-300 text-amber-900 rounded font-semibold transition shrink-0"
              >
                Limpar filtro (Ver todos)
              </button>
            </div>
          )}

          {/* Mensagens gerais de validação do arquivo */}
          <div className="space-y-2 pt-1 border-t border-slate-200">
            {validations.map((v) => {
              const isSuccess = v.tipo === 'sucesso';
              const isWarning = v.tipo === 'aviso';
              const isError = v.tipo === 'erro';

              return (
                <div
                  key={v.id}
                  className={`p-3 rounded-lg text-xs flex items-start gap-2.5 border ${
                    isSuccess
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                      : isWarning
                      ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                      : isError
                      ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                      : 'bg-blue-50/70 border-blue-200 text-blue-900'
                  }`}
                >
                  {isSuccess ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : isWarning ? (
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  ) : (
                    <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-semibold block">{v.titulo}</span>
                    <p className="mt-0.5 text-slate-600">{v.mensagem}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
