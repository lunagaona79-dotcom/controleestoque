import {
  Material,
  Sector,
  StockPosition,
  Movement,
  Requisition,
  DashboardStats,
  User,
  MovementType,
  RequisitionStatus,
} from '../types.ts';

const STORAGE_PREFIX = 'stock_pro_';
const KEYS = {
  USERS: `${STORAGE_PREFIX}users`,
  SECTORS: `${STORAGE_PREFIX}sectors`,
  MATERIALS: `${STORAGE_PREFIX}materials`,
  BALANCES: `${STORAGE_PREFIX}balances`,
  MOVEMENTS: `${STORAGE_PREFIX}movements`,
  REQUISITIONS: `${STORAGE_PREFIX}requisitions`,
  INITIALIZED: `${STORAGE_PREFIX}initialized_v2`,
};

interface StoredBalance {
  materialId: number;
  sectorId: number;
  quantity: number;
  updatedAt: string;
}

// Initial Seed Datasets
const SEED_USERS: User[] = [
  {
    id: 1,
    username: 'admin',
    name: 'Luna Gaona (Gestor de Estoque)',
    role: 'admin',
    createdAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 2,
    username: 'operador',
    name: 'Carlos Almeida (Almoxarife)',
    role: 'operador',
    createdAt: '2026-09-01T08:00:00.000Z',
  },
];

const SEED_SECTORS: Sector[] = [
  {
    id: 1,
    code: 'SEC-01',
    name: 'Almoxarifado Central',
    description: 'Depósito principal de recebimento e guarda de insumos',
    isStorage: true,
    createdAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 2,
    code: 'SEC-02',
    name: 'Manutenção & Engenharia',
    description: 'Oficina mecânica, elétrica e ferramentaria',
    isStorage: true,
    createdAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 3,
    code: 'SEC-03',
    name: 'Linha de Produção 01',
    description: 'Setor operacional e linha de montagem industrial',
    isStorage: true,
    createdAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 4,
    code: 'SEC-04',
    name: 'Obras & Infraestrutura',
    description: 'Canteiro operacional de instalações e reformas',
    isStorage: true,
    createdAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 5,
    code: 'SEC-05',
    name: 'Administração & Escritórios',
    description: 'Setor corporativo e suporte administrativo',
    isStorage: false,
    createdAt: '2026-09-01T08:00:00.000Z',
  },
];

const SEED_MATERIALS: Material[] = [
  {
    id: 1,
    code: 'MAT-001',
    name: 'Rolamento Rígido de Esferas 6204',
    description: 'Rolamento blindado 20x47x14mm para motores industriais',
    unit: 'UN',
    minQty: 20,
    unitPrice: 34.50,
    category: 'Mecânica',
    createdAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 2,
    code: 'MAT-002',
    name: 'Cabo Flexível 2,5mm² 750V (Rolo 100m)',
    description: 'Condutor de cobre eletrolítico isolado em PVC antichama',
    unit: 'RL',
    minQty: 10,
    unitPrice: 189.90,
    category: 'Elétrica',
    createdAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 3,
    code: 'MAT-003',
    name: 'Óleo Lubrificante Industrial ISO VG 68 (Balde 20L)',
    description: 'Óleo mineral parafínico com aditivação antidesgaste para hidráulica',
    unit: 'L',
    minQty: 100,
    unitPrice: 19.80,
    category: 'Lubrificantes',
    createdAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 4,
    code: 'MAT-004',
    name: 'Parafuso Sextavado Aço Inox M8 x 40mm',
    description: 'Fixador classe A2 resistente a corrosão química e mecânica',
    unit: 'UN',
    minQty: 300,
    unitPrice: 1.85,
    category: 'Fixadores',
    createdAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 5,
    code: 'MAT-005',
    name: 'Disco de Corte Abrasivo 115 x 1.0mm',
    description: 'Disco extra fino para corte rápido de aços e tubulações',
    unit: 'UN',
    minQty: 60,
    unitPrice: 7.20,
    category: 'Abrasivos',
    createdAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 6,
    code: 'MAT-006',
    name: 'Luva Nitrílica Solvex Cano Longo Tam. G',
    description: 'EPI para proteção química e manuseio de solventes/óleos',
    unit: 'PAR',
    minQty: 40,
    unitPrice: 14.50,
    category: 'EPI / Segurança',
    createdAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 7,
    code: 'MAT-007',
    name: 'Fita Isolante 3M Alta Fusão 19mm x 10m',
    description: 'Fita autofusão de borracha EPR para barramentos de média tensão',
    unit: 'UN',
    minQty: 35,
    unitPrice: 16.20,
    category: 'Elétrica',
    createdAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 8,
    code: 'MAT-008',
    name: 'Eletrodo Revestido AWS E6013 2,5mm (Lata 5kg)',
    description: 'Consumível para soldagem elétrica em estruturas metálicas',
    unit: 'KG',
    minQty: 30,
    unitPrice: 48.00,
    category: 'Solda',
    createdAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 9,
    code: 'MAT-009',
    name: 'Graxa Grafitada de Alta Temperatura (Pote 1kg)',
    description: 'Graxa a base de sabão de lítio com grafite coloidal',
    unit: 'UN',
    minQty: 15,
    unitPrice: 42.00,
    category: 'Lubrificantes',
    createdAt: '2026-09-01T08:00:00.000Z',
  },
];

