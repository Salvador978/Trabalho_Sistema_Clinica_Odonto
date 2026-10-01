import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { logger } from './logger.js';
import { initDatabase } from './db.js';
import { configureAutoBackup } from './services/autoBackup.js';
import { authRouter } from './routes/authRoutes.js';
import { patientRouter } from './routes/patientRoutes.js';
import { documentRouter } from './routes/documentRoutes.js';
import { clinicalRouter } from './routes/clinicalRoutes.js';
import { scheduleRouter } from './routes/scheduleRoutes.js';
import { financialRouter } from './routes/financialRoutes.js';
import { settingsRouter } from './routes/settingsRoutes.js';
import { auxRouter } from './routes/auxRoutes.js';

const app = express();
const PORT = process.env.PORT || 3001;
app.set('trust proxy', 1);

// Inicializa banco de dados SQLite e tabelas estruturadas
initDatabase();

// Configura o agendador de backup automático em segundo plano
configureAutoBackup();

// Middlewares essenciais de segurança e cabeçalhos HTTP (XSS, Clickjacking, MIME sniffing)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false
}));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' })); // Suporte para termos assinados, vetores e imagens radiográficas

// Rate limiting de proteção (DDoS e Brute Force)
const globalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Limite de requisições excedido. Tente novamente mais tarde.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas de autenticação. Tente novamente em 15 minutos.' }
});

app.use('/api/', globalApiLimiter);
app.use('/api/auth/', authLimiter);

// Logger de requisições
app.use((req, _res, next) => {
  logger.debug({ method: req.method, url: req.url, ip: req.ip }, 'Requisição recebida');
  next();
});

// Rotas da API
app.use('/api/auth', authRouter);
app.use('/api/patients', patientRouter);
app.use('/api/documents', documentRouter);
app.use('/api/clinical', clinicalRouter);
app.use('/api/schedule', scheduleRouter);
app.use('/api/financial', financialRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/aux', auxRouter);

// Middleware global de tratamento de erros (previne leak de stack trace)
app.use((err: any, _req: import('express').Request, res: import('express').Response, _next: import('express').NextFunction) => {
  logger.error({ err }, 'Erro não tratado no servidor');
  res.status(err.status || 500).json({
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Ocorreu um erro inesperado'
  });
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'Gerencia Odonto API',
    database: 'SQLite (WAL Mode)',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  logger.info(`🦷 Gerencia Odonto API rodando em http://localhost:${PORT}`);
});

export default app;
