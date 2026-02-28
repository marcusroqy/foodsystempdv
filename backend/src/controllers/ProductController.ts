import { Request, Response } from 'express';
import { ProductService } from '../services/ProductService';

export class ProductController {
    private productService = new ProductService();

    list = async (req: Request, res: Response) => {
        try {
            const tenantId = req.user?.tenantId;
            if (!tenantId) return res.status(401).json({ error: 'Tenant missing' });

            const all = req.query.all === 'true';

            const products = await this.productService.listProducts(tenantId, all);
            return res.json(products);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    };

    create = async (req: Request, res: Response) => {
        try {
            const tenantId = req.user?.tenantId;
            if (!tenantId) return res.status(401).json({ error: 'Tenant missing' });

            const { name, price, categoryId, isStockControlled, isForSale } = req.body;
            const product = await this.productService.createProduct(tenantId, { name, price, categoryId, isStockControlled, isForSale });
            return res.status(201).json(product);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    };

    update = async (req: Request, res: Response) => {
        try {
            const tenantId = req.user?.tenantId;
            if (!tenantId) return res.status(401).json({ error: 'Tenant missing' });

            const id = req.params.id as string;
            const { name, price, categoryId, isStockControlled, isForSale } = req.body;

            await this.productService.updateProduct(tenantId, id, { name, price, categoryId, isStockControlled, isForSale });
            return res.status(200).json({ success: true });
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    };

    delete = async (req: Request, res: Response) => {
        try {
            const tenantId = req.user?.tenantId;
            if (!tenantId) return res.status(401).json({ error: 'Tenant missing' });

            const id = req.params.id as string;
            await this.productService.deleteProduct(tenantId, id);
            return res.status(204).send();
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    };
}
