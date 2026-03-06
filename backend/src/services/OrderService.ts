import { getTenantPrisma } from '../repositories/prisma';
import { PushNotificationService } from './PushNotificationService';

const notificationService = new PushNotificationService();

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

    async createOrder(tenantId: string, userId: string, data: { customerName?: string, paymentMethod?: string, notes?: string, items: Array<{ productId: string, quantity: number, unitPrice: number, notes?: string }> }) {
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
                paymentMethod: data.paymentMethod || null,
                notes: data.notes || null,
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

        // Send Notification to ALL subscribed users (Kitchen, Owner, Manager, etc.)
        try {
            await notificationService.sendNotificationToAllSubscribers(tenantId, {
                title: '🛎️ Novo Pedido na Cozinha!',
                body: `Pedido #${order.id.slice(-4).toUpperCase()} - ${data.customerName || 'Balcão'} - ${data.items.length} itens.`,
                url: '/cozinha'
            });
        } catch (error) {
            console.error('Failed to notify kitchen:', error);
        }

        // ==========================================
        // AUTO-CREATE FINANCIAL TRANSACTION (INCOME)
        // ==========================================
        try {
            await prisma.financialTransaction.create({
                data: {
                    tenantId,
                    orderId: order.id,
                    type: 'INCOME',
                    category: 'Venda PDV',
                    amount: totalAmount,
                    description: `Pedido #${order.id.slice(-4).toUpperCase()} - ${data.customerName || 'Balcão'}`,
                    paymentMethod: data.paymentMethod || null,
                    paidAt: new Date()
                }
            });
        } catch (error) {
            console.error('Failed to create financial transaction for order:', error);
        }

        return order;
    }

    async updateOrderStatus(tenantId: string, id: string, status: 'QUEUE' | 'PREPARING' | 'READY' | 'DISPATCHED' | 'COMPLETED' | 'CANCELED') {
        const prisma = getTenantPrisma(tenantId);
        const order = await prisma.order.update({
            where: { id },
            data: { status }
        });

        // Notify ALL subscribers when order is completed
        if (status === 'COMPLETED') {
            try {
                await notificationService.sendNotificationToAllSubscribers(tenantId, {
                    title: '✅ Pedido Pronto!',
                    body: `O Pedido #${order.id.slice(-4).toUpperCase()} já pode ser entregue.`,
                    url: '/pdv'
                });
            } catch (error) {
                console.error('Failed to notify cashier/waiter:', error);
            }
        }

        return order;
    }

    async deleteOrder(tenantId: string, id: string) {
        const prisma = getTenantPrisma(tenantId);

        // As long as Prisma `onDelete: Cascade` is set up correctly in the schema for Order items,
        // deleting the parent order will delete its items.
        // Also note: we are not reverting inventory transactions here. Since they were consumed,
        // if the user deletes the order, they might need to do manual stock adjustment or
        // we could implement complex reversal logic later. For now, simple deletion rules.

        return prisma.order.delete({
            where: { id, tenantId } // Ensure it specifically belongs to this tenant
        });
    }
}
