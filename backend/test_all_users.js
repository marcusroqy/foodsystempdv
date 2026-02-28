const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const users = await prisma.user.findMany();
    console.log("Users:", users.map(u => ({ email: u.email, role: u.role, tenantId: u.tenantId })));
}
check()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
