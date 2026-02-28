import { Request, Response } from 'express';
import { prisma } from '../repositories/prisma';

export class FinanceController {
    async list(req: Request, res: Response) {
        try {
            const tenantId = req.user?.tenantId;
            if (!tenantId) return res.status(401).json({ error: 'Tenant missing' });

            const finances = await prisma.financialTransaction.findMany({
                where: { tenantId },
                orderBy: { paidAt: 'desc' }
            });

            // Map to frontend interface
            const mapped = finances.map((f: any) => ({
                id: f.id,
                description: f.description || '',
                amount: Number(f.amount),
                type: f.type,
                date: f.paidAt,
                category: f.category
            }));

            return res.json(mapped);
        } catch (error: any) {
            console.error('Erro Listar Finanças:', error);
            return res.status(500).json({ error: 'Erro interno' });
        }
    }

    async create(req: Request, res: Response) {
        try {
            const tenantId = req.user?.tenantId;
            if (!tenantId) return res.status(401).json({ error: 'Tenant missing' });

            const { description, amount, type, category } = req.body;

            const finance = await prisma.financialTransaction.create({
                data: {
                    tenantId,
                    description,
                    amount,
                    type,
                    category,
                    paidAt: new Date()
                }
            });

            return res.status(201).json(finance);
        } catch (error: any) {
            console.error('Erro Criar Finança:', error);
            return res.status(500).json({ error: 'Erro interno' });
        }
    }
}
