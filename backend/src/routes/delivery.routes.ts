import { Router } from 'express';
import { DeliveryController } from '../controllers/DeliveryController';
import { authMiddleware } from '../middlewares/authMiddleware';

const routes = Router();
const deliveryController = new DeliveryController();

// Public Routes (No Auth Required)
routes.get('/:slug', deliveryController.getTenantBySlug);
routes.get('/:slug/menu', deliveryController.getMenu);
routes.post('/:slug/auth/register', deliveryController.registerCustomer);
routes.post('/:slug/auth/login', deliveryController.loginCustomer);

// Protected Routes (Requires Customer Auth)
routes.use(authMiddleware); // We will reuse the same middleware but the token will have customerId

routes.post('/:slug/orders', deliveryController.createOrder);
routes.get('/:slug/orders', deliveryController.getCustomerOrders);

export default routes;
