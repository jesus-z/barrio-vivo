import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../app.js';

const prisma = new PrismaClient();
const app = createApp(prisma);
const valid = { title: 'Jornada de limpieza', description: 'Limpiamos el parque central juntos.', category: 'Limpieza', author: 'María' };
beforeAll(async () => prisma.$connect());
beforeEach(async () => prisma.activity.deleteMany());
afterAll(async () => prisma.$disconnect());

describe.sequential('API de actividades con PostgreSQL', () => {
  it('responde health check', async () => { const res = await request(app).get('/api/health'); expect(res.status).toBe(200); expect(res.body.status).toBe('ok'); });
  it('crea una actividad y calcula puntos por categoría', async () => { const res = await request(app).post('/api/activities').send(valid); expect(res.status).toBe(201); expect(res.body.activity.points).toBe(25); });
  it('rechaza una actividad con campos requeridos inválidos', async () => { const res = await request(app).post('/api/activities').send({ ...valid, title: 'x' }); expect(res.status).toBe(400); expect(res.body.error).toBe('Datos inválidos'); });
  it('lista las actividades ordenadas y su resumen', async () => { await request(app).post('/api/activities').send(valid); const res = await request(app).get('/api/activities'); expect(res.body.activities).toHaveLength(1); expect(res.body.summary.points).toBe(25); });
  it('filtra las actividades por categoría', async () => { await request(app).post('/api/activities').send(valid); await request(app).post('/api/activities').send({ ...valid, category: 'Huerto', title: 'Siembra vecinal' }); const res = await request(app).get('/api/activities?category=Huerto'); expect(res.body.activities).toHaveLength(1); expect(res.body.activities[0].category).toBe('Huerto'); });
  it('expone estadísticas agregadas de la comunidad', async () => { await request(app).post('/api/activities').send(valid); const res = await request(app).get('/api/stats'); expect(res.body).toMatchObject({ count: 1, points: 25, categories: { Limpieza: 1 } }); });
});
