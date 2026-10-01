/**
 * Utilitários de manipulação e normalização de datas no formato brasileiro e ISO.
 */

export const normalizeDateToYMD = (dateStr?: string): string => {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();
  if (trimmed.includes('-')) {
    return trimmed.split('T')[0];
  }
  if (trimmed.includes('/')) {
    const parts = trimmed.split(' ')[0].split('/');
    if (parts.length === 3) {
      const [d, m, y] = parts;
      const fullYear = y.length === 2 ? `20${y}` : y;
      return `${fullYear}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
  }
  return trimmed;
};

export const formatYMDToBR = (ymd?: string): string => {
  if (!ymd) return '';
  if (ymd.includes('-')) {
    const parts = ymd.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }
  return ymd;
};
