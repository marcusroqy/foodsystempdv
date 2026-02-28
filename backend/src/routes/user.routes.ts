import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authMiddleware } from '../middlewares/authMiddleware';

const routes = Router();
const userController = new UserController();

routes.use(authMiddleware);

// Profile e Team
routes.get('/profile', userController.getProfile);
routes.put('/profile', userController.updateProfile);
routes.get('/', userController.getTeam);
routes.post('/invite', userController.inviteUser);

export default routes;
