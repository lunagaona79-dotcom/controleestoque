import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { database, initDatabase } from './src/server/db.ts';
import { createSession, deleteSession, getSession, verifyPassword } from './src/server/auth.ts';

// Initialize the SQLite relational database
initDatabase();

const app = express();
const PORT = 3000;

app.use(express.json());

// Auth extraction middleware
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
    name: string;
    role: 'admin' | 'operador';
  };
}

const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const session = getSession(token);
    if (session) {
      req.user = session.user;
    }
  }
  next();
};

app.use(authMiddleware);

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Authentication endpoints
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
    }

    const user = database.getUserByUsername(username.trim().toLowerCase());
    if (!user) {
      return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
    }

    const isValid = verifyPassword(password, user.password_hash, user.salt);
    if (!isValid) {
      return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
    }

    const token = createSession({
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao realizar login.' });
  }
});

app.post('/api/auth/logout', (req: AuthenticatedRequest, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    deleteSession(token);
  }
  res.json({ success: true });
});

app.get('/api/auth/me', (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Não autenticado.' });
  }
  res.json({ user: req.user });
});

// Sectors endpoints
app.get('/api/sectors', (req, res) => {
  try {
    const sectors = database.getSectors();
    res.json(sectors);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao buscar setores.' });
  }
});

app.post('/api/sectors', (req: AuthenticatedRequest, res) => {
  try {
    const { code, name, description, isStorage } = req.body;
    if (!code || !name) {
      return res.status(400).json({ error: 'Código e nome do setor são obrigatórios.' });
    }
    const sector = database.createSector({ code, name, description, isStorage });
    res.status(201).json(sector);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erro ao criar setor.' });
  }
});

app.put('/api/sectors/:id', (req: AuthenticatedRequest, res) => {
  try {
    const id = Number(req.params.id);
    const { code, name, description, isStorage } = req.body;
    if (!code || !name) {
      return res.status(400).json({ error: 'Código e nome do setor são obrigatórios.' });
    }
    const sector = database.updateSector(id, { code, name, description, isStorage });
    res.json(sector);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erro ao atualizar setor.' });
  }
});

app.delete('/api/sectors/:id', (req: AuthenticatedRequest, res) => {
  try {
    const id = Number(req.params.id);
    database.deleteSector(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erro ao excluir setor.' });
  }
});

// Materials endpoints
app.get('/api/materials', (req, res) => {
  try {
    const search = req.query.search as string;
    const category = req.query.category as string;
    const materials = database.getMaterials(search, category);
    res.json(materials);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao buscar materiais.' });
  }
});

app.get('/api/materials/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const material = database.getMaterialById(id);
    if (!material) {
      return res.status(404).json({ error: 'Material não encontrado.' });
    }
    res.json(material);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao buscar material.' });
  }
});

app.post('/api/materials', (req: AuthenticatedRequest, res) => {
  try {
    const { code, name, description, unit, minQty, unitPrice, category } = req.body;
    if (!code || !name || !unit) {
      return res.status(400).json({ error: 'Código, nome e unidade de medida são obrigatórios.' });
    }
    const material = database.createMaterial({
      code,
      name,
      description,
      unit,
      minQty: Number(minQty) || 0,
      unitPrice: Number(unitPrice) || 0,
      category,
    });
    res.status(201).json(material);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erro ao cadastrar material.' });
  }
});

app.put('/api/materials/:id', (req: AuthenticatedRequest, res) => {
  try {
    const id = Number(req.params.id);
    const { code, name, description, unit, minQty, unitPrice, category } = req.body;
    if (!code || !name || !unit) {
      return res.status(400).json({ error: 'Código, nome e unidade de medida são obrigatórios.' });
    }
    const material = database.updateMaterial(id, {
      code,
      name,
      description,
      unit,
      minQty: Number(minQty) || 0,
      unitPrice: Number(unitPrice) || 0,
      category,
    });
    res.json(material);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erro ao atualizar material.' });
  }
});

