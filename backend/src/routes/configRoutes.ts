import { Router } from 'express';
import { configController } from '../controller/configController';

const router = Router();

router.get('/config', configController.getAll);
router.put('/config/:key', configController.update);

export default router;
