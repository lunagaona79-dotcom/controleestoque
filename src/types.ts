export type MovementType = 'ENTRADA' | 'SAIDA' | 'TRANSFERENCIA';
export type RequisitionStatus = 'Pendente' | 'Aprovada' | 'Atendida' | 'Cancelada';
export type PriorityLevel = 'Baixa' | 'Normal' | 'Urgente';

export interface User {
  id: number;
  username: string;
  name: string;
  role: 'admin' | 'operador';
  createdAt: string;
}

export interface Sector {
  id: number;
  code: string;
  name: string;
  description: string;
  isStorage: boolean;
  createdAt: string;
  totalMaterialsCount?: number;
  totalQuantity?: number;
  totalValue?: number;
}

export interface Material {
  id: number;
  code: string;
  name: string;
  description: string;
  unit: string;
  minQty: number;
  unitPrice: number;
  category: string;
  createdAt: string;
  totalStock?: number;
  totalValue?: number;
  isCritical?: boolean;
}

export interface StockPosition {
  materialId: number;
  materialCode: string;
  materialName: string;
  unit: string;
  minQty: number;
  unitPrice: number;
  totalQuantity: number;
  totalValue: number;
  status: 'Normal' | 'Alerta' | 'Crítico';
  sectors: {
    sectorId: number;
    sectorCode: string;
    sectorName: string;
    quantity: number;
  }[];
}

export interface Movement {
  id: number;
  type: MovementType;
  materialId: number;
  materialCode: string;
  materialName: string;
  unit: string;
  sourceSectorId?: number | null;
  sourceSectorName?: string | null;
  targetSectorId?: number | null;
  targetSectorName?: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  userId?: number | null;
  userName: string;
  reason: string;
  documentRef?: string | null;
  createdAt: string;
}

export interface RequisitionItem {
  id?: number;
  requisitionId?: number;
  materialId: number;
  materialCode?: string;
  materialName?: string;
  unit?: string;
  requestedQty: number;
  fulfilledQty?: number;
  unitPrice?: number;
  notes?: string;
}

export interface Requisition {
  id: number;
  requisitionNumber: string;
  requestingSectorId: number;
  requestingSectorName: string;
  sourceSectorId?: number | null;
  sourceSectorName?: string | null;
  requesterName: string;
  createdByUserId?: number | null;
  priority: PriorityLevel;
  status: RequisitionStatus;
  notes?: string;
  createdAt: string;
  fulfilledAt?: string | null;
  fulfilledByUserName?: string | null;
  items: RequisitionItem[];
  totalEstimatedValue?: number;
}

export interface DashboardStats {
  totalMaterials: number;
  totalStockUnits: number;
  totalStockValue: number;
  criticalStockCount: number;
  pendingRequisitionsCount: number;
  movementsTodayCount: number;
  criticalItems: {
    id: number;
    code: string;
    name: string;
    unit: string;
    currentStock: number;
    minQty: number;
    deficit: number;
  }[];
  recentMovements: Movement[];
  topMovedMaterials: {
    materialId: number;
    materialCode: string;
    materialName: string;
    unit: string;
    totalQuantityMoved: number;
    totalMovements: number;
    type: MovementType;
  }[];
  stockTurnoverKPIs: {
    materialId: number;
    materialCode: string;
    materialName: string;
    currentStock: number;
    totalOut: number;
    turnoverRatio: number;
    turnoverStatus: 'Alto Giro' | 'Médio Giro' | 'Baixo Giro' | 'Estagnado';
  }[];
}
