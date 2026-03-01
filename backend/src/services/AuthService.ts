import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../repositories/prisma';

export class AuthService {
    async login(email: string, password: string) {
        // Usa instância raiz do prisma para login global, pois ainda não sabemos o tenantId
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            throw new Error('Invalid credentials');
        }

        const passwordMatch = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatch) {
            throw new Error('Credenciais inválidas');
        }

        const isDefaultPassword = await bcrypt.compare('123456', user.passwordHash);

        const token = jwt.sign(
            {
                userId: user.id,
                tenantId: user.tenantId,
                role: user.role
            },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '1d' }
        );

        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                tenantId: user.tenantId,
            },
            token,
            mustChangePassword: isDefaultPassword
        };
    }

    async registerTenantUser(data: any) {
        // Cria o Tenant e o proprietário (Owner) em uma só transação
        const { email, password, name, tenantName, document } = data;

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            throw new Error('User already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const tenantAndUser = await prisma.$transaction(async (tx: any) => {
            const tenant = await tx.tenant.create({
                data: {
                    name: tenantName,
                    document,
                    plan: 'BASIC'
                }
            });

            const user = await tx.user.create({
                data: {
                    tenantId: tenant.id,
                    name,
                    email,
                    passwordHash: hashedPassword,
                    role: 'OWNER'
                }
            });

            return { tenant, user };
        });

        return tenantAndUser;
    }
}
