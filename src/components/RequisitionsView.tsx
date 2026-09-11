import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Plus,
  Printer,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Check,
  Calendar,
  X,
  Trash2,
  Package,
} from 'lucide-react';
import { Requisition, Material, Sector, RequisitionItem } from '../types.ts';
import { api } from '../lib/api.ts';
import { PrintableRequisition } from './PrintableRequisition.tsx';

interface RequisitionsViewProps {
  materials: Material[];
  sectors: Sector[];
  onRequisitionChange: () => void;
  openCreateByDefault?: boolean;
}

export const RequisitionsView: React.FC<RequisitionsViewProps> = ({
  materials,
  sectors,
  onRequisitionChange,
  openCreateByDefault = false,
}) => {
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>('Todos');
  const [filterSectorId, setFilterSectorId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Print modal
  const [selectedForPrint, setSelectedForPrint] = useState<Requisition | null>(null);

  // Fulfill modal
  const [fulfillingReq, setFulfillingReq] = useState<Requisition | null>(null);
  const [fulfillSourceSectorId, setFulfillSourceSectorId] = useState<string>('');
  const [fulfillingSubmitting, setFulfillingSubmitting] = useState(false);
  const [fulfillError, setFulfillError] = useState<string | null>(null);

  // Create Requisition modal
  const [isCreateOpen, setIsCreateOpen] = useState(openCreateByDefault);
  const [reqSectorId, setReqSectorId] = useState<string>('');
  const [requesterName, setRequesterName] = useState<string>('');
  const [priority, setPriority] = useState<'Baixa' | 'Normal' | 'Urgente'>('Normal');
  const [notes, setNotes] = useState<string>('');
  const [items, setItems] = useState<{ materialId: number; requestedQty: number; notes: string }[]>([
    { materialId: materials[0]?.id || 0, requestedQty: 1, notes: '' },
  ]);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadRequisitions();
  }, [filterStatus, filterSectorId, searchQuery]);

  useEffect(() => {
    if (openCreateByDefault) {
      setIsCreateOpen(true);
    }
  }, [openCreateByDefault]);

  const loadRequisitions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getRequisitions({
        status: filterStatus !== 'Todos' ? filterStatus : undefined,
        sectorId: filterSectorId ? Number(filterSectorId) : undefined,
        search: searchQuery || undefined,
      });
      setRequisitions(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar requisições.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItemRow = () => {
    setItems([
      ...items,
      { materialId: materials[0]?.id || 0, requestedQty: 1, notes: '' },
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateSuccess(null);

    if (!reqSectorId) {
      setCreateError('Selecione o setor solicitante.');
      return;
    }
    if (!requesterName.trim()) {
      setCreateError('Informe o nome do solicitante.');
      return;
    }

    // Validate items
    for (const it of items) {
      if (!it.materialId) {
        setCreateError('Selecione todos os materiais da lista.');
        return;
      }
      if (!it.requestedQty || it.requestedQty <= 0) {
        setCreateError('A quantidade solicitada para todos os itens deve ser maior que zero.');
        return;
      }
    }

    setCreateSubmitting(true);
    try {
      const newReq = await api.createRequisition({
        requestingSectorId: Number(reqSectorId),
        requesterName: requesterName.trim(),
        priority,
        notes: notes.trim() || undefined,
        items,
      });

      setCreateSuccess(`Requisição ${newReq.requisitionNumber} criada com sucesso!`);
      setTimeout(() => {
        setIsCreateOpen(false);
        setCreateSuccess(null);
        resetCreateForm();
        loadRequisitions();
        onRequisitionChange();
      }, 900);
    } catch (err: any) {
      setCreateError(err.message || 'Erro ao criar requisição.');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const resetCreateForm = () => {
    setReqSectorId('');
    setRequesterName('');
    setPriority('Normal');
    setNotes('');
    setItems([{ materialId: materials[0]?.id || 0, requestedQty: 1, notes: '' }]);
    setCreateError(null);
  };

  const handleStatusChange = async (id: number, newStatus: 'Pendente' | 'Aprovada' | 'Cancelada') => {
    try {
      await api.updateRequisitionStatus(id, newStatus);
      loadRequisitions();
      onRequisitionChange();
    } catch (err: any) {
      alert(err.message || 'Erro ao alterar status.');
    }
  };

  const handleFulfillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fulfillingReq) return;
    if (!fulfillSourceSectorId) {
      setFulfillError('Selecione o setor do almoxarifado de onde os itens serão baixados.');
      return;
    }

    setFulfillingSubmitting(true);
    setFulfillError(null);
    try {
      await api.fulfillRequisition(fulfillingReq.id, Number(fulfillSourceSectorId));
      setFulfillingReq(null);
      loadRequisitions();
      onRequisitionChange();
    } catch (err: any) {
      setFulfillError(err.message || 'Erro ao atender requisição.');
    } finally {
      setFulfillingSubmitting(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div id="requisitions-view" className="space-y-6">
      {/* Header and New Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Requisições de Materiais</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Criação de pedidos internos, atendimento/baixa em estoque e emissão de folhas para impressão (PDF)
          </p>
        </div>
        <button
          id="btn-open-new-requisition"
          type="button"
          onClick={() => {
            resetCreateForm();
            setIsCreateOpen(true);
          }}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Criar Nova Requisição</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              id="filter-req-search"
              type="text"
              placeholder="Número, solicitante, setor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
            />
          </div>

          <div>
            <select
              id="filter-req-status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
            >
              <option value="Todos">Todos os Status</option>
              <option value="Pendente">Pendente</option>
              <option value="Aprovada">Aprovada</option>
              <option value="Atendida">Atendida</option>
              <option value="Cancelada">Cancelada</option>
            </select>
          </div>

          <div>
            <select
              id="filter-req-sector"
              value={filterSectorId}
              onChange={(e) => setFilterSectorId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
            >
              <option value="">Todos os Setores Solicitantes</option>
              {sectors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Requisitions List Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Carregando requisições...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600 text-sm">{error}</div>
        ) : requisitions.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Nenhuma requisição encontrada com os filtros selecionados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Código Ordem</th>
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Setor Solicitante</th>
                  <th className="py-3 px-4">Solicitante</th>
                  <th className="py-3 px-4 text-center">Itens</th>
                  <th className="py-3 px-4 text-right">Valor Estimado</th>
                  <th className="py-3 px-4">Prioridade</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requisitions.map((req) => {
                  let statusColor = 'bg-slate-100 text-slate-700 border-slate-200';
                  if (req.status === 'Pendente') statusColor = 'bg-amber-50 text-amber-800 border-amber-300';
                  if (req.status === 'Aprovada') statusColor = 'bg-blue-50 text-blue-800 border-blue-300';
                  if (req.status === 'Atendida') statusColor = 'bg-emerald-50 text-emerald-800 border-emerald-300';
                  if (req.status === 'Cancelada') statusColor = 'bg-rose-50 text-rose-800 border-rose-300';

                  return (
                    <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap font-mono font-bold text-slate-900">
                        {req.requisitionNumber}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-500">
                        {new Date(req.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {req.requestingSectorName}
                      </td>
                      <td className="py-3 px-4 text-slate-700">{req.requesterName}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                          {req.items.length} {req.items.length === 1 ? 'item' : 'itens'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 whitespace-nowrap">
                        {formatCurrency(req.totalEstimatedValue || 0)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`text-[11px] font-bold ${
                            req.priority === 'Urgente'
                              ? 'text-rose-600'
                              : req.priority === 'Baixa'
                              ? 'text-slate-500'
                              : 'text-amber-700'
                          }`}
                        >
                          {req.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border ${statusColor}`}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-center space-x-1.5">
                        {/* Print Button */}
                        <button
                          type="button"
                          onClick={() => setSelectedForPrint(req)}
                          className="p-1.5 rounded text-slate-600 hover:text-slate-950 hover:bg-slate-100 transition-colors"
                          title="Imprimir Requisição (PDF)"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {/* Fulfill Button if pending or approved */}
                        {(req.status === 'Pendente' || req.status === 'Aprovada') && (
                          <button
                            type="button"
                            onClick={() => {
                              setFulfillingReq(req);
                              const central = sectors.find((s) => s.isStorage);
                              if (central) setFulfillSourceSectorId(String(central.id));
                            }}
                            className="inline-flex items-center space-x-1 px-2 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded shadow-2xs transition-colors"
                            title="Atender requisição e baixar itens do estoque"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Atender</span>
                          </button>
                        )}

                        {/* Status dropdown or cancel */}
                        {req.status === 'Pendente' && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(req.id, 'Cancelada')}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                            title="Cancelar requisição"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
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

      {/* Printable Modal */}
      {selectedForPrint && (
        <PrintableRequisition
          requisition={selectedForPrint}
          onClose={() => setSelectedForPrint(null)}
        />
      )}

      {/* Fulfill (Atender) Modal */}
      {fulfillingReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">
                Atendimento da Requisição {fulfillingReq.requisitionNumber}
              </h3>
              <button
                type="button"
                onClick={() => setFulfillingReq(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFulfillSubmit} className="p-6 space-y-4">
              {fulfillError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700">
                  {fulfillError}
                </div>
              )}

              <p className="text-xs text-slate-600">
                Ao confirmar o atendimento, o sistema deduzirá automaticamente as quantidades solicitadas do setor de estoque selecionado abaixo:
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Setor Fornecedor (Origem da Baixa) *
                </label>
                <select
                  value={fulfillSourceSectorId}
                  onChange={(e) => setFulfillSourceSectorId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                  required
                >
                  <option value="">-- Selecione o setor de saída --</option>
                  {sectors
                    .filter((s) => s.isStorage)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Items preview */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 max-h-40 overflow-y-auto">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Itens a baixar:
                </span>
                {fulfillingReq.items.map((it) => (
                  <div key={it.id} className="text-xs flex items-center justify-between text-slate-700">
                    <span className="truncate max-w-[200px]">{it.materialName}</span>
                    <span className="font-mono font-bold text-slate-900">
                      {it.requestedQty} {it.unit}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setFulfillingReq(null)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={fulfillingSubmitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm disabled:opacity-50"
                >
                  {fulfillingSubmitting ? 'Processando baixa...' : 'Confirmar Atendimento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Requisition Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full overflow-hidden animate-in fade-in my-8">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <ClipboardList className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">Nova Requisição de Materiais</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              {createError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{createError}</span>
                </div>
              )}
              {createSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                  <span>{createSuccess}</span>
                </div>
              )}

              {/* Header Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Setor Solicitante *
                  </label>
                  <select
                    id="input-req-sector"
                    value={reqSectorId}
                    onChange={(e) => setReqSectorId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                    required
                  >
                    <option value="">-- Selecione o setor --</option>
                    {sectors.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome do Solicitante *
                  </label>
                  <input
                    id="input-req-requester"
                    type="text"
                    placeholder="Ex: Roberto Silva"
                    value={requesterName}
                    onChange={(e) => setRequesterName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Prioridade
                  </label>
                  <select
                    id="input-req-priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                  >
                    <option value="Baixa">Baixa</option>
                    <option value="Normal">Normal</option>
                    <option value="Urgente">Urgente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Justificativa / Observações
                </label>
                <input
                  id="input-req-notes"
                  type="text"
                  placeholder="Ex: Reposição de peças para linha de montagem turno 1"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                />
              </div>

              {/* Items Table Builder */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Itens da Requisição ({items.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-600" />
                    <span>Adicionar Item</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-60 overflow-y-auto">
                  {items.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-50/50 flex flex-col sm:flex-row items-center gap-2">
                      <div className="w-full sm:flex-1">
                        <select
                          value={item.materialId}
                          onChange={(e) => handleItemChange(idx, 'materialId', Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs bg-white focus:ring-1 focus:ring-amber-500 outline-none"
                          required
                        >
                          {materials.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.code} - {m.name} ({m.unit})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-28">
                        <input
                          type="number"
                          step="any"
                          min="0.01"
                          placeholder="Qtd."
                          value={item.requestedQty}
                          onChange={(e) => handleItemChange(idx, 'requestedQty', Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-amber-500 outline-none font-mono"
                          required
                        />
                      </div>

                      <div className="w-full sm:w-44">
                        <input
                          type="text"
                          placeholder="Observação (opcional)"
                          value={item.notes}
                          onChange={(e) => handleItemChange(idx, 'notes', e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                        />
                      </div>

                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          title="Remover linha"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit / Cancel buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  id="btn-submit-create-req"
                  type="submit"
                  disabled={createSubmitting}
                  className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  {createSubmitting ? 'Gerando requisição...' : 'Salvar e Gerar Requisição'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
