import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import projectRoutes from './routes/project.routes';
import applicationRoutes from './routes/application.routes';
import advisorRoutes from './routes/advisor.routes';
import adminRoutes from './routes/admin.routes';
import userRoutes from './routes/user.routes';
import teamAdRoutes from './routes/teamAd.routes';
import { prisma } from './prisma/client';
import { globalLimiter, authLimiter } from './middlewares/rateLimit.middleware';

const app = express();
const PORT = process.env.PORT || 5000;

// Essential Middlewares
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
app.use(express.json());

// Apply global rate limiter
app.use(globalLimiter);

// Health Check Endpoint
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'OK', database: 'Connected', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(503).json({ status: 'ERROR', database: 'Disconnected', timestamp: new Date().toISOString() });
  }
});

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/advisors', advisorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/team-ads', teamAdRoutes);

// Global Error Handler (Fallback)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Error:', err);

  if (err.name === 'PrismaClientKnownRequestError') {
    res.status(400).json({ error: 'Database constraint violation or invalid operation', code: err.code });
    return;
  }

  res.status(500).json({ error: 'Internal Server Error', details: process.env.NODE_ENV === 'development' ? err.message : undefined });
});

// Only start listening when this file is run directly (not imported by tests)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });

  // Graceful shutdown — disconnect Prisma to avoid connection leaks
  const shutdown = async () => {
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

export default app;
