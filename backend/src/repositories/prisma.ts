import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({ log: ['query', 'info', 'warn', 'error'] });

// Extensão do Prisma para Data Isolation (Multi-Tenant)
export const getTenantPrisma = (tenantId: string) => {
    return prisma.$extends({
        query: {
            $allModels: {
                async findMany({ model, operation, args, query }: any) {
                    args.where = { ...args.where, tenantId };
                    return query(args);
                },
                async findFirst({ model, operation, args, query }: any) {
                    args.where = { ...args.where, tenantId };
                    return query(args);
                },
                async findUnique({ model, operation, args, query }: any) {
                    const result = await (prisma as any)[model].findFirst({
                        ...args,
                        where: { ...args.where, tenantId },
                    });
                    return result;
                },
                async create({ model, operation, args, query }: any) {
                    args.data = { ...args.data, tenantId };
                    return query(args);
                },
                async update({ model, operation, args, query }: any) {
                    args.where = { ...args.where, tenantId };
                    return query(args);
                },
                async updateMany({ model, operation, args, query }: any) {
                    args.where = { ...args.where, tenantId };
                    return query(args);
                },
                async delete({ model, operation, args, query }: any) {
                    const record = await (prisma as any)[model].findFirst({
                        where: { ...args.where, tenantId }
                    });
                    if (!record) {
                        throw new Error(`Record not found or not authorized for tenant ${tenantId}`);
                    }
                    return query(args);
                },
                async deleteMany({ model, operation, args, query }: any) {
                    args.where = { ...args.where, tenantId };
                    return query(args);
                },
                async count({ model, operation, args, query }: any) {
                    args.where = { ...args.where, tenantId };
                    return query(args);
                },
            },
        },
    });
};

export { prisma };