const SEED_BALANCES: StoredBalance[] = [
  { materialId: 1, sectorId: 1, quantity: 12, updatedAt: '2026-09-09T10:00:00.000Z' },
  { materialId: 2, sectorId: 1, quantity: 6, updatedAt: '2026-09-09T10:00:00.000Z' },
  { materialId: 3, sectorId: 1, quantity: 120, updatedAt: '2026-09-10T10:00:00.000Z' },
  { materialId: 3, sectorId: 2, quantity: 20, updatedAt: '2026-09-10T11:00:00.000Z' },
  { materialId: 4, sectorId: 1, quantity: 85, updatedAt: '2026-09-11T09:00:00.000Z' },
  { materialId: 5, sectorId: 1, quantity: 80, updatedAt: '2026-09-10T14:00:00.000Z' },
  { materialId: 5, sectorId: 2, quantity: 15, updatedAt: '2026-09-10T15:00:00.000Z' },
  { materialId: 6, sectorId: 1, quantity: 40, updatedAt: '2026-09-11T12:00:00.000Z' },
  { materialId: 6, sectorId: 3, quantity: 10, updatedAt: '2026-09-11T13:00:00.000Z' },
  { materialId: 7, sectorId: 1, quantity: 28, updatedAt: '2026-09-09T10:00:00.000Z' },
  { materialId: 8, sectorId: 1, quantity: 40, updatedAt: '2026-09-09T10:00:00.000Z' },
  { materialId: 8, sectorId: 4, quantity: 5, updatedAt: '2026-09-10T10:00:00.000Z' },
  { materialId: 9, sectorId: 1, quantity: 18, updatedAt: '2026-09-09T10:00:00.000Z' },
];

