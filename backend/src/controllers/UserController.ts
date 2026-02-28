import { Request, Response } from 'express';
import { prisma } from '../repositories/prisma';
import bcrypt from 'bcrypt';

export class UserController {
    async getProfile(req: Request, res: Response) {
        try {
            const userId = req.user?.userId as string;

            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true
                }
            });

            if (!user) {
                return res.status(404).json({ error: 'Usuário não encontrado' });
            }

            return res.json(user);
        } catch (error) {
            console.error('Erro ao buscar perfil do usuário:', error);
            return res.status(500).json({ error: 'Erro interno ao buscar perfil' });
        }
    }

    async updateProfile(req: Request, res: Response) {
        try {
            const userId = req.user?.userId as string;
            const { name } = req.body;

            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: { name },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true
                }
            });

            return res.json(updatedUser);
        } catch (error) {
            console.error('Erro ao atualizar perfil do usuário:', error);
            return res.status(500).json({ error: 'Erro interno ao atualizar perfil' });
        }
    }

    async getTeam(req: Request, res: Response) {
        try {
            const tenantId = req.user?.tenantId as string;

            const team = await prisma.user.findMany({
                where: { tenantId },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    createdAt: true
                }
            });

            // Mapeando a resposta pro frontend que espera status e lastLogin
            const mappedTeam = team.map((member: any) => ({
                id: member.id,
                name: member.name,
                email: member.email,
                role: member.role,
                status: 'ACTIVE',
                lastLogin: member.createdAt // Mock last login just to have something
            }));

            return res.json(mappedTeam);
        } catch (error) {
            console.error('Erro ao buscar equipe:', error);
            return res.status(500).json({ error: 'Erro interno ao buscar equipe' });
        }
    }

    async inviteUser(req: Request, res: Response) {
        try {
            const tenantId = req.user?.tenantId as string;
            const { name, email, role } = req.body;

            // Se não enviou email, vai dar erro com UNIQUE do Prisma se colocar null,
            // então para evitar erros nesta sprint de MVP, vamos gerar um email fake caso falte.
            const generatedEmail = email || `user_${Date.now()}@temp.foodsaas.com`;

            const existingUser = await prisma.user.findUnique({ where: { email: generatedEmail } });
            if (existingUser) {
                return res.status(400).json({ error: 'Email já está em uso.' });
            }

            // Senha padrão 123456
            const hashedPassword = await bcrypt.hash('123456', 10);

            const newUser = await prisma.user.create({
                data: {
                    name,
                    email: generatedEmail,
                    passwordHash: hashedPassword,
                    role: role || 'EMPLOYEE',
                    tenantId
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true
                }
            });

            return res.status(201).json(newUser);
        } catch (error) {
            console.error('Erro ao convidar membro:', error);
            return res.status(500).json({ error: 'Erro interno ao convidar membro de equipe' });
        }
    }

    async updateUser(req: Request, res: Response) {
        try {
            const tenantId = req.user?.tenantId as string;
            const id = req.params.id as string;
            const { name, role } = req.body;

            const targetUser = await prisma.user.findFirst({ where: { id, tenantId } });
            if (!targetUser) return res.status(404).json({ error: 'Usuário não encontrado' });

            const updatedUser = await prisma.user.update({
                where: { id },
                data: { name, role: role || undefined }
            });

            return res.json(updatedUser);
        } catch (error) {
            console.error('Erro ao atualizar usuário:', error);
            return res.status(500).json({ error: 'Erro ao atualizar usuário' });
        }
    }

    async deleteUser(req: Request, res: Response) {
        try {
            const tenantId = req.user?.tenantId as string;
            const id = req.params.id as string;

            const targetUser = await prisma.user.findFirst({ where: { id, tenantId } });
            if (!targetUser) return res.status(404).json({ error: 'Usuário não encontrado' });

            // Impede que o owner principal se exclua aqui (lógica avançada seria verificar o role)
            if (targetUser.role === 'OWNER') {
                return res.status(403).json({ error: 'Não é possível excluir o proprietário' });
            }

            await prisma.user.delete({ where: { id } });
            return res.status(204).send();
        } catch (error) {
            console.error('Erro ao excluir usuário:', error);
            return res.status(500).json({ error: 'Erro ao excluir usuário' });
        }
    }
}
