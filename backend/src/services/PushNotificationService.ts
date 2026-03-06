import webpush from 'web-push';
import { prisma } from '../repositories/prisma';

let isWebPushConfigured = false;

const getWebPush = () => {
    if (!isWebPushConfigured) {
        webpush.setVapidDetails(
            process.env.VAPID_SUBJECT || 'mailto:admin@pastelaria.com',
            process.env.VAPID_PUBLIC_KEY || '',
            process.env.VAPID_PRIVATE_KEY || ''
        );
        isWebPushConfigured = true;
    }
    return webpush;
};

export class PushNotificationService {
    async subscribeUser(tenantId: string, userId: string, subscription: any) {
        // Verifica se já existe a assinatura para este endpoint
        const existing = await prisma.pushSubscription.findFirst({
            where: {
                tenantId,
                userId,
                endpoint: subscription.endpoint,
            }
        });

        if (existing) {
            return existing;
        }

        return await prisma.pushSubscription.create({
            data: {
                tenantId,
                userId,
                endpoint: subscription.endpoint,
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth,
            }
        });
    }

    async sendNotificationToUser(tenantId: string, userId: string, payload: any) {
        const subscriptions = await prisma.pushSubscription.findMany({
            where: { tenantId, userId }
        });

        const promises = subscriptions.map(sub => {
            const pushSub = {
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.p256dh,
                    auth: sub.auth,
                }
            };

            return getWebPush().sendNotification(pushSub, JSON.stringify(payload)).catch(err => {
                if (err.statusCode === 404 || err.statusCode === 410) {
                    console.log('Subscription has expired or is no longer valid: ', err);
                    return prisma.pushSubscription.delete({ where: { id: sub.id } });
                } else {
                    console.log('Error sending push notification', err);
                }
            });
        });

        await Promise.all(promises);
    }

    async sendNotificationToRole(tenantId: string, role: string, payload: any) {
        const users = await prisma.user.findMany({
            where: { tenantId, role: role as any }
        });

        for (const user of users) {
            await this.sendNotificationToUser(tenantId, user.id, payload);
        }
    }
}
