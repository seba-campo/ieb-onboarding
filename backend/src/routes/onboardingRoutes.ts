import { Router } from 'express';
import { onboardingController } from '../controller/onboardingController';

const router = Router();

/**
 * @route POST /api/onboardings
 * @desc Iniciar un nuevo proceso de onboarding masivo
 */
router.post('/onboardings', onboardingController.create);

/**
 * @route GET /api/onboardings/:id
 * @desc Consultar el estado transaccional (utilizado por el polling de la UI del cliente)
 */
router.get('/onboardings/:id', onboardingController.getStatus);

export default router;