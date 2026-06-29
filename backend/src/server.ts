import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import onboardingRoutes from './routes/onboardingRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import { onboardingWorker } from './workers/onboardingWorker';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const app: Application = express();

const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';

// Middlewares Globales
app.use(
  cors({
    origin: allowedOrigin,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());

// Inyección de rutas
app.use('/api', onboardingRoutes);
app.use('/api', analyticsRoutes);

/**
 * Endpoint de monitoreo operativo (Health Check)
 */
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`[🚀 Onboarding Server]: Servicio Express inicializado en el puerto ${PORT}`);
  //Encender el worker al iniciar el server.
  onboardingWorker.start();
});
