import { Router } from 'express';
import AppController from '../controllers/AppController';

const router = Router();

const appController = new AppController();

router.get('/status', appController.getStatus);

router.get('/stats', appController.getStats);

export default router;
