/**
 * FORMATAÇÃO CANÔNICA DE IDENTIFICAÇÃO VISUAL DA CLÍNICA & DENTISTA
 * Garante que tanto no celular quanto no computador o cabeçalho, gaveta e relatórios
 * exibam exatamente a mesma nomenclatura com alinhamento responsivo perfeito.
 */

export function getCanonicalClinicName(settings?: { clinicName?: string; dentistName?: string }): string {
  if (!settings) return 'Consultório Odontológico';
  const clinic = settings.clinicName?.trim() || '';
  const dentist = settings.dentistName?.trim() || '';

  // Se a clínica estiver com o nome padrão antigo ou vazio e houver nome de dentista personalizado
  if (!clinic || clinic === 'Consultório Odontológico' || clinic === 'Consultório Odontológico Dra. Juliana Mendes') {
    if (dentist && dentist !== 'Dra. Juliana Mendes') {
      const prefix = dentist.match(/^(Dr|Dra)\.?/i) ? '' : 'Dr(a). ';
      return `Consultório Odontológico ${prefix}${dentist}`;
    }
    return clinic || 'Consultório Odontológico';
  }

  return clinic;
}

export function getCanonicalDentistName(dentistName?: string): string {
  if (!dentistName) return '';
  const trimmed = dentistName.trim();
  if (trimmed.match(/^(Dr|Dra)\.?/i)) {
    return trimmed;
  }
  return `Dr(a). ${trimmed}`;
}

export function getCanonicalCro(cro?: string): string {
  if (!cro) return '';
  const trimmed = cro.trim();
  return trimmed.toUpperCase().startsWith('CRO') ? trimmed : `CRO ${trimmed}`;
}
