import { Request, Response } from 'express';
import { prisma } from '../repositories/prisma';

export class TenantController {
    async getTenant(req: Request, res: Response) {
        try {
            const tenantId = req.user?.tenantId as string;

            const tenant = await prisma.tenant.findUnique({
                where: { id: tenantId },
                select: {
                    id: true,
                    name: true,
                    document: true,
                    phone: true,
                    address: true,
                    plan: true,
                    status: true
                }
            });

            if (!tenant) {
                return res.status(404).json({ error: 'Tenant (Empresa) não encontrado' });
            }

            return res.json(tenant);
        } catch (error) {
            console.error('Erro ao buscar tenant:', error);
            return res.status(500).json({ error: 'Erro interno ao buscar dados da empresa' });
        }
    }

    async updateTenant(req: Request, res: Response) {
        try {
            const tenantId = req.user?.tenantId as string;
            const { name, document, phone, address } = req.body;

            // Apenas Owner e Manager deveriam poder atualizar isso, o authMiddleware garante isso nas rotas para Owner/Manager
            if (req.user?.role !== 'OWNER' && req.user?.role !== 'MANAGER') {
                return res.status(403).json({ error: 'Permissão negada. Apenas Proprietários e Gerentes podem alterar os dados da empresa.' });
            }

            const updatedTenant = await prisma.tenant.update({
                where: { id: tenantId },
                data: {
                    name,
                    document,
                    phone,
                    address
                },
                select: {
                    id: true,
                    name: true,
                    document: true,
                    phone: true,
                    address: true
                }
            });

            return res.json(updatedTenant);
        } catch (error) {
            console.error('Erro ao atualizar tenant:', error);
            return res.status(500).json({ error: 'Erro interno ao atualizar dados da empresa' });
        }
    }
}
