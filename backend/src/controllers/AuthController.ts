import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';

export class AuthController {
    private authService = new AuthService();

    login = async (req: Request, res: Response) => {
        try {
            const { email, password } = req.body;
            const { token, user } = await this.authService.login(email, password);

            return res.json({ token, user });
        } catch (error: any) {
            return res.status(error.message === 'Invalid credentials' ? 401 : 400).json({ error: error.message });
        }
    };

    register = async (req: Request, res: Response) => {
        try {
            const { email, password, name, tenantName, document } = req.body;

            // O Tenant é criado junto com o primeiro usuário (Dono)
            const result = await this.authService.registerTenantUser({
                email, password, name, tenantName, document
            });

            return res.status(201).json(result);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    };
}
