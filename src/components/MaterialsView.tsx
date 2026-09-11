import React, { useState } from 'react';
import {
  Boxes,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Package,
  Eye,
} from 'lucide-react';
import { Material } from '../types.ts';
import { api } from '../lib/api.ts';

interface MaterialsViewProps {
  materials: Material[];
  onMaterialsChanged: () => void;
}

export const MaterialsView: React.FC<MaterialsViewProps> = ({
  materials,
  onMaterialsChanged,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form Fields
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('Geral');
  const [formUnit, setFormUnit] = useState('UN');
  const [formMinQty, setFormMinQty] = useState('');
  const [formUnitPrice, setFormUnitPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const categories = ['Todas', ...Array.from(new Set(materials.map((m) => m.category || 'Geral')))];

  const filtered = materials.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.code.toLowerCase().includes(search.toLowerCase()) ||
      (m.description && m.description.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory = selectedCategory === 'Todas' || m.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const openCreateModal = () => {
    setEditingId(null);
    setFormCode(`MAT-00${materials.length + 1}`);
    setFormName('');
    setFormDescription('');
    setFormCategory('Peças & Fixadores');
    setFormUnit('UN');
    setFormMinQty('10');
    setFormUnitPrice('0');
    setFormError(null);
    setFormSuccess(null);
    setIsModalOpen(true);
  };

  const openEditModal = (mat: Material) => {
    setEditingId(mat.id);
    setFormCode(mat.code);
    setFormName(mat.name);
    setFormDescription(mat.description || '');
    setFormCategory(mat.category || 'Geral');
    setFormUnit(mat.unit);
    setFormMinQty(String(mat.minQty));
    setFormUnitPrice(String(mat.unitPrice));
    setFormError(null);
    setFormSuccess(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (mat: Material) => {
    if (!confirm(`Deseja realmente excluir o material "${mat.name}"?`)) return;

    try {
      await api.deleteMaterial(mat.id);
      onMaterialsChanged();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir material.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!formCode.trim() || !formName.trim()) {
      setFormError('Código e nome são obrigatórios.');
      return;
    }

    const minQty = Number(formMinQty);
    const unitPrice = Number(formUnitPrice);

    setSubmitting(true);
    try {
      if (editingId) {
        await api.updateMaterial(editingId, {
          code: formCode.trim(),
          name: formName.trim(),
          description: formDescription.trim() || undefined,
          category: formCategory.trim() || undefined,
          unit: formUnit.trim(),
          minQty: isNaN(minQty) ? 0 : minQty,
          unitPrice: isNaN(unitPrice) ? 0 : unitPrice,
        });
        setFormSuccess('Material atualizado com sucesso!');
      } else {
        await api.createMaterial({
          code: formCode.trim(),
          name: formName.trim(),
          description: formDescription.trim() || undefined,
          category: formCategory.trim() || undefined,
          unit: formUnit.trim(),
          minQty: isNaN(minQty) ? 0 : minQty,
          unitPrice: isNaN(unitPrice) ? 0 : unitPrice,
        });
        setFormSuccess('Material cadastrado com sucesso!');
      }

      setTimeout(() => {
        setIsModalOpen(false);
        setFormSuccess(null);
        onMaterialsChanged();
      }, 750);
    } catch (err: any) {
      setFormError(err.message || 'Erro ao salvar material.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div id="materials-view" className="space-y-6">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Cadastro & Gestão de Materiais</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cadastros de itens, códigos SKU, estoques de segurança (mínimo) e preços unitários
          </p>
        </div>
        <button
          id="btn-add-material"
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Material</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por código, nome ou descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
          />
        </div>

        <div className="w-full sm:w-64">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                Categoria: {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Materials Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Material / Insumo</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4 text-center">UN</th>
                <th className="py-3 px-4 text-right">Est. Mínimo</th>
                <th className="py-3 px-4 text-right">Saldo Atual</th>
                <th className="py-3 px-4 text-right">Preço Unitário</th>
                <th className="py-3 px-4 text-right">Total em Estoque</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((mat) => {
                const isCritical = (mat.totalStock || 0) <= mat.minQty;
                return (
                  <tr key={mat.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {mat.code}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{mat.name}</div>
                      {mat.description && (
                        <div className="text-[11px] text-slate-400 truncate max-w-[280px]">
                          {mat.description}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                        {mat.category || 'Geral'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap font-mono text-slate-600">
                      {mat.unit}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap font-mono text-slate-500">
                      {mat.minQty}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-bold">
                      <span className={isCritical ? 'text-rose-600' : 'text-slate-900'}>
                        {mat.totalStock || 0}
                      </span>
                      {isCritical && (
                        <span className="ml-1 text-[10px] text-rose-600 font-bold">!</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap font-mono text-slate-700">
                      {formatCurrency(mat.unitPrice)}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-semibold text-slate-900">
                      {formatCurrency((mat.totalStock || 0) * mat.unitPrice)}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap space-x-1.5">
                      <button
                        type="button"
                        onClick={() => openEditModal(mat)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                        title="Editar Material"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(mat)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        title="Excluir Material"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Material Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Boxes className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">
                  {editingId ? 'Editar Cadastro de Material' : 'Cadastrar Novo Material'}
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
              {formSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-700 flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Código SKU *
                  </label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none uppercase"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome do Material *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Rolamento Blindado 6204-2RS"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descrição Técnica Detalhada
                </label>
                <textarea
                  rows={2}
                  placeholder="Dimensões, especificações de material, fabricante..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Categoria
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Peças, Ferramentas, Elétrica..."
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unidade de Medida *
                  </label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                    required
                  >
                    <option value="UN">UN - Unidade</option>
                    <option value="KG">KG - Quilograma</option>
                    <option value="LT">LT - Litro</option>
                    <option value="MT">MT - Metro</option>
                    <option value="CX">CX - Caixa</option>
                    <option value="PC">PC - Peça</option>
                    <option value="PAR">PAR - Par</option>
                    <option value="RL">RL - Rolo</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Estoque Mínimo (Ponto de Alerta) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formMinQty}
                    onChange={(e) => setFormMinQty(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Preço Unitário Estimado (R$)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formUnitPrice}
                    onChange={(e) => setFormUnitPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

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
                  {submitting ? 'Salvando...' : 'Salvar Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
