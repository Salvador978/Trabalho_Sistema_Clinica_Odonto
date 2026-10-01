import { Router, Response } from 'express';
import { db } from '../db.js';
import { authMiddleware, AuthenticatedRequest, logAudit } from '../auth.js';

export const auxRouter = Router();

auxRouter.use(authMiddleware);

// --- AUTOCLAVE & BIOSSEGURANÇA RDC 15 ---

// GET /api/aux/autoclave — Lista ciclos de esterilização
auxRouter.get('/autoclave', (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.auth!.clinicId;

  const rows = db.prepare(`
    SELECT * FROM autoclave_cycles
    WHERE clinic_id = ?
    ORDER BY cycle_date DESC, created_at DESC
  `).all(clinicId) as any[];

  res.json(rows.map((r) => ({
    id: r.id,
    date: r.cycle_date,
    lotNumber: r.lot_number,
    operator: r.operator_name,
    temperature: r.temperature,
    pressure: r.pressure,
    timeMinutes: r.time_minutes,
    chemicalIndicator: Boolean(r.chemical_indicator),
    biologicalIndicator: Boolean(r.biological_indicator),
    status: r.status,
    packageCount: r.package_count,
    notes: r.notes,
    createdAt: r.created_at
  })));
});

// POST /api/aux/autoclave — Grava ciclo de esterilização com rastreabilidade ANVISA RDC 15
auxRouter.post('/autoclave', (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.auth!.clinicId;
  const userRole = req.auth!.role;
  const data = req.body;

  if (!data.lotNumber || !data.operator) {
    return res.status(400).json({ error: 'lotNumber e operator são obrigatórios' });
  }

  const id = data.id || `auto_${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const date = data.date || now.split('T')[0];

  const stmt = db.prepare(`
    INSERT INTO autoclave_cycles (
      id, clinic_id, cycle_date, lot_number, operator_name,
      temperature, pressure, time_minutes, chemical_indicator, biological_indicator,
      status, package_count, notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    clinicId,
    date,
    data.lotNumber,
    data.operator,
    data.temperature || 134,
    data.pressure || 2.1,
    data.timeMinutes || 15,
    data.chemicalIndicator !== false ? 1 : 0,
    data.biologicalIndicator !== false ? 1 : 0,
    data.status || 'APPROVED',
    data.packageCount || 1,
    data.notes || null,
    now
  );

  logAudit(clinicId, userRole, 'AUTOCLAVE_CYCLE_LOGGED', 'BIOSECURITY', id, { lotNumber: data.lotNumber }, req.ip);

  res.status(201).json({
    id,
    date,
    lotNumber: data.lotNumber,
    operator: data.operator,
    status: data.status || 'APPROVED'
  });
});

// --- ORDENS DE PROTÉTICO (LAB) ---

// GET /api/aux/lab-orders — Lista ordens de protético
auxRouter.get('/lab-orders', (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.auth!.clinicId;

  const rows = db.prepare('SELECT id, data_json FROM lab_orders WHERE clinic_id = ? ORDER BY created_at DESC').all(clinicId) as any[];

  const orders = rows.map((r) => {
    try {
      return { id: r.id, ...JSON.parse(r.data_json) };
    } catch {
      return { id: r.id };
    }
  });

  res.json(orders);
});

// POST /api/aux/lab-orders — Salva/atualiza ordem de protético
auxRouter.post('/lab-orders', (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.auth!.clinicId;
  const userRole = req.auth!.role;
  const data = req.body;

  const id = data.id || `lab_${crypto.randomUUID()}`;

  db.prepare(`
    INSERT INTO lab_orders (id, clinic_id, data_json, created_at)
    VALUES (?, ?, ?, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      data_json = excluded.data_json
  `).run(id, clinicId, JSON.stringify(data));

  logAudit(clinicId, userRole, 'LAB_ORDER_SAVED', 'LAB', id, { patient: data.patientName }, req.ip);

  res.json({ id, ...data });
});

// DELETE /api/aux/lab-orders/:id — Exclui ordem de protético
auxRouter.delete('/lab-orders/:id', (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.auth!.clinicId;
  const id = String(req.params.id);

  db.prepare('DELETE FROM lab_orders WHERE id = ? AND clinic_id = ?').run(id, clinicId);
  res.json({ success: true });
});

// --- ESTOQUE (INVENTORY) ---

// GET /api/aux/inventory — Lista itens de estoque
auxRouter.get('/inventory', (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.auth!.clinicId;

  const rows = db.prepare('SELECT id, data_json FROM inventory WHERE clinic_id = ? ORDER BY created_at DESC').all(clinicId) as any[];

  const items = rows.map((r) => {
    try {
      return { id: r.id, ...JSON.parse(r.data_json) };
    } catch {
      return { id: r.id };
    }
  });

  res.json(items);
});

// POST /api/aux/inventory — Salva/atualiza item de estoque
auxRouter.post('/inventory', (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.auth!.clinicId;
  const userRole = req.auth!.role;
  const data = req.body;

  const id = data.id || `inv_${crypto.randomUUID()}`;

  db.prepare(`
    INSERT INTO inventory (id, clinic_id, data_json, created_at)
    VALUES (?, ?, ?, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      data_json = excluded.data_json
  `).run(id, clinicId, JSON.stringify(data));

  logAudit(clinicId, userRole, 'INVENTORY_SAVED', 'INVENTORY', id, { name: data.name }, req.ip);

  res.json({ id, ...data });
});

// DELETE /api/aux/inventory/:id — Exclui item de estoque
auxRouter.delete('/inventory/:id', (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.auth!.clinicId;
  const id = String(req.params.id);

  db.prepare('DELETE FROM inventory WHERE id = ? AND clinic_id = ?').run(id, clinicId);
  res.json({ success: true });
});
