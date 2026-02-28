import { Request, Response } from 'express';
import { prisma } from '../repositories/prisma';

export class InventoryController {
    async list(req: Request, res: Response) {
        try {
            const tenantId = req.user?.tenantId;
            if (!tenantId) return res.status(401).json({ error: 'Tenant missing' });

            // Busca produtos que SÃO controlados no estoque
            const products = await prisma.product.findMany({
                where: { tenantId, isStockControlled: true },
                include: { category: true, inventory: true }
            });

            const mapped = products.map((p: any) => {
                const totalIn = p.inventory.filter((tx: any) => tx.type === 'IN').reduce((acc: number, tx: any) => acc + Number(tx.quantity), 0);
                const totalOut = p.inventory.filter((tx: any) => tx.type === 'OUT').reduce((acc: number, tx: any) => acc + Number(tx.quantity), 0);
                const currentQuantity = totalIn - totalOut;

                let limit = 10; // minimum mock
                let status = 'GOOD';
                if (currentQuantity <= 0) status = 'OUT';
                else if (currentQuantity <= limit) status = 'LOW';

                return {
                    id: p.id,
                    name: p.name,
                    sku: p.id.substring(0, 8).toUpperCase(),
                    quantity: currentQuantity,
                    minQuantity: limit,
                    unit: 'un',
                    lastUpdated: p.updatedAt,
                    status: status,
                    categoryName: p.category?.name || 'Sem Categoria'
                };
            });

            return res.json(mapped);
        } catch (error: any) {
            console.error('Erro Listar Estoque:', error);
            return res.status(500).json({ error: 'Erro interno' });
        }
    }

    async adjust(req: Request, res: Response) {
        try {
            const tenantId = req.user?.tenantId;
            if (!tenantId) return res.status(401).json({ error: 'Tenant missing' });

            const { productId, type, quantity, reason } = req.body;

            if (type === 'SET') {
                const p = await prisma.product.findUnique({
                    where: { id: productId, tenantId },
                    include: { inventory: true }
                });
                if (!p) return res.status(404).json({ error: 'Product not found' });

                const totalIn = p.inventory.filter((tx: any) => tx.type === 'IN').reduce((acc: number, tx: any) => acc + Number(tx.quantity), 0);
                const totalOut = p.inventory.filter((tx: any) => tx.type === 'OUT').reduce((acc: number, tx: any) => acc + Number(tx.quantity), 0);
                const currentQuantity = totalIn - totalOut;

                const diff = quantity - currentQuantity;
                if (diff === 0) return res.json({ message: 'No change' });

                const adjustedType = diff > 0 ? 'IN' : 'OUT';
                const adjustedQty = Math.abs(diff);

                const transaction = await prisma.inventoryTransaction.create({
                    data: {
                        tenantId,
                        productId,
                        type: adjustedType,
                        quantity: adjustedQty,
                        reason: reason || 'Ajuste de Saldo Absoluto'
                    }
                });
                return res.status(201).json(transaction);
            }

            const transaction = await prisma.inventoryTransaction.create({
                data: {
                    tenantId,
                    productId,
                    type,
                    quantity,
                    reason
                }
            });

            return res.status(201).json(transaction);
        } catch (error: any) {
            console.error('Erro Ajustar Estoque:', error);
            return res.status(500).json({ error: 'Erro interno' });
        }
    }
}
