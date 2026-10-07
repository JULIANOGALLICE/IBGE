import React from 'react';
import { X, Save, Edit3 } from 'lucide-react';
import { EscrituraRecord } from '../types/ibge';
import { parseRegimeBens } from '../utils/ibgeConverter';

interface EditEscrituraModalProps {
  escritura: EscrituraRecord | null;
  onClose: () => void;
  onSave: (updated: EscrituraRecord) => void;
}

export const EditEscrituraModal: React.FC<EditEscrituraModalProps> = ({
  escritura,
  onClose,
  onSave,
}) => {
  if (!escritura) return null;

  const [form, setForm] = React.useState<EscrituraRecord>({ ...escritura });

  const handleFieldChange = (field: keyof EscrituraRecord, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleConjuge1Change = (field: string, value: any) => {
    setForm((prev) => ({
      ...prev,
      conjuge1: { ...prev.conjuge1, [field]: value },
    }));
  };

  const handleConjuge2Change = (field: string, value: any) => {
    setForm((prev) => ({
      ...prev,
      conjuge2: { ...prev.conjuge2, [field]: value },
    }));
  };

  const handleRegimeChange = (code: string) => {
    const info = parseRegimeBens(code);
    setForm((prev) => ({
      ...prev,
      regimeBens: info.code,
      regimeBensNome: info.label,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm sm:text-base">
              Editar Escritura: Livro {form.livro} • Folha {form.folhaInicial}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* Dados do Livro e Escritura */}
          <div>
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-3 pb-1 border-b border-slate-200">
              Dados do Registro Notarial (Campos 7 a 17)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Livro (18 carac.)</label>
                <input
                  type="text"
                  maxLength={18}
                  value={form.livro}
                  onChange={(e) => handleFieldChange('livro', e.target.value.toUpperCase())}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Folha Inicial (4 dígitos)</label>
                <input
                  type="text"
                  maxLength={4}
                  value={form.folhaInicial}
                  onChange={(e) => handleFieldChange('folhaInicial', e.target.value.padStart(4, '0'))}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Folha Final (4 dígitos)</label>
                <input
                  type="text"
                  maxLength={4}
                  value={form.folhaFinal}
                  onChange={(e) => handleFieldChange('folhaFinal', e.target.value.padStart(4, '0'))}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Compl. Folha (1 dígito)</label>
                <select
                  value={form.complFolha}
                  onChange={(e) => handleFieldChange('complFolha', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono"
                >
                  <option value="9">9 = Sem complemento</option>
                  <option value="1">1 = Frente</option>
                  <option value="2">2 = Verso</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Data Ato Notarial (DDMMAAAA)</label>
                <input
                  type="text"
                  maxLength={8}
                  value={form.dataAtoNotarial}
                  onChange={(e) => handleFieldChange('dataAtoNotarial', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Data Casamento (DDMMAAAA)</label>
                <input
                  type="text"
                  maxLength={8}
                  value={form.dataCasamento}
                  onChange={(e) => handleFieldChange('dataCasamento', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Regime de Bens</label>
                <select
                  value={form.regimeBens}
                  onChange={(e) => handleRegimeChange(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded"
                >
                  <option value="1">1 = Comunhão Universal</option>
                  <option value="2">2 = Comunhão Parcial</option>
                  <option value="3">3 = Separação de Bens</option>
                  <option value="9">9 = Sem Declaração</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Responsável Guarda Filhos</label>
                <select
                  value={form.codRespFilho}
                  onChange={(e) => handleFieldChange('codRespFilho', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded"
                >
                  <option value="9">9 = Sem declaração</option>
                  <option value="1">1 = Cônjuge 1</option>
                  <option value="2">2 = Cônjuge 2</option>
                  <option value="3">3 = Ambos os Cônjuges</option>
                  <option value="4">4 = Outro</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Filhos Maiores (02)</label>
                <input
                  type="text"
                  maxLength={2}
                  value={form.numFilhoMaior}
                  onChange={(e) => handleFieldChange('numFilhoMaior', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Filhos Menores (02)</label>
                <input
                  type="text"
                  maxLength={2}
                  value={form.numFilhoMenor}
                  onChange={(e) => handleFieldChange('numFilhoMenor', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono"
                />
              </div>
            </div>
          </div>

          {/* Cônjuge 1 */}
          <div className="p-4 bg-blue-50/40 rounded-xl border border-blue-200">
            <h4 className="font-bold text-blue-900 text-xs uppercase tracking-wider mb-3">
              Cônjuge 1 (Campos 18-20, 24-25, 28, 30)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-slate-600 font-medium mb-1">Nome Completo</label>
                <input
                  type="text"
                  value={form.conjuge1.nome}
                  onChange={(e) => handleConjuge1Change('nome', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Sexo</label>
                <select
                  value={form.conjuge1.sexo}
                  onChange={(e) => handleConjuge1Change('sexo', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                >
                  <option value="1">1 = Masculino</option>
                  <option value="2">2 = Feminino</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Data Nascimento (DDMMAAAA)</label>
                <input
                  type="text"
                  maxLength={8}
                  value={form.conjuge1.dataNascimento}
                  onChange={(e) => handleConjuge1Change('dataNascimento', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">UF Nascimento (02)</label>
                <input
                  type="text"
                  maxLength={2}
                  value={form.conjuge1.ufNasc}
                  onChange={(e) => handleConjuge1Change('ufNasc', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">País Nascimento (03)</label>
                <input
                  type="text"
                  maxLength={3}
                  value={form.conjuge1.codPaisNasc}
                  onChange={(e) => handleConjuge1Change('codPaisNasc', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">UF Residência (02)</label>
                <input
                  type="text"
                  maxLength={2}
                  value={form.conjuge1.ufRes}
                  onChange={(e) => handleConjuge1Change('ufRes', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Município Residência (05)</label>
                <input
                  type="text"
                  maxLength={5}
                  value={form.conjuge1.codMunRes}
                  onChange={(e) => handleConjuge1Change('codMunRes', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">País Residência (03)</label>
                <input
                  type="text"
                  maxLength={3}
                  value={form.conjuge1.codPaisRes}
                  onChange={(e) => handleConjuge1Change('codPaisRes', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono bg-white"
                />
              </div>
            </div>
          </div>

          {/* Cônjuge 2 */}
          <div className="p-4 bg-rose-50/40 rounded-xl border border-rose-200">
            <h4 className="font-bold text-rose-900 text-xs uppercase tracking-wider mb-3">
              Cônjuge 2 (Campos 21-23, 26-27, 29, 31)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-slate-600 font-medium mb-1">Nome Completo</label>
                <input
                  type="text"
                  value={form.conjuge2.nome}
                  onChange={(e) => handleConjuge2Change('nome', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Sexo</label>
                <select
                  value={form.conjuge2.sexo}
                  onChange={(e) => handleConjuge2Change('sexo', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                >
                  <option value="1">1 = Masculino</option>
                  <option value="2">2 = Feminino</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Data Nascimento (DDMMAAAA)</label>
                <input
                  type="text"
                  maxLength={8}
                  value={form.conjuge2.dataNascimento}
                  onChange={(e) => handleConjuge2Change('dataNascimento', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">UF Nascimento (02)</label>
                <input
                  type="text"
                  maxLength={2}
                  value={form.conjuge2.ufNasc}
                  onChange={(e) => handleConjuge2Change('ufNasc', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">País Nascimento (03)</label>
                <input
                  type="text"
                  maxLength={3}
                  value={form.conjuge2.codPaisNasc}
                  onChange={(e) => handleConjuge2Change('codPaisNasc', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">UF Residência (02)</label>
                <input
                  type="text"
                  maxLength={2}
                  value={form.conjuge2.ufRes}
                  onChange={(e) => handleConjuge2Change('ufRes', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Município Residência (05)</label>
                <input
                  type="text"
                  maxLength={5}
                  value={form.conjuge2.codMunRes}
                  onChange={(e) => handleConjuge2Change('codMunRes', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">País Residência (03)</label>
                <input
                  type="text"
                  maxLength={3}
                  value={form.conjuge2.codPaisRes}
                  onChange={(e) => handleConjuge2Change('codPaisRes', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono bg-white"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
