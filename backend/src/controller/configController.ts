import { Request, Response } from 'express';
import { configRepository } from '../repository/configRepository';
import { logger } from '../utils/logger';

export const configController = {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const configs = await configRepository.getAllConfigs();
      res.status(200).json({ configs });
    } catch (err) {
      logger.error('configController.getAll falló', { correlationId: req.correlationId, error: String(err) });
      res.status(500).json({ error: 'Error al obtener configuraciones' });
    }
  },

  async update(req: Request, res: Response): Promise<void> {
    const key = req.params.key as string;
    const { value } = req.body;

    if (value === undefined || value === null || String(value).trim() === '') {
      res.status(400).json({ error: 'El campo value es requerido' });
      return;
    }

    const VALID_KEYS = [
      'LOW_CONVERSION_RATE',
      'HIGH_STEP_ERROR_RATE_PCT',
      'STUCK_MIN_COUNT',
      'ERROR_SPIKE_COUNT',
      'COOLDOWN_MS',
      'CONVERSION_MIN_SAMPLE',
    ];

    if (!VALID_KEYS.includes(key)) {
      res.status(400).json({ error: `Clave inválida. Claves válidas: ${VALID_KEYS.join(', ')}` });
      return;
    }

    const numeric = Number(value);
    if (isNaN(numeric) || numeric < 0) {
      res.status(400).json({ error: 'El valor debe ser un número positivo' });
      return;
    }

    try {
      await configRepository.setConfig(key, String(numeric));
      res.status(200).json({ key, value: String(numeric) });
    } catch (err) {
      logger.error('configController.update falló', { correlationId: req.correlationId, key, error: String(err) });
      res.status(500).json({ error: 'Error al actualizar configuración' });
    }
  },
};
