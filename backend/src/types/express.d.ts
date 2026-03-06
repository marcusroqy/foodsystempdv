declare namespace Express {
    export interface Request {
        user?: {
            userId?: string;
            customerId?: string;
            tenantId: string;
            role?: string;
        };
    }
}
