import { getTenantPrisma } from '../repositories/prisma';

export class CategoryService {
    async listCategories(tenantId: string) {
        const prisma = getTenantPrisma(tenantId);
        return prisma.category.findMany();
    }

    async createCategory(tenantId: string, name: string) {
        const prisma = getTenantPrisma(tenantId);
        return prisma.category.create({
            data: { tenantId, name }
        });
    }

    async deleteCategory(tenantId: string, id: string) {
        const prisma = getTenantPrisma(tenantId);
        return prisma.category.delete({
            where: { id }
        });
    }
}
