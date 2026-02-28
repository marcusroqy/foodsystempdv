import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
    console.log("Setting up default Ficha Técnica (Ketchup, Maionese) for Pastéis...");
    const tenantId = '88157f23-8b84-4a85-b212-6fe5252032b3'; // the single tenant we've been using

    // Find the ingredients
    const ketchup = await prisma.product.findFirst({ where: { name: { contains: 'Ketchup', mode: 'insensitive' } } });
    const maionese = await prisma.product.findFirst({ where: { name: { contains: 'Maionese', mode: 'insensitive' } } });

    if (!ketchup || !maionese) {
        console.error("Could not find Ketchup or Maionese in stock!");
        return;
    }

    // Find sellable products
    const products = await prisma.product.findMany({
        where: { tenantId, isForSale: true }
    });

    console.log(`Found ${products.length} sellable products.`);

    let createdCount = 0;
    for (const p of products) {
        // Delete existing recipes for this product to avoid duplicates during test
        await prisma.recipeIngredient.deleteMany({ where: { productId: p.id } });

        // Link Ketchup (1 un)
        await prisma.recipeIngredient.create({
            data: { tenantId, productId: p.id, ingredientId: ketchup.id, quantity: 1 }
        });

        // Link Maionese (1 un)
        await prisma.recipeIngredient.create({
            data: { tenantId, productId: p.id, ingredientId: maionese.id, quantity: 1 }
        });
        createdCount += 2;
    }

    console.log(`Successfully created ${createdCount} Recipe ingredients for ${products.length} products.`);
}

run().finally(() => prisma.$disconnect());
