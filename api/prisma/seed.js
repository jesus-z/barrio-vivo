import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const examples = [
  { title: 'Compost para la plaza', description: 'Instalamos una compostera comunitaria junto a las vecinas.', category: 'Huerto', points: 20, author: 'Camila' },
  { title: 'Bici al trabajo', description: 'Una semana completa moviéndome en bicicleta por el barrio.', category: 'Movilidad', points: 10, author: 'Diego' },
  { title: 'Punto limpio barrial', description: 'Separamos papel y plástico para llevarlos al centro de acopio.', category: 'Reciclaje', points: 15, author: 'Lucía' }
];
for (const activity of examples) {
  const id = `seed-${activity.title.toLowerCase().replaceAll(' ', '-')}`;
  await prisma.activity.upsert({ where: { id }, update: {}, create: { ...activity, id } });
}
await prisma.$disconnect();
