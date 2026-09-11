import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { hashPassword } from './auth.ts';

const dbPath = path.resolve(process.cwd(), 'inventory.sqlite');
const db = new DatabaseSync(dbPath);

// Enable foreign keys and WAL mode for reliability and performance
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'operador',
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS sectors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      is_storage INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      unit TEXT NOT NULL DEFAULT 'UN',
      min_qty REAL NOT NULL DEFAULT 0,
      unit_price REAL NOT NULL DEFAULT 0,
      category TEXT DEFAULT 'Geral',
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS inventory_balances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      material_id INTEGER NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
      sector_id INTEGER NOT NULL REFERENCES sectors(id) ON DELETE CASCADE,
      quantity REAL NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      UNIQUE(material_id, sector_id)
    );

    CREATE TABLE IF NOT EXISTS movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL, -- 'ENTRADA' | 'SAIDA' | 'TRANSFERENCIA'
      material_id INTEGER NOT NULL REFERENCES materials(id),
      source_sector_id INTEGER REFERENCES sectors(id),
      target_sector_id INTEGER REFERENCES sectors(id),
      quantity REAL NOT NULL,
      unit_price REAL NOT NULL,
      total_price REAL NOT NULL,
      user_id INTEGER REFERENCES users(id),
      user_name TEXT NOT NULL,
      reason TEXT NOT NULL,
      document_ref TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS requisitions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      requisition_number TEXT UNIQUE NOT NULL,
      requesting_sector_id INTEGER NOT NULL REFERENCES sectors(id),
      source_sector_id INTEGER REFERENCES sectors(id),
      requester_name TEXT NOT NULL,
      created_by_user_id INTEGER REFERENCES users(id),
      priority TEXT NOT NULL DEFAULT 'Normal',
      status TEXT NOT NULL DEFAULT 'Pendente',
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      fulfilled_at TEXT,
      fulfilled_by_user_name TEXT
    );

    CREATE TABLE IF NOT EXISTS requisition_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      requisition_id INTEGER NOT NULL REFERENCES requisitions(id) ON DELETE CASCADE,
      material_id INTEGER NOT NULL REFERENCES materials(id),
      requested_qty REAL NOT NULL,
      fulfilled_qty REAL NOT NULL DEFAULT 0,
      notes TEXT
    );
  `);

  seedInitialData();
}

function seedInitialData() {
  const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any)?.count || 0;
  if (userCount === 0) {
    const adminPass = hashPassword('admin123');
    const opPass = hashPassword('operador123');

    const insertUser = db.prepare(`
      INSERT INTO users (username, password_hash, salt, name, role)
      VALUES (?, ?, ?, ?, ?)
    `);

    insertUser.run('admin', adminPass.hash, adminPass.salt, 'Luna Gaona (Gestor de Estoque)', 'admin');
    insertUser.run('operador', opPass.hash, opPass.salt, 'Carlos Almeida (Almoxarife)', 'operador');
  }

  const sectorCount = (db.prepare('SELECT COUNT(*) as count FROM sectors').get() as any)?.count || 0;
  if (sectorCount === 0) {
    const insertSector = db.prepare(`
      INSERT INTO sectors (code, name, description, is_storage)
      VALUES (?, ?, ?, ?)
    `);

    insertSector.run('SEC-01', 'Almoxarifado Central', 'Depósito principal de recebimento e guarda de insumos', 1);
    insertSector.run('SEC-02', 'Manutenção & Engenharia', 'Oficina mecânica, elétrica e ferramentaria', 1);
    insertSector.run('SEC-03', 'Linha de Produção 01', 'Setor operacional e linha de montagem industrial', 1);
    insertSector.run('SEC-04', 'Obras & Infraestrutura', 'Canteiro operacional de instalações e reformas', 1);
    insertSector.run('SEC-05', 'Administração & Escritórios', 'Setor corporativo e suporte administrativo', 0);
  }

  const materialCount = (db.prepare('SELECT COUNT(*) as count FROM materials').get() as any)?.count || 0;
  if (materialCount === 0) {
    const insertMaterial = db.prepare(`
      INSERT INTO materials (code, name, description, unit, min_qty, unit_price, category)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertMaterial.run('MAT-001', 'Rolamento Rígido de Esferas 6204', 'Rolamento blindado 20x47x14mm para motores industriais', 'UN', 20, 34.50, 'Mecânica');
    insertMaterial.run('MAT-002', 'Cabo Flexível 2,5mm² 750V (Rolo 100m)', 'Condutor de cobre eletrolítico isolado em PVC antichama', 'RL', 10, 189.90, 'Elétrica');
    insertMaterial.run('MAT-003', 'Óleo Lubrificante Industrial ISO VG 68 (Balde 20L)', 'Óleo mineral parafínico com aditivação antidesgaste para hidráulica', 'L', 100, 19.80, 'Lubrificantes');
    insertMaterial.run('MAT-004', 'Parafuso Sextavado Aço Inox M8 x 40mm', 'Fixador classe A2 resistente a corrosão química e mecânica', 'UN', 300, 1.85, 'Fixadores');
    insertMaterial.run('MAT-005', 'Disco de Corte Abrasivo 115 x 1.0mm', 'Disco extra fino para corte rápido de aços e tubulações', 'UN', 60, 7.20, 'Abrasivos');
    insertMaterial.run('MAT-006', 'Luva Nitrílica Solvex Cano Longo Tam. G', 'EPI para proteção química e manuseio de solventes/óleos', 'PAR', 40, 14.50, 'EPI / Segurança');
    insertMaterial.run('MAT-007', 'Fita Isolante 3M Alta Fusão 19mm x 10m', 'Fita autofusão de borracha EPR para barramentos de média tensão', 'UN', 35, 16.20, 'Elétrica');
    insertMaterial.run('MAT-008', 'Eletrodo Revestido AWS E6013 2,5mm (Lata 5kg)', 'Consumível para soldagem elétrica em estruturas metálicas', 'KG', 30, 48.00, 'Solda');
    insertMaterial.run('MAT-009', 'Graxa Grafitada de Alta Temperatura (Pote 1kg)', 'Graxa a base de sabão de lítio com grafite coloidal', 'UN', 15, 42.00, 'Lubrificantes');

    // Seed balances across sectors
    const insertBalance = db.prepare(`
      INSERT INTO inventory_balances (material_id, sector_id, quantity)
      VALUES (?, ?, ?)
    `);

    // Material 1: 6204 - 12 in Central (below min 20 => CRITICAL)
    insertBalance.run(1, 1, 12);
    // Material 2: Cabo 2,5mm - 6 in Central (below min 10 => CRITICAL)
    insertBalance.run(2, 1, 6);
    // Material 3: Óleo VG 68 - 140 in Central
    insertBalance.run(3, 1, 120);
    insertBalance.run(3, 2, 20);
    // Material 4: Parafuso M8 - 85 in Central (below min 300 => CRITICAL!)
    insertBalance.run(4, 1, 85);
    // Material 5: Disco corte - 95 in Central
    insertBalance.run(5, 1, 80);
    insertBalance.run(5, 2, 15);
    // Material 6: Luva Nitrilica - 50 in Central
    insertBalance.run(6, 1, 40);
    insertBalance.run(6, 3, 10);
    // Material 7: Fita Isolante - 28 in Central (below min 35 => ALERT)
    insertBalance.run(7, 1, 28);
    // Material 8: Eletrodo - 45 in Central
    insertBalance.run(8, 1, 40);
    insertBalance.run(8, 4, 5);
    // Material 9: Graxa - 18 in Central
    insertBalance.run(9, 1, 18);

    // Seed sample movements
    const insertMovement = db.prepare(`
      INSERT INTO movements (type, material_id, source_sector_id, target_sector_id, quantity, unit_price, total_price, user_id, user_name, reason, document_ref, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?))
    `);

    insertMovement.run('ENTRADA', 1, null, 1, 25, 34.50, 862.50, 1, 'Luna Gaona', 'Recebimento de compra de reposição de estoque', 'NF-78412', '-3 days');
    insertMovement.run('SAIDA', 1, 1, null, 13, 34.50, 448.50, 2, 'Carlos Almeida', 'Atendimento a manutenção preventiva de bombas', 'OS-4401', '-2 days');
    insertMovement.run('ENTRADA', 3, null, 1, 160, 19.80, 3168.00, 1, 'Luna Gaona', 'Fornecimento mensal de fluídos industriais', 'NF-78500', '-2 days');
    insertMovement.run('TRANSFERENCIA', 3, 1, 2, 20, 19.80, 396.00, 2, 'Carlos Almeida', 'Abastecimento do estoque da oficina mecânica', 'TRF-102', '-1 days');
    insertMovement.run('ENTRADA', 5, null, 1, 100, 7.20, 720.00, 1, 'Luna Gaona', 'Reposição periódica de insumos abrasivos', 'NF-78590', '-1 days');
    insertMovement.run('SAIDA', 4, 1, null, 150, 1.85, 277.50, 2, 'Carlos Almeida', 'Consumo na montagem do galpão logístico', 'REQ-2026-0001', '-5 hours');
    insertMovement.run('TRANSFERENCIA', 6, 1, 3, 10, 14.50, 145.00, 2, 'Carlos Almeida', 'Disponibilização de EPIs para operadores do turno A', 'TRF-103', '-2 hours');

    // Seed sample requisitions
    const insertReq = db.prepare(`
      INSERT INTO requisitions (requisition_number, requesting_sector_id, source_sector_id, requester_name, created_by_user_id, priority, status, notes, created_at, fulfilled_at, fulfilled_by_user_name)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?), ?, ?)
    `);

    insertReq.run('REQ-2026-0001', 4, 1, 'Eng. Roberto Silva', 1, 'Urgente', 'Atendida', 'Urgência para conclusão da fixação do galpão', '-1 days', '2026-09-10 16:30:00', 'Carlos Almeida');
    const req1Id = (db.prepare('SELECT id FROM requisitions WHERE requisition_number = "REQ-2026-0001"').get() as any)?.id;
    if (req1Id) {
      db.prepare(`INSERT INTO requisition_items (requisition_id, material_id, requested_qty, fulfilled_qty, notes) VALUES (?, ?, ?, ?, ?)`).run(req1Id, 4, 150, 150, 'Parafuso M8 para estruturas');
    }

    insertReq.run('REQ-2026-0002', 2, 1, 'Marcos Eletricista', 2, 'Normal', 'Pendente', 'Necessário para troca de fiação do setor de compressores', '-3 hours', null, null);
    const req2Id = (db.prepare('SELECT id FROM requisitions WHERE requisition_number = "REQ-2026-0002"').get() as any)?.id;
    if (req2Id) {
      db.prepare(`INSERT INTO requisition_items (requisition_id, material_id, requested_qty, fulfilled_qty, notes) VALUES (?, ?, ?, ?, ?)`).run(req2Id, 2, 3, 0, 'Cabo 2,5mm rolos');
      db.prepare(`INSERT INTO requisition_items (requisition_id, material_id, requested_qty, fulfilled_qty, notes) VALUES (?, ?, ?, ?, ?)`).run(req2Id, 7, 5, 0, 'Fita isolante 3M');
    }

    insertReq.run('REQ-2026-0003', 3, 1, 'Supervisão de Turno', 1, 'Urgente', 'Pendente', 'Reposição urgente de discos de corte para adequação de peças', '-30 minutes', null, null);
    const req3Id = (db.prepare('SELECT id FROM requisitions WHERE requisition_number = "REQ-2026-0003"').get() as any)?.id;
    if (req3Id) {
      db.prepare(`INSERT INTO requisition_items (requisition_id, material_id, requested_qty, fulfilled_qty, notes) VALUES (?, ?, ?, ?, ?)`).run(req3Id, 5, 20, 0, 'Discos abrasivos 115mm');
      db.prepare(`INSERT INTO requisition_items (requisition_id, material_id, requested_qty, fulfilled_qty, notes) VALUES (?, ?, ?, ?, ?)`).run(req3Id, 6, 10, 0, 'Luvas de proteção química');
    }
  }
}

