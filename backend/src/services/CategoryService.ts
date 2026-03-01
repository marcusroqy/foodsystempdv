import { getTenantPrisma } from '../repositories/prisma';

export class CategoryService {
    async listCategories(tenantId: string, type?: string) {
        const prisma = getTenantPrisma(tenantId);
        return prisma.category.findMany({
            where: {
                tenantId,
                ...(type ? { type } : {})
            }
        });
    }

    async createCategory(tenantId: string, name: string, type: string = "MENU") {
        const prisma = getTenantPrisma(tenantId);
        return prisma.category.create({
            data: { tenantId, name, type }
        });
    }

    async deleteCategory(tenantId: string, id: string) {
        const prisma = getTenantPrisma(tenantId);
        return prisma.category.delete({
            where: { id }
        });
    }
}