const SEED_MOVEMENTS: Movement[] = [
  {
    id: 1,
    type: 'ENTRADA',
    materialId: 1,
    materialCode: 'MAT-001',
    materialName: 'Rolamento Rígido de Esferas 6204',
    unit: 'UN',
    sourceSectorId: null,
    sourceSectorName: null,
    targetSectorId: 1,
    targetSectorName: 'Almoxarifado Central',
    quantity: 25,
    unitPrice: 34.50,
    totalPrice: 862.50,
    userId: 1,
    userName: 'Luna Gaona',
    reason: 'Recebimento de compra de reposição de estoque',
    documentRef: 'NF-78412',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 2,
    type: 'SAIDA',
    materialId: 1,
    materialCode: 'MAT-001',
    materialName: 'Rolamento Rígido de Esferas 6204',
    unit: 'UN',
    sourceSectorId: 1,
    sourceSectorName: 'Almoxarifado Central',
    targetSectorId: null,
    targetSectorName: null,
    quantity: 13,
    unitPrice: 34.50,
    totalPrice: 448.50,
    userId: 2,
    userName: 'Carlos Almeida',
    reason: 'Atendimento a manutenção preventiva de bombas',
    documentRef: 'OS-4401',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 3,
    type: 'ENTRADA',
    materialId: 3,
    materialCode: 'MAT-003',
    materialName: 'Óleo Lubrificante Industrial ISO VG 68 (Balde 20L)',
    unit: 'L',
    sourceSectorId: null,
    sourceSectorName: null,
    targetSectorId: 1,
    targetSectorName: 'Almoxarifado Central',
    quantity: 160,
    unitPrice: 19.80,
    totalPrice: 3168.00,
    userId: 1,
    userName: 'Luna Gaona',
    reason: 'Fornecimento mensal de fluídos industriais',
    documentRef: 'NF-78500',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 4,
    type: 'TRANSFERENCIA',
    materialId: 3,
    materialCode: 'MAT-003',
    materialName: 'Óleo Lubrificante Industrial ISO VG 68 (Balde 20L)',
    unit: 'L',
    sourceSectorId: 1,
    sourceSectorName: 'Almoxarifado Central',
    targetSectorId: 2,
    targetSectorName: 'Manutenção & Engenharia',
    quantity: 20,
    unitPrice: 19.80,
    totalPrice: 396.00,
    userId: 2,
    userName: 'Carlos Almeida',
    reason: 'Abastecimento do estoque da oficina mecânica',
    documentRef: 'TRF-102',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 5,
    type: 'ENTRADA',
    materialId: 5,
    materialCode: 'MAT-005',
    materialName: 'Disco de Corte Abrasivo 115 x 1.0mm',
    unit: 'UN',
    sourceSectorId: null,
    sourceSectorName: null,
    targetSectorId: 1,
    targetSectorName: 'Almoxarifado Central',
    quantity: 100,
    unitPrice: 7.20,
    totalPrice: 720.00,
    userId: 1,
    userName: 'Luna Gaona',
    reason: 'Reposição periódica de insumos abrasivos',
    documentRef: 'NF-78590',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 6,
    type: 'SAIDA',
    materialId: 4,
    materialCode: 'MAT-004',
    materialName: 'Parafuso Sextavado Aço Inox M8 x 40mm',
    unit: 'UN',
    sourceSectorId: 1,
    sourceSectorName: 'Almoxarifado Central',
    targetSectorId: null,
    targetSectorName: null,
    quantity: 150,
    unitPrice: 1.85,
    totalPrice: 277.50,
    userId: 2,
    userName: 'Carlos Almeida',
    reason: 'Consumo na montagem do galpão logístico',
    documentRef: 'REQ-2026-0001',
    createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
  },
  {
    id: 7,
    type: 'TRANSFERENCIA',
    materialId: 6,
    materialCode: 'MAT-006',
    materialName: 'Luva Nitrílica Solvex Cano Longo Tam. G',
    unit: 'PAR',
    sourceSectorId: 1,
    sourceSectorName: 'Almoxarifado Central',
    targetSectorId: 3,
    targetSectorName: 'Linha de Produção 01',
    quantity: 10,
    unitPrice: 14.50,
    totalPrice: 145.00,
    userId: 2,
    userName: 'Carlos Almeida',
    reason: 'Disponibilização de EPIs para operadores do turno A',
    documentRef: 'TRF-103',
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
];

const SEED_REQUISITIONS: Requisition[] = [
  {
    id: 1,
    requisitionNumber: 'REQ-2026-0001',
    requestingSectorId: 4,
    requestingSectorName: 'Obras & Infraestrutura',
    sourceSectorId: 1,
    sourceSectorName: 'Almoxarifado Central',
    requesterName: 'Eng. Roberto Silva',
    createdByUserId: 1,
    priority: 'Urgente',
    status: 'Atendida',
    notes: 'Urgência para conclusão da fixação do galpão',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    fulfilledAt: new Date(Date.now() - 5 * 3600000).toISOString(),
    fulfilledByUserName: 'Carlos Almeida',
    totalEstimatedValue: 277.50,
    items: [
      {
        id: 1,
        requisitionId: 1,
        materialId: 4,
        materialCode: 'MAT-004',
        materialName: 'Parafuso Sextavado Aço Inox M8 x 40mm',
        unit: 'UN',
        requestedQty: 150,
        fulfilledQty: 150,
        unitPrice: 1.85,
        notes: 'Parafuso M8 para estruturas',
      },
    ],
  },
  {
    id: 2,
    requisitionNumber: 'REQ-2026-0002',
    requestingSectorId: 2,
    requestingSectorName: 'Manutenção & Engenharia',
    sourceSectorId: 1,
    sourceSectorName: 'Almoxarifado Central',
    requesterName: 'Marcos Eletricista',
    createdByUserId: 2,
    priority: 'Normal',
    status: 'Pendente',
    notes: 'Necessário para troca de fiação do setor de compressores',
    createdAt: new Date(Date.now() - 3 * 3600000).toISOString(),
    totalEstimatedValue: 650.70,
    items: [
      {
        id: 2,
        requisitionId: 2,
        materialId: 2,
        materialCode: 'MAT-002',
        materialName: 'Cabo Flexível 2,5mm² 750V (Rolo 100m)',
        unit: 'RL',
        requestedQty: 3,
        fulfilledQty: 0,
        unitPrice: 189.90,
        notes: 'Cabo 2,5mm rolos',
      },
      {
        id: 3,
        requisitionId: 2,
        materialId: 7,
        materialCode: 'MAT-007',
        materialName: 'Fita Isolante 3M Alta Fusão 19mm x 10m',
        unit: 'UN',
        requestedQty: 5,
        fulfilledQty: 0,
        unitPrice: 16.20,
        notes: 'Fita isolante 3M',
      },
    ],
  },
  {
    id: 3,
    requisitionNumber: 'REQ-2026-0003',
    requestingSectorId: 3,
    requestingSectorName: 'Linha de Produção 01',
    sourceSectorId: 1,
    sourceSectorName: 'Almoxarifado Central',
    requesterName: 'Supervisão de Turno',
    createdByUserId: 1,
    priority: 'Urgente',
    status: 'Pendente',
    notes: 'Reposição urgente de discos de corte para adequação de peças',
    createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
    totalEstimatedValue: 289.00,
    items: [
      {
        id: 4,
        requisitionId: 3,
        materialId: 5,
        materialCode: 'MAT-005',
        materialName: 'Disco de Corte Abrasivo 115 x 1.0mm',
        unit: 'UN',
        requestedQty: 20,
        fulfilledQty: 0,
        unitPrice: 7.20,
        notes: 'Discos abrasivos 115mm',
      },
      {
        id: 5,
        requisitionId: 3,
        materialId: 6,
        materialCode: 'MAT-006',
        materialName: 'Luva Nitrílica Solvex Cano Longo Tam. G',
        unit: 'PAR',
        requestedQty: 10,
        fulfilledQty: 0,
        unitPrice: 14.50,
        notes: 'Luvas de proteção química',
      },
    ],
  },
];

// Helper to safely read and write to localStorage
function getStore<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultVal;
    return JSON.parse(raw);
  } catch {
    return defaultVal;
  }
}

function setStore<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (err) {
    console.warn(`Erro ao persistir no localStorage [${key}]:`, err);
  }
}

