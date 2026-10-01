import fs from 'node:fs';
import path from 'node:path';
import { db, DB_PATH } from '../db.js';

export function configureAutoBackup() {
  const BACKUP_DIR = path.resolve('./backups');

  // Garante que a pasta de backups exista
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const runBackup = () => {
    try {
      // 1. Força a consolidação do cache WAL no arquivo principal .db
      db.exec('PRAGMA wal_checkpoint(TRUNCATE);');

      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10);
      const timeStr = `${String(now.getHours()).padStart(2, '0')}h${String(now.getMinutes()).padStart(2, '0')}`;
      const fileName = `gerencia_odonto_auto_${dateStr}_${timeStr}.db`;
      const targetPath = path.join(BACKUP_DIR, fileName);

      // 2. Copia o arquivo físico
      fs.copyFileSync(DB_PATH, targetPath);
      console.log(`[AutoBackup] Backup automático gerado com sucesso: ${fileName}`);

      // 3. Limpeza automática: retém apenas os últimos 14 backups para economizar disco
      const files = fs.readdirSync(BACKUP_DIR)
        .filter((f) => f.endsWith('.db'))
        .map((f) => ({ name: f, time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime() }))
        .sort((a, b) => b.time - a.time);

      if (files.length > 14) {
        files.slice(14).forEach((file) => {
          try {
            fs.unlinkSync(path.join(BACKUP_DIR, file.name));
          } catch (delErr) {
            console.error('[AutoBackup] Erro ao remover backup antigo:', delErr);
          }
        });
      }
    } catch (error) {
      console.error('[AutoBackup] Falha ao gerar cópia de segurança:', error);
    }
  };

  // Executa uma cópia a cada 4 horas durante o expediente
  const FOUR_HOURS = 4 * 60 * 60 * 1000;
  setInterval(runBackup, FOUR_HOURS);

  // Executa também um backup inicial após 30 segundos de inicialização
  setTimeout(runBackup, 30_000);
}
