import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Token missing' });
    }

    const [, token] = authHeader.split(' ');

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as {
            userId: string;
            tenantId: string;
            role: string;
        };

        req.user = decoded;
        return next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};
