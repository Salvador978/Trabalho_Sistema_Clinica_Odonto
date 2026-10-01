import { describe, it, expect } from 'vitest';
import { buildActivePatientFromRecord } from '../patientUtils';
import { Patient } from '../../types/patient';

describe('patientUtils - buildActivePatientFromRecord', () => {
  it('deve mapear corretamente os dados do paciente para a ficha ativa', () => {
    const mockPatient: Patient = {
      id: 'pat_123',
      name: 'Carlos Alberto Silva',
      cpf: '123.456.789-00',
      phone: '(11) 98765-4321',
      birthDate: '1990-05-15',
      gender: 'MALE',
      status: 'IN_TREATMENT',
      medicalAlerts: {
        hypertension: true,
        diabetes: false,
        anticoagulant: false,
        allergicPenicillin: true,
        allergicAnesthetics: false,
        allergicDipyroneNSAIDs: true,
        pregnantOrLactating: false,
        allergies: ['Penicilina', 'Dipirona']
      },
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    };

    const activeInfo = buildActivePatientFromRecord(mockPatient);

    expect(activeInfo.id).toBe('pat_123');
    expect(activeInfo.name).toBe('Carlos Alberto Silva');
    expect(activeInfo.cpf).toBe('123.456.789-00');
    expect(activeInfo.medicalAlerts.hypertension).toBe(true);
    expect(activeInfo.medicalAlerts.diabetes).toBe(false);
    expect(activeInfo.medicalAlerts.allergies).toContain('Penicilina');
    expect(activeInfo.birthDate).toContain('15/05/1990');
  });

  it('deve lidar com alertas médicos vazios ou indefinidos', () => {
    const mockPatient: Patient = {
      id: 'pat_456',
      name: 'Maria Oliveira',
      cpf: '987.654.321-11',
      phone: '(11) 91234-5678',
      birthDate: '1995-10-20',
      gender: 'FEMALE',
      status: 'IN_TREATMENT',
      medicalAlerts: {
        hypertension: false,
        diabetes: false,
        anticoagulant: false,
        allergicPenicillin: false,
        allergicAnesthetics: false,
        allergicDipyroneNSAIDs: false,
        pregnantOrLactating: false,
        allergies: []
      },
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    };

    const activeInfo = buildActivePatientFromRecord(mockPatient);

    expect(activeInfo.medicalAlerts.hypertension).toBe(false);
    expect(activeInfo.medicalAlerts.diabetes).toBe(false);
    expect(activeInfo.medicalAlerts.allergies).toEqual([]);
  });
});
