import React from 'react';
import { Database, ShieldCheck, Cpu } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer id="app-footer" className="bg-slate-900 border-t border-slate-800 text-slate-400 text-xs py-8 mt-12 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-slate-200 font-semibold text-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Controle de Estoques Pro • Sistema Integrado de Gestão</span>
            </div>
            <p className="text-slate-400 text-xs mt-1">
              Desenvolvido com arquitetura Full-Stack: React 19, TypeScript, Node.js & Banco Relacional SQLite.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-slate-800 border border-slate-700">
              <Database className="w-3.5 h-3.5 text-amber-400" />
              <span>SQLite Nativo (ACID / WAL)</span>
            </div>
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-slate-800 border border-slate-700">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Controle de Sessão & RBAC</span>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
          <span>
            Responsável Técnico: Desenvolvedor Full-Stack (Luna Gaona / Google AI Studio)
          </span>
          <span>
            © {new Date().getFullYear()} Controle de Estoques • Todos os direitos reservados.
          </span>
        </div>
      </div>
    </footer>
  );
};
