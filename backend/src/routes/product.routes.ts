import { Router } from 'express';
import { ProductController } from '../controllers/ProductController';
import { authMiddleware } from '../middlewares/authMiddleware';

const productRouter = Router();
const productController = new ProductController();

productRouter.use(authMiddleware);

productRouter.get('/', productController.list);
productRouter.post('/', productController.create);
productRouter.put('/:id', productController.update);
productRouter.delete('/:id', productController.delete);

export default productRouter;
