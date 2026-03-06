import { Request, Response } from 'express';
import { prisma } from '../repositories/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export class DeliveryController {
    // 1. Get Tenant details by slug
    async getTenantBySlug(req: Request, res: Response) {
        try {
            const slug = req.params.slug as string;
            const tenant = await prisma.tenant.findUnique({
                where: { slug },
                select: { id: true, name: true, phone: true, address: true, status: true, slug: true }
            });

            if (!tenant) return res.status(404).json({ error: 'Loja não encontrada' });
            if (tenant.status !== 'ACTIVE') return res.status(403).json({ error: 'Loja indisponível no momento' });

            return res.json(tenant);
        } catch (error) {
            console.error('Erro getTenantBySlug:', error);
            return res.status(500).json({ error: 'Erro interno' });
        }
    }

    // 2. Get Menu by Tenant Slug
    async getMenu(req: Request, res: Response) {
        try {
            const slug = req.params.slug as string;
            const tenant = await prisma.tenant.findUnique({ where: { slug } });
            if (!tenant) return res.status(404).json({ error: 'Loja não encontrada' });

            const categories = await prisma.category.findMany({
                where: { tenantId: tenant.id, type: 'MENU' },
                include: {
                    products: {
                        where: { isForSale: true },
                        select: { id: true, name: true, price: true, imageUrl: true }
                    }
                }
            });

            // Filter out empty categories
            const filledCategories = categories.filter((c: any) => c.products.length > 0);

            return res.json(filledCategories);
        } catch (error) {
            console.error('Erro getMenu:', error);
            return res.status(500).json({ error: 'Erro interno' });
        }
    }

    // 3. Customer Auth (Register/Login)
    async registerCustomer(req: Request, res: Response) {
        try {
            const slug = req.params.slug as string;
            const { name, phone, password, street, number, complement, neighborhood, city, state, zipCode } = req.body;

            const tenant = await prisma.tenant.findUnique({ where: { slug } });
            if (!tenant) return res.status(404).json({ error: 'Loja não encontrada' });

            const existingCustomer = await prisma.customer.findFirst({
                where: { tenantId: tenant.id, phone }
            });

            if (existingCustomer) {
                return res.status(400).json({ error: 'Este número de WhatsApp já possui cadastro.' });
            }

            const passwordHash = await bcrypt.hash(password, 8);

            const customer = await prisma.customer.create({
                data: {
                    tenantId: tenant.id,
                    name,
                    phone,
                    passwordHash,
                    street, number, complement, neighborhood, city, state, zipCode
                }
            });

            const token = jwt.sign(
                { customerId: customer.id, tenantId: tenant.id },
                process.env.JWT_SECRET || 'secret',
                { expiresIn: '30d' }
            );

            return res.status(201).json({
                token,
                customer: {
                    id: customer.id,
                    name: customer.name,
                    phone: customer.phone,
                    street: customer.street,
                    number: customer.number,
                    neighborhood: customer.neighborhood
                }
            });
        } catch (error) {
            console.error('Erro registerCustomer:', error);
            return res.status(500).json({ error: 'Erro interno' });
        }
    }

    async loginCustomer(req: Request, res: Response) {
        try {
            const slug = req.params.slug as string;
            const { phone, password } = req.body;

            const tenant = await prisma.tenant.findUnique({ where: { slug } });
            if (!tenant) return res.status(404).json({ error: 'Loja não encontrada' });

            const customer = await prisma.customer.findFirst({
                where: { tenantId: tenant.id, phone }
            });

            if (!customer) {
                return res.status(401).json({ error: 'Telefone ou senha incorretos' });
            }

            const isMatch = await bcrypt.compare(password, customer.passwordHash);
            if (!isMatch) {
                return res.status(401).json({ error: 'Telefone ou senha incorretos' });
            }

            const token = jwt.sign(
                { customerId: customer.id, tenantId: tenant.id },
                process.env.JWT_SECRET || 'secret',
                { expiresIn: '30d' }
            );

            return res.json({
                token,
                customer: {
                    id: customer.id,
                    name: customer.name,
                    phone: customer.phone,
                    street: customer.street,
                    number: customer.number,
                    neighborhood: customer.neighborhood
                }
            });
        } catch (error) {
            console.error('Erro loginCustomer:', error);
            return res.status(500).json({ error: 'Erro interno' });
        }
    }

    // 4. Create Order from App
    async createOrder(req: Request, res: Response) {
        try {
            const slug = req.params.slug as string;
            const { customerId } = req.user as any; // From Auth Middleware
            const { items, orderType, deliveryAddress, paymentMethod, changeFor, notes } = req.body;

            const tenant = await prisma.tenant.findUnique({ where: { slug } });
            if (!tenant) return res.status(404).json({ error: 'Loja não encontrada' });

            const customer = await prisma.customer.findUnique({ where: { id: customerId } });
            if (!customer) return res.status(404).json({ error: 'Cliente não encontrado' });

            let totalAmount = 0;
            const orderItemsInput = [];

            for (const item of items) {
                const product = await prisma.product.findUnique({ where: { id: item.productId } });
                if (!product) return res.status(400).json({ error: `Produto não encontrado: ${item.productId}` });

                totalAmount += Number(product.price) * item.quantity;

                orderItemsInput.push({
                    tenantId: tenant.id,
                    productId: product.id,
                    quantity: item.quantity,
                    unitPrice: product.price,
                    notes: item.notes || null,
                });
            }

            // Assign order to an active tenant user (owner/manager) since our schema requires userId.
            const tenantOwner = await prisma.user.findFirst({
                where: { tenantId: tenant.id }
            });

            if (!tenantOwner) return res.status(500).json({ error: 'Nenhum usuário ativo para receber o pedido.' });

            const order = await prisma.order.create({
                data: {
                    tenantId: tenant.id,
                    userId: tenantOwner.id,
                    customerName: customer.name,
                    customerId: customer.id,
                    status: 'QUEUE',
                    orderType: orderType || 'DELIVERY',
                    totalAmount,
                    paymentMethod,
                    changeFor: changeFor ? Number(changeFor) : null,
                    notes,
                    deliveryAddress,
                    items: {
                        create: orderItemsInput
                    }
                },
                include: { items: true }
            });

            // Note: We don't create FinancialTransaction here. It's done when status changes to COMPLETED.

            return res.status(201).json(order);
        } catch (error) {
            console.error('Erro createOrder (Delivery):', error);
            return res.status(500).json({ error: 'Erro interno' });
        }
    }

    // 5. Get Customer Orders history
    async getCustomerOrders(req: Request, res: Response) {
        try {
            const slug = req.params.slug as string;
            const { customerId } = req.user as any;

            const tenant = await prisma.tenant.findUnique({ where: { slug } });
            if (!tenant) return res.status(404).json({ error: 'Loja não encontrada' });

            const orders = await prisma.order.findMany({
                where: { tenantId: tenant.id, customerId },
                include: { items: { include: { product: { select: { name: true, imageUrl: true } } } } },
                orderBy: { createdAt: 'desc' }
            });

            return res.json(orders);
        } catch (error) {
            console.error('Erro getCustomerOrders:', error);
            return res.status(500).json({ error: 'Erro interno' });
        }
    }
}
