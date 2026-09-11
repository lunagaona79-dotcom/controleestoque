import React from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  TrendingUp,
  Package,
  DollarSign,
  ClipboardCheck,
  Clock,
  ArrowLeftRight,
  PlusCircle,
  Eye,
} from 'lucide-react';
import { DashboardStats, Movement } from '../types.ts';

interface DashboardViewProps {
  stats: DashboardStats | null;
  loading: boolean;
  onNavigateToMovements: () => void;
  onNavigateToRequisitions: () => void;
  onNavigateToReports: () => void;
  onOpenNewMovement: (defaultType?: 'ENTRADA' | 'SAIDA' | 'TRANSFERENCIA') => void;
  onOpenNewRequisition: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  loading,
  onNavigateToMovements,
  onNavigateToRequisitions,
  onNavigateToReports,
  onOpenNewMovement,
  onOpenNewRequisition,
}) => {
  if (loading || !stats) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[360px]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-500 font-medium">Carregando indicadores e estoques...</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div id="dashboard-view" className="space-y-6">
      {/* Top Banner with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-5 text-white shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Painel de Controle e Indicadores</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitoramento em tempo real do nível de inventário, alertas de reposição e movimentações
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="btn-quick-entry"
            type="button"
            onClick={() => onOpenNewMovement('ENTRADA')}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Registrar Entrada</span>
          </button>
          <button
            id="btn-quick-exit"
            type="button"
            onClick={() => onOpenNewMovement('SAIDA')}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <ArrowDownRight className="w-4 h-4" />
            <span>Registrar Saída</span>
          </button>
          <button
            id="btn-quick-req"
            type="button"
            onClick={onOpenNewRequisition}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <PlusCircle className="w-4 h-4 text-amber-400" />
            <span>Nova Requisição</span>
          </button>
        </div>
      </div>

      {/* KPI Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Valor em Estoque */}
        <div id="kpi-stock-value" className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Patrimônio em Estoque
            </span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatCurrency(stats.totalStockValue)}
            </p>
            <div className="mt-1 flex items-center text-xs text-slate-500">
              <Package className="w-3.5 h-3.5 mr-1 text-slate-400" />
              <span>{stats.totalStockUnits.toLocaleString('pt-BR')} unidades armazenadas</span>
            </div>
          </div>
        </div>

        {/* Card 2: Estoques Críticos */}
        <div
          id="kpi-critical-stock"
          className={`border rounded-xl p-5 shadow-xs ${
            stats.criticalStockCount > 0
              ? 'bg-amber-50/70 border-amber-300'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Estoques Críticos
            </span>
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                stats.criticalStockCount > 0
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-slate-900 tracking-tight">
              {stats.criticalStockCount} {stats.criticalStockCount === 1 ? 'material' : 'materiais'}
            </p>
            <p className="mt-1 text-xs text-amber-800 font-medium">
              {stats.criticalStockCount > 0
                ? 'Abaixo ou no limite do estoque mínimo'
                : 'Todos os itens em nível seguro'}
            </p>
          </div>
        </div>

        {/* Card 3: Requisições Pendentes */}
        <div id="kpi-pending-reqs" className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Requisições Pendentes
            </span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-slate-900 tracking-tight">
              {stats.pendingRequisitionsCount}
            </p>
            <button
              type="button"
              onClick={onNavigateToRequisitions}
              className="mt-1 inline-flex items-center text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Ver fila de atendimento &rarr;
            </button>
          </div>
        </div>

        {/* Card 4: Total de Materiais Cadastrados */}
        <div id="kpi-total-items" className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Itens Cadastrados
            </span>
            <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-slate-900 tracking-tight">
              {stats.totalMaterials}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {stats.movementsTodayCount} movimentações registradas hoje
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Critical Stock + Recent Movements */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Critical Stock List (7 cols) */}
        <div id="section-critical-stock" className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Estoques Críticos e Reposição Necessária
              </h3>
            </div>
            <button
              type="button"
              onClick={onNavigateToReports}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center space-x-1"
            >
              <span>Ver Posição Completa</span>
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>

          {stats.criticalItems.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">
              <Package className="w-8 h-8 mx-auto mb-2 text-emerald-400 opacity-60" />
              <p className="text-slate-600 font-medium">Nenhum item com estoque abaixo do mínimo.</p>
              <p className="text-xs text-slate-400 mt-0.5">Todos os níveis operacionais estão adequados.</p>
            </div>
          ) : (
            <div className="mt-3 divide-y divide-slate-100 overflow-hidden">
              {stats.criticalItems.map((item) => {
                const percent = Math.min(100, Math.round((item.currentStock / item.minQty) * 100));
                return (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono font-semibold px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                          {item.code}
                        </span>
                        <h4 className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                          {item.name}
                        </h4>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-2 flex items-center space-x-3">
                        <div className="w-32 sm:w-48 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              percent <= 50 ? 'bg-rose-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {percent}% do mínimo
                        </span>
                      </div>
                    </div>

                    {/* Quantities */}
                    <div className="text-right whitespace-nowrap">
                      <div className="text-xs font-bold text-rose-600">
                        {item.currentStock} {item.unit}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Mín: {item.minQty} {item.unit}
                      </div>
                      <div className="text-[10px] text-amber-700 font-medium">
                        Déficit: -{item.deficit}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenNewMovement('ENTRADA')}
                      className="hidden sm:inline-flex px-2.5 py-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded border border-emerald-200 transition-colors"
                    >
                      Repor
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Recent Movements (5 cols) */}
        <div id="section-recent-movements" className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Movimentações Recentes
              </h3>
            </div>
            <button
              type="button"
              onClick={onNavigateToMovements}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              Ver Todas &rarr;
            </button>
          </div>

          {stats.recentMovements.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">
              <ArrowLeftRight className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Nenhuma movimentação registrada até o momento.</p>
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {stats.recentMovements.map((mov: Movement) => {
                let badgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
                let Icon = ArrowLeftRight;

                if (mov.type === 'ENTRADA') {
                  badgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                  Icon = ArrowUpRight;
                } else if (mov.type === 'SAIDA') {
                  badgeClass = 'bg-rose-50 text-rose-800 border-rose-200';
                  Icon = ArrowDownRight;
                } else if (mov.type === 'TRANSFERENCIA') {
                  badgeClass = 'bg-indigo-50 text-indigo-800 border-indigo-200';
                  Icon = ArrowLeftRight;
                }

                return (
                  <div
                    key={mov.id}
                    className="p-3 bg-slate-50/70 border border-slate-200 rounded-lg text-xs hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded font-semibold text-[10px] border ${badgeClass}`}
                        >
                          <Icon className="w-3 h-3" />
                          <span>{mov.type}</span>
                        </span>
                        <span className="font-semibold text-slate-900 truncate max-w-[150px] sm:max-w-[180px]">
                          {mov.materialName}
                        </span>
                      </div>
                      <span className="font-bold text-slate-900 font-mono whitespace-nowrap">
                        {mov.type === 'SAIDA' ? '-' : '+'}{mov.quantity} {mov.unit}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="truncate max-w-[200px]" title={mov.reason}>
                        {mov.reason}
                      </span>
                      <span className="text-slate-400 font-mono">
                        {new Date(mov.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Top Moved Materials + Stock Rotation Turnover */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Moved Materials */}
        <div id="section-top-moved" className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-slate-700" />
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Materiais Mais Movimentados
              </h3>
            </div>
          </div>

          <div className="mt-3 divide-y divide-slate-100">
            {stats.topMovedMaterials.map((item, idx) => (
              <div key={`${item.materialId}-${item.type}-${idx}`} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold">
                    {idx + 1}
                  </span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-slate-900">
                      {item.materialName}
                    </h4>
                    <span className="text-[11px] text-slate-500 font-mono">{item.materialCode}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-xs sm:text-sm text-slate-900">
                    {item.totalQuantityMoved.toLocaleString('pt-BR')} {item.unit}
                  </span>
                  <p className="text-[10px] text-slate-400">
                    {item.totalMovements} {item.totalMovements === 1 ? 'operação' : 'operações'} ({item.type})
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stock Turnover Indicator */}
        <div id="section-turnover" className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <ArrowLeftRight className="w-4 h-4 text-amber-600" />
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Velocidade de Rotação (Giro de Estoque)
              </h3>
            </div>
          </div>

          <div className="mt-3 divide-y divide-slate-100">
            {stats.stockTurnoverKPIs.slice(0, 5).map((kpi) => {
              let tagColor = 'bg-slate-100 text-slate-700';
              if (kpi.turnoverStatus === 'Alto Giro') tagColor = 'bg-emerald-100 text-emerald-800';
              if (kpi.turnoverStatus === 'Médio Giro') tagColor = 'bg-blue-100 text-blue-800';
              if (kpi.turnoverStatus === 'Baixo Giro') tagColor = 'bg-amber-100 text-amber-800';

              return (
                <div key={kpi.materialId} className="py-2.5 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-slate-900 truncate max-w-[220px]">
                      {kpi.materialName}
                    </h4>
                    <div className="text-[11px] text-slate-500 space-x-2">
                      <span>Estoque: {kpi.currentStock}</span>
                      <span>•</span>
                      <span>Saídas: {kpi.totalOut}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${tagColor}`}>
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
  );
};
