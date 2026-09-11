import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Layers,
  AlertTriangle,
  TrendingUp,
  RotateCw,
  Search,
  Filter,
  Download,
  Warehouse,
  Package,
  DollarSign,
  ArrowDownRight,
  ArrowUpRight,
  ArrowLeftRight,
  CheckCircle,
} from 'lucide-react';
import { StockPosition, Movement, Material, Sector, DashboardStats } from '../types.ts';
import { api } from '../lib/api.ts';

interface ReportsViewProps {
  materials: Material[];
  sectors: Sector[];
  stats: DashboardStats | null;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ materials, sectors, stats }) => {
  const [activeSubTab, setActiveSubTab] = useState<'positions' | 'kpis' | 'movements_report'>('positions');

  // Stock Positions Data
  const [positions, setPositions] = useState<StockPosition[]>([]);
  const [loadingPositions, setLoadingPositions] = useState(false);
  const [filterSectorId, setFilterSectorId] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('Todos');
  const [searchPosition, setSearchPosition] = useState<string>('');

  // Movements Report Data
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(false);
  const [movType, setMovType] = useState<string>('Todos');
  const [movSectorId, setMovSectorId] = useState<string>('');
  const [movStartDate, setMovStartDate] = useState<string>('');
  const [movEndDate, setMovEndDate] = useState<string>('');
  const [movSearch, setMovSearch] = useState<string>('');

  useEffect(() => {
    if (activeSubTab === 'positions') {
      loadPositions();
    } else if (activeSubTab === 'movements_report') {
      loadMovements();
    }
  }, [activeSubTab, filterSectorId, filterStatus, searchPosition, movType, movSectorId, movStartDate, movEndDate, movSearch]);

  const loadPositions = async () => {
    setLoadingPositions(true);
    try {
      const data = await api.getStockPositions({
        sectorId: filterSectorId ? Number(filterSectorId) : undefined,
        status: filterStatus !== 'Todos' ? filterStatus : undefined,
        search: searchPosition || undefined,
      });
      setPositions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPositions(false);
    }
  };

  const loadMovements = async () => {
    setLoadingMovements(true);
    try {
      const data = await api.getMovements({
        type: movType !== 'Todos' ? movType : undefined,
        sectorId: movSectorId ? Number(movSectorId) : undefined,
        startDate: movStartDate || undefined,
        endDate: movEndDate || undefined,
        search: movSearch || undefined,
      });
      setMovements(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMovements(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // Export position to CSV
  const exportPositionsToCSV = () => {
    if (!positions.length) return;
    const headers = ['Código', 'Material', 'Unidade', 'Estoque Mínimo', 'Saldo Total', 'Preço Unitário', 'Valor Total', 'Status', 'Distribuição por Setores'];
    const rows = positions.map((p) => [
      p.materialCode,
      `"${p.materialName}"`,
      p.unit,
      p.minQty,
      p.totalQuantity,
      p.unitPrice,
      p.totalValue,
      p.status,
      `"${p.sectors.map((s) => `${s.sectorName}: ${s.quantity}`).join(' | ')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `posicao_estoque_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalFilteredValue = positions.reduce((sum, p) => sum + p.totalValue, 0);
  const totalFilteredUnits = positions.reduce((sum, p) => sum + p.totalQuantity, 0);

  return (
    <div id="reports-view" className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Relatórios & Indicadores de Desempenho</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Análise aprofundada de estoques por setor, rotação de materiais e indicadores críticos
          </p>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex items-center p-1 bg-slate-200/80 rounded-lg text-xs font-semibold">
          <button
            id="subtab-positions"
            type="button"
            onClick={() => setActiveSubTab('positions')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeSubTab === 'positions'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Posição por Setor
          </button>
          <button
            id="subtab-kpis"
            type="button"
            onClick={() => setActiveSubTab('kpis')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeSubTab === 'kpis'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Indicadores (KPIs)
          </button>
          <button
            id="subtab-movements"
            type="button"
            onClick={() => setActiveSubTab('movements_report')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeSubTab === 'movements_report'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Extrato de Movimentações
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: POSIÇÃO DE ESTOQUES POR MATERIAL E SETOR */}
      {activeSubTab === 'positions' && (
        <div className="space-y-4">
          {/* Summary Mini Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Valor Total Filtrado</span>
              <p className="text-xl font-bold text-slate-900 mt-1 font-mono">
                {formatCurrency(totalFilteredValue)}
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Volume em Unidades</span>
              <p className="text-xl font-bold text-slate-900 mt-1 font-mono">
                {totalFilteredUnits.toLocaleString('pt-BR')} itens
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Total de Linhas</span>
              <p className="text-xl font-bold text-slate-900 mt-1 font-mono">
                {positions.length} materiais cadastrados
              </p>
            </div>
          </div>

          {/* Filters and CSV Export */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full sm:w-auto sm:flex-1">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filtrar por nome ou código..."
                  value={searchPosition}
                  onChange={(e) => setSearchPosition(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <select
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

              <div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                >
                  <option value="Todos">Todos os Status</option>
                  <option value="Normal">Normal</option>
                  <option value="Alerta">Alerta (Próximo ao Mínimo)</option>
                  <option value="Crítico">Crítico (Abaixo do Mínimo)</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={exportPositionsToCSV}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors border border-slate-200"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Exportar CSV</span>
            </button>
          </div>

          {/* Matrix Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            {loadingPositions ? (
              <div className="p-12 text-center text-slate-500 text-sm">
                <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Carregando posição consolidada de estoque...
              </div>
            ) : positions.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                Nenhum material encontrado com os critérios informados.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600 border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Código</th>
                      <th className="py-3 px-4">Material</th>
                      <th className="py-3 px-4 text-right">Est. Mínimo</th>
                      <th className="py-3 px-4 text-right">Saldo Total</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Distribuição por Setor / Local</th>
                      <th className="py-3 px-4 text-right">Valor Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {positions.map((pos) => {
                      let statusBadge = 'bg-emerald-50 text-emerald-800 border-emerald-300';
                      if (pos.status === 'Crítico') statusBadge = 'bg-rose-50 text-rose-800 border-rose-300 font-bold';
                      if (pos.status === 'Alerta') statusBadge = 'bg-amber-50 text-amber-800 border-amber-300';

                      return (
                        <tr key={pos.materialId} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                            {pos.materialCode}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900">{pos.materialName}</div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              Unidade: {pos.unit} • Preço: {formatCurrency(pos.unitPrice)}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-500 whitespace-nowrap">
                            {pos.minQty} {pos.unit}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                            {pos.totalQuantity} {pos.unit}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className={`inline-block px-2 py-0.5 rounded text-[11px] border ${statusBadge}`}>
                              {pos.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {pos.sectors.length === 0 ? (
                              <span className="text-slate-400 italic text-[11px]">Sem saldo registrado</span>
                            ) : (
                              <div className="flex flex-wrap gap-1.5">
                                {pos.sectors.map((s) => (
                                  <span
                                    key={s.sectorId}
                                    className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 text-[11px]"
                                  >
                                    <span className="font-medium mr-1 text-slate-600">{s.sectorName}:</span>
                                    <span className="font-mono font-bold text-slate-900">
                                      {s.quantity} {pos.unit}
                                    </span>
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 whitespace-nowrap">
                            {formatCurrency(pos.totalValue)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: INDICADORES DE DESEMPENHO (KPIS) */}
      {activeSubTab === 'kpis' && (
        <div className="space-y-6">
          {/* KPI 1: Estoque Mínimo Atingido */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="flex items-center space-x-2 pb-4 border-b border-slate-100">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Indicador: Materiais com Estoque Mínimo Atingido
                </h3>
                <p className="text-xs text-slate-500">
                  Itens cujo saldo atual é inferior ou igual à quantidade mínima de segurança cadastrada
                </p>
              </div>
            </div>

            <div className="mt-4">
              {!stats?.criticalItems.length ? (
                <div className="p-6 text-center text-slate-500 text-sm">
                  <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  Nenhum item abaixo do estoque mínimo. Estoque em estado saudável!
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold text-[11px] uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Código</th>
                        <th className="py-2.5 px-3">Material</th>
                        <th className="py-2.5 px-3 text-right">Saldo Atual</th>
                        <th className="py-2.5 px-3 text-right">Estoque Mínimo</th>
                        <th className="py-2.5 px-3 text-right">Déficit</th>
                        <th className="py-2.5 px-3">Nível Operacional</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {stats.criticalItems.map((it) => {
                        const ratio = it.minQty > 0 ? (it.currentStock / it.minQty) * 100 : 0;
                        return (
                          <tr key={it.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-bold text-slate-900">{it.code}</td>
                            <td className="py-2.5 px-3 font-sans font-medium text-slate-900">{it.name}</td>
                            <td className="py-2.5 px-3 text-right font-bold text-rose-600">
                              {it.currentStock} {it.unit}
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-600">
                              {it.minQty} {it.unit}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-amber-700">
                              -{it.deficit} {it.unit}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="w-32 bg-slate-100 rounded-full h-2 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-rose-500"
                                  style={{ width: `${Math.min(100, Math.round(ratio))}%` }}
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* KPI 2 & 3: Materiais Mais Movimentados & Giro de Estoque */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Mais movimentados */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
                <TrendingUp className="w-5 h-5 text-slate-700" />
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Ranking de Materiais Mais Movimentados
                </h3>
              </div>

              <div className="mt-4 space-y-3">
                {stats?.topMovedMaterials.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2.5">
                      <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-xs">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="font-semibold text-slate-900">{item.materialName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {item.materialCode} • {item.type}
                        </div>
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <span className="font-bold text-slate-900">
                        {item.totalQuantityMoved} {item.unit}
                      </span>
                      <div className="text-[10px] text-slate-400">
                        {item.totalMovements} transações
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Velocidade de Rotação (Turnover) */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
                <RotateCw className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    Velocidade de Rotação (Giro de Estoque)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Fórmula: Volume de Saídas / Estoque Médio
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {stats?.stockTurnoverKPIs.map((kpi) => {
                  let badge = 'bg-slate-100 text-slate-700';
                  if (kpi.turnoverStatus === 'Alto Giro') badge = 'bg-emerald-100 text-emerald-800 font-bold';
                  if (kpi.turnoverStatus === 'Médio Giro') badge = 'bg-blue-100 text-blue-800 font-bold';
                  if (kpi.turnoverStatus === 'Baixo Giro') badge = 'bg-amber-100 text-amber-800 font-bold';

                  return (
                    <div key={kpi.materialId} className="p-3 bg-slate-50 rounded-lg flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-slate-900">{kpi.materialName}</div>
                        <div className="text-[11px] text-slate-500">
                          Estoque atual: {kpi.currentStock} • Total consumido: {kpi.totalOut}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] ${badge}`}>
                          {kpi.turnoverStatus} ({kpi.turnoverRatio}x)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: EXTRATO COMPLETO DE MOVIMENTAÇÕES */}
      {activeSubTab === 'movements_report' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <select
                value={movType}
                onChange={(e) => setMovType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
              >
                <option value="Todos">Todos os Tipos</option>
                <option value="ENTRADA">Entrada</option>
                <option value="SAIDA">Saída</option>
                <option value="TRANSFERENCIA">Transferência</option>
              </select>
            </div>

            <div>
              <select
                value={movSectorId}
                onChange={(e) => setMovSectorId(e.target.value)}
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

            <div>
              <input
                type="date"
                value={movStartDate}
                onChange={(e) => setMovStartDate(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
              />
            </div>

            <div>
              <input
                type="date"
                value={movEndDate}
                onChange={(e) => setMovEndDate(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
              />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            {loadingMovements ? (
              <div className="p-12 text-center text-slate-500 text-sm">
                Carregando extrato de movimentações...
              </div>
            ) : movements.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                Nenhum registro encontrado no período selecionado.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600 border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Data</th>
                      <th className="py-3 px-4">Tipo</th>
                      <th className="py-3 px-4">Material</th>
                      <th className="py-3 px-4 text-right">Qtd</th>
                      <th className="py-3 px-4 text-right">Total (R$)</th>
                      <th className="py-3 px-4">Responsável</th>
                      <th className="py-3 px-4">Motivo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {movements.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 whitespace-nowrap text-slate-500">
                          {new Date(m.createdAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-2.5 px-4 whitespace-nowrap font-sans font-bold">
                          {m.type}
                        </td>
                        <td className="py-2.5 px-4 font-sans text-slate-900">{m.materialName}</td>
                        <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                          {m.quantity} {m.unit}
                        </td>
                        <td className="py-2.5 px-4 text-right">{formatCurrency(m.totalPrice)}</td>
                        <td className="py-2.5 px-4 font-sans text-slate-600">{m.userName}</td>
                        <td className="py-2.5 px-4 font-sans text-slate-500 truncate max-w-[200px]">{m.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
