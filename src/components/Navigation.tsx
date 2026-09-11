import React from 'react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  ClipboardList,
  BarChart3,
  Boxes,
  Warehouse,
  BookOpen,
} from 'lucide-react';

export type ActiveTab =
  | 'dashboard'
  | 'movements'
  | 'materials'
  | 'sectors'
  | 'requisitions'
  | 'reports'
  | 'best_practices';

interface NavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  pendingRequisitionsCount?: number;
  criticalStockCount?: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  pendingRequisitionsCount = 0,
  criticalStockCount = 0,
}) => {
  const tabs = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Painel Geral',
      icon: LayoutDashboard,
      badge: criticalStockCount > 0 ? `${criticalStockCount} alertas` : null,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    },
    {
      id: 'movements' as ActiveTab,
      label: 'Movimentações',
      icon: ArrowLeftRight,
    },
    {
      id: 'requisitions' as ActiveTab,
      label: 'Requisições',
      icon: ClipboardList,
      badge: pendingRequisitionsCount > 0 ? `${pendingRequisitionsCount} pendentes` : null,
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    },
    {
      id: 'reports' as ActiveTab,
      label: 'Posição & Relatórios',
      icon: BarChart3,
    },
    {
      id: 'materials' as ActiveTab,
      label: 'Materiais',
      icon: Boxes,
    },
    {
      id: 'sectors' as ActiveTab,
      label: 'Setores & Locais',
      icon: Warehouse,
    },
    {
      id: 'best_practices' as ActiveTab,
      label: 'Boas Práticas',
      icon: BookOpen,
    },
  ];

  return (
    <nav id="main-navigation" className="bg-slate-900 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2.5 scrollbar-thin">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-slate-800 text-amber-400 shadow-sm border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded text-[10px] font-semibold border ${tab.badgeColor}`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
