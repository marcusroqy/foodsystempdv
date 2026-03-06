import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Starting order synchronization to finance...');

    // Find all orders that DO NOT have a related FinancialTransaction
    const ordersToSync = await prisma.order.findMany({
        where: {
            financeTx: null
        }
    });

    console.log(`Found ${ordersToSync.length} orders without financial transactions.`);

    let successCount = 0;
    let failCount = 0;

    for (const order of ordersToSync) {
        try {
            await prisma.financialTransaction.create({
                data: {
                    tenantId: order.tenantId,
                    orderId: order.id,
                    type: 'INCOME',
                    category: 'Venda PDV',
                    amount: order.totalAmount,
                    description: `Pedido #${order.id.slice(-4).toUpperCase()} - ${order.customerName || 'Balcão'}`,
                    paymentMethod: order.paymentMethod || 'Dinheiro', // Fallback to Dinheiro if null, or just leave null
                    paidAt: order.createdAt // using order creation date to preserve historical correct dates!
                }
            });
            successCount++;
        } catch (error) {
            console.error(`❌ Failed to sync order ${order.id}:`, error);
            failCount++;
        }
    }

    console.log('✅ Synchronization completed!');
    console.log(`   - Synced: ${successCount}`);
    console.log(`   - Failed: ${failCount}`);
}

main()
    .catch(e => {
        console.error('Fatal error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
