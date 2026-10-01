import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import bcrypt from 'bcryptjs';

const DB_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

export const DB_PATH = path.join(DB_DIR, 'gerencia_odonto.db');
export const db = new DatabaseSync(DB_PATH);

// Ativa WAL mode e foreign keys para desempenho e integridade
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS clinics (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      login TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      dentist_name TEXT NOT NULL,
      dentist_cro TEXT NOT NULL,
      dentist_pin_hash TEXT NOT NULL,
      receptionist_name TEXT DEFAULT 'Recepção',
      phone TEXT,
      email TEXT,
      city TEXT,
      state TEXT,
      address TEXT,
      plan TEXT DEFAULT 'PRO',
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS clinic_settings (
      clinic_id TEXT PRIMARY KEY,
      settings_json TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      clinic_id TEXT NOT NULL,
      name TEXT NOT NULL,
      cpf TEXT,
      rg TEXT,
      rg_issuer TEXT,
      birth_date TEXT,
      gender TEXT,
      profession TEXT,
      phone TEXT NOT NULL,
      secondary_phone TEXT,
      emergency_contact_name TEXT,
      email TEXT,
      cep TEXT,
      address TEXT,
      number TEXT,
      complement TEXT,
      neighborhood TEXT,
      city TEXT,
      state TEXT,
      has_financial_responsible INTEGER DEFAULT 0,
      financial_responsible_name TEXT,
      financial_responsible_cpf TEXT,
      financial_responsible_relationship TEXT,
      medical_alerts_json TEXT,
      status TEXT DEFAULT 'IN_TREATMENT',
      last_appointment_date TEXT,
      notes TEXT,
      treatment_items_json TEXT,
      pending_budget_amount REAL DEFAULT 0,
      version INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      clinic_id TEXT NOT NULL,
      patient_id TEXT,
      patient_name TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      duration_min INTEGER DEFAULT 30,
      status TEXT NOT NULL,
      procedure TEXT,
      notes TEXT,
      dentist_name TEXT,
      dentist_cro TEXT,
      phone TEXT,
      whatsapp_status TEXT DEFAULT 'PENDING',
      is_emergency INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      clinic_id TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT,
      type TEXT NOT NULL,
      category TEXT,
      desc TEXT,
      amount REAL NOT NULL,
      method TEXT,
      dmed INTEGER DEFAULT 0,
      patient_name TEXT,
      patient_cpf TEXT,
      payer_cpf TEXT,
      payments_json TEXT,
      receipt_number TEXT,
      idempotency_key TEXT UNIQUE,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS cashier_closings (
      id TEXT PRIMARY KEY,
      clinic_id TEXT NOT NULL,
      closing_date TEXT NOT NULL,
      total_income REAL DEFAULT 0,
      total_expense REAL DEFAULT 0,
      balance REAL DEFAULT 0,
      breakdown_json TEXT,
      closed_by TEXT,
      closed_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      clinic_id TEXT NOT NULL,
      patient_id TEXT NOT NULL,
      patient_name TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      sha256_hash TEXT,
      signature_base64 TEXT,
      dentist_cro TEXT,
      content_json TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS clinical_evolutions (
      id TEXT PRIMARY KEY,
      clinic_id TEXT NOT NULL,
      patient_id TEXT NOT NULL,
      patient_name TEXT NOT NULL,
      date TEXT NOT NULL,
      dentist_name TEXT NOT NULL,
      dentist_cro TEXT NOT NULL,
      procedure TEXT NOT NULL,
      tooth TEXT,
      text TEXT NOT NULL,
      sterilization_lot TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS odontograms (
      patient_id TEXT PRIMARY KEY,
      clinic_id TEXT NOT NULL,
      findings_json TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS autoclave_cycles (
      id TEXT PRIMARY KEY,
      clinic_id TEXT NOT NULL,
      cycle_date TEXT NOT NULL,
      lot_number TEXT NOT NULL,
      operator_name TEXT NOT NULL,
      temperature REAL,
      pressure REAL,
      time_minutes INTEGER,
      chemical_indicator INTEGER DEFAULT 1,
      biological_indicator INTEGER DEFAULT 1,
      status TEXT DEFAULT 'APPROVED',
      package_count INTEGER DEFAULT 1,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS lab_orders (
      id TEXT PRIMARY KEY,
      clinic_id TEXT NOT NULL,
      data_json TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id TEXT PRIMARY KEY,
      clinic_id TEXT NOT NULL,
      data_json TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clinic_id TEXT NOT NULL,
      user_role TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id TEXT,
      details_json TEXT,
      ip_address TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS pin_failed_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clinic_id TEXT NOT NULL,
      ip_address TEXT,
      attempted_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      applied_at TEXT DEFAULT (datetime('now'))
    );
  `);

  runMigrations();
  seedDefaultClinic();
}

/**
 * SISTEMA AUTOMÁTICO DE MIGRAÇÕES DE BANCO DE DADOS
 */
function runMigrations() {
  const migrations: { name: string; run: () => void }[] = [
    {
      name: '001_create_performance_indexes',
      run: () => {
        db.exec(`
          CREATE INDEX IF NOT EXISTS idx_patients_clinic ON patients(clinic_id);
          CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(clinic_id, name);
          CREATE INDEX IF NOT EXISTS idx_patients_cpf ON patients(clinic_id, cpf);
          CREATE INDEX IF NOT EXISTS idx_appointments_clinic_date ON appointments(clinic_id, date);
          CREATE INDEX IF NOT EXISTS idx_transactions_clinic_date ON transactions(clinic_id, date);
          CREATE INDEX IF NOT EXISTS idx_evolutions_patient ON clinical_evolutions(patient_id);
          CREATE INDEX IF NOT EXISTS idx_documents_patient ON documents(patient_id);
          CREATE INDEX IF NOT EXISTS idx_audit_clinic ON audit_log(clinic_id, created_at);
        `);
      }
    },
    {
      name: '002_add_version_to_patients_table',
      run: () => {
        const columns = db.prepare("PRAGMA table_info(patients)").all() as any[];
        const hasVersion = columns.some((col: any) => col.name === 'version');
        if (!hasVersion) {
          db.exec('ALTER TABLE patients ADD COLUMN version INTEGER DEFAULT 1;');
        }
      }
    },
    {
      name: '003_sanitize_plaintext_pins_in_settings',
      run: () => {
        const rows = db.prepare('SELECT clinic_id, settings_json FROM clinic_settings').all() as any[];
        for (const row of rows) {
          try {
            const parsed = JSON.parse(row.settings_json);
            if (parsed.dentistPin) {
              delete parsed.dentistPin;
              db.prepare('UPDATE clinic_settings SET settings_json = ? WHERE clinic_id = ?').run(
                JSON.stringify(parsed),
                row.clinic_id
              );
            }
          } catch {}
        }
      }
    },
    {
      name: '004_add_anamnesis_columns',
      run: () => {
        const addColIfNotExists = (table: string, col: string, def: string) => {
          const cols = db.prepare(`PRAGMA table_info(${table})`).all() as any[];
          if (!cols.some((c: any) => c.name === col)) {
            db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${def};`);
          }
        };

        addColIfNotExists('patients', 'has_hypertension', 'INTEGER DEFAULT 0');
        addColIfNotExists('patients', 'has_diabetes', 'INTEGER DEFAULT 0');
        addColIfNotExists('patients', 'is_anticoagulated', 'INTEGER DEFAULT 0');
        addColIfNotExists('patients', 'allergies', 'TEXT');
        addColIfNotExists('patients', 'medical_alerts', 'TEXT');
        addColIfNotExists('documents', 'content_hash', 'TEXT');
        addColIfNotExists('documents', 'signature_image', 'TEXT');
      }
    }
  ];

  for (const mig of migrations) {
    const executed = db.prepare('SELECT id FROM migrations WHERE name = ?').get(mig.name);
    if (!executed) {
      try {
        mig.run();
        db.prepare('INSERT INTO migrations (name) VALUES (?)').run(mig.name);
      } catch (err) {
        console.error(`Falha ao executar migração ${mig.name}:`, err);
      }
    }
  }
}

