import { Request, Response } from 'express';
import { PushNotificationService } from '../services/PushNotificationService';

const notificationService = new PushNotificationService();

export class NotificationController {
    async subscribe(req: Request, res: Response) {
        try {
            const { subscription } = req.body;
            const { tenantId, userId } = req.user!;

            if (!subscription || !subscription.endpoint) {
                return res.status(400).json({ error: 'Subscription is invalid' });
            }

            if (!userId) {
                return res.status(401).json({ error: 'User is required to subscribe' });
            }

            const sub = await notificationService.subscribeUser(tenantId, userId, subscription);
            res.status(201).json(sub);
        } catch (error: any) {
            console.error('Error in subscribe controller:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Rota de teste
    async testSend(req: Request, res: Response) {
        try {
            const { tenantId, userId } = req.user!;
            if (!userId) {
                return res.status(401).json({ error: 'User is required for notifications' });
            }

            await notificationService.sendNotificationToUser(tenantId, userId, {
                title: 'Teste de Notificação',
                body: 'Sua assinatura foi configurada com sucesso!',
                url: '/pdv'
            });
            res.status(200).json({ success: true });
        } catch (error: any) {
            console.error('Error in testSend controller:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
