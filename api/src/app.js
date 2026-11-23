import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { z } from 'zod';
import { CATEGORIES, normalizeActivity, summarizeActivities } from './domain/activities.js';

const activitySchema = z.object({
  title: z.string().trim().min(3).max(80),
  description: z.string().trim().min(8).max(500),
  category: z.enum(CATEGORIES),
  author: z.string().trim().min(2).max(40)
});

export function createApp(prisma) {
  const app = express();
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '20kb' }));

  app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'barrio-vivo-api' }));
  app.get('/api/activities', async (req, res, next) => {
    try {
      const where = req.query.category ? { category: String(req.query.category) } : {};
      const activities = await prisma.activity.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100 });
      res.json({ activities, summary: summarizeActivities(activities) });
    } catch (error) { next(error); }
  });
  app.post('/api/activities', async (req, res, next) => {
    const parsed = activitySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors });
    try {
      const activity = await prisma.activity.create({ data: normalizeActivity(parsed.data) });
      res.status(201).json({ activity });
    } catch (error) { next(error); }
  });
  app.get('/api/stats', async (_req, res, next) => {
    try {
      const activities = await prisma.activity.findMany({ select: { category: true, points: true } });
      res.json(summarizeActivities(activities));
    } catch (error) { next(error); }
  });
  app.use((error, _req, res, _next) => {
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor' });
  });
  return app;
}
