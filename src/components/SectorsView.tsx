import React, { useState } from 'react';
import { Warehouse, Plus, Edit2, Trash2, X, CheckCircle2, AlertCircle, Building2 } from 'lucide-react';
import { Sector } from '../types.ts';
import { api } from '../lib/api.ts';

interface SectorsViewProps {
  sectors: Sector[];
  onSectorsChanged: () => void;
}

export const SectorsView: React.FC<SectorsViewProps> = ({ sectors, onSectorsChanged }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIsStorage, setFormIsStorage] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const openCreate = () => {
    setEditingId(null);
    setFormName('');
    setFormDescription('');
    setFormIsStorage(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEdit = (sec: Sector) => {
    setEditingId(sec.id);
    setFormName(sec.name);
    setFormDescription(sec.description || '');
    setFormIsStorage(sec.isStorage);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (sec: Sector) => {
    if (!confirm(`Deseja realmente remover o setor/local "${sec.name}"?`)) return;

    try {
      await api.deleteSector(sec.id);
      onSectorsChanged();
    } catch (err: any) {
      alert(err.message || 'Erro ao remover setor.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim()) {
      setFormError('Informe o nome do setor.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await api.updateSector(editingId, {
          name: formName.trim(),
          description: formDescription.trim() || undefined,
          isStorage: formIsStorage,
        });
      } else {
        await api.createSector({
          name: formName.trim(),
          description: formDescription.trim() || undefined,
          isStorage: formIsStorage,
        });
      }
      setIsModalOpen(false);
      onSectorsChanged();
    } catch (err: any) {
      setFormError(err.message || 'Erro ao salvar setor.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div id="sectors-view" className="space-y-6">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Gestão de Setores & Locais de Armazenamento</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configuração de almoxarifados físicos, depósitos, oficinas e setores requisitantes de consumo
          </p>
        </div>
        <button
          id="btn-add-sector"
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Setor / Local</span>
        </button>
      </div>

      {/* Grid of Sectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sectors.map((sec) => (
          <div
            key={sec.id}
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      sec.isStorage
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {sec.isStorage ? (
                      <Warehouse className="w-5 h-5" />
                    ) : (
                      <Building2 className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{sec.name}</h3>
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        sec.isStorage
                          ? 'bg-amber-50 text-amber-900 border border-amber-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {sec.isStorage ? 'Almoxarifado / Depósito' : 'Setor Operacional (Consumo)'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => openEdit(sec)}
                    className="p-1.5 text-slate-400 hover:text-slate-900 rounded"
                    title="Editar setor"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(sec)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                    title="Excluir setor"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {sec.description && (
                <p className="mt-3 text-xs text-slate-600 leading-relaxed">{sec.description}</p>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>ID: #{sec.id}</span>
              <span>
                Criado em: {new Date(sec.createdAt).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Sector Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Warehouse className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">
                  {editingId ? 'Editar Setor / Local' : 'Novo Setor ou Almoxarifado'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome do Setor / Local *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Almoxarifado Central, Manutenção Industrial..."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descrição e Localização Física
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Galpão B, Prateleiras 1 a 12, Ramal 4055..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="check-is-storage"
                  checked={formIsStorage}
                  onChange={(e) => setFormIsStorage(e.target.checked)}
                  className="w-4 h-4 text-amber-500 border-slate-300 rounded focus:ring-amber-500"
                />
                <label htmlFor="check-is-storage" className="text-xs font-semibold text-slate-700">
                  Este local armazena estoques físicos (Almoxarifado / Depósito)
                </label>
              </div>
              <p className="text-[11px] text-slate-400 pl-6">
                Se desmarcado, funcionará prioritariamente como setor requisitante / centro de custo para consumo de materiais.
              </p>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Salvando...' : 'Salvar Setor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
