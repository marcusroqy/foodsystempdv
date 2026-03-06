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
                category: f.category,
                paymentMethod: f.paymentMethod || null
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

    async update(req: Request, res: Response) {
        try {
            const tenantId = req.user?.tenantId;
            if (!tenantId) return res.status(401).json({ error: 'Tenant missing' });

            const id = req.params.id as string;
            const { description, amount, type, category } = req.body;

            const existing = await prisma.financialTransaction.findFirst({
                where: { id, tenantId }
            });

            if (!existing) return res.status(404).json({ error: 'Transaction not found' });

            const finance = await prisma.financialTransaction.update({
                where: { id },
                data: {
                    description,
                    amount,
                    type,
                    category
                }
            });

            return res.json(finance);
        } catch (error: any) {
            console.error('Erro Atualizar Finança:', error);
            return res.status(500).json({ error: 'Erro interno' });
        }
    }

    async delete(req: Request, res: Response) {
        try {
            const tenantId = req.user?.tenantId;
            if (!tenantId) return res.status(401).json({ error: 'Tenant missing' });

            const id = req.params.id as string;

            const existing = await prisma.financialTransaction.findFirst({
                where: { id, tenantId }
            });

            if (!existing) return res.status(404).json({ error: 'Transaction not found' });

            await prisma.financialTransaction.delete({
                where: { id }
            });

            return res.json({ message: 'Transaction deleted' });
        } catch (error: any) {
            console.error('Erro Deletar Finança:', error);
            return res.status(500).json({ error: 'Erro interno' });
        }
    }
}
