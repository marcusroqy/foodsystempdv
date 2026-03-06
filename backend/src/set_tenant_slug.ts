import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Setting up tenant slug for Delivery App...');

    const tenants = await prisma.tenant.findMany({
        where: { slug: null }
    });

    for (const tenant of tenants) {
        // Generate a simple slug from the name
        const slug = tenant.name
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // remove accents
            .replace(/[^a-z0-9]+/g, '-') // replace non-alphanumeric with dashes
            .replace(/(^-|-$)+/g, ''); // remove leading/trailing dashes

        // Default to "minha-loja" if empty for some reason
        const finalSlug = slug || 'minha-loja' + tenant.id.substring(0, 4);

        await prisma.tenant.update({
            where: { id: tenant.id },
            data: { slug: finalSlug }
        });

        console.log(`✅ Tenant ${tenant.name} updated with slug: ${finalSlug}`);
    }

    console.log('🎉 Finalized!');
}

main()
    .catch(e => {
        console.error('Fatal error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
