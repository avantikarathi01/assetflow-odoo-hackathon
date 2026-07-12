import express from 'express';
import cors from 'cors';
import { authMiddleware } from './middleware/auth';
import authRoutes from './routes/auth.routes';
import organizationRoutes from './routes/organization.routes';
import assetRoutes from './routes/asset.routes';
import transferRoutes from './routes/transfer.routes';
import dashboardRoutes from './routes/dashboard.routes';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Global Auth Middleware
app.use(authMiddleware);

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(err.statusCode || 500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`🚀 API Server running at http://localhost:${PORT}`);
});
