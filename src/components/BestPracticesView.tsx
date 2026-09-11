import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Calculator,
  Compass,
  Sparkles,
  ShieldCheck,
  TrendingDown,
  Layers,
  FileCheck,
} from 'lucide-react';

export const BestPracticesView: React.FC = () => {
  // Interactive Calculator State
  const [calcDailyDemand, setCalcDailyDemand] = useState<number>(15);
  const [calcLeadTime, setCalcLeadTime] = useState<number>(7);
  const [calcSafetyDays, setCalcSafetyDays] = useState<number>(5);

  const calculatedSafetyStock = calcDailyDemand * calcSafetyDays;
  const calculatedReorderPoint = calcDailyDemand * calcLeadTime + calculatedSafetyStock;
  const calculatedMaxStock = calculatedSafetyStock + calcDailyDemand * 30; // 30 days lot

  return (
    <div id="best-practices-view" className="space-y-8">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 text-white shadow-sm">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-400/20 text-amber-300 border border-amber-400/30 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Manual de Excelência Operacional</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Guia de Boas Práticas para Gestão de Estoques
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Diretrizes operacionais, fórmulas matemáticas, metodologia de inventários e processos consolidados
              para maximizar a acurácia, prevenir rupturas e eliminar custos de obsolescência no almoxarifado.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Calculator: Ponto de Pedido & Estoque Mínimo */}
      <div className="bg-white border-2 border-amber-500/40 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              Simulador Interativo: Ponto de Pedido (ROP) e Estoque Mínimo
            </h3>
            <p className="text-xs text-slate-500">
              Calcule os parâmetros ideais de ressuprimento em tempo real com base no lead time e demanda
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Consumo Médio Diário (Unidades/dia)
            </label>
            <input
              type="number"
              min="1"
              value={calcDailyDemand}
              onChange={(e) => setCalcDailyDemand(Math.max(1, Number(e.target.value)))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Média histórica de saídas nos últimos 30 a 90 dias
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tempo de Reposição / Lead Time (Dias)
            </label>
            <input
              type="number"
              min="1"
              value={calcLeadTime}
              onChange={(e) => setCalcLeadTime(Math.max(1, Number(e.target.value)))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Prazo desde a emissão do pedido até a entrega física e conferência
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Dias de Margem de Segurança (Buffer)
            </label>
            <input
              type="number"
              min="0"
              value={calcSafetyDays}
              onChange={(e) => setCalcSafetyDays(Math.max(0, Number(e.target.value)))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Proteção contra atrasos de transporte ou picos sazonais
            </span>
          </div>
        </div>

        {/* Calculated Results */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
            <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">
              Estoque de Segurança (Mínimo)
            </span>
            <div className="mt-1 flex items-baseline space-x-2">
              <span className="text-2xl font-extrabold text-amber-950 font-mono">
                {calculatedSafetyStock}
              </span>
              <span className="text-xs text-amber-800 font-semibold">unidades</span>
            </div>
            <p className="text-[11px] text-amber-800 mt-1">
              Fórmula: Consumo Diário ({calcDailyDemand}) × Dias de Margem ({calcSafetyDays})
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 text-white border border-slate-800">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
              Ponto de Pedido Recomendado (ROP)
            </span>
            <div className="mt-1 flex items-baseline space-x-2">
              <span className="text-2xl font-extrabold text-white font-mono">
                {calculatedReorderPoint}
              </span>
              <span className="text-xs text-slate-300 font-semibold">unidades</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Gatilho de compra: emitir pedido quando o saldo atingir esta marca.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Estoque Máximo Operacional (Sugerido)
            </span>
            <div className="mt-1 flex items-baseline space-x-2">
              <span className="text-2xl font-extrabold text-slate-900 font-mono">
                {calculatedMaxStock}
              </span>
              <span className="text-xs text-slate-600 font-semibold">unidades</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Evita capital excessivo parado e custos elevados de armazenagem.
            </p>
          </div>
        </div>
      </div>

      {/* Core Topics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tópico 1: Frequência de Contagens e Auditorias */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <RotateCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                1. Frequência de Contagens e Auditorias
              </h3>
              <p className="text-xs text-slate-500">Inventários rotativos vs. inventários gerais</p>
            </div>
          </div>

          <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <h4 className="font-bold text-slate-900 text-xs mb-1">
                • Inventário Rotativo (Cíclico) — Recomendado
              </h4>
              <p>
                Contagem diária ou semanal de um subconjunto selecionado de itens sem parar a operação da fábrica.
                Permite identificar desvios imediatamente e corrigir falhas de lançamento no mesmo dia.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <h4 className="font-bold text-slate-900 text-xs mb-1">
                • Inventário Geral (Anual ou Semestral)
              </h4>
              <p>
                Auditoria de 100% dos materiais cadastrados, exigindo paralisação de recebimentos e expedição.
                Obrigatório para fechamento de balanço contábil e fiscal anual.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-950">
              <h4 className="font-bold text-xs mb-1 flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                Meta de Acurácia de Inventário (IRA)
              </h4>
              <p>
                O índice de acurácia global deve ser mantido <strong>acima de 98%</strong>. Materiais de alto valor
                (Curva A) devem atingir <strong>99,5% de exatidão</strong> entre estoque físico e registros no sistema.
              </p>
            </div>
          </div>
        </div>

        {/* Tópico 2: Métodos de Controle e Valoração */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                2. Métodos de Controle e Valoração
              </h3>
              <p className="text-xs text-slate-500">FIFO / PEPS, LIFO / UEPS e Custo Médio</p>
            </div>
          </div>

          <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <h4 className="font-bold text-slate-900 text-xs mb-1">
                • PEPS / FIFO (Primeiro a Entrar, Primeiro a Sair)
              </h4>
              <p>
                Os lotes mais antigos são os primeiros consumidos. Crucial para insumos com validade, óleos, tintas e
                polímeros, reduzindo drasticamente perdas por envelhecimento.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <h4 className="font-bold text-slate-900 text-xs mb-1">
                • Custo Médio Ponderado Móvel (CMPM)
              </h4>
              <p>
                A cada nova entrada com preço diferente, o custo unitário é recalculado proporcionalmente.
                É o método mais equilibrado e o padrão aceito pela legislação fiscal brasileira (RIR).
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <h4 className="font-bold text-slate-900 text-xs mb-1">
                • Classificação ABC (Curva de Pareto)
              </h4>
              <p>
                <strong>Classe A (20% dos itens / 80% do valor):</strong> Controle rígido e diário.<br />
                <strong>Classe B (30% dos itens / 15% do valor):</strong> Controle quinzenal padrão.<br />
                <strong>Classe C (50% dos itens / 5% do valor):</strong> Controle mensal simplificado.
              </p>
            </div>
          </div>
        </div>

        {/* Tópico 3: Dimensionamento e Estoque Mínimo */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                3. Dimensionamento de Estoque Mínimo
              </h3>
              <p className="text-xs text-slate-500">Evite a ruptura sem inflar o capital de giro</p>
            </div>
          </div>

          <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <h4 className="font-bold text-slate-900 text-xs mb-1">
                • Lead Time Real do Fornecedor
              </h4>
              <p>
                Considere o tempo total: aprovação da cotação, faturamento, trânsito rodoviário e conferência física na
                doca. Um lead time subestimado é a causa de 70% das faltas de material.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <h4 className="font-bold text-slate-900 text-xs mb-1">
                • Revisão Periódica dos Parâmetros
              </h4>
              <p>
                O estoque mínimo não deve ser estático. Revise-o a cada 3 meses para acompanhar alterações de ritmo na
                produção ou sazonalidade de demanda.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <h4 className="font-bold text-slate-900 text-xs mb-1">
                • Lote Econômico de Compras (LEC)
              </h4>
              <p>
                Equilibre o custo de processar pedidos com o custo de armazenagem física para definir o volume ótimo de
                reposição por fornecedor.
              </p>
            </div>
          </div>
        </div>

        {/* Tópico 4: Prevenção de Desperdícios e Obsolescência */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                4. Prevenção de Perdas e Obsolescência
              </h3>
              <p className="text-xs text-slate-500">Identificação de itens sem giro e controle 5S</p>
            </div>
          </div>

          <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <h4 className="font-bold text-slate-900 text-xs mb-1">
                • Monitoramento de Estoque Parado (&gt; 90 dias)
              </h4>
              <p>
                Extraia mensalmente o relatório de materiais sem nenhuma movimentação de saída. Realize reuniões com os
                setores de manutenção e engenharia para decidir entre uso alternativo, devolução ou venda como sucata.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <h4 className="font-bold text-slate-900 text-xs mb-1">
                • Endereçamento Físico Padronizado (Rua-Prateleira-Vão)
              </h4>
              <p>
                Todo material deve possuir endereço fixo no sistema. Materiais "invisíveis" no galpão geram compras
                duplicadas de itens já existentes em prateleiras secundárias.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <h4 className="font-bold text-slate-900 text-xs mb-1">
                • Controle Rigoroso de Requisições
              </h4>
              <p>
                Nenhuma peça deve sair do almoxarifado sem a ordem de requisição assinada e registrada no sistema.
                Elimine o hábito de "pegar depois e dar baixa quando der".
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
