const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function check() {
    const users = await prisma.user.findMany({
        where: { email: { contains: 'fabiolla', mode: 'insensitive' } }
    });

    console.log("Users found:", users.length);
    for (const u of users) {
        console.log("User:", u.email);
        const match = await bcrypt.compare('123456', u.passwordHash);
        console.log("Password 123456 matches?:", match);
    }
}
check()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
