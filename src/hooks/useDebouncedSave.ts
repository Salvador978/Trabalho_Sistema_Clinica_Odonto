import { useEffect } from 'react';
import { saveToStorage, STORAGE_KEYS } from '../services/storage';

export function useDebouncedSave<T>(
  key: keyof typeof STORAGE_KEYS,
  data: T,
  clinicId?: string,
  delay: number = 800
): void {
  useEffect(() => {
    if (!clinicId) return;
    const handler = setTimeout(() => {
      saveToStorage(key, data, clinicId);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [key, data, clinicId, delay]);
}

