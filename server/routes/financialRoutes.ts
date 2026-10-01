import { Router, Response } from 'express';
import { db } from '../db.js';
import { authMiddleware, requireRole, AuthenticatedRequest, logAudit } from '../auth.js';

export const financialRouter = Router();

financialRouter.use(authMiddleware);

// GET /api/financial/transactions — Lista transações do Livro Caixa
financialRouter.get('/transactions', (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.auth!.clinicId;
  const dateFilter = req.query.date as string | undefined;

  let query = 'SELECT * FROM transactions WHERE clinic_id = ?';
  const params: any[] = [clinicId];

  if (dateFilter) {
    query += ' AND date = ?';
    params.push(dateFilter);
  }

  query += ' ORDER BY date DESC, time DESC';

  const rows = db.prepare(query).all(...params) as any[];

  const txs = rows.map((r) => {
    let payments = [];
    try {
      payments = JSON.parse(r.payments_json || '[]');
    } catch {}

    return {
      id: r.id,
      date: r.date,
      time: r.time,
      type: r.type,
      category: r.category,
      desc: r.desc,
      amount: Number(r.amount),
      method: r.method,
      dmed: Boolean(r.dmed),
      patientName: r.patient_name,
      patientCpf: r.patient_cpf,
      payerCpf: r.payer_cpf,
      receiptNumber: r.receipt_number,
      idempotencyKey: r.idempotency_key,
      payments
    };
  });

  res.json(txs);
});

// POST /api/financial/transactions — Lança receita ou despesa com chave de idempotência e validação de permissão
financialRouter.post('/transactions', (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.auth!.clinicId;
  const userRole = req.auth!.role;
  const data = req.body;

  // Regra de Negócio: Lançamento de DESPESA é restrito ao Dentista
  if (data.type === 'EXPENSE' && userRole !== 'DENTIST') {
    return res.status(403).json({
      error: 'Acesso negado. Apenas o Cirurgião-Dentista tem permissão para lançar despesas no Livro Caixa.'
    });
  }

  if (!data.date || !data.amount || !data.type) {
    return res.status(400).json({ error: 'date, amount e type são obrigatórios' });
  }

  // Idempotência: evita lançamentos duplicados caso ocorra duplo clique no checkout
  if (data.idempotencyKey) {
    const existing = db.prepare('SELECT * FROM transactions WHERE clinic_id = ? AND idempotency_key = ?').get(
      clinicId,
      data.idempotencyKey
    ) as any;

    if (existing) {
      let payments = [];
      try { payments = JSON.parse(existing.payments_json || '[]'); } catch {}
      return res.status(200).json({
        id: existing.id,
        date: existing.date,
        time: existing.time,
        type: existing.type,
        category: existing.category,
        desc: existing.desc,
        amount: Number(existing.amount),
        method: existing.method,
        dmed: Boolean(existing.dmed),
        patientName: existing.patient_name,
        patientCpf: existing.patient_cpf,
        payerCpf: existing.payer_cpf,
        receiptNumber: existing.receipt_number,
        idempotencyKey: existing.idempotency_key,
        payments,
        idempotentReplay: true
      });
    }
  }

  const id = data.id || `tx_${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const time = data.time || now.split('T')[1].substring(0, 5);

  const stmt = db.prepare(`
    INSERT INTO transactions (
      id, clinic_id, date, time, type, category, desc, amount,
      method, dmed, patient_name, patient_cpf, payer_cpf, payments_json,
      receipt_number, idempotency_key, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    clinicId,
    data.date,
    time,
    data.type,
    data.category || 'Outros',
    data.desc || '',
    Number(data.amount),
    data.method || 'PIX',
    data.dmed ? 1 : 0,
    data.patientName || null,
    data.patientCpf || null,
    data.payerCpf || null,
    JSON.stringify(data.payments || []),
    data.receiptNumber || null,
    data.idempotencyKey || null,
    now
  );

  logAudit(clinicId, userRole, 'TRANSACTION_RECORDED', 'FINANCE', id, {
    type: data.type,
    amount: data.amount,
    method: data.method
  }, req.ip);

  res.status(201).json({
    id,
    date: data.date,
    time,
    type: data.type,
    category: data.category || 'Outros',
    desc: data.desc || '',
    amount: Number(data.amount),
    method: data.method || 'PIX',
    dmed: Boolean(data.dmed),
    patientName: data.patientName || null,
    patientCpf: data.patientCpf || null,
    payerCpf: data.payerCpf || null,
    receiptNumber: data.receiptNumber || null,
    idempotencyKey: data.idempotencyKey || null,
    payments: data.payments || []
  });
});

