import { PrismaClient } from '@prisma/client';
import { createApp } from './app.js';

const prisma = new PrismaClient();
const port = Number(process.env.API_PORT ?? 3000);
const server = createApp(prisma).listen(port, '0.0.0.0', () => console.log(`Barrio Vivo API escuchando en ${port}`));

async function shutdown() {
  server.close();
  await prisma.$disconnect();
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
