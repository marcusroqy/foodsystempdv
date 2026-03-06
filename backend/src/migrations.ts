import { prisma } from './repositories/prisma';

/**
 * Executa migrações SQL diretamente no banco para adicionar colunas novas.
 * Usa IF NOT EXISTS para ser idempotente (pode rodar várias vezes sem erro).
 */
export async function runMigrations() {
    console.log('🔄 Running database migrations...');
    try {
        await prisma.$executeRawUnsafe(`ALTER TABLE products ADD COLUMN IF NOT EXISTS unit VARCHAR(10) DEFAULT 'UN'`);
        await prisma.$executeRawUnsafe(`ALTER TABLE products ADD COLUMN IF NOT EXISTS "minStock" DECIMAL(10,3) DEFAULT 0`);
        await prisma.$executeRawUnsafe(`ALTER TABLE products ADD COLUMN IF NOT EXISTS "costPrice" DECIMAL(10,2) DEFAULT 0`);
        await prisma.$executeRawUnsafe(`ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier VARCHAR(255)`);
        console.log('✅ Database migrations applied successfully');
    } catch (error) {
        console.error('❌ Migration error (non-fatal):', error);
    }
}
