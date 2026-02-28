import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
    console.log("Setting up default PDV Categories...");
    const tenantId = '88157f23-8b84-4a85-b212-6fe5252032b3'; // the single tenant we've been using

    const defaultCategories = [
        "Pastéis",
        "Bebidas",
        "Porções",
        "Sobremesas",
        "Diversos"
    ];

    let createdCount = 0;
    for (const catName of defaultCategories) {
        const exists = await prisma.category.findFirst({
            where: { tenantId, name: catName }
        });

        if (!exists) {
            await prisma.category.create({
                data: {
                    tenantId,
                    name: catName
                }
            });
            createdCount++;
        }
    }

    console.log(`Successfully created ${createdCount} new PDV categories.`);
}

run().finally(() => prisma.$disconnect());