// Initialize database with seed data if not yet present
export function initLocalDb(): void {
  try {
    const isInit = localStorage.getItem(KEYS.INITIALIZED);
    if (!isInit) {
      localStorage.setItem(KEYS.USERS, JSON.stringify(SEED_USERS));
      localStorage.setItem(KEYS.SECTORS, JSON.stringify(SEED_SECTORS));
      localStorage.setItem(KEYS.MATERIALS, JSON.stringify(SEED_MATERIALS));
      localStorage.setItem(KEYS.BALANCES, JSON.stringify(SEED_BALANCES));
      localStorage.setItem(KEYS.MOVEMENTS, JSON.stringify(SEED_MOVEMENTS));
      localStorage.setItem(KEYS.REQUISITIONS, JSON.stringify(SEED_REQUISITIONS));
      localStorage.setItem(KEYS.INITIALIZED, 'true');
    }
  } catch {
    // If private mode or no storage, storage defaults to memory gracefully
  }
}

// Auto-run initialization
initLocalDb();

export const localDb = {
  resetToInitialData() {
    localStorage.removeItem(KEYS.INITIALIZED);
    initLocalDb();
  },

  // Auth
  getUser(username: string): User | null {
    const users = getStore<User[]>(KEYS.USERS, SEED_USERS);
    const u = users.find(x => x.username.toLowerCase() === username.trim().toLowerCase());
    return u || null;
  },

  // Sectors
  getSectors(): Sector[] {
    const sectors = getStore<Sector[]>(KEYS.SECTORS, SEED_SECTORS);
    const balances = getStore<StoredBalance[]>(KEYS.BALANCES, SEED_BALANCES);
    const materials = getStore<Material[]>(KEYS.MATERIALS, SEED_MATERIALS);

    const matMap = new Map<number, Material>(materials.map(m => [m.id, m]));

    return sectors.map(s => {
      const sectorBals = balances.filter(b => b.sectorId === s.id && b.quantity > 0);
      const totalQuantity = sectorBals.reduce((sum, b) => sum + b.quantity, 0);
      const totalValue = sectorBals.reduce((sum, b) => {
        const mat = matMap.get(b.materialId);
        return sum + b.quantity * (mat?.unitPrice || 0);
      }, 0);
      const totalMaterialsCount = new Set(sectorBals.map(b => b.materialId)).size;

      return {
        ...s,
        totalQuantity,
        totalValue,
        totalMaterialsCount,
      };
    });
  },

  createSector(data: Partial<Sector>): Sector {
    const sectors = getStore<Sector[]>(KEYS.SECTORS, SEED_SECTORS);
    const newId = sectors.length > 0 ? Math.max(...sectors.map(s => s.id)) + 1 : 1;
    const newSector: Sector = {
      id: newId,
      code: (data.code || `SEC-${String(newId).padStart(2, '0')}`).trim().toUpperCase(),
      name: (data.name || '').trim(),
      description: (data.description || '').trim(),
      isStorage: data.isStorage !== false,
      createdAt: new Date().toISOString(),
      totalQuantity: 0,
      totalValue: 0,
      totalMaterialsCount: 0,
    };
    sectors.push(newSector);
    setStore(KEYS.SECTORS, sectors);
    return newSector;
  },

  updateSector(id: number, data: Partial<Sector>): Sector {
    const sectors = getStore<Sector[]>(KEYS.SECTORS, SEED_SECTORS);
    const idx = sectors.findIndex(s => s.id === id);
    if (idx === -1) throw new Error('Setor não encontrado.');
    sectors[idx] = {
      ...sectors[idx],
      code: data.code !== undefined ? data.code.trim().toUpperCase() : sectors[idx].code,
      name: data.name !== undefined ? data.name.trim() : sectors[idx].name,
      description: data.description !== undefined ? data.description.trim() : sectors[idx].description,
      isStorage: data.isStorage !== undefined ? data.isStorage : sectors[idx].isStorage,
    };
    setStore(KEYS.SECTORS, sectors);
    return sectors[idx];
  },

  deleteSector(id: number): { success: boolean } {
    const balances = getStore<StoredBalance[]>(KEYS.BALANCES, SEED_BALANCES);
    const hasItems = balances.some(b => b.sectorId === id && b.quantity > 0);
    if (hasItems) {
      throw new Error('Não é possível excluir o setor pois ainda há saldo em estoque armazenado nele.');
    }
    const sectors = getStore<Sector[]>(KEYS.SECTORS, SEED_SECTORS).filter(s => s.id !== id);
    setStore(KEYS.SECTORS, sectors);
    return { success: true };
  },

  // Materials
  getMaterials(search?: string, category?: string): Material[] {
    let mats = getStore<Material[]>(KEYS.MATERIALS, SEED_MATERIALS);
    const balances = getStore<StoredBalance[]>(KEYS.BALANCES, SEED_BALANCES);

    if (search) {
      const q = search.toLowerCase();
      mats = mats.filter(m => m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q) || m.description.toLowerCase().includes(q));
    }
    if (category && category !== 'Todos') {
      mats = mats.filter(m => m.category === category);
    }

    return mats.map(m => {
      const matBals = balances.filter(b => b.materialId === m.id);
      const totalStock = matBals.reduce((sum, b) => sum + b.quantity, 0);
      const totalValue = totalStock * m.unitPrice;
      const isCritical = totalStock <= m.minQty;
      return {
        ...m,
        totalStock,
        totalValue,
        isCritical,
      };
    });
  },

  getMaterial(id: number): Material {
    const mats = this.getMaterials();
    const found = mats.find(m => m.id === id);
    if (!found) throw new Error('Material não encontrado.');
    return found;
  },

  createMaterial(data: Partial<Material>): Material {
    const mats = getStore<Material[]>(KEYS.MATERIALS, SEED_MATERIALS);
    const newId = mats.length > 0 ? Math.max(...mats.map(m => m.id)) + 1 : 1;
    const newMat: Material = {
      id: newId,
      code: (data.code || `MAT-${String(newId).padStart(3, '0')}`).trim().toUpperCase(),
      name: (data.name || '').trim(),
      description: (data.description || '').trim(),
      unit: (data.unit || 'UN').trim().toUpperCase(),
      minQty: Number(data.minQty) || 0,
      unitPrice: Number(data.unitPrice) || 0,
      category: (data.category || 'Geral').trim(),
      createdAt: new Date().toISOString(),
      totalStock: 0,
      totalValue: 0,
      isCritical: (Number(data.minQty) || 0) > 0,
    };
    mats.push(newMat);
    setStore(KEYS.MATERIALS, mats);
    return newMat;
  },

  updateMaterial(id: number, data: Partial<Material>): Material {
    const mats = getStore<Material[]>(KEYS.MATERIALS, SEED_MATERIALS);
    const idx = mats.findIndex(m => m.id === id);
    if (idx === -1) throw new Error('Material não encontrado.');
    mats[idx] = {
      ...mats[idx],
      code: data.code !== undefined ? data.code.trim().toUpperCase() : mats[idx].code,
      name: data.name !== undefined ? data.name.trim() : mats[idx].name,
      description: data.description !== undefined ? data.description.trim() : mats[idx].description,
      unit: data.unit !== undefined ? data.unit.trim().toUpperCase() : mats[idx].unit,
      minQty: data.minQty !== undefined ? Number(data.minQty) : mats[idx].minQty,
      unitPrice: data.unitPrice !== undefined ? Number(data.unitPrice) : mats[idx].unitPrice,
      category: data.category !== undefined ? data.category.trim() : mats[idx].category,
    };
    setStore(KEYS.MATERIALS, mats);
    return this.getMaterial(id);
  },

  deleteMaterial(id: number): { success: boolean } {
    const balances = getStore<StoredBalance[]>(KEYS.BALANCES, SEED_BALANCES);
    const totalStock = balances.filter(b => b.materialId === id).reduce((sum, b) => sum + b.quantity, 0);
    if (totalStock > 0) {
      throw new Error(`Não é possível excluir o material pois ainda há saldo em estoque (${totalStock} unidades). Dê baixa antes.`);
    }
    const mats = getStore<Material[]>(KEYS.MATERIALS, SEED_MATERIALS).filter(m => m.id !== id);
    setStore(KEYS.MATERIALS, mats);
    return { success: true };
  },

  // Stock Positions
  getStockPositions(params?: { materialId?: number; sectorId?: number; status?: string; search?: string }): StockPosition[] {
    const mats = this.getMaterials();
    const sectors = this.getSectors();
    const balances = getStore<StoredBalance[]>(KEYS.BALANCES, SEED_BALANCES);

    const sectorMap = new Map<number, Sector>(sectors.map(s => [s.id, s]));

    let positions: StockPosition[] = mats.map(m => {
      const matBals = balances.filter(b => b.materialId === m.id && b.quantity > 0);
      const totalQty = matBals.reduce((sum, b) => sum + b.quantity, 0);
      const totalValue = totalQty * m.unitPrice;

      let status: 'Normal' | 'Alerta' | 'Crítico' = 'Normal';
      if (totalQty <= m.minQty) {
        status = 'Crítico';
      } else if (totalQty <= m.minQty * 1.25) {
        status = 'Alerta';
      }

      const sectorDetails = matBals.map(b => {
        const sec = sectorMap.get(b.sectorId);
        return {
          sectorId: b.sectorId,
          sectorCode: sec?.code || '',
          sectorName: sec?.name || `Setor #${b.sectorId}`,
          quantity: b.quantity,
        };
      });

      return {
        materialId: m.id,
        materialCode: m.code,
        materialName: m.name,
        unit: m.unit,
        minQty: m.minQty,
        unitPrice: m.unitPrice,
        totalQuantity: totalQty,
        totalValue,
        status,
        sectors: sectorDetails,
      };
    });

    if (params?.materialId) {
      positions = positions.filter(p => p.materialId === params.materialId);
    }
    if (params?.sectorId) {
      positions = positions.filter(p => p.sectors.some(s => s.sectorId === params.sectorId));
    }
    if (params?.status && params.status !== 'Todos') {
      positions = positions.filter(p => p.status === params.status);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      positions = positions.filter(p => p.materialName.toLowerCase().includes(q) || p.materialCode.toLowerCase().includes(q));
    }

    return positions;
  },

  // Movements
  getMovements(params?: {
    type?: string;
    materialId?: number;
    sectorId?: number;
    startDate?: string;
    endDate?: string;
    search?: string;
    limit?: number;
  }): Movement[] {
    let movs = getStore<Movement[]>(KEYS.MOVEMENTS, SEED_MOVEMENTS);

    if (params?.type && params.type !== 'Todos') {
      movs = movs.filter(m => m.type === params.type);
    }
    if (params?.materialId) {
      movs = movs.filter(m => m.materialId === params.materialId);
    }
    if (params?.sectorId) {
      movs = movs.filter(m => m.sourceSectorId === params.sectorId || m.targetSectorId === params.sectorId);
    }
    if (params?.startDate) {
      movs = movs.filter(m => m.createdAt.slice(0, 10) >= params.startDate!);
    }
    if (params?.endDate) {
      movs = movs.filter(m => m.createdAt.slice(0, 10) <= params.endDate!);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      movs = movs.filter(m =>
        m.materialName.toLowerCase().includes(q) ||
        m.materialCode.toLowerCase().includes(q) ||
        m.reason.toLowerCase().includes(q) ||
        m.userName.toLowerCase().includes(q) ||
        (m.documentRef && m.documentRef.toLowerCase().includes(q))
      );
    }

    movs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (params?.limit) {
      movs = movs.slice(0, params.limit);
    }

    return movs;
  },

  recordMovement(data: {
    type: MovementType;
    materialId: number;
    sourceSectorId?: number | null;
    targetSectorId?: number | null;
    quantity: number;
    unitPrice?: number;
    userName?: string;
    reason: string;
    documentRef?: string | null;
  }): Movement {
    if (data.quantity <= 0) {
      throw new Error('A quantidade deve ser maior que zero.');
    }

    const mats = getStore<Material[]>(KEYS.MATERIALS, SEED_MATERIALS);
    const mat = mats.find(m => m.id === data.materialId);
    if (!mat) throw new Error('Material não encontrado.');

    const sectors = this.getSectors();
    const secMap = new Map<number, Sector>(sectors.map(s => [s.id, s]));

    const balances = getStore<StoredBalance[]>(KEYS.BALANCES, SEED_BALANCES);
    const unitPrice = data.unitPrice !== undefined && data.unitPrice >= 0 ? data.unitPrice : mat.unitPrice;
    const totalPrice = data.quantity * unitPrice;

    if (data.type === 'ENTRADA') {
      if (!data.targetSectorId) throw new Error('Setor de destino é obrigatório para entradas.');
      const bIdx = balances.findIndex(b => b.materialId === data.materialId && b.sectorId === data.targetSectorId);
      if (bIdx >= 0) {
        balances[bIdx].quantity += data.quantity;
        balances[bIdx].updatedAt = new Date().toISOString();
      } else {
        balances.push({
          materialId: data.materialId,
          sectorId: data.targetSectorId,
          quantity: data.quantity,
          updatedAt: new Date().toISOString(),
        });
      }
    } else if (data.type === 'SAIDA') {
      if (!data.sourceSectorId) throw new Error('Setor de origem é obrigatório para saídas.');
      const bIdx = balances.findIndex(b => b.materialId === data.materialId && b.sectorId === data.sourceSectorId);
      const curQty = bIdx >= 0 ? balances[bIdx].quantity : 0;
      if (curQty < data.quantity) {
        throw new Error(`Saldo insuficiente no setor de origem. Saldo atual: ${curQty} ${mat.unit}, Solicitado: ${data.quantity} ${mat.unit}`);
      }
      balances[bIdx].quantity -= data.quantity;
      balances[bIdx].updatedAt = new Date().toISOString();
    } else if (data.type === 'TRANSFERENCIA') {
      if (!data.sourceSectorId || !data.targetSectorId) {
        throw new Error('Setor de origem e de destino são obrigatórios para transferências.');
      }
      if (data.sourceSectorId === data.targetSectorId) {
        throw new Error('O setor de destino deve ser diferente do de origem.');
      }
      const bSrcIdx = balances.findIndex(b => b.materialId === data.materialId && b.sectorId === data.sourceSectorId);
      const curQty = bSrcIdx >= 0 ? balances[bSrcIdx].quantity : 0;
      if (curQty < data.quantity) {
        throw new Error(`Saldo insuficiente para transferência. Saldo atual: ${curQty} ${mat.unit}, Solicitado: ${data.quantity} ${mat.unit}`);
      }
      balances[bSrcIdx].quantity -= data.quantity;
      balances[bSrcIdx].updatedAt = new Date().toISOString();

      const bTgtIdx = balances.findIndex(b => b.materialId === data.materialId && b.sectorId === data.targetSectorId);
      if (bTgtIdx >= 0) {
        balances[bTgtIdx].quantity += data.quantity;
        balances[bTgtIdx].updatedAt = new Date().toISOString();
      } else {
        balances.push({
          materialId: data.materialId,
          sectorId: data.targetSectorId,
          quantity: data.quantity,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    setStore(KEYS.BALANCES, balances);

    const movs = getStore<Movement[]>(KEYS.MOVEMENTS, SEED_MOVEMENTS);
    const newMovId = movs.length > 0 ? Math.max(...movs.map(m => m.id)) + 1 : 1;

    const targetSec = data.targetSectorId ? secMap.get(data.targetSectorId) : null;
    const sourceSec = data.sourceSectorId ? secMap.get(data.sourceSectorId) : null;

    const newMov: Movement = {
      id: newMovId,
      type: data.type,
      materialId: data.materialId,
      materialCode: mat.code,
      materialName: mat.name,
      unit: mat.unit,
      sourceSectorId: data.sourceSectorId || null,
      sourceSectorName: sourceSec?.name || null,
      targetSectorId: data.targetSectorId || null,
      targetSectorName: targetSec?.name || null,
      quantity: data.quantity,
      unitPrice,
      totalPrice,
      userId: 1,
      userName: (data.userName || 'Operador do Sistema').trim(),
      reason: data.reason.trim(),
      documentRef: data.documentRef?.trim() || null,
      createdAt: new Date().toISOString(),
    };

    movs.unshift(newMov);
    setStore(KEYS.MOVEMENTS, movs);
    return newMov;
  },

  // Requisitions
  getRequisitions(params?: { status?: string; sectorId?: number; search?: string }): Requisition[] {
    let reqs = getStore<Requisition[]>(KEYS.REQUISITIONS, SEED_REQUISITIONS);

    if (params?.status && params.status !== 'Todos') {
      reqs = reqs.filter(r => r.status === params.status);
    }
    if (params?.sectorId) {
      reqs = reqs.filter(r => r.requestingSectorId === params.sectorId || r.sourceSectorId === params.sectorId);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      reqs = reqs.filter(r =>
        r.requisitionNumber.toLowerCase().includes(q) ||
        r.requesterName.toLowerCase().includes(q) ||
        r.requestingSectorName.toLowerCase().includes(q)
      );
    }

    reqs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return reqs;
  },

  getRequisition(id: number): Requisition {
    const reqs = this.getRequisitions();
    const found = reqs.find(r => r.id === id);
    if (!found) throw new Error('Requisição não encontrada.');
    return found;
  },

  createRequisition(data: {
    requestingSectorId: number;
    sourceSectorId?: number | null;
    requesterName: string;
    priority?: 'Baixa' | 'Normal' | 'Urgente';
    notes?: string;
    items: { materialId: number; requestedQty: number; notes?: string }[];
  }): Requisition {
    if (!data.items || data.items.length === 0) {
      throw new Error('A requisição deve conter pelo menos um item.');
    }

    const sectors = this.getSectors();
    const secMap = new Map<number, Sector>(sectors.map(s => [s.id, s]));
    const reqSector = secMap.get(data.requestingSectorId);
    if (!reqSector) throw new Error('Setor solicitante não encontrado.');

    const srcSector = data.sourceSectorId ? secMap.get(data.sourceSectorId) : null;
    const mats = this.getMaterials();
    const matMap = new Map<number, Material>(mats.map(m => [m.id, m]));

    const reqs = getStore<Requisition[]>(KEYS.REQUISITIONS, SEED_REQUISITIONS);
    const newId = reqs.length > 0 ? Math.max(...reqs.map(r => r.id)) + 1 : 1;
    const year = new Date().getFullYear();
    const requisitionNumber = `REQ-${year}-${String(newId).padStart(4, '0')}`;

    let totalVal = 0;
    const items = data.items.map((it, idx) => {
      const mat = matMap.get(it.materialId);
      const itemVal = (it.requestedQty || 0) * (mat?.unitPrice || 0);
      totalVal += itemVal;
      return {
        id: idx + 1,
        requisitionId: newId,
        materialId: it.materialId,
        materialCode: mat?.code || '',
        materialName: mat?.name || '',
        unit: mat?.unit || 'UN',
        requestedQty: it.requestedQty,
        fulfilledQty: 0,
        unitPrice: mat?.unitPrice || 0,
        notes: it.notes || '',
      };
    });

    const newReq: Requisition = {
      id: newId,
      requisitionNumber,
      requestingSectorId: data.requestingSectorId,
      requestingSectorName: reqSector.name,
      sourceSectorId: data.sourceSectorId || null,
      sourceSectorName: srcSector?.name || null,
      requesterName: data.requesterName.trim(),
      createdByUserId: 1,
      priority: data.priority || 'Normal',
      status: 'Pendente',
      notes: data.notes?.trim() || '',
      createdAt: new Date().toISOString(),
      items,
      totalEstimatedValue: totalVal,
    };

    reqs.unshift(newReq);
    setStore(KEYS.REQUISITIONS, reqs);
    return newReq;
  },

  updateRequisitionStatus(id: number, status: RequisitionStatus): Requisition {
    const reqs = getStore<Requisition[]>(KEYS.REQUISITIONS, SEED_REQUISITIONS);
    const idx = reqs.findIndex(r => r.id === id);
    if (idx === -1) throw new Error('Requisição não encontrada.');
    reqs[idx].status = status;
    setStore(KEYS.REQUISITIONS, reqs);
    return reqs[idx];
  },

  fulfillRequisition(id: number, sourceSectorId: number): Requisition {
    const req = this.getRequisition(id);
    if (req.status === 'Atendida') throw new Error('Esta requisição já foi atendida.');
    if (req.status === 'Cancelada') throw new Error('Esta requisição foi cancelada.');

    const sectors = this.getSectors();
    const reqSec = sectors.find(s => s.id === req.requestingSectorId);
    const isTargetStorage = reqSec?.isStorage;

    // Fulfill each item via recordMovement
    for (const item of req.items) {
      const type: MovementType = isTargetStorage ? 'TRANSFERENCIA' : 'SAIDA';
      this.recordMovement({
        type,
        materialId: item.materialId,
        sourceSectorId,
        targetSectorId: isTargetStorage ? req.requestingSectorId : null,
        quantity: item.requestedQty,
        unitPrice: item.unitPrice,
        userName: 'Almoxarife Responsável',
        reason: isTargetStorage
          ? `Atendimento da Requisição ${req.requisitionNumber}`
          : `Atendimento ao setor ${req.requestingSectorName} (Req: ${req.requisitionNumber})`,
        documentRef: req.requisitionNumber,
      });
      item.fulfilledQty = item.requestedQty;
    }

    const reqs = getStore<Requisition[]>(KEYS.REQUISITIONS, SEED_REQUISITIONS);
    const idx = reqs.findIndex(r => r.id === id);
    if (idx >= 0) {
      reqs[idx].status = 'Atendida';
      reqs[idx].sourceSectorId = sourceSectorId;
      reqs[idx].sourceSectorName = sectors.find(s => s.id === sourceSectorId)?.name || null;
      reqs[idx].fulfilledAt = new Date().toISOString();
      reqs[idx].fulfilledByUserName = 'Almoxarife Responsável';
      reqs[idx].items = req.items;
      setStore(KEYS.REQUISITIONS, reqs);
      return reqs[idx];
    }
    return req;
  },

  // Dashboard Stats
  getDashboardStats(): DashboardStats {
    const materials = this.getMaterials();
    const totalMaterials = materials.length;
    const totalStockUnits = materials.reduce((sum, m) => sum + (m.totalStock || 0), 0);
    const totalStockValue = materials.reduce((sum, m) => sum + (m.totalValue || 0), 0);

    const criticalItems = materials
      .filter(m => (m.totalStock || 0) <= m.minQty)
      .map(m => ({
        id: m.id,
        code: m.code,
        name: m.name,
        unit: m.unit,
        currentStock: m.totalStock || 0,
        minQty: m.minQty,
        deficit: m.minQty - (m.totalStock || 0),
      }))
      .sort((a, b) => b.deficit - a.deficit);

    const requisitions = this.getRequisitions();
    const pendingRequisitionsCount = requisitions.filter(r => r.status === 'Pendente').length;

    const todayStr = new Date().toISOString().slice(0, 10);
    const movements = this.getMovements();
    const movementsTodayCount = movements.filter(m => m.createdAt.slice(0, 10) === todayStr).length;

    const recentMovements = movements.slice(0, 6);

    // Top moved materials
    const movedMap = new Map<number, { qty: number; count: number; type: MovementType }>();
    for (const mov of movements) {
      const cur = movedMap.get(mov.materialId) || { qty: 0, count: 0, type: mov.type };
      cur.qty += mov.quantity;
      cur.count += 1;
      cur.type = mov.type;
      movedMap.set(mov.materialId, cur);
    }

    const topMovedMaterials = Array.from(movedMap.entries())
      .map(([mId, data]) => {
        const mat = materials.find(m => m.id === mId);
        return {
          materialId: mId,
          materialCode: mat?.code || '',
          materialName: mat?.name || '',
          unit: mat?.unit || 'UN',
          totalQuantityMoved: data.qty,
          totalMovements: data.count,
          type: data.type,
        };
      })
      .sort((a, b) => b.totalQuantityMoved - a.totalQuantityMoved)
      .slice(0, 5);

    // Stock turnover KPIs
    const stockTurnoverKPIs = materials.map(m => {
      const stock = m.totalStock || 0;
      const totalOut = movements
        .filter(mov => mov.materialId === m.id && mov.type === 'SAIDA')
        .reduce((sum, mov) => sum + mov.quantity, 0);

      const turnoverRatio = stock > 0 ? Number((totalOut / stock).toFixed(2)) : (totalOut > 0 ? 99 : 0);
      let turnoverStatus: 'Alto Giro' | 'Médio Giro' | 'Baixo Giro' | 'Estagnado' = 'Estagnado';

      if (turnoverRatio >= 2) {
        turnoverStatus = 'Alto Giro';
      } else if (turnoverRatio >= 0.8) {
        turnoverStatus = 'Médio Giro';
      } else if (turnoverRatio > 0) {
        turnoverStatus = 'Baixo Giro';
      }

      return {
        materialId: m.id,
        materialCode: m.code,
        materialName: m.name,
        currentStock: stock,
        totalOut,
        turnoverRatio,
        turnoverStatus,
      };
    });

    return {
      totalMaterials,
      totalStockUnits,
      totalStockValue,
      criticalStockCount: criticalItems.length,
      pendingRequisitionsCount,
      movementsTodayCount,
      criticalItems,
      recentMovements,
      topMovedMaterials,
      stockTurnoverKPIs,
    };
  },
};
