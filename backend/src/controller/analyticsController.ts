import { Request, Response } from 'express';
import { analyticsRepository } from '../repository/analyticsRepository';

export const analyticsController = {
  /**
   * Mantiene una conexión HTTP persistente y unidireccional con el Dashboard de React
   */
  async streamDashboard(req: Request, res: Response) {
    // Cabeceras obligatorias para activar Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Desactivar el buffering en proxies como Nginx o Cloudflare si existieran
    res.setHeader('X-Accel-Buffering', 'no');

    // Enviar un primer ping de conexión exitosa
    res.write('data: {"connected": true}\n\n');

    // Función encargada de buscar métricas y empujarlas al cliente
    const sendMetrics = async () => {
      try {
        const metrics = await analyticsRepository.getDashboardMetrics();
        res.write(`data: ${JSON.stringify(metrics)}\n\n`);
      } catch (error) {
        console.error('[🚨 SSE Stream Error]: Falló el envío de métricas:', error);
      }
    };

    await sendMetrics();

    // Establecer un intervalo de actualización recurrente (cada 3 segundos)
    const intervalId = setInterval(sendMetrics, 3000);

    // CRÍTICO: Detectar si el usuario cerró la pestaña del Dashboard para limpiar la memoria
    req.on('close', () => {
      clearInterval(intervalId);
      console.log('[🔌 SSE]: Cliente desconectado del dashboard stream.');
      res.end();
    });
  },
};
