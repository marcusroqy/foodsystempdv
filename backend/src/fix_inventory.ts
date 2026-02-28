import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = 'marcusroqy12@gmail.com';

    const user = await prisma.user.findUnique({
        where: { email },
        include: { tenant: true }
    });

    if (!user) {
        console.error(`Usuário com email ${email} não encontrado.`);
        return;
    }

    const tenantId = user.tenantId;

    // 1. Criar Categorias Específicas
    const embalagensCategory = await prisma.category.upsert({
        where: { id: 'dummy', name: 'Embalagens e Limpeza' }, // Prisma requires a unique constraint for upsert, but name is not unique. So we use findFirst instead.
        update: {},
        create: { name: 'Embalagens e Limpeza', tenantId }
    }).catch(async () => {
        let cat = await prisma.category.findFirst({ where: { tenantId, name: 'Embalagens e Limpeza' } });
        if (!cat) cat = await prisma.category.create({ data: { name: 'Embalagens e Limpeza', tenantId } });
        return cat;
    });

    const ingredientesCategory = await prisma.category.findFirst({ where: { tenantId, name: 'Ingredientes p/ Pastel' } })
        || await prisma.category.create({ data: { name: 'Ingredientes p/ Pastel', tenantId } });

    const complementosCategory = await prisma.category.findFirst({ where: { tenantId, name: 'Complementos' } })
        || await prisma.category.create({ data: { name: 'Complementos', tenantId } });

    // Map to categorize
    const updates = [
        { name: 'Chedder 400gr', cat: ingredientesCategory.id },
        { name: 'Catupiry 400gr', cat: ingredientesCategory.id },
        { name: 'Caixa de Ketchup', cat: complementosCategory.id },
        { name: 'Caixa de Maionese', cat: complementosCategory.id },
        { name: 'Papel Toalha (1 pct 2 rolos)', cat: embalagensCategory.id },
        { name: 'Massa de Pastel', cat: ingredientesCategory.id, price: 33.0 },
        { name: 'Presunto', cat: ingredientesCategory.id, price: 19.0 },
        { name: 'Mussarela', cat: ingredientesCategory.id, price: 20.0 },
        { name: 'Sacola (50 un)', cat: embalagensCategory.id },
        { name: 'Saco de Papel (50 un)', cat: embalagensCategory.id }
    ];

    for (const item of updates) {
        const dbItem = await prisma.product.findFirst({
            where: { tenantId, name: item.name }
        });

        if (dbItem) {
            await prisma.product.update({
                where: { id: dbItem.id },
                data: {
                    categoryId: item.cat,
                    isForSale: false // Remove do PDV
                }
            });

            // Se tiver preço pago listado pelo usuário, vira despesa
            if (item.price) {
                await prisma.financialTransaction.create({
                    data: {
                        tenantId,
                        type: 'EXPENSE',
                        category: 'COMPRA DE INSUMOS',
                        amount: item.price,
                        description: `Compra de estoque (Lançamento Inicial): ${item.name}`,
                        paidAt: new Date()
                    }
                });
            }
        }
    }

    console.log('✅ Itens atualizados como Insumos (Ocultos do PDV) e despesas registradas!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
