import React, { useState, useEffect } from 'react';
import {
  ArrowLeftRight,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Filter,
  Search,
  Calendar,
  Warehouse,
  FileText,
  User,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Movement, Material, Sector, MovementType } from '../types.ts';
import { api } from '../lib/api.ts';

interface MovementsViewProps {
  materials: Material[];
  sectors: Sector[];
  onMovementCreated: () => void;
  openModalByDefault?: boolean;
  defaultType?: MovementType;
}

export const MovementsView: React.FC<MovementsViewProps> = ({
  materials,
  sectors,
  onMovementCreated,
  openModalByDefault = false,
  defaultType = 'ENTRADA',
}) => {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterType, setFilterType] = useState<string>('Todos');
  const [filterSectorId, setFilterSectorId] = useState<string>('');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(openModalByDefault);
  const [formType, setFormType] = useState<MovementType>(defaultType);
  const [formMaterialId, setFormMaterialId] = useState<string>('');
  const [formSourceSectorId, setFormSourceSectorId] = useState<string>('');
  const [formTargetSectorId, setFormTargetSectorId] = useState<string>('');
  const [formQuantity, setFormQuantity] = useState<string>('');
  const [formUnitPrice, setFormUnitPrice] = useState<string>('');
  const [formReason, setFormReason] = useState<string>('');
  const [formDocRef, setFormDocRef] = useState<string>('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadMovements();
  }, [filterType, filterSectorId, filterStartDate, filterEndDate, searchQuery]);

  useEffect(() => {
    if (openModalByDefault) {
      setIsModalOpen(true);
      setFormType(defaultType);
    }
  }, [openModalByDefault, defaultType]);

  const loadMovements = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getMovements({
        type: filterType !== 'Todos' ? filterType : undefined,
        sectorId: filterSectorId ? Number(filterSectorId) : undefined,
        startDate: filterStartDate || undefined,
        endDate: filterEndDate || undefined,
        search: searchQuery || undefined,
      });
      setMovements(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar movimentações.');
    } finally {
      setLoading(false);
    }
  };

  const handleMaterialChange = (matIdStr: string) => {
    setFormMaterialId(matIdStr);
    const selected = materials.find((m) => m.id === Number(matIdStr));
    if (selected) {
      setFormUnitPrice(String(selected.unitPrice));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!formMaterialId) {
      setFormError('Selecione o material a ser movimentado.');
      return;
    }
    const qty = Number(formQuantity);
    if (!qty || qty <= 0) {
      setFormError('Informe uma quantidade válida maior que zero.');
      return;
    }
    if (!formReason.trim()) {
      setFormError('Informe o motivo ou justificativa da movimentação.');
      return;
    }

    if (formType === 'ENTRADA' && !formTargetSectorId) {
      setFormError('Selecione o setor de destino para o recebimento.');
      return;
    }
    if (formType === 'SAIDA' && !formSourceSectorId) {
      setFormError('Selecione o setor de origem para a saída.');
      return;
    }
    if (formType === 'TRANSFERENCIA') {
      if (!formSourceSectorId || !formTargetSectorId) {
        setFormError('Selecione os setores de origem e destino para a transferência.');
        return;
      }
      if (formSourceSectorId === formTargetSectorId) {
        setFormError('O setor de destino deve ser diferente do setor de origem.');
        return;
      }
    }

    setFormSubmitting(true);
    try {
      await api.recordMovement({
        type: formType,
        materialId: Number(formMaterialId),
        sourceSectorId: formSourceSectorId ? Number(formSourceSectorId) : null,
        targetSectorId: formTargetSectorId ? Number(formTargetSectorId) : null,
        quantity: qty,
        unitPrice: formUnitPrice ? Number(formUnitPrice) : undefined,
        reason: formReason.trim(),
        documentRef: formDocRef.trim() || null,
      });

      setFormSuccess('Movimentação registrada com sucesso!');
      setTimeout(() => {
        setIsModalOpen(false);
        setFormSuccess(null);
        resetForm();
        loadMovements();
        onMovementCreated();
      }, 900);
    } catch (err: any) {
      setFormError(err.message || 'Erro ao registrar movimentação.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormMaterialId('');
    setFormSourceSectorId('');
    setFormTargetSectorId('');
    setFormQuantity('');
    setFormUnitPrice('');
    setFormReason('');
    setFormDocRef('');
    setFormError(null);
  };

  const selectedMaterial = materials.find((m) => m.id === Number(formMaterialId));

  return (
    <div id="movements-view" className="space-y-6">
      {/* Header and Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Registro & Histórico de Movimentações</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Controle de entradas (recebimentos), saídas (consumos) e transferências entre setores
          </p>
        </div>
        <button
          id="btn-open-new-movement"
          type="button"
          onClick={() => {
            resetForm();
            setFormType('ENTRADA');
            setIsModalOpen(true);
          }}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Movimentação</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700">
          <Filter className="w-4 h-4 text-amber-500" />
          <span>Filtros de Pesquisa</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Term */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              id="filter-movement-search"
              type="text"
              placeholder="Material, código, motivo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              id="filter-movement-type"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
            >
              <option value="Todos">Todos os Tipos</option>
              <option value="ENTRADA">Entrada (Recebimento)</option>
              <option value="SAIDA">Saída (Consumo/Baixa)</option>
              <option value="TRANSFERENCIA">Transferência entre Setores</option>
            </select>
          </div>

          {/* Sector Filter */}
          <div>
            <select
              id="filter-movement-sector"
              value={filterSectorId}
              onChange={(e) => setFilterSectorId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
            >
              <option value="">Todos os Setores</option>
              {sectors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Start */}
          <div className="flex items-center space-x-1.5">
            <span className="text-[11px] text-slate-400">De:</span>
            <input
              id="filter-movement-start"
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
            />
          </div>

          {/* Date End */}
          <div className="flex items-center space-x-1.5">
            <span className="text-[11px] text-slate-400">Até:</span>
            <input
              id="filter-movement-end"
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
            />
          </div>
        </div>

        {(filterType !== 'Todos' || filterSectorId || filterStartDate || filterEndDate || searchQuery) && (
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => {
                setFilterType('Todos');
                setFilterSectorId('');
                setFilterStartDate('');
                setFilterEndDate('');
                setSearchQuery('');
              }}
              className="text-xs text-amber-700 hover:text-amber-900 font-medium underline"
            >
              Limpar filtros
            </button>
          </div>
        )}
      </div>

      {/* Movements Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Carregando registros de movimentações...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600 text-sm">{error}</div>
        ) : movements.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <ArrowLeftRight className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Nenhuma movimentação encontrada com os filtros selecionados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Data / Hora</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Material</th>
                  <th className="py-3 px-4">Origem &rarr; Destino</th>
                  <th className="py-3 px-4 text-right">Quantidade</th>
                  <th className="py-3 px-4 text-right">Total (R$)</th>
                  <th className="py-3 px-4">Responsável</th>
                  <th className="py-3 px-4">Motivo / Doc</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movements.map((mov) => {
                  let badge = 'bg-slate-100 text-slate-700 border-slate-200';
                  let Icon = ArrowLeftRight;

                  if (mov.type === 'ENTRADA') {
                    badge = 'bg-emerald-50 text-emerald-800 border-emerald-300';
                    Icon = ArrowUpRight;
                  } else if (mov.type === 'SAIDA') {
                    badge = 'bg-rose-50 text-rose-800 border-rose-300';
                    Icon = ArrowDownRight;
                  } else if (mov.type === 'TRANSFERENCIA') {
                    badge = 'bg-indigo-50 text-indigo-800 border-indigo-300';
                    Icon = ArrowLeftRight;
                  }

                  return (
                    <tr key={mov.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-500">
                        {new Date(mov.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-bold border ${badge}`}
                        >
                          <Icon className="w-3 h-3" />
                          <span>{mov.type}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{mov.materialName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{mov.materialCode}</div>
                      </td>
                      <td className="py-3 px-4">
                        {mov.type === 'ENTRADA' && (
                          <span className="text-slate-700">
                            Fornecedor &rarr;{' '}
                            <span className="font-medium text-slate-900">{mov.targetSectorName}</span>
                          </span>
                        )}
                        {mov.type === 'SAIDA' && (
                          <span className="text-slate-700">
                            <span className="font-medium text-slate-900">{mov.sourceSectorName}</span>{' '}
                            &rarr; Consumo / Baixa
                          </span>
                        )}
                        {mov.type === 'TRANSFERENCIA' && (
                          <span className="text-slate-700">
                            <span className="font-medium text-slate-900">{mov.sourceSectorName}</span>{' '}
                            &rarr;{' '}
                            <span className="font-medium text-slate-900">{mov.targetSectorName}</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-bold text-slate-900">
                        {mov.type === 'SAIDA' ? '-' : '+'}{mov.quantity} {mov.unit}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap font-mono text-slate-700">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                          mov.totalPrice
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                        <div className="flex items-center space-x-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{mov.userName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 truncate max-w-[200px]" title={mov.reason}>
                          {mov.reason}
                        </div>
                        {mov.documentRef && (
                          <div className="text-[11px] text-slate-400 flex items-center space-x-1 mt-0.5">
                            <FileText className="w-3 h-3 text-slate-400" />
                            <span>{mov.documentRef}</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Register Movement Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-900 text-white">
              <div className="flex items-center space-x-2">
                <ArrowLeftRight className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">Registrar Nova Movimentação</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}
              {formSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                  <span>{formSuccess}</span>
                </div>
              )}

              {/* Movement Type Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Tipo de Movimentação *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormType('ENTRADA')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors flex items-center justify-center space-x-1.5 ${
                      formType === 'ENTRADA'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>Entrada</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormType('SAIDA')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors flex items-center justify-center space-x-1.5 ${
                      formType === 'SAIDA'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    <span>Saída</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormType('TRANSFERENCIA')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors flex items-center justify-center space-x-1.5 ${
                      formType === 'TRANSFERENCIA'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                    <span>Transferência</span>
                  </button>
                </div>
              </div>

              {/* Material Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Material / Insumo *
                </label>
                <select
                  id="input-movement-material"
                  value={formMaterialId}
                  onChange={(e) => handleMaterialChange(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                  required
                >
                  <option value="">-- Selecione o material --</option>
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.code} - {m.name} ({m.unit}) [Saldo Total: {m.totalStock || 0}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Sectors Selection based on movement type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(formType === 'SAIDA' || formType === 'TRANSFERENCIA') && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Setor de Origem *
                    </label>
                    <select
                      id="input-movement-source-sector"
                      value={formSourceSectorId}
                      onChange={(e) => setFormSourceSectorId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                      required
                    >
                      <option value="">-- Selecione a origem --</option>
                      {sectors
                        .filter((s) => s.isStorage)
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                {(formType === 'ENTRADA' || formType === 'TRANSFERENCIA') && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Setor de Destino *
                    </label>
                    <select
                      id="input-movement-target-sector"
                      value={formTargetSectorId}
                      onChange={(e) => setFormTargetSectorId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                      required
                    >
                      <option value="">-- Selecione o destino --</option>
                      {sectors.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Quantity and Unit Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quantidade ({selectedMaterial?.unit || 'UN'}) *
                  </label>
                  <input
                    id="input-movement-qty"
                    type="number"
                    step="any"
                    min="0.01"
                    placeholder="Ex: 10"
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Preço Unitário (R$)
                  </label>
                  <input
                    id="input-movement-price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formUnitPrice}
                    onChange={(e) => setFormUnitPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none font-mono"
                  />
                </div>
              </div>

              {/* Reason & Document Ref */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Motivo / Justificativa *
                </label>
                <input
                  id="input-movement-reason"
                  type="text"
                  placeholder="Ex: Recebimento de compra, manutenção preventiva máquina 04..."
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Documento de Referência (Opcional)
                </label>
                <input
                  id="input-movement-doc"
                  type="text"
                  placeholder="Ex: NF-12345, OS-8840, Requisição #12"
                  value={formDocRef}
                  onChange={(e) => setFormDocRef(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                />
              </div>

              {/* Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  id="btn-submit-movement"
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  {formSubmitting ? 'Gravando...' : 'Confirmar Movimentação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
