import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

// Validador genérico de Middleware Express
export const validateBody = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errList = (result.error as any).issues || (result.error as any).errors || [];
      return res.status(400).json({
        error: 'Dados da requisição inválidos',
        details: errList.map((e: any) => ({
          path: Array.isArray(e.path) ? e.path.join('.') : String(e.path || ''),
          message: e.message
        }))
      });
    }
    req.body = result.data;
    next();
  };
};

// Autenticação
export const LoginSchema = z.object({
  login: z.string().min(1, 'Login é obrigatório'),
  password: z.string().min(1, 'Senha é obrigatória')
});

export const ElevatePinSchema = z.object({
  pin: z.string().regex(/^\d{4}$/, 'O PIN deve conter exatamente 4 dígitos numéricos')
});

export const ChangePinSchema = z.object({
  newPin: z.string().regex(/^\d{4}$/, 'O novo PIN deve conter exatamente 4 dígitos numéricos')
});

// Pacientes
export const MedicalAlertsSchema = z.object({
  hypertension: z.boolean().optional(),
  diabetes: z.boolean().optional(),
  anticoagulant: z.boolean().optional(),
  allergicPenicillin: z.boolean().optional(),
  allergicAnesthetics: z.boolean().optional(),
  allergicDipyroneNSAIDs: z.boolean().optional(),
  pregnantOrLactating: z.boolean().optional(),
  allergies: z.array(z.string()).optional()
}).optional();

export const PatientSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'Nome deve conter pelo menos 2 caracteres'),
  cpf: z.string().optional(),
  rg: z.string().optional(),
  rgIssuer: z.string().optional(),
  birthDate: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  profession: z.string().optional(),
  phone: z.string().min(8, 'Telefone inválido'),
  secondaryPhone: z.string().optional(),
  emergencyContactName: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  cep: z.string().optional(),
  address: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  medicalAlerts: MedicalAlertsSchema,
  status: z.enum(['IN_TREATMENT', 'COMPLETED', 'ARCHIVED']).optional(),
  notes: z.string().optional(),
  treatmentItems: z.array(z.any()).optional(),
  pendingBudgetAmount: z.number().optional(),
  version: z.number().int().optional()
});

// Agendamento
export const AppointmentSchema = z.object({
  id: z.string().optional(),
  patientId: z.string().optional(),
  patientName: z.string().min(1, 'Nome do paciente é obrigatório'),
  patientPhone: z.string().optional(),
  phone: z.string().optional(),
  date: z.string().min(1, 'Data é obrigatória'),
  time: z.string().min(1, 'Horário é obrigatório'),
  duration: z.string().optional(),
  durationMin: z.number().optional(),
  procedure: z.string().optional(),
  notes: z.string().optional(),
  status: z.string().optional(),
  whatsappStatus: z.string().optional(),
  paid: z.boolean().optional()
});

// Transações
export const TransactionSchema = z.object({
  id: z.string().optional(),
  date: z.string().min(1, 'Data é obrigatória'),
  time: z.string().optional(),
  type: z.enum(['INCOME', 'EXPENSE']),
  category: z.string().optional(),
  desc: z.string().min(1, 'Descrição é obrigatória'),
  amount: z.number().positive('O valor deve ser positivo'),
  method: z.string().optional(),
  dmed: z.boolean().optional(),
  patientName: z.string().optional(),
  patientCpf: z.string().optional(),
  payerCpf: z.string().optional(),
  payments: z.array(z.any()).optional()
});
