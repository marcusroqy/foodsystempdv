import { getTenantPrisma } from '../repositories/prisma';

export class ProductService {
    async listProducts(tenantId: string, all: boolean = false) {
        const prisma = getTenantPrisma(tenantId);
        return prisma.product.findMany({
            where: all ? {} : { isForSale: true },
            include: { category: true }
        });
    }

    async createProduct(tenantId: string, data: { name: string; price: number; categoryId?: string; isStockControlled?: boolean; isForSale?: boolean }) {
        const prisma = getTenantPrisma(tenantId);
        const newProduct = await prisma.product.create({
            data: {
                tenantId,
                name: data.name,
                price: data.price,
                categoryId: data.categoryId,
                isStockControlled: data.isStockControlled ?? true,
                isForSale: data.isForSale ?? true
            }
        });

        // Ficha Técnica Automática: Sempre que criar um "Pastel", atrela 1 Ketchup e 1 Maionese
        if (data.categoryId && newProduct.isForSale) {
            const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
            if (category && category.name.toLowerCase().includes('past')) {
                const ketchup = await prisma.product.findFirst({ where: { tenantId, name: { contains: 'Ketchup', mode: 'insensitive' } } });
                const maionese = await prisma.product.findFirst({ where: { tenantId, name: { contains: 'Maionese', mode: 'insensitive' } } });
                const sacoPapel = await prisma.product.findFirst({ where: { tenantId, name: { contains: 'Saco de papel', mode: 'insensitive' } } });

                const recipesToCreate = [];
                if (ketchup) recipesToCreate.push({ tenantId, productId: newProduct.id, ingredientId: ketchup.id, quantity: 1 });
                if (maionese) recipesToCreate.push({ tenantId, productId: newProduct.id, ingredientId: maionese.id, quantity: 1 });
                if (sacoPapel) recipesToCreate.push({ tenantId, productId: newProduct.id, ingredientId: sacoPapel.id, quantity: 1 });

                if (recipesToCreate.length > 0) {
                    await prisma.recipeIngredient.createMany({ data: recipesToCreate });
                }
            }
        }

        return newProduct;
    }

    async updateProduct(tenantId: string, id: string, data: { name?: string; price?: number; categoryId?: string; isStockControlled?: boolean; isForSale?: boolean }) {
        const prisma = getTenantPrisma(tenantId);
        return prisma.product.updateMany({
            where: { id, tenantId },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.price !== undefined && { price: data.price }),
                ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
                ...(data.isStockControlled !== undefined && { isStockControlled: data.isStockControlled }),
                ...(data.isForSale !== undefined && { isForSale: data.isForSale })
            }
        });
    }

    async deleteProduct(tenantId: string, id: string) {
        const prisma = getTenantPrisma(tenantId);
        return prisma.product.delete({
            where: { id }
        });
    }
}
