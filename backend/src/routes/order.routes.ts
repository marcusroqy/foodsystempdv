import { Router } from 'express';
import { OrderController } from '../controllers/OrderController';
import { authMiddleware } from '../middlewares/authMiddleware';

const orderRouter = Router();
const orderController = new OrderController();

orderRouter.use(authMiddleware);

orderRouter.get('/', orderController.list);
orderRouter.post('/', orderController.create);
orderRouter.patch('/:id/status', orderController.updateStatus);

export default orderRouter;
