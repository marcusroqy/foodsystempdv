import { Request, Response } from 'express';
import { OrderService } from '../services/OrderService';

export class OrderController {
    private orderService = new OrderService();

    list = async (req: Request, res: Response) => {
        try {
            const tenantId = req.user?.tenantId;
            if (!tenantId) return res.status(401).json({ error: 'Tenant missing' });

            const orders = await this.orderService.listOrders(tenantId);
            return res.json(orders);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    };

    create = async (req: Request, res: Response) => {
        try {
            const tenantId = req.user?.tenantId;
            const userId = req.user?.userId;
            if (!tenantId || !userId) return res.status(401).json({ error: 'Auth context missing' });

            const { customerName, items } = req.body;
            const order = await this.orderService.createOrder(tenantId, userId, { customerName, items });
            return res.status(201).json(order);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    };

    updateStatus = async (req: Request, res: Response) => {
        try {
            const tenantId = req.user?.tenantId;
            if (!tenantId) return res.status(401).json({ error: 'Tenant missing' });

            const id = req.params.id as string;
            const { status } = req.body;

            const order = await this.orderService.updateOrderStatus(tenantId, id, status);
            return res.json(order);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    };
}
