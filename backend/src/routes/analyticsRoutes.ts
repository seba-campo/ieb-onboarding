import { Router } from 'express';
import { analyticsController } from '../controller/analyticsController';

const router = Router();

/**
 * @route GET /api/dashboard/stream
 * @desc Canal de tiempo real unidireccional (SSE) para nutrir al panel operativo
 */
router.get('/dashboard/stream', analyticsController.streamDashboard);

export default router;