function seedDefaultClinic() {
  const existing = db.prepare('SELECT id FROM clinics WHERE id = ?').get('clinica_odonto');
  if (!existing) {
    const passwordHash = bcrypt.hashSync('senha123', 10);
    const pinHash = bcrypt.hashSync('1234', 10);

    const stmt = db.prepare(`
      INSERT INTO clinics (
        id, name, login, password_hash, dentist_name, dentist_cro,
        dentist_pin_hash, receptionist_name, phone, email, city, state, address, plan, active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      'clinica_odonto',
      'Consultório Odontológico Dra. Juliana Mendes',
      'admin@consultorio.com',
      passwordHash,
      'Dra. Juliana Mendes',
      'CRO-SP 123.456',
      pinHash,
      'Recepção',
      '(11) 98765-4321',
      'admin@consultorio.com',
      'São Paulo',
      'SP',
      'Av. Paulista, 1000 - Cj. 42 - Bela Vista',
      'PRO',
      1,
      '2026-01-01T08:00:00.000Z'
    );

    // Initial default settings (sem PIN em texto plano por conformidade de segurança)
    const defaultSettings = {
      clinicName: 'Consultório Odontológico Dra. Juliana Mendes',
      dentistName: 'Dra. Juliana Mendes',
      dentistCro: 'CRO-SP 123.456',
      clinicCpfCnpj: '',
      clinicAddress: 'Av. Paulista, 1000 - Cj. 42 - Bela Vista',
      clinicPhone: '(11) 98765-4321',
      clinicEmail: 'admin@consultorio.com',
      receptionistName: 'Recepção',
      receptionistPhone: '(11) 98765-4321',
      receptionistShift: 'Comercial (08:00 às 18:00)',
      receptionistNotes: 'Controle de agendamentos e recepção.',
      pixKey: 'admin@consultorio.com',
      pixKeyType: 'EMAIL',
      cardFeeDebit: 1.49,
      cardFeeCreditSight: 3.19,
      cardFeeCreditInstallment: 4.49,
      cardMachineName: 'Maquininha Própria'
    };

    db.prepare('INSERT INTO clinic_settings (clinic_id, settings_json) VALUES (?, ?)').run(
      'clinica_odonto',
      JSON.stringify(defaultSettings)
    );
  }
}
