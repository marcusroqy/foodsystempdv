import { Router } from 'express';
import { NotificationController } from '../controllers/NotificationController';
import { authMiddleware } from '../middlewares/authMiddleware';

export const notificationRoutes = Router();
const notificationController = new NotificationController();

notificationRoutes.post('/subscribe', authMiddleware, notificationController.subscribe);
notificationRoutes.post('/test', authMiddleware, notificationController.testSend);
