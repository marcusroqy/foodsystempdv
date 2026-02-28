import { Router } from 'express';
import { TenantController } from '../controllers/TenantController';
import { authMiddleware } from '../middlewares/authMiddleware';

const routes = Router();
const tenantController = new TenantController();

// Todas as rotas de tenant precisam de autenticação
routes.use(authMiddleware);

// Rotas Base: /api/tenant
routes.get('/', tenantController.getTenant);
routes.put('/', tenantController.updateTenant);

export default routes;
