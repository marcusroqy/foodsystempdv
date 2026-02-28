import { Router } from 'express';
import { InventoryController } from '../controllers/InventoryController';
import { authMiddleware } from '../middlewares/authMiddleware';

const routes = Router();
const inventoryController = new InventoryController();

routes.use(authMiddleware);

routes.get('/', inventoryController.list);
routes.post('/adjust', inventoryController.adjust);

export default routes;
