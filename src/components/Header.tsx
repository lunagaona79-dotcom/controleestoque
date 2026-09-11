import React from 'react';
import { Package, ShieldCheck, User as UserIcon, LogIn, LogOut, BookOpen, Database } from 'lucide-react';
import { User } from '../types.ts';

interface HeaderProps {
  user: User | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  onOpenBestPractices: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onOpenLogin,
  onLogout,
  onOpenBestPractices,
}) => {
  return (
    <header id="app-header" className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white">Controle de Estoques</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  v1.0 Pro
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Gestão Integrada de Movimentações, Materiais & Requisições
              </p>
            </div>
          </div>

          {/* Database indicator & User controls */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Database indicator */}
            <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700 text-xs">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-400">Banco:</span>
              <span className="text-slate-200 font-medium">Persistência Ativa (Online / Local)</span>
            </div>

            {/* Best Practices button */}
            <button
              id="btn-header-best-practices"
              type="button"
              onClick={onOpenBestPractices}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-amber-500/30 hover:border-amber-500/50 text-xs font-medium transition-colors"
              title="Guia de Boas Práticas para Gestão de Estoques"
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Boas Práticas</span>
            </button>

            {/* User Session Info */}
            {user ? (
              <div className="flex items-center space-x-2.5 pl-2 border-l border-slate-800">
                <div className="flex flex-col text-right hidden sm:block">
                  <span className="text-xs font-medium text-slate-200">{user.name}</span>
                  <span className="text-[11px] text-amber-400 font-mono capitalize">
                    {user.role === 'admin' ? 'Administrador' : 'Operador'}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                  {user.role === 'admin' ? (
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                  ) : (
                    <UserIcon className="w-4 h-4 text-slate-300" />
                  )}
                </div>
                <button
                  id="btn-logout"
                  type="button"
                  onClick={onLogout}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-md transition-colors"
                  title="Sair do sistema"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="btn-login-open"
                type="button"
                onClick={onOpenLogin}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold transition-colors shadow-sm"
              >
                <LogIn className="w-4 h-4" />
                <span>Acessar Conta</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