app.delete('/api/materials/:id', (req: AuthenticatedRequest, res) => {
  try {
    const id = Number(req.params.id);
    database.deleteMaterial(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erro ao excluir material.' });
  }
});

// Stock positions
app.get('/api/stocks', (req, res) => {
  try {
    const materialId = req.query.materialId ? Number(req.query.materialId) : undefined;
    const sectorId = req.query.sectorId ? Number(req.query.sectorId) : undefined;
    const status = req.query.status as string;
    const search = req.query.search as string;

    const positions = database.getStockPositions({ materialId, sectorId, status, search });
    res.json(positions);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao consultar posição de estoque.' });
  }
});

// Movements endpoints
app.get('/api/movements', (req, res) => {
  try {
    const type = req.query.type as string;
    const materialId = req.query.materialId ? Number(req.query.materialId) : undefined;
    const sectorId = req.query.sectorId ? Number(req.query.sectorId) : undefined;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    const search = req.query.search as string;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;

    const movements = database.getMovements({ type, materialId, sectorId, startDate, endDate, search, limit });
    res.json(movements);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao buscar movimentações.' });
  }
});

app.post('/api/movements', (req: AuthenticatedRequest, res) => {
  try {
    const { type, materialId, sourceSectorId, targetSectorId, quantity, unitPrice, reason, documentRef } = req.body;

    if (!type || !materialId || !quantity || !reason) {
      return res.status(400).json({ error: 'Tipo, material, quantidade e motivo são campos obrigatórios.' });
    }

    const userName = req.user ? req.user.name : (req.body.userName || 'Operador do Sistema');
    const userId = req.user ? req.user.id : null;

    const movement = database.recordMovement({
      type,
      materialId: Number(materialId),
      sourceSectorId: sourceSectorId ? Number(sourceSectorId) : null,
      targetSectorId: targetSectorId ? Number(targetSectorId) : null,
      quantity: Number(quantity),
      unitPrice: unitPrice !== undefined ? Number(unitPrice) : undefined,
      userId,
      userName,
      reason,
      documentRef,
    });

    res.status(201).json(movement);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erro ao registrar movimentação.' });
  }
});

// Requisitions endpoints
app.get('/api/requisitions', (req, res) => {
  try {
    const status = req.query.status as string;
    const sectorId = req.query.sectorId ? Number(req.query.sectorId) : undefined;
    const search = req.query.search as string;

    const reqs = database.getRequisitions({ status, sectorId, search });
    res.json(reqs);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao buscar requisições.' });
  }
});

app.get('/api/requisitions/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const requisition = database.getRequisitionById(id);
    if (!requisition) {
      return res.status(404).json({ error: 'Requisição não encontrada.' });
    }
    res.json(requisition);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao buscar requisição.' });
  }
});

app.post('/api/requisitions', (req: AuthenticatedRequest, res) => {
  try {
    const { requestingSectorId, sourceSectorId, requesterName, priority, notes, items } = req.body;

    if (!requestingSectorId || !requesterName || !items || !items.length) {
      return res.status(400).json({ error: 'Setor solicitante, nome do solicitante e itens são obrigatórios.' });
    }

    const createdByUserId = req.user ? req.user.id : null;

    const requisition = database.createRequisition({
      requestingSectorId: Number(requestingSectorId),
      sourceSectorId: sourceSectorId ? Number(sourceSectorId) : null,
      requesterName,
      createdByUserId,
      priority,
      notes,
      items,
    });

    res.status(201).json(requisition);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erro ao criar requisição.' });
  }
});

app.patch('/api/requisitions/:id/status', (req: AuthenticatedRequest, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;
    if (!status || !['Pendente', 'Aprovada', 'Cancelada'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido.' });
    }
    const updated = database.updateRequisitionStatus(id, status);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erro ao alterar status da requisição.' });
  }
});

app.post('/api/requisitions/:id/fulfill', (req: AuthenticatedRequest, res) => {
  try {
    const id = Number(req.params.id);
    const { sourceSectorId } = req.body;

    if (!sourceSectorId) {
      return res.status(400).json({ error: 'Setor de origem para baixa do estoque é obrigatório.' });
    }

    const user = {
      id: req.user ? req.user.id : 1,
      name: req.user ? req.user.name : (req.body.fulfilledBy || 'Almoxarife Responsável'),
    };

    const fulfilled = database.fulfillRequisition(id, Number(sourceSectorId), user);
    res.json(fulfilled);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erro ao atender requisição.' });
  }
});

// Dashboard & KPIs
app.get('/api/dashboard/stats', (req, res) => {
  try {
    const stats = database.getDashboardStats();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao calcular dados do painel.' });
  }
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Inventory Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