// DELETE /api/financial/transactions/:id — Excluir transação (Restrito ao Dentista)
financialRouter.delete('/transactions/:id', requireRole('DENTIST'), (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.auth!.clinicId;
  const userRole = req.auth!.role;
  const id = String(req.params.id);

  const existing = db.prepare('SELECT * FROM transactions WHERE id = ? AND clinic_id = ?').get(id, clinicId) as any;
  if (!existing) {
    return res.status(404).json({ error: 'Transação não encontrada' });
  }

  logAudit(clinicId, userRole, 'TRANSACTION_DELETED', 'FINANCE', id, {
    amount: existing.amount,
    desc: existing.desc
  }, req.ip);

  db.prepare('DELETE FROM transactions WHERE id = ? AND clinic_id = ?').run(id, clinicId);

  res.json({ success: true });
});

// GET /api/financial/cashier-closings — Histórico de fechamentos diários
financialRouter.get('/cashier-closings', (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.auth!.clinicId;
  const dateFilter = req.query.date as string | undefined;

  let query = 'SELECT * FROM cashier_closings WHERE clinic_id = ?';
  const params: any[] = [clinicId];

  if (dateFilter) {
    query += ' AND closing_date = ?';
    params.push(dateFilter);
  }

  query += ' ORDER BY closing_date DESC';

  const rows = db.prepare(query).all(...params) as any[];

  const closings = rows.map((r) => {
    let breakdown = {};
    try { breakdown = JSON.parse(r.breakdown_json || '{}'); } catch {}
    return {
      id: r.id,
      closingDate: r.closing_date,
      totalIncome: Number(r.total_income),
      totalExpense: Number(r.total_expense),
      balance: Number(r.balance),
      closedBy: r.closed_by,
      closedAt: r.closed_at,
      breakdown
    };
  });

  res.json(closings);
});

// POST /api/financial/cashier-closings — Registrar fechamento de caixa diário
financialRouter.post('/cashier-closings', (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.auth!.clinicId;
  const userRole = req.auth!.role;
  const { closingDate, totalIncome, totalExpense, balance, breakdown } = req.body;

  if (!closingDate) {
    return res.status(400).json({ error: 'closingDate é obrigatório' });
  }

  const id = `close_${clinicId}_${closingDate}`;
  const closedBy = userRole === 'DENTIST' ? req.auth!.dentistName : 'Recepção';
  const now = new Date().toISOString();

  // Substitui ou insere fechamento do dia (upsert)
  db.prepare(`
    INSERT INTO cashier_closings (
      id, clinic_id, closing_date, total_income, total_expense, balance, breakdown_json, closed_by, closed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      total_income = excluded.total_income,
      total_expense = excluded.total_expense,
      balance = excluded.balance,
      breakdown_json = excluded.breakdown_json,
      closed_by = excluded.closed_by,
      closed_at = excluded.closed_at
  `).run(
    id,
    clinicId,
    closingDate,
    Number(totalIncome || 0),
    Number(totalExpense || 0),
    Number(balance || 0),
    JSON.stringify(breakdown || {}),
    closedBy,
    now
  );

  logAudit(clinicId, userRole, 'CASHIER_CLOSED', 'FINANCE', id, { closingDate, balance }, req.ip);

  res.status(200).json({
    id,
    closingDate,
    totalIncome,
    totalExpense,
    balance,
    closedBy,
    closedAt: now,
    breakdown
  });
});
