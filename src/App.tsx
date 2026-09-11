import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header.tsx';
import { Navigation, ActiveTab } from './components/Navigation.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { MovementsView } from './components/MovementsView.tsx';
import { RequisitionsView } from './components/RequisitionsView.tsx';
import { ReportsView } from './components/ReportsView.tsx';
import { MaterialsView } from './components/MaterialsView.tsx';
import { SectorsView } from './components/SectorsView.tsx';
import { BestPracticesView } from './components/BestPracticesView.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { Footer } from './components/Footer.tsx';
import { api, getStoredUser, clearAuthSession } from './lib/api.ts';
import { Material, Sector, DashboardStats, User, MovementType } from './types.ts';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Core Data
  const [materials, setMaterials] = useState<Material[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Quick Action Modal Triggers
  const [movementModalTrigger, setMovementModalTrigger] = useState<{
    open: boolean;
    type: MovementType;
  }>({ open: false, type: 'ENTRADA' });

  const [reqModalTrigger, setReqModalTrigger] = useState(false);

  // Load all initial data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [matsRes, sectorsRes, statsRes] = await Promise.allSettled([
        api.getMaterials(),
        api.getSectors(),
        api.getDashboardStats(),
      ]);

      if (matsRes.status === 'fulfilled') {
        setMaterials(matsRes.value);
      }
      if (sectorsRes.status === 'fulfilled') {
        setSectors(sectorsRes.value);
      }
      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value);
      }
    } catch (err) {
      console.error('Erro ao carregar dados do estoque:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // If no user in storage, initialize with default admin session for seamless out-of-the-box usage
    if (!user) {
      api.login('admin', 'admin123')
        .then((res) => {
          setUser(res.user);
        })
        .catch(() => {
          // offline or error, continue gracefully
        });
    }
    loadData();
  }, [loadData]);

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
  };

  const handleOpenMovementModal = (type: MovementType = 'ENTRADA') => {
    setActiveTab('movements');
    setMovementModalTrigger({ open: true, type });
  };

  const handleOpenRequisitionModal = () => {
    setActiveTab('requisitions');
    setReqModalTrigger(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 selection:bg-amber-400 selection:text-slate-950 font-sans">
      {/* Top Header */}
      <Header
        user={user}
        onOpenLogin={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onOpenBestPractices={() => setActiveTab('best_practices')}
      />

      {/* Navigation Bar */}
      <Navigation
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setMovementModalTrigger({ open: false, type: 'ENTRADA' });
          setReqModalTrigger(false);
        }}
        pendingRequisitionsCount={stats?.pendingRequisitionsCount}
        criticalStockCount={stats?.criticalStockCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            stats={stats}
            loading={loading}
            onNavigateToMovements={() => setActiveTab('movements')}
            onNavigateToRequisitions={() => setActiveTab('requisitions')}
            onNavigateToReports={() => setActiveTab('reports')}
            onOpenNewMovement={(type) => handleOpenMovementModal(type || 'ENTRADA')}
            onOpenNewRequisition={handleOpenRequisitionModal}
          />
        )}

        {activeTab === 'movements' && (
          <MovementsView
            materials={materials}
            sectors={sectors}
            onMovementCreated={loadData}
            openModalByDefault={movementModalTrigger.open}
            defaultType={movementModalTrigger.type}
          />
        )}

        {activeTab === 'requisitions' && (
          <RequisitionsView
            materials={materials}
            sectors={sectors}
            onRequisitionChange={loadData}
            openCreateByDefault={reqModalTrigger}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView materials={materials} sectors={sectors} stats={stats} />
        )}

        {activeTab === 'materials' && (
          <MaterialsView materials={materials} onMaterialsChanged={loadData} />
        )}

        {activeTab === 'sectors' && (
          <SectorsView sectors={sectors} onSectorsChanged={loadData} />
        )}

        {activeTab === 'best_practices' && <BestPracticesView />}
      </main>

      {/* Footer */}
      <Footer />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={(loggedUser) => setUser(loggedUser)}
      />
    </div>
  );
}
