const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  if (users.length === 0) return console.log("No users");
  const target = users.find(u => u.email === 'fabiolla@test.com') || users[0];
  console.log("Updating user:", target.id);
  
  try {
    const updatedUser = await prisma.user.update({
        where: { id: target.id },
        data: { name: 'Fabiolla Modified', email: 'eufaluba@gmail.com', role: 'MANAGER' }
    });
    console.log("Success:", updatedUser);
  } catch (e) {
    console.error("Error updating:", e);
  }
}

main().finally(() => prisma.$disconnect());
