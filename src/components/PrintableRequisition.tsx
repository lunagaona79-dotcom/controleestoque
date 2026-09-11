import React from 'react';
import { Printer, X, CheckCircle, Clock, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Requisition } from '../types.ts';

interface PrintableRequisitionProps {
  requisition: Requisition;
  onClose: () => void;
}

export const PrintableRequisition: React.FC<PrintableRequisitionProps> = ({
  requisition,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 p-4 sm:p-6 flex items-center justify-center backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200">
        {/* Modal Action Bar (Hidden in Print) */}
        <div className="no-print px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Printer className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Visualização de Impressão da Requisição
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              id="btn-trigger-print"
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg shadow-sm transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / Salvar PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Area */}
        <div id="printable-requisition-sheet" className="p-8 sm:p-12 text-slate-800 bg-white font-sans">
          {/* Company Document Header */}
          <div className="border-b-2 border-slate-900 pb-5 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">
                  SISTEMA DE GESTÃO DE ESTOQUES
                </h1>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mt-0.5">
                  REQUISIÇÃO INTERNA DE MATERIAIS E INSUMOS
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Documento Operacional de Controle e Baixa de Inventário
                </p>
              </div>

              {/* Number and Date box */}
              <div className="text-right">
                <div className="inline-block border-2 border-slate-900 px-3 py-1 rounded bg-slate-50 font-mono text-base font-bold text-slate-900">
                  {requisition.requisitionNumber}
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-1">
                  Data:{' '}
                  {new Date(requisition.createdAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs mb-6">
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400">
                Setor Solicitante
              </span>
              <span className="font-bold text-slate-900">{requisition.requestingSectorName}</span>
            </div>

            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400">
                Solicitante / Responsável
              </span>
              <span className="font-semibold text-slate-900">{requisition.requesterName}</span>
            </div>

            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400">
                Prioridade
              </span>
              <span
                className={`font-bold ${
                  requisition.priority === 'Urgente'
                    ? 'text-rose-600'
                    : requisition.priority === 'Baixa'
                    ? 'text-slate-600'
                    : 'text-amber-700'
                }`}
              >
                {requisition.priority.toUpperCase()}
              </span>
            </div>

            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400">
                Status da Ordem
              </span>
              <span
                className={`font-bold ${
                  requisition.status === 'Atendida'
                    ? 'text-emerald-700'
                    : requisition.status === 'Pendente'
                    ? 'text-amber-700'
                    : 'text-slate-800'
                }`}
              >
                {requisition.status.toUpperCase()}
              </span>
            </div>
          </div>

          {requisition.notes && (
            <div className="mb-6 p-3 bg-amber-50/50 border border-amber-200/60 rounded text-xs text-slate-700">
              <span className="font-bold text-amber-900">Finalidade / Observações: </span>
              {requisition.notes}
            </div>
          )}

          {/* Items Table */}
          <div className="mb-8">
            <table className="w-full text-left text-xs border border-slate-300">
              <thead className="bg-slate-100 border-b border-slate-300 font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3 border-r border-slate-200 w-12 text-center">Item</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 w-24">Código SKU</th>
                  <th className="py-2.5 px-3 border-r border-slate-200">Descrição do Material</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 w-16 text-center">UN</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 w-24 text-right">Qtd. Req.</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 w-24 text-right">Qtd. Atend.</th>
                  <th className="py-2.5 px-3 text-right w-24">Estimado (R$)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                {requisition.items.map((it, idx) => {
                  const lineTotal = (it.requestedQty || 0) * (it.unitPrice || 0);
                  return (
                    <tr key={it.id || idx}>
                      <td className="py-2 px-3 text-center border-r border-slate-200 font-sans text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 font-bold text-slate-900">
                        {it.materialCode}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 font-sans text-slate-900">
                        <div className="font-medium">{it.materialName}</div>
                        {it.notes && (
                          <div className="text-[10px] text-slate-500 italic mt-0.5">{it.notes}</div>
                        )}
                      </td>
                      <td className="py-2 px-3 text-center border-r border-slate-200 text-slate-600">
                        {it.unit}
                      </td>
                      <td className="py-2 px-3 text-right border-r border-slate-200 font-bold text-slate-900">
                        {it.requestedQty}
                      </td>
                      <td className="py-2 px-3 text-right border-r border-slate-200 text-slate-700">
                        {it.fulfilledQty !== undefined ? it.fulfilledQty : '---'}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-700">
                        {formatCurrency(lineTotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50 border-t-2 border-slate-300 font-bold text-xs">
                <tr>
                  <td colSpan={6} className="py-2.5 px-3 text-right uppercase text-slate-700">
                    Valor Total Estimado da Requisição:
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-900 font-mono">
                    {formatCurrency(requisition.totalEstimatedValue || 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Fulfillment details if attended */}
          {requisition.status === 'Atendida' && (
            <div className="mb-8 p-3 rounded bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
              <span className="font-bold">Requisição Atendida em:</span>{' '}
              {requisition.fulfilledAt
                ? new Date(requisition.fulfilledAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Data registrada no sistema'}{' '}
              por <span className="font-bold">{requisition.fulfilledByUserName || 'Almoxarife Responsável'}</span>.
            </div>
          )}

          {/* Signatures Area */}
          <div className="pt-8 border-t border-slate-300 grid grid-cols-3 gap-6 text-center text-xs">
            <div>
              <div className="border-b border-slate-400 pb-1 mb-1 font-semibold text-slate-900">
                {requisition.requesterName}
              </div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                Solicitante / Setor
              </span>
            </div>

            <div>
              <div className="border-b border-slate-400 pb-1 mb-1 font-semibold text-slate-900">
                {requisition.fulfilledByUserName || 'Almoxarifado'}
              </div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                Almoxarife / Entregue por
              </span>
            </div>

            <div>
              <div className="border-b border-slate-400 pb-1 mb-1 font-semibold text-slate-900">
                Gerência / Supervisão
              </div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                Autorização & Visto
              </span>
            </div>
          </div>

          {/* Footer print stamp */}
          <div className="mt-8 pt-4 border-t border-slate-200 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Controle de Estoques Enterprise • Sistema de Gestão de Materiais</span>
            <span>Impresso via terminal web em {new Date().toLocaleDateString('pt-BR')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
