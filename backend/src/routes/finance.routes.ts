import { Router } from 'express';
import { FinanceController } from '../controllers/FinanceController';
import { authMiddleware } from '../middlewares/authMiddleware';

const routes = Router();
const financeController = new FinanceController();

routes.use(authMiddleware);

routes.get('/', financeController.list);
routes.post('/', financeController.create);
routes.put('/:id', financeController.update);
routes.delete('/:id', financeController.delete);

export default routes;