// Data Access Object (DAO) methods

export const database = {
  // Users
  getUserByUsername(username: string) {
    return db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
  },

  getUserById(id: number) {
    return db.prepare('SELECT id, username, name, role, created_at as createdAt FROM users WHERE id = ?').get(id) as any;
  },

  // Sectors
  getSectors() {
    const rows = db.prepare(`
      SELECT s.id, s.code, s.name, s.description, s.is_storage as isStorage, s.created_at as createdAt,
             COUNT(DISTINCT b.material_id) as totalMaterialsCount,
             COALESCE(SUM(b.quantity), 0) as totalQuantity,
             COALESCE(SUM(b.quantity * m.unit_price), 0) as totalValue
      FROM sectors s
      LEFT JOIN inventory_balances b ON s.id = b.sector_id AND b.quantity > 0
      LEFT JOIN materials m ON b.material_id = m.id
      GROUP BY s.id
      ORDER BY s.name ASC
    `).all() as any[];

    return rows.map(r => ({
      ...r,
      isStorage: Boolean(r.isStorage),
      totalQuantity: Number(r.totalQuantity),
      totalValue: Number(r.totalValue),
      totalMaterialsCount: Number(r.totalMaterialsCount),
    }));
  },

  getSectorById(id: number) {
    return db.prepare('SELECT id, code, name, description, is_storage as isStorage, created_at as createdAt FROM sectors WHERE id = ?').get(id) as any;
  },

  createSector(data: { code: string; name: string; description?: string; isStorage?: boolean }) {
    const stmt = db.prepare(`
      INSERT INTO sectors (code, name, description, is_storage)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(data.code.trim().toUpperCase(), data.name.trim(), data.description || '', data.isStorage !== false ? 1 : 0);
    return this.getSectorById(Number(result.lastInsertRowid));
  },

  updateSector(id: number, data: { code: string; name: string; description?: string; isStorage?: boolean }) {
    db.prepare(`
      UPDATE sectors
      SET code = ?, name = ?, description = ?, is_storage = ?
      WHERE id = ?
    `).run(data.code.trim().toUpperCase(), data.name.trim(), data.description || '', data.isStorage !== false ? 1 : 0, id);
    return this.getSectorById(id);
  },

  deleteSector(id: number) {
    // Check if there are active balances
    const balance = (db.prepare('SELECT SUM(quantity) as qty FROM inventory_balances WHERE sector_id = ?').get(id) as any)?.qty || 0;
    if (balance > 0) {
      throw new Error(`Não é possível excluir o setor pois ainda existem ${balance} unidades de materiais armazenados nele.`);
    }
    db.prepare('DELETE FROM sectors WHERE id = ?').run(id);
    return { success: true };
  },

  // Materials
  getMaterials(search?: string, category?: string) {
    let sql = `
      SELECT m.id, m.code, m.name, m.description, m.unit, m.min_qty as minQty,
             m.unit_price as unitPrice, m.category, m.created_at as createdAt,
             COALESCE(SUM(b.quantity), 0) as totalStock,
             COALESCE(SUM(b.quantity * m.unit_price), 0) as totalValue
      FROM materials m
      LEFT JOIN inventory_balances b ON m.id = b.material_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search) {
      sql += ` AND (m.name LIKE ? OR m.code LIKE ? OR m.description LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    if (category && category !== 'Todos') {
      sql += ` AND m.category = ?`;
      params.push(category);
    }

    sql += ` GROUP BY m.id ORDER BY m.name ASC`;

    const rows = db.prepare(sql).all(...params) as any[];
    return rows.map(r => ({
      ...r,
      minQty: Number(r.minQty),
      unitPrice: Number(r.unitPrice),
      totalStock: Number(r.totalStock),
      totalValue: Number(r.totalValue),
      isCritical: Number(r.totalStock) <= Number(r.minQty),
    }));
  },

  getMaterialById(id: number) {
    const row = db.prepare(`
      SELECT m.id, m.code, m.name, m.description, m.unit, m.min_qty as minQty,
             m.unit_price as unitPrice, m.category, m.created_at as createdAt,
             COALESCE(SUM(b.quantity), 0) as totalStock,
             COALESCE(SUM(b.quantity * m.unit_price), 0) as totalValue
      FROM materials m
      LEFT JOIN inventory_balances b ON m.id = b.material_id
      WHERE m.id = ?
      GROUP BY m.id
    `).get(id) as any;

    if (!row) return null;

    const sectorBalances = db.prepare(`
      SELECT b.sector_id as sectorId, s.code as sectorCode, s.name as sectorName, b.quantity
      FROM inventory_balances b
      JOIN sectors s ON b.sector_id = s.id
      WHERE b.material_id = ? AND b.quantity > 0
      ORDER BY b.quantity DESC
    `).all(id) as any[];

    return {
      ...row,
      minQty: Number(row.minQty),
      unitPrice: Number(row.unitPrice),
      totalStock: Number(row.totalStock),
      totalValue: Number(row.totalValue),
      isCritical: Number(row.totalStock) <= Number(row.minQty),
      sectorBalances,
    };
  },

  createMaterial(data: { code: string; name: string; description?: string; unit: string; minQty: number; unitPrice: number; category?: string }) {
    const stmt = db.prepare(`
      INSERT INTO materials (code, name, description, unit, min_qty, unit_price, category)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      data.code.trim().toUpperCase(),
      data.name.trim(),
      data.description || '',
      data.unit.trim().toUpperCase(),
      Number(data.minQty) || 0,
      Number(data.unitPrice) || 0,
      data.category?.trim() || 'Geral'
    );
    return this.getMaterialById(Number(result.lastInsertRowid));
  },

  updateMaterial(id: number, data: { code: string; name: string; description?: string; unit: string; minQty: number; unitPrice: number; category?: string }) {
    db.prepare(`
      UPDATE materials
      SET code = ?, name = ?, description = ?, unit = ?, min_qty = ?, unit_price = ?, category = ?
      WHERE id = ?
    `).run(
      data.code.trim().toUpperCase(),
      data.name.trim(),
      data.description || '',
      data.unit.trim().toUpperCase(),
      Number(data.minQty) || 0,
      Number(data.unitPrice) || 0,
      data.category?.trim() || 'Geral',
      id
    );
    return this.getMaterialById(id);
  },

  deleteMaterial(id: number) {
    const totalStock = (db.prepare('SELECT SUM(quantity) as stock FROM inventory_balances WHERE material_id = ?').get(id) as any)?.stock || 0;
    if (totalStock > 0) {
      throw new Error(`Não é possível excluir o material pois ainda há saldo em estoque (${totalStock} unidades). Dê baixa antes.`);
    }
    db.prepare('DELETE FROM materials WHERE id = ?').run(id);
    return { success: true };
  },

  // Stock Positions (Posição de Estoque consolidada com detalhamento por setor)
  getStockPositions(filters?: { materialId?: number; sectorId?: number; status?: string; search?: string }) {
    let baseSql = `
      SELECT m.id as materialId, m.code as materialCode, m.name as materialName,
             m.unit, m.min_qty as minQty, m.unit_price as unitPrice,
             COALESCE(SUM(b.quantity), 0) as totalQuantity,
             COALESCE(SUM(b.quantity * m.unit_price), 0) as totalValue
      FROM materials m
      LEFT JOIN inventory_balances b ON m.id = b.material_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters?.materialId) {
      baseSql += ` AND m.id = ?`;
      params.push(filters.materialId);
    }
    if (filters?.search) {
      baseSql += ` AND (m.name LIKE ? OR m.code LIKE ?)`;
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    baseSql += ` GROUP BY m.id ORDER BY m.name ASC`;
    const materials = db.prepare(baseSql).all(...params) as any[];

    // Fetch all active sector balances
    const sectorRows = db.prepare(`
      SELECT b.material_id as materialId, b.sector_id as sectorId, s.code as sectorCode, s.name as sectorName, b.quantity
      FROM inventory_balances b
      JOIN sectors s ON b.sector_id = s.id
      WHERE b.quantity > 0
      ORDER BY s.name ASC
    `).all() as any[];

    const sectorMapByMaterial = new Map<number, any[]>();
    for (const row of sectorRows) {
      const list = sectorMapByMaterial.get(row.materialId) || [];
      list.push({
        sectorId: row.sectorId,
        sectorCode: row.sectorCode,
        sectorName: row.sectorName,
        quantity: Number(row.quantity),
      });
      sectorMapByMaterial.set(row.materialId, list);
    }

    return materials.map(m => {
      const totalQty = Number(m.totalQuantity);
      const minQty = Number(m.minQty);
      let status: 'Normal' | 'Alerta' | 'Crítico' = 'Normal';
      if (totalQty <= minQty) {
        status = 'Crítico';
      } else if (totalQty <= minQty * 1.25) {
        status = 'Alerta';
      }

      const sectors = sectorMapByMaterial.get(m.materialId) || [];

      return {
        materialId: m.materialId,
        materialCode: m.materialCode,
        materialName: m.materialName,
        unit: m.unit,
        minQty,
        unitPrice: Number(m.unitPrice),
        totalQuantity: totalQty,
        totalValue: Number(m.totalValue),
        status,
        sectors,
      };
    }).filter(item => {
      if (filters?.sectorId) {
        const hasSector = item.sectors.some(s => s.sectorId === filters.sectorId);
        if (!hasSector) return false;
      }
      if (filters?.status && filters.status !== 'Todos') {
        if (item.status !== filters.status) return false;
      }
      return true;
    });
  },

  // Movements (Entrada, Saída, Transferência) with atomic transaction
  recordMovement(data: {
    type: 'ENTRADA' | 'SAIDA' | 'TRANSFERENCIA';
    materialId: number;
    sourceSectorId?: number | null;
    targetSectorId?: number | null;
    quantity: number;
    unitPrice?: number;
    userId?: number | null;
    userName: string;
    reason: string;
    documentRef?: string | null;
  }) {
    if (data.quantity <= 0) {
      throw new Error('A quantidade deve ser maior que zero.');
    }

    const material = db.prepare('SELECT id, code, name, unit, unit_price FROM materials WHERE id = ?').get(data.materialId) as any;
    if (!material) {
      throw new Error('Material não encontrado.');
    }

    const unitPrice = data.unitPrice !== undefined && data.unitPrice >= 0 ? data.unitPrice : Number(material.unit_price);
    const totalPrice = data.quantity * unitPrice;

    // Start SQLite transaction
    db.exec('BEGIN IMMEDIATE TRANSACTION;');

    try {
      if (data.type === 'ENTRADA') {
        if (!data.targetSectorId) {
          throw new Error('Setor de destino é obrigatório para entradas de materiais.');
        }

        // Upsert balance into target sector
        db.prepare(`
          INSERT INTO inventory_balances (material_id, sector_id, quantity, updated_at)
          VALUES (?, ?, ?, datetime('now', 'localtime'))
          ON CONFLICT(material_id, sector_id) DO UPDATE SET
            quantity = quantity + excluded.quantity,
            updated_at = datetime('now', 'localtime')
        `).run(data.materialId, data.targetSectorId, data.quantity);

        // Optionally update unit price if provided and different
        if (data.unitPrice && data.unitPrice > 0) {
          db.prepare('UPDATE materials SET unit_price = ? WHERE id = ?').run(data.unitPrice, data.materialId);
        }
      } else if (data.type === 'SAIDA') {
        if (!data.sourceSectorId) {
          throw new Error('Setor de origem é obrigatório para saídas de materiais.');
        }

        const balanceRow = db.prepare('SELECT quantity FROM inventory_balances WHERE material_id = ? AND sector_id = ?').get(data.materialId, data.sourceSectorId) as any;
        const currentQty = balanceRow ? Number(balanceRow.quantity) : 0;

        if (currentQty < data.quantity) {
          throw new Error(`Saldo insuficiente no setor de origem. Saldo atual: ${currentQty} ${material.unit}, Solicitado: ${data.quantity} ${material.unit}`);
        }

        db.prepare(`
          UPDATE inventory_balances
          SET quantity = quantity - ?, updated_at = datetime('now', 'localtime')
          WHERE material_id = ? AND sector_id = ?
        `).run(data.quantity, data.materialId, data.sourceSectorId);
      } else if (data.type === 'TRANSFERENCIA') {
        if (!data.sourceSectorId || !data.targetSectorId) {
          throw new Error('Setor de origem e setor de destino são obrigatórios para transferências.');
        }
        if (data.sourceSectorId === data.targetSectorId) {
          throw new Error('O setor de destino deve ser diferente do setor de origem.');
        }

        const balanceRow = db.prepare('SELECT quantity FROM inventory_balances WHERE material_id = ? AND sector_id = ?').get(data.materialId, data.sourceSectorId) as any;
        const currentQty = balanceRow ? Number(balanceRow.quantity) : 0;

        if (currentQty < data.quantity) {
          throw new Error(`Saldo insuficiente no setor de origem para transferência. Saldo atual: ${currentQty} ${material.unit}, Solicitado: ${data.quantity} ${material.unit}`);
        }

        // Deduct from source
        db.prepare(`
          UPDATE inventory_balances
          SET quantity = quantity - ?, updated_at = datetime('now', 'localtime')
          WHERE material_id = ? AND sector_id = ?
        `).run(data.quantity, data.materialId, data.sourceSectorId);

        // Add to target
        db.prepare(`
          INSERT INTO inventory_balances (material_id, sector_id, quantity, updated_at)
          VALUES (?, ?, ?, datetime('now', 'localtime'))
          ON CONFLICT(material_id, sector_id) DO UPDATE SET
            quantity = quantity + excluded.quantity,
            updated_at = datetime('now', 'localtime')
        `).run(data.materialId, data.targetSectorId, data.quantity);
      }

      // Insert movement record
      const stmt = db.prepare(`
        INSERT INTO movements (type, material_id, source_sector_id, target_sector_id, quantity, unit_price, total_price, user_id, user_name, reason, document_ref)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        data.type,
        data.materialId,
        data.sourceSectorId || null,
        data.targetSectorId || null,
        data.quantity,
        unitPrice,
        totalPrice,
        data.userId || null,
        data.userName.trim(),
        data.reason.trim(),
        data.documentRef?.trim() || null
      );

      db.exec('COMMIT;');
      return this.getMovementById(Number(result.lastInsertRowid));
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }
  },

  getMovementById(id: number) {
    const row = db.prepare(`
      SELECT m.id, m.type, m.material_id as materialId, mat.code as materialCode, mat.name as materialName, mat.unit,
             m.source_sector_id as sourceSectorId, s_src.name as sourceSectorName,
             m.target_sector_id as targetSectorId, s_tgt.name as targetSectorName,
             m.quantity, m.unit_price as unitPrice, m.total_price as totalPrice,
             m.user_id as userId, m.user_name as userName, m.reason, m.document_ref as documentRef,
             m.created_at as createdAt
      FROM movements m
      JOIN materials mat ON m.material_id = mat.id
      LEFT JOIN sectors s_src ON m.source_sector_id = s_src.id
      LEFT JOIN sectors s_tgt ON m.target_sector_id = s_tgt.id
      WHERE m.id = ?
    `).get(id) as any;

    return row ? {
      ...row,
      quantity: Number(row.quantity),
      unitPrice: Number(row.unitPrice),
      totalPrice: Number(row.totalPrice),
    } : null;
  },

  getMovements(filters?: {
    type?: string;
    materialId?: number;
    sectorId?: number;
    startDate?: string;
    endDate?: string;
    search?: string;
    limit?: number;
  }) {
    let sql = `
      SELECT m.id, m.type, m.material_id as materialId, mat.code as materialCode, mat.name as materialName, mat.unit,
             m.source_sector_id as sourceSectorId, s_src.name as sourceSectorName,
             m.target_sector_id as targetSectorId, s_tgt.name as targetSectorName,
             m.quantity, m.unit_price as unitPrice, m.total_price as totalPrice,
             m.user_id as userId, m.user_name as userName, m.reason, m.document_ref as documentRef,
             m.created_at as createdAt
      FROM movements m
      JOIN materials mat ON m.material_id = mat.id
      LEFT JOIN sectors s_src ON m.source_sector_id = s_src.id
      LEFT JOIN sectors s_tgt ON m.target_sector_id = s_tgt.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters?.type && filters.type !== 'Todos') {
      sql += ` AND m.type = ?`;
      params.push(filters.type);
    }
    if (filters?.materialId) {
      sql += ` AND m.material_id = ?`;
      params.push(filters.materialId);
    }
    if (filters?.sectorId) {
      sql += ` AND (m.source_sector_id = ? OR m.target_sector_id = ?)`;
      params.push(filters.sectorId, filters.sectorId);
    }
    if (filters?.startDate) {
      sql += ` AND date(m.created_at) >= date(?)`;
      params.push(filters.startDate);
    }
    if (filters?.endDate) {
      sql += ` AND date(m.created_at) <= date(?)`;
      params.push(filters.endDate);
    }
    if (filters?.search) {
      sql += ` AND (mat.name LIKE ? OR mat.code LIKE ? OR m.reason LIKE ? OR m.user_name LIKE ? OR m.document_ref LIKE ?)`;
      const term = `%${filters.search}%`;
      params.push(term, term, term, term, term);
    }

    sql += ` ORDER BY m.created_at DESC`;

    if (filters?.limit) {
      sql += ` LIMIT ?`;
      params.push(filters.limit);
    }

    const rows = db.prepare(sql).all(...params) as any[];
    return rows.map(r => ({
      ...r,
      quantity: Number(r.quantity),
      unitPrice: Number(r.unitPrice),
      totalPrice: Number(r.totalPrice),
    }));
  },

  // Requisitions
  getRequisitions(filters?: { status?: string; sectorId?: number; search?: string }) {
    let sql = `
      SELECT r.id, r.requisition_number as requisitionNumber,
             r.requesting_sector_id as requestingSectorId, s_req.name as requestingSectorName,
             r.source_sector_id as sourceSectorId, s_src.name as sourceSectorName,
             r.requester_name as requesterName, r.created_by_user_id as createdByUserId,
             r.priority, r.status, r.notes, r.created_at as createdAt,
             r.fulfilled_at as fulfilledAt, r.fulfilled_by_user_name as fulfilledByUserName
      FROM requisitions r
      JOIN sectors s_req ON r.requesting_sector_id = s_req.id
      LEFT JOIN sectors s_src ON r.source_sector_id = s_src.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters?.status && filters.status !== 'Todos') {
      sql += ` AND r.status = ?`;
      params.push(filters.status);
    }
    if (filters?.sectorId) {
      sql += ` AND (r.requesting_sector_id = ? OR r.source_sector_id = ?)`;
      params.push(filters.sectorId, filters.sectorId);
    }
    if (filters?.search) {
      sql += ` AND (r.requisition_number LIKE ? OR r.requester_name LIKE ? OR s_req.name LIKE ?)`;
      const term = `%${filters.search}%`;
      params.push(term, term, term);
    }

    sql += ` ORDER BY r.created_at DESC`;

    const requisitions = db.prepare(sql).all(...params) as any[];

    // Fetch items for each
    const itemsStmt = db.prepare(`
      SELECT ri.id, ri.requisition_id as requisitionId, ri.material_id as materialId,
             m.code as materialCode, m.name as materialName, m.unit, m.unit_price as unitPrice,
             ri.requested_qty as requestedQty, ri.fulfilled_qty as fulfilledQty, ri.notes
      FROM requisition_items ri
      JOIN materials m ON ri.material_id = m.id
      WHERE ri.requisition_id = ?
    `);

    return requisitions.map(r => {
      const items = itemsStmt.all(r.id) as any[];
      const totalEstimatedValue = items.reduce((sum, it) => sum + (Number(it.requestedQty) * Number(it.unitPrice || 0)), 0);
      return {
        ...r,
        items: items.map(it => ({
          ...it,
          requestedQty: Number(it.requestedQty),
          fulfilledQty: Number(it.fulfilledQty),
          unitPrice: Number(it.unitPrice),
        })),
        totalEstimatedValue,
      };
    });
  },

  getRequisitionById(id: number) {
    const r = db.prepare(`
      SELECT r.id, r.requisition_number as requisitionNumber,
             r.requesting_sector_id as requestingSectorId, s_req.name as requestingSectorName,
             r.source_sector_id as sourceSectorId, s_src.name as sourceSectorName,
             r.requester_name as requesterName, r.created_by_user_id as createdByUserId,
             r.priority, r.status, r.notes, r.created_at as createdAt,
             r.fulfilled_at as fulfilledAt, r.fulfilled_by_user_name as fulfilledByUserName
      FROM requisitions r
      JOIN sectors s_req ON r.requesting_sector_id = s_req.id
      LEFT JOIN sectors s_src ON r.source_sector_id = s_src.id
      WHERE r.id = ?
    `).get(id) as any;

    if (!r) return null;

    const items = db.prepare(`
      SELECT ri.id, ri.requisition_id as requisitionId, ri.material_id as materialId,
             m.code as materialCode, m.name as materialName, m.unit, m.unit_price as unitPrice,
             ri.requested_qty as requestedQty, ri.fulfilled_qty as fulfilledQty, ri.notes
      FROM requisition_items ri
      JOIN materials m ON ri.material_id = m.id
      WHERE ri.requisition_id = ?
    `).all(id) as any[];

    const totalEstimatedValue = items.reduce((sum, it) => sum + (Number(it.requestedQty) * Number(it.unitPrice || 0)), 0);

    return {
      ...r,
      items: items.map(it => ({
        ...it,
        requestedQty: Number(it.requestedQty),
        fulfilledQty: Number(it.fulfilledQty),
        unitPrice: Number(it.unitPrice),
      })),
      totalEstimatedValue,
    };
  },

  createRequisition(data: {
    requestingSectorId: number;
    sourceSectorId?: number | null;
    requesterName: string;
    createdByUserId?: number | null;
    priority?: 'Baixa' | 'Normal' | 'Urgente';
    notes?: string;
    items: { materialId: number; requestedQty: number; notes?: string }[];
  }) {
    if (!data.items || data.items.length === 0) {
      throw new Error('A requisição deve conter pelo menos um item.');
    }

    db.exec('BEGIN IMMEDIATE TRANSACTION;');

    try {
      // Generate requisition number
      const year = new Date().getFullYear();
      const count = ((db.prepare(`SELECT COUNT(*) as c FROM requisitions WHERE requisition_number LIKE ?`).get(`REQ-${year}-%`) as any)?.c || 0) + 1;
      const requisitionNumber = `REQ-${year}-${String(count).padStart(4, '0')}`;

      const stmt = db.prepare(`
        INSERT INTO requisitions (requisition_number, requesting_sector_id, source_sector_id, requester_name, created_by_user_id, priority, status, notes)
        VALUES (?, ?, ?, ?, ?, ?, 'Pendente', ?)
      `);

      const result = stmt.run(
        requisitionNumber,
        data.requestingSectorId,
        data.sourceSectorId || null,
        data.requesterName.trim(),
        data.createdByUserId || null,
        data.priority || 'Normal',
        data.notes?.trim() || ''
      );

      const reqId = Number(result.lastInsertRowid);

      const itemStmt = db.prepare(`
        INSERT INTO requisition_items (requisition_id, material_id, requested_qty, fulfilled_qty, notes)
        VALUES (?, ?, ?, 0, ?)
      `);

      for (const item of data.items) {
        if (item.requestedQty <= 0) {
          throw new Error('A quantidade requisitada deve ser maior que zero.');
        }
        itemStmt.run(reqId, item.materialId, item.requestedQty, item.notes?.trim() || '');
      }

      db.exec('COMMIT;');
      return this.getRequisitionById(reqId);
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }
  },

  updateRequisitionStatus(id: number, status: 'Pendente' | 'Aprovada' | 'Cancelada') {
    db.prepare('UPDATE requisitions SET status = ? WHERE id = ?').run(status, id);
    return this.getRequisitionById(id);
  },

  fulfillRequisition(id: number, sourceSectorId: number, user: { id: number; name: string }) {
    const req = this.getRequisitionById(id);
    if (!req) throw new Error('Requisição não encontrada.');
    if (req.status === 'Atendida') throw new Error('Esta requisição já foi atendida.');
    if (req.status === 'Cancelada') throw new Error('Esta requisição foi cancelada.');

    db.exec('BEGIN IMMEDIATE TRANSACTION;');

    try {
      const isTargetStorage = (db.prepare('SELECT is_storage FROM sectors WHERE id = ?').get(req.requestingSectorId) as any)?.is_storage;

      // Verify and deduct stock for each item
      for (const item of req.items) {
        const balanceRow = db.prepare('SELECT quantity FROM inventory_balances WHERE material_id = ? AND sector_id = ?').get(item.materialId, sourceSectorId) as any;
        const currentQty = balanceRow ? Number(balanceRow.quantity) : 0;

        if (currentQty < item.requestedQty) {
          throw new Error(`Saldo insuficiente no setor de origem para o item "${item.materialName}". Saldo disponível: ${currentQty} ${item.unit}, Requisitado: ${item.requestedQty} ${item.unit}`);
        }

        // Deduct from source
        db.prepare(`
          UPDATE inventory_balances
          SET quantity = quantity - ?, updated_at = datetime('now', 'localtime')
          WHERE material_id = ? AND sector_id = ?
        `).run(item.requestedQty, item.materialId, sourceSectorId);

        // If requesting sector is storage, it's a TRANSFERENCIA, otherwise SAIDA (consumo)
        if (isTargetStorage) {
          db.prepare(`
            INSERT INTO inventory_balances (material_id, sector_id, quantity, updated_at)
            VALUES (?, ?, ?, datetime('now', 'localtime'))
            ON CONFLICT(material_id, sector_id) DO UPDATE SET
              quantity = quantity + excluded.quantity,
              updated_at = datetime('now', 'localtime')
          `).run(item.materialId, req.requestingSectorId, item.requestedQty);

          db.prepare(`
            INSERT INTO movements (type, material_id, source_sector_id, target_sector_id, quantity, unit_price, total_price, user_id, user_name, reason, document_ref)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            'TRANSFERENCIA',
            item.materialId,
            sourceSectorId,
            req.requestingSectorId,
            item.requestedQty,
            item.unitPrice,
            item.requestedQty * item.unitPrice,
            user.id,
            user.name,
            `Atendimento da Requisição ${req.requisitionNumber}`,
            req.requisitionNumber
          );
        } else {
          db.prepare(`
            INSERT INTO movements (type, material_id, source_sector_id, target_sector_id, quantity, unit_price, total_price, user_id, user_name, reason, document_ref)
            VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            'SAIDA',
            item.materialId,
            sourceSectorId,
            item.requestedQty,
            item.unitPrice,
            item.requestedQty * item.unitPrice,
            user.id,
            user.name,
            `Atendimento ao setor ${req.requestingSectorName} (Req: ${req.requisitionNumber})`,
            req.requisitionNumber
          );
        }

        // Mark item fulfilled
        db.prepare('UPDATE requisition_items SET fulfilled_qty = requested_qty WHERE id = ?').run(item.id);
      }

      // Mark requisition as fulfilled
      db.prepare(`
        UPDATE requisitions
        SET status = 'Atendida', source_sector_id = ?, fulfilled_at = datetime('now', 'localtime'), fulfilled_by_user_name = ?
        WHERE id = ?
      `).run(sourceSectorId, user.name, id);

      db.exec('COMMIT;');
      return this.getRequisitionById(id);
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }
  },

  // Dashboard & Performance KPIs
  getDashboardStats() {
    const totalMaterials = (db.prepare('SELECT COUNT(*) as c FROM materials').get() as any)?.c || 0;

    const totals = db.prepare(`
      SELECT COALESCE(SUM(b.quantity), 0) as totalUnits,
             COALESCE(SUM(b.quantity * m.unit_price), 0) as totalValue
      FROM inventory_balances b
      JOIN materials m ON b.material_id = m.id
    `).get() as any;

    // Critical stock items
    const criticalRows = db.prepare(`
      SELECT m.id, m.code, m.name, m.unit, m.min_qty as minQty,
             COALESCE(SUM(b.quantity), 0) as currentStock,
             (m.min_qty - COALESCE(SUM(b.quantity), 0)) as deficit
      FROM materials m
      LEFT JOIN inventory_balances b ON m.id = b.material_id
      GROUP BY m.id
      HAVING COALESCE(SUM(b.quantity), 0) <= m.min_qty
      ORDER BY deficit DESC
    `).all() as any[];

    const pendingReqs = (db.prepare(`SELECT COUNT(*) as c FROM requisitions WHERE status = 'Pendente'`).get() as any)?.c || 0;
    const movementsToday = (db.prepare(`SELECT COUNT(*) as c FROM movements WHERE date(created_at) = date('now', 'localtime')`).get() as any)?.c || 0;

    const recentMovements = this.getMovements({ limit: 6 });

    // Top moved materials
    const topMoved = db.prepare(`
      SELECT m.id as materialId, m.code as materialCode, m.name as materialName, m.unit,
             SUM(mov.quantity) as totalQuantityMoved,
             COUNT(mov.id) as totalMovements,
             mov.type
      FROM movements mov
      JOIN materials m ON mov.material_id = m.id
      GROUP BY m.id, mov.type
      ORDER BY totalQuantityMoved DESC
      LIMIT 5
    `).all() as any[];

    // Stock Turnover KPI (Velocidade de rotação = saídas / estoque atual)
    const turnoverRows = db.prepare(`
      SELECT m.id as materialId, m.code as materialCode, m.name as materialName,
             COALESCE((SELECT SUM(quantity) FROM inventory_balances WHERE material_id = m.id), 0) as currentStock,
             COALESCE((SELECT SUM(quantity) FROM movements WHERE material_id = m.id AND type = 'SAIDA'), 0) as totalOut
      FROM materials m
      ORDER BY totalOut DESC
    `).all() as any[];

    const stockTurnoverKPIs = turnoverRows.map(r => {
      const stock = Number(r.currentStock);
      const out = Number(r.totalOut);
      const turnoverRatio = stock > 0 ? Number((out / stock).toFixed(2)) : (out > 0 ? 99 : 0);
      let turnoverStatus: 'Alto Giro' | 'Médio Giro' | 'Baixo Giro' | 'Estagnado' = 'Estagnado';

      if (turnoverRatio >= 2) {
        turnoverStatus = 'Alto Giro';
      } else if (turnoverRatio >= 0.8) {
        turnoverStatus = 'Médio Giro';
      } else if (turnoverRatio > 0) {
        turnoverStatus = 'Baixo Giro';
      }

      return {
        materialId: r.materialId,
        materialCode: r.materialCode,
        materialName: r.materialName,
        currentStock: stock,
        totalOut: out,
        turnoverRatio,
        turnoverStatus,
      };
    });

    return {
      totalMaterials,
      totalStockUnits: Number(totals?.totalUnits || 0),
      totalStockValue: Number(totals?.totalValue || 0),
      criticalStockCount: criticalRows.length,
      pendingRequisitionsCount: pendingReqs,
      movementsTodayCount: movementsToday,
      criticalItems: criticalRows.map(r => ({
        ...r,
        currentStock: Number(r.currentStock),
        minQty: Number(r.minQty),
        deficit: Number(r.deficit),
      })),
      recentMovements,
      topMovedMaterials: topMoved.map(r => ({
        ...r,
        totalQuantityMoved: Number(r.totalQuantityMoved),
        totalMovements: Number(r.totalMovements),
      })),
      stockTurnoverKPIs,
    };
  },
};
