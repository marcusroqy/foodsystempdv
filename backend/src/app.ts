import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './routes/auth.routes';
import categoryRouter from './routes/category.routes';
import productRouter from './routes/product.routes';
import orderRouter from './routes/order.routes';
import financeRouter from './routes/finance.routes';
import inventoryRouter from './routes/inventory.routes';
import tenantRouter from './routes/tenant.routes';
import userRouter from './routes/user.routes';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/products', productRouter);
app.use('/api/orders', orderRouter);
app.use('/api/finances', financeRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/tenant', tenantRouter);
app.use('/api/users', userRouter);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'SaaS API is running' });
});

export default app;
