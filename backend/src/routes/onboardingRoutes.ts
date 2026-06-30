import { Router } from 'express';
import { onboardingController } from '../controller/onboardingController';

const router = Router();

router.post('/onboardings', onboardingController.create);
router.get('/onboardings', onboardingController.list);
router.get('/onboardings/:id', onboardingController.getStatus);
router.post('/admin/seed', onboardingController.seedBulk);
router.post('/onboardings/:id/pause', onboardingController.pause);
router.post('/onboardings/:id/resume', onboardingController.resume);
router.post('/onboardings/:id/cancel', onboardingController.cancel);
router.post('/onboardings/:id/advance', onboardingController.advance);

export default router;
