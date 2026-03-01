import { Request, Response } from 'express';
import { CategoryService } from '../services/CategoryService';

export class CategoryController {
    private categoryService = new CategoryService();

    list = async (req: Request, res: Response) => {
        try {
            const tenantId = req.user?.tenantId;
            if (!tenantId) return res.status(401).json({ error: 'Tenant missing' });

            const type = req.query.type as string | undefined;

            const categories = await this.categoryService.listCategories(tenantId, type);
            return res.json(categories);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    };

    create = async (req: Request, res: Response) => {
        try {
            const tenantId = req.user?.tenantId;
            if (!tenantId) return res.status(401).json({ error: 'Tenant missing' });

            const { name, type } = req.body;
            const category = await this.categoryService.createCategory(tenantId, name, type);
            return res.status(201).json(category);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    };

    delete = async (req: Request, res: Response) => {
        try {
            const tenantId = req.user?.tenantId;
            if (!tenantId) return res.status(401).json({ error: 'Tenant missing' });

            const id = req.params.id as string;
            await this.categoryService.deleteCategory(tenantId, id);
            return res.status(204).send();
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    };
}
