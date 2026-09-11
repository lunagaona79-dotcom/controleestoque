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
import { localDb } from './localDatabase.ts';

const TOKEN_KEY = 'stock_auth_token';
const USER_KEY = 'stock_auth_user';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getStoredUser(): User | null {
  try {
    const data = localStorage.getItem(USER_KEY);
    if (!data) return null;
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function setAuthSession(token: string, user: User) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // ignore
  }
}

export function clearAuthSession() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    // ignore
  }
}

// Server availability detection with timeout & content-type validation
let serverAvailablePromise: Promise<boolean> | null = null;
let isServerAvailable: boolean | null = null;

async function checkServerAvailable(): Promise<boolean> {
  if (isServerAvailable !== null) return isServerAvailable;

  if (!serverAvailablePromise) {
    serverAvailablePromise = (async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 1500);

        const response = await fetch('/api/health', {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });
        clearTimeout(timeout);

        const contentType = response.headers.get('content-type') || '';
        if (response.ok && contentType.includes('application/json')) {
          const data = await response.json();
          isServerAvailable = data?.status === 'ok';
        } else {
          isServerAvailable = false;
        }
      } catch {
        isServerAvailable = false;
      }
      return isServerAvailable;
    })();
  }

  return serverAvailablePromise;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error('Servidor não retornou resposta em formato JSON');
  }

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
    const hasServer = await checkServerAvailable();
    if (hasServer) {
      try {
        const res = await request<{ token: string; user: User }>('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ username, password }),
        });
        setAuthSession(res.token, res.user);
        return res;
      } catch (err) {
        console.warn('Falha no login via servidor, tentando validação local:', err);
      }
    }

    // Local authentication fallback for shared / published deployments
    const u = localDb.getUser(username);
    if (!u) {
      throw new Error('Usuário não encontrado. Use "admin" ou "operador".');
    }
    if (
      (u.username === 'admin' && password !== 'admin123') ||
      (u.username === 'operador' && password !== 'operador123')
    ) {
      throw new Error('Senha incorreta.');
    }

    const fakeToken = `local_token_${Date.now()}`;
    setAuthSession(fakeToken, u);
    return { token: fakeToken, user: u };
  },

  async logout(): Promise<void> {
    const hasServer = await checkServerAvailable();
    if (hasServer) {
      try {
        await request('/api/auth/logout', { method: 'POST' });
      } catch {
        // ignore
      }
    }
    clearAuthSession();
  },

  async getMe(): Promise<{ user: User }> {
    const hasServer = await checkServerAvailable();
    if (hasServer) {
      try {
        return await request<{ user: User }>('/api/auth/me');
      } catch {
        // fallback
      }
    }
    const user = getStoredUser();
    if (!user) throw new Error('Não autenticado.');
    return { user };
  },

  // Materials
  async getMaterials(search?: string, category?: string): Promise<Material[]> {
    const hasServer = await checkServerAvailable();
    if (hasServer) {
      try {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (category) params.append('category', category);
        return await request<Material[]>(`/api/materials?${params.toString()}`);
      } catch (err) {
        console.warn('Falha ao buscar materiais do servidor, usando base local:', err);
      }
    }
    return localDb.getMaterials(search, category);
  },

  async getMaterial(id: number): Promise<Material> {
    const hasServer = await checkServerAvailable();
    if (hasServer) {
      try {
        return await request<Material>(`/api/materials/${id}`);
      } catch (err) {
        console.warn('Falha ao buscar material do servidor, usando base local:', err);
      }
    }
    return localDb.getMaterial(id);
  },

  async createMaterial(data: Partial<Material>): Promise<Material> {
    const hasServer = await checkServerAvailable();
    if (hasServer) {
      try {
        const res = await request<Material>('/api/materials', {
          method: 'POST',
          body: JSON.stringify(data),
        });
        localDb.createMaterial(res); // keep local mirror in sync
        return res;
      } catch (err) {
        console.warn('Falha ao criar material no servidor, salvando na base local:', err);
      }
    }
    return localDb.createMaterial(data);
  },

  async updateMaterial(id: number, data: Partial<Material>): Promise<Material> {
    const hasServer = await checkServerAvailable();
    if (hasServer) {
      try {
        const res = await request<Material>(`/api/materials/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
        localDb.updateMaterial(id, data);
        return res;
      } catch (err) {
        console.warn('Falha ao atualizar material no servidor, salvando na base local:', err);
      }
    }
    return localDb.updateMaterial(id, data);
  },

  async deleteMaterial(id: number): Promise<{ success: boolean }> {
    const hasServer = await checkServerAvailable();
    if (hasServer) {
      try {
        const res = await request<{ success: boolean }>(`/api/materials/${id}`, {
          method: 'DELETE',
        });
        localDb.deleteMaterial(id);
        return res;
      } catch (err) {
        console.warn('Falha ao excluir material no servidor, excluindo da base local:', err);
      }
    }
    return localDb.deleteMaterial(id);
  },

  // Sectors
  async getSectors(): Promise<Sector[]> {
    const hasServer = await checkServerAvailable();
    if (hasServer) {
      try {
        return await request<Sector[]>('/api/sectors');
      } catch (err) {
        console.warn('Falha ao buscar setores do servidor, usando base local:', err);
      }
    }
    return localDb.getSectors();
  },

  async createSector(data: Partial<Sector>): Promise<Sector> {
    const hasServer = await checkServerAvailable();
    if (hasServer) {
      try {
        const res = await request<Sector>('/api/sectors', {
          method: 'POST',
          body: JSON.stringify(data),
        });
        localDb.createSector(res);
        return res;
      } catch (err) {
        console.warn('Falha ao criar setor no servidor, salvando na base local:', err);
      }
    }
    return localDb.createSector(data);
  },

  async updateSector(id: number, data: Partial<Sector>): Promise<Sector> {
    const hasServer = await checkServerAvailable();
    if (hasServer) {
      try {
        const res = await request<Sector>(`/api/sectors/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
        localDb.updateSector(id, data);
        return res;
      } catch (err) {
        console.warn('Falha ao atualizar setor no servidor, salvando na base local:', err);
      }
    }
    return localDb.updateSector(id, data);
  },

  async deleteSector(id: number): Promise<{ success: boolean }> {
    const hasServer = await checkServerAvailable();
    if (hasServer) {
      try {
        const res = await request<{ success: boolean }>(`/api/sectors/${id}`, {
          method: 'DELETE',
        });
        localDb.deleteSector(id);
        return res;
      } catch (err) {
        console.warn('Falha ao excluir setor no servidor, excluindo da base local:', err);
      }
    }
    return localDb.deleteSector(id);
  },

  // Stock Positions
  async getStockPositions(params?: {
    materialId?: number;
    sectorId?: number;
    status?: string;
    search?: string;
  }): Promise<StockPosition[]> {
    const hasServer = await checkServerAvailable();
    if (hasServer) {
      try {
        const query = new URLSearchParams();
        if (params?.materialId) query.append('materialId', String(params.materialId));
        if (params?.sectorId) query.append('sectorId', String(params.sectorId));
        if (params?.status) query.append('status', params.status);
        if (params?.search) query.append('search', params.search);
        return await request<StockPosition[]>(`/api/stocks?${query.toString()}`);
      } catch (err) {
        console.warn('Falha ao consultar posições do servidor, usando base local:', err);
      }
    }
    return localDb.getStockPositions(params);
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
    const hasServer = await checkServerAvailable();
    if (hasServer) {
      try {
        const query = new URLSearchParams();
        if (params?.type) query.append('type', params.type);
        if (params?.materialId) query.append('materialId', String(params.materialId));
        if (params?.sectorId) query.append('sectorId', String(params.sectorId));
        if (params?.startDate) query.append('startDate', params.startDate);
        if (params?.endDate) query.append('endDate', params.endDate);
        if (params?.search) query.append('search', params.search);
        if (params?.limit) query.append('limit', String(params.limit));
        return await request<Movement[]>(`/api/movements?${query.toString()}`);
      } catch (err) {
        console.warn('Falha ao consultar movimentações do servidor, usando base local:', err);
      }
    }
    return localDb.getMovements(params);
  },

  async recordMovement(data: {
    type: MovementType;
    materialId: number;
    sourceSectorId?: number | null;
    targetSectorId?: number | null;
    quantity: number;
    unitPrice?: number;
    userName?: string;
    reason: string;
    documentRef?: string | null;
  }): Promise<Movement> {
    const hasServer = await checkServerAvailable();
    if (hasServer) {
      try {
        const res = await request<Movement>('/api/movements', {
          method: 'POST',
          body: JSON.stringify(data),
        });
        try {
          localDb.recordMovement(data);
        } catch {
          // ignore sync failure
        }
        return res;
      } catch (err) {
        console.warn('Falha ao registrar movimentação no servidor, registrando na base local:', err);
      }
    }
    return localDb.recordMovement(data);
  },

  // Requisitions
  async getRequisitions(params?: {
    status?: string;
    sectorId?: number;
    search?: string;
  }): Promise<Requisition[]> {
    const hasServer = await checkServerAvailable();
    if (hasServer) {
      try {
        const query = new URLSearchParams();
        if (params?.status) query.append('status', params.status);
        if (params?.sectorId) query.append('sectorId', String(params.sectorId));
        if (params?.search) query.append('search', params.search);
        return await request<Requisition[]>(`/api/requisitions?${query.toString()}`);
      } catch (err) {
        console.warn('Falha ao buscar requisições do servidor, usando base local:', err);
      }
    }
    return localDb.getRequisitions(params);
  },

  async getRequisition(id: number): Promise<Requisition> {
    const hasServer = await checkServerAvailable();
    if (hasServer) {
      try {
        return await request<Requisition>(`/api/requisitions/${id}`);
      } catch (err) {
        console.warn('Falha ao buscar requisição do servidor, usando base local:', err);
      }
    }
    return localDb.getRequisition(id);
  },

  async createRequisition(data: {
    requestingSectorId: number;
    sourceSectorId?: number | null;
    requesterName: string;
    priority?: 'Baixa' | 'Normal' | 'Urgente';
    notes?: string;
    items: { materialId: number; requestedQty: number; notes?: string }[];
  }): Promise<Requisition> {
    const hasServer = await checkServerAvailable();
    if (hasServer) {
      try {
        const res = await request<Requisition>('/api/requisitions', {
          method: 'POST',
          body: JSON.stringify(data),
        });
        try {
          localDb.createRequisition(data);
        } catch {
          // ignore
        }
        return res;
      } catch (err) {
        console.warn('Falha ao criar requisição no servidor, criando na base local:', err);
      }
    }
    return localDb.createRequisition(data);
  },

  async updateRequisitionStatus(
    id: number,
    status: RequisitionStatus
  ): Promise<Requisition> {
    const hasServer = await checkServerAvailable();
    if (hasServer) {
      try {
        const res = await request<Requisition>(`/api/requisitions/${id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        });
        localDb.updateRequisitionStatus(id, status);
        return res;
      } catch (err) {
        console.warn('Falha ao atualizar status no servidor, atualizando na base local:', err);
      }
    }
    return localDb.updateRequisitionStatus(id, status);
  },

  async fulfillRequisition(id: number, sourceSectorId: number): Promise<Requisition> {
    const hasServer = await checkServerAvailable();
    if (hasServer) {
      try {
        const res = await request<Requisition>(`/api/requisitions/${id}/fulfill`, {
          method: 'POST',
          body: JSON.stringify({ sourceSectorId }),
        });
        try {
          localDb.fulfillRequisition(id, sourceSectorId);
        } catch {
          // ignore
        }
        return res;
      } catch (err) {
        console.warn('Falha ao atender requisição no servidor, atendendo na base local:', err);
      }
    }
    return localDb.fulfillRequisition(id, sourceSectorId);
  },

  // Dashboard Stats
  async getDashboardStats(): Promise<DashboardStats> {
    const hasServer = await checkServerAvailable();
    if (hasServer) {
      try {
        return await request<DashboardStats>('/api/dashboard/stats');
      } catch (err) {
        console.warn('Falha ao buscar estatísticas do servidor, calculando na base local:', err);
      }
    }
    return localDb.getDashboardStats();
  },
};
