-- ==============================================================================
-- GERENCIA ODONTO - CONSULTÓRIO ODONTOLÓGICO INDIVIDUAL (DENTISTA AUTÔNOMO)
-- SISTEMA ENXUTO, RÁPIDO E FUNCIONAL: DENTISTA (TITULAR) + RECEPÇÃO
-- ==============================================================================

-- 1. EXTENSÕES DO POSTGRESQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist"; -- Restrição direta de conflito de horário na agenda
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TIPOS ENUMERADOS
CREATE TYPE user_role AS ENUM (
    'DENTIST',      -- Dentista Titular / Administrador (Acesso total)
    'RECEPTIONIST'  -- Recepção (Agenda, cadastro, recebimentos, WhatsApp)
);

CREATE TYPE appointment_status AS ENUM (
    'SCHEDULED',
    'CONFIRMED',
    'WAITING_ROOM',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
    'NO_SHOW'
);

CREATE TYPE tooth_surface AS ENUM (
    'MESIAL',
    'DISTAL',
    'OCCLUSAL_INCISAL',
    'VESTIBULAR',
    'LINGUAL_PALATAL',
    'GENERAL_TOOTH'
);

CREATE TYPE dental_condition AS ENUM (
    'HEALTHY',
    'CARIES',
    'RESTORATION_RESIN',
    'RESTORATION_AMALGAM',
    'CROWN',
    'PROSTHESIS_FIXED',
    'PROSTHESIS_REMOVABLE',
    'ENDODONTIC_TREATED',
    'ENDODONTIC_NEEDED',
    'IMPLANT',
    'MISSING_TOOTH',
    'EXTRACTION_INDICATED',
    'SEALANT',
    'FRACTURE',
    'EROSION'
);

CREATE TYPE condition_layer AS ENUM (
    'INITIAL_STATE',   -- Diagnóstico inicial
    'TREATMENT_PLAN',  -- Proposto no orçamento
    'COMPLETED'        -- Executado
);

CREATE TYPE budget_status AS ENUM (
    'DRAFT',
    'APPROVED',
    'REJECTED',
    'COMPLETED'
);

CREATE TYPE lab_order_status AS ENUM (
    'SENT',
    'IN_PRODUCTION',
    'TRY_IN_STAGE',
    'READY_FOR_CEMENTATION',
    'COMPLETED',
    'CANCELLED'
);

CREATE TYPE audit_action AS ENUM (
    'READ',
    'CREATE',
    'UPDATE',
    'DELETE',
    'SIGN'
);

-- ==============================================================================
-- 3. PERFIL DO CONSULTÓRIO / DENTISTA AUTÔNOMO
-- ==============================================================================

CREATE TABLE clinic_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dentist_name VARCHAR(255) NOT NULL,       -- Ex: "Dra. Juliana Mendes"
    cro_uf VARCHAR(2) NOT NULL,               -- Ex: "SP"
    cro_number VARCHAR(20) NOT NULL,          -- Ex: "123456"
    cpf_cnpj VARCHAR(14) NOT NULL,            -- CPF do autônomo (Carnê-Leão) ou CNPJ
    trade_name VARCHAR(255),                  -- Nome do Consultório (Ex: "Consultório Odontológico Dra. Juliana")
    phone VARCHAR(20) NOT NULL,
    whatsapp VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    address JSONB DEFAULT '{
        "street": "",
        "number": "",
        "complement": "",
        "neighborhood": "",
        "city": "",
        "state": "",
        "zip_code": ""
    }'::jsonb,
    settings JSONB NOT NULL DEFAULT '{
        "currency": "BRL",
        "appointment_duration_default_min": 30,
        "whatsapp_auto_reminder": true,
        "post_op_reminder_hours": 24
    }'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Usuários: Dentista Titular e Recepcionista
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 4. PACIENTES E ANAMNESE (COM ALERTAS MÉDICOS CRÍTICOS)
-- ==============================================================================

CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    cpf VARCHAR(11) NOT NULL UNIQUE,
    rg VARCHAR(20),
    birth_date DATE NOT NULL,
    gender VARCHAR(20),
    phone VARCHAR(20) NOT NULL,
    whatsapp VARCHAR(20),
    email VARCHAR(255),
    address JSONB DEFAULT '{}'::jsonb,
    -- Alertas para exibição imediata no prontuário (Badges Vermelhos)
    medical_alerts JSONB NOT NULL DEFAULT '{
        "hypertension": false,
        "diabetes": false,
        "anticoagulant_use": false,
        "drug_allergies": [],
        "anesthetic_allergies": [],
        "critical_observations": null
    }'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_patients_name ON patients(full_name);
CREATE INDEX idx_patients_cpf ON patients(cpf);

-- ==============================================================================
-- 5. AGENDA DIRETA (CONSULTÓRIO ÚNICO - ANTI-CONFLITO TOTAL)
-- ==============================================================================

CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    time_slot TSTZRANGE NOT NULL, -- Horário de início e término contínuos
    status appointment_status NOT NULL DEFAULT 'SCHEDULED',
    procedures_summary TEXT,      -- O que será feito (ex: "Restauração dente 16 + Limpeza")
    estimated_duration_min INT NOT NULL DEFAULT 30 CHECK (estimated_duration_min > 0),
    notes TEXT,
    cancellation_reason TEXT,
    whatsapp_notification_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- RESTRIÇÃO DIRETA: Como há apenas 1 dentista e 1 cadeira, nunca pode haver 2 consultas no mesmo horário
    CONSTRAINT no_appointment_overlap EXCLUDE USING gist (
        time_slot WITH &&
    ) WHERE (status NOT IN ('CANCELLED', 'NO_SHOW'))
);

CREATE INDEX idx_appointments_range ON appointments USING gist(time_slot);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);

-- Encaixes e Fila de Retorno
CREATE TABLE waitlist_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    preferred_days VARCHAR(50), -- Ex: "Terças e Quintas"
    preferred_period VARCHAR(20), -- "Manhã" ou "Tarde"
    notes TEXT,
    is_fulfilled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 6. PRONTUÁRIO ELETRÔNICO, EVOLUÇÕES & IMUTABILIDADE CFM/CFO
-- ==============================================================================

CREATE TABLE clinical_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    record_type VARCHAR(50) NOT NULL, -- 'EVOLUTION', 'ANAMNESIS', 'SURGERY'
    soap_notes TEXT NOT NULL,         -- Evolução do atendimento clínico
    is_signed BOOLEAN NOT NULL DEFAULT FALSE,
    signed_at TIMESTAMPTZ,
    signature_hash_sha256 VARCHAR(64),
    pades_signature_token TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Adendos: Retificações legais em registros assinados
CREATE TABLE clinical_record_addenda (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinical_record_id UUID NOT NULL REFERENCES clinical_records(id) ON DELETE RESTRICT,
    justification TEXT NOT NULL,
    addendum_text TEXT NOT NULL,
    signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    signature_hash_sha256 VARCHAR(64) NOT NULL
);

-- Bloqueia alteração/exclusão de registros assinados
CREATE OR REPLACE FUNCTION enforce_signed_record_immutability()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.is_signed = TRUE THEN
        RAISE EXCEPTION 'COMPLIANCE CFM/CFO: Registros clínicos assinados são imutáveis. Utilize adendos para correções.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_clinical_record_immutability
BEFORE UPDATE OR DELETE ON clinical_records
FOR EACH ROW
EXECUTE FUNCTION enforce_signed_record_immutability();

-- Receitas (Comum e Controle Especial), Atestados e TCLE
CREATE TABLE clinical_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL, -- 'PRESCRIPTION', 'CERTIFICATE', 'TCLE'
    title VARCHAR(255) NOT NULL,
    content_html TEXT NOT NULL,
    is_signed BOOLEAN NOT NULL DEFAULT FALSE,
    signature_hash_sha256 VARCHAR(64),
    signed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 7. ODONTOGRAMA (FDI ISO 3950 & 5 FACES)
-- ==============================================================================

CREATE TABLE odontograms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    version_number INT NOT NULL DEFAULT 1,
    title VARCHAR(100) NOT NULL DEFAULT 'Odontograma Geral',
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(patient_id, version_number)
);

