import { getTenantPrisma } from '../repositories/prisma';

export class OrderService {
    async listOrders(tenantId: string) {
        const prisma = getTenantPrisma(tenantId);
        return prisma.order.findMany({
            include: {
                items: {
                    include: { product: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async createOrder(tenantId: string, userId: string, data: { customerName?: string, items: Array<{ productId: string, quantity: number, unitPrice: number, notes?: string }> }) {
        const prisma = getTenantPrisma(tenantId);

        // Calculates total amount
        const totalAmount = data.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);

        const order = await prisma.order.create({
            data: {
                tenantId,
                userId,
                customerName: data.customerName,
                totalAmount,
                status: 'QUEUE',
                items: {
                    create: data.items.map(item => ({
                        tenantId,
                        productId: item.productId,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        notes: item.notes
                    }))
                }
            },
            include: {
                items: true
            }
        });

        // ==========================================
        // DEDUCT INVENTORY BASED ON FICHA TÉCNICA
        // ==========================================
        for (const item of data.items) {
            // Check if the product itself is stock-controlled (e.g. they sell a Coke directly)
            const product = await prisma.product.findUnique({
                where: { id: item.productId, tenantId },
                include: { recipes: true }
            });

            if (!product) continue;

            if (product.isStockControlled && product.isForSale && product.recipes.length === 0) {
                // If it's a direct item (like a Coke or Water) with no recipe, deduct it directly
                await prisma.inventoryTransaction.create({
                    data: {
                        tenantId,
                        productId: product.id,
                        type: 'OUT',
                        quantity: item.quantity,
                        reason: `Venda Direta - Pedido ${order.id}`
                    }
                });
            } else {
                // If it has a recipe (pastéis), deduct the ingredients
                for (const recipeItem of product.recipes) {
                    await prisma.inventoryTransaction.create({
                        data: {
                            tenantId,
                            productId: recipeItem.ingredientId,
                            type: 'OUT',
                            quantity: Number(recipeItem.quantity) * item.quantity,
                            reason: `Consumo Ficha Técnica - Produto ${product.name} (Pedido ${order.id})`
                        }
                    });
                }
            }
        }

        // ==========================================
        // DEDUCT GLOBAL ORDER PACKAGING (SACOLA)
        // ==========================================
        // Check if there was at least one prepared item (has recipes) in the order to justify a bag
        let needsBag = false;
        for (const item of data.items) {
            const product = await prisma.product.findUnique({
                where: { id: item.productId, tenantId },
                include: { recipes: true }
            });
            if (product && product.recipes.length > 0) {
                needsBag = true;
                break;
            }
        }

        if (needsBag) {
            const sacola = await prisma.product.findFirst({
                where: { tenantId, name: { contains: 'Sacola', mode: 'insensitive' }, isForSale: false }
            });

            if (sacola) {
                await prisma.inventoryTransaction.create({
                    data: {
                        tenantId,
                        productId: sacola.id,
                        type: 'OUT',
                        quantity: 1, // Only 1 bag per order regardless of items
                        reason: `Embalagem (1 por Compra) - Pedido ${order.id}`
                    }
                });
            }
        }

        return order;
    }

    async updateOrderStatus(tenantId: string, id: string, status: 'QUEUE' | 'PREPARING' | 'COMPLETED' | 'CANCELED') {
        const prisma = getTenantPrisma(tenantId);
        return prisma.order.update({
            where: { id },
            data: { status }
        });
    }
}
