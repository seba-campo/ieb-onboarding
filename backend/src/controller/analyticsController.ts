import { Request, Response } from 'express';
import { analyticsRepository } from '../repository/analyticsRepository';
import { logger } from '../utils/logger';

export const analyticsController = {
  async streamDashboard(req: Request, res: Response) {
    // Cabeceras obligatorias para activar Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.write('data: {"connected": true}\n\n');

    // Funcion: buscar métricas y empujarlas al cliente
    const sendMetrics = async () => {
      try {
        const metrics = await analyticsRepository.getDashboardMetrics();
        res.write(`data: ${JSON.stringify(metrics)}\n\n`);
      } catch (error) {
        logger.error('SSE: falló el envío de métricas', { error: String(error) });
      }
    };

    await sendMetrics();

    // Establecer un intervalo de actualización recurrente (cada 3 segundos)
    const intervalId = setInterval(sendMetrics, 3000);

    // CRÍTICO: Detectar si el usuario cerró la pestaña del Dashboard para limpiar la memoria
    req.on('close', () => {
      clearInterval(intervalId);
      logger.info('SSE: cliente desconectado del dashboard stream');
      res.end();
    });
  },
};