CREATE TABLE odontogram_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    odontogram_id UUID NOT NULL REFERENCES odontograms(id) ON DELETE CASCADE,
    tooth_number INT NOT NULL, -- 11-48 ou 51-85 (FDI)
    surface tooth_surface NOT NULL,
    condition dental_condition NOT NULL,
    layer condition_layer NOT NULL,
    notes TEXT,
    estimated_cost_cents INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_odontogram_items_search ON odontogram_items(odontogram_id, tooth_number, layer);

-- Periodontograma Básico (Sondagem e Sangramento)
CREATE TABLE periodontograms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    exam_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    sites_data JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array compacto com medidas por dente
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Imagens e Radiografias do Paciente
CREATE TABLE clinical_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL, -- 'PANORAMICA', 'PERIAPICAL', 'FOTO'
    s3_key VARCHAR(500) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    description TEXT,
    taken_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 8. ORÇAMENTOS & LIVRO CAIXA (CARNÊ-LEÃO / DMED)
-- ==============================================================================

CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    odontogram_id UUID REFERENCES odontograms(id) ON DELETE SET NULL,
    budget_number SERIAL,
    status budget_status NOT NULL DEFAULT 'DRAFT',
    gross_total_cents INT NOT NULL DEFAULT 0,
    discount_cents INT NOT NULL DEFAULT 0,
    net_total_cents INT NOT NULL DEFAULT 0,
    valid_until DATE NOT NULL,
    approved_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE budget_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    odontogram_item_id UUID REFERENCES odontogram_items(id) ON DELETE SET NULL,
    procedure_name VARCHAR(255) NOT NULL,
    tooth_number INT,
    surface tooth_surface,
    quantity INT NOT NULL DEFAULT 1,
    unit_price_cents INT NOT NULL,
    final_price_cents INT NOT NULL,
    is_approved BOOLEAN NOT NULL DEFAULT FALSE
);

-- Livro Caixa do Consultório: Entradas de Pacientes e Saídas do Consultório
CREATE TABLE cashbook_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id UUID REFERENCES budgets(id) ON DELETE SET NULL,
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
    category VARCHAR(100) NOT NULL, -- 'PROCEDIMENTO', 'DENTAL_MATERIAL', 'PROTETICO', 'ALUGUEL_LUZ', 'OUTROS'
    description TEXT NOT NULL,
    amount_cents INT NOT NULL,
    payment_method VARCHAR(50), -- 'PIX', 'CREDIT_CARD', 'DEBIT_CARD', 'CASH'
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    dmed_deductible BOOLEAN NOT NULL DEFAULT TRUE, -- Para emissão do relatório DMED / Carnê-Leão
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 9. GESTÃO DE PROTÉTICOS (LABORATÓRIO EXTERNO)
-- ==============================================================================

CREATE TABLE prosthetic_work_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    lab_name VARCHAR(255) NOT NULL,
    tooth_number INT NOT NULL,
    vita_shade VARCHAR(10) NOT NULL,      -- Cor VITA (Ex: A2, Bleach)
    material_type VARCHAR(100) NOT NULL,  -- Zircônia, E-Max, Provisório
    work_description TEXT NOT NULL,
    status lab_order_status NOT NULL DEFAULT 'SENT',
    sent_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_try_in_date DATE,
    final_delivery_date DATE,
    cost_cents INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 10. ESTOQUE ESSENCIAL DO CONSULTÓRIO (LOTES E VALIDADE)
-- ==============================================================================

CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,     -- Ex: "Resina Z350 XT A2", "Lidocaína 2% com Epi"
    category VARCHAR(100) NOT NULL,
    unit VARCHAR(20) NOT NULL,      -- "TUBETE", "SERINGA", "CX"
    minimum_stock INT NOT NULL DEFAULT 2,
    current_stock INT NOT NULL DEFAULT 0,
    batch_number VARCHAR(100),
    expiration_date DATE,           -- Alerta preditivo de validade
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 11. AUDITORIA LGPD (APPEND-ONLY)
-- ==============================================================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    action audit_action NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID NOT NULL,
    ip_address INET,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Imutabilidade do Log de Auditoria
CREATE OR REPLACE FUNCTION prevent_audit_tampering()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'SEGURANÇA: Logs de auditoria são imutáveis.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_logs_immutable
BEFORE UPDATE OR DELETE ON audit_logs
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_tampering();
