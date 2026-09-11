import {
  Material,
  Sector,
  StockPosition,
  Movement,
  Requisition,
  DashboardStats,
  User,
} from '../types.ts';

const TOKEN_KEY = 'stock_auth_token';
const USER_KEY = 'stock_auth_user';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  const data = localStorage.getItem(USER_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function setAuthSession(token: string, user: User) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuthSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = 'Erro na requisição';
    try {
      const errJson = await response.json();
      if (errJson.error) errorMsg = errJson.error;
    } catch {
      errorMsg = `Erro ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export const api = {
  // Auth
  async login(username: string, password: string): Promise<{ token: string; user: User }> {
    const res = await request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    setAuthSession(res.token, res.user);
    return res;
  },

  async logout(): Promise<void> {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } finally {
      clearAuthSession();
    }
  },

  async getMe(): Promise<{ user: User }> {
    return request<{ user: User }>('/api/auth/me');
  },

  // Materials
  async getMaterials(search?: string, category?: string): Promise<Material[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category) params.append('category', category);
    return request<Material[]>(`/api/materials?${params.toString()}`);
  },

  async getMaterial(id: number): Promise<Material> {
    return request<Material>(`/api/materials/${id}`);
  },

  async createMaterial(data: Partial<Material>): Promise<Material> {
    return request<Material>('/api/materials', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateMaterial(id: number, data: Partial<Material>): Promise<Material> {
    return request<Material>(`/api/materials/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteMaterial(id: number): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/api/materials/${id}`, {
      method: 'DELETE',
    });
  },

  // Sectors
  async getSectors(): Promise<Sector[]> {
    return request<Sector[]>('/api/sectors');
  },

  async createSector(data: Partial<Sector>): Promise<Sector> {
    return request<Sector>('/api/sectors', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateSector(id: number, data: Partial<Sector>): Promise<Sector> {
    return request<Sector>(`/api/sectors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteSector(id: number): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/api/sectors/${id}`, {
      method: 'DELETE',
    });
  },

  // Stock Positions
  async getStockPositions(params?: {
    materialId?: number;
    sectorId?: number;
    status?: string;
    search?: string;
  }): Promise<StockPosition[]> {
    const query = new URLSearchParams();
    if (params?.materialId) query.append('materialId', String(params.materialId));
    if (params?.sectorId) query.append('sectorId', String(params.sectorId));
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    return request<StockPosition[]>(`/api/stocks?${query.toString()}`);
  },

  // Movements
  async getMovements(params?: {
    type?: string;
    materialId?: number;
    sectorId?: number;
    startDate?: string;
    endDate?: string;
    search?: string;
    limit?: number;
  }): Promise<Movement[]> {
    const query = new URLSearchParams();
    if (params?.type) query.append('type', params.type);
    if (params?.materialId) query.append('materialId', String(params.materialId));
    if (params?.sectorId) query.append('sectorId', String(params.sectorId));
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    if (params?.search) query.append('search', params.search);
    if (params?.limit) query.append('limit', String(params.limit));
    return request<Movement[]>(`/api/movements?${query.toString()}`);
  },

  async recordMovement(data: {
    type: 'ENTRADA' | 'SAIDA' | 'TRANSFERENCIA';
    materialId: number;
    sourceSectorId?: number | null;
    targetSectorId?: number | null;
    quantity: number;
    unitPrice?: number;
    reason: string;
    documentRef?: string | null;
  }): Promise<Movement> {
    return request<Movement>('/api/movements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Requisitions
  async getRequisitions(params?: {
    status?: string;
    sectorId?: number;
    search?: string;
  }): Promise<Requisition[]> {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.sectorId) query.append('sectorId', String(params.sectorId));
    if (params?.search) query.append('search', params.search);
    return request<Requisition[]>(`/api/requisitions?${query.toString()}`);
  },

  async getRequisition(id: number): Promise<Requisition> {
    return request<Requisition>(`/api/requisitions/${id}`);
  },

  async createRequisition(data: {
    requestingSectorId: number;
    sourceSectorId?: number | null;
    requesterName: string;
    priority?: 'Baixa' | 'Normal' | 'Urgente';
    notes?: string;
    items: { materialId: number; requestedQty: number; notes?: string }[];
  }): Promise<Requisition> {
    return request<Requisition>('/api/requisitions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateRequisitionStatus(
    id: number,
    status: 'Pendente' | 'Aprovada' | 'Cancelada'
  ): Promise<Requisition> {
    return request<Requisition>(`/api/requisitions/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async fulfillRequisition(id: number, sourceSectorId: number): Promise<Requisition> {
    return request<Requisition>(`/api/requisitions/${id}/fulfill`, {
      method: 'POST',
      body: JSON.stringify({ sourceSectorId }),
    });
  },

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    return request<DashboardStats>('/api/dashboard/stats');
  },
};
