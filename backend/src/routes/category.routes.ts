import { Router } from 'express';
import { CategoryController } from '../controllers/CategoryController';
import { authMiddleware } from '../middlewares/authMiddleware';

const categoryRouter = Router();
const categoryController = new CategoryController();

categoryRouter.use(authMiddleware);

categoryRouter.get('/', categoryController.list);
categoryRouter.post('/', categoryController.create);
categoryRouter.delete('/:id', categoryController.delete);

export default categoryRouter;
