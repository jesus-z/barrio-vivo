import { describe, expect, it } from 'vitest';
import { normalizeActivity, pointsForCategory, summarizeActivities } from './activities.js';

describe('reglas de actividades', () => {
  it('normaliza espacios de título, descripción y autor', () => {
    expect(normalizeActivity({ title: '  Limpieza  ', description: '  Plaza limpia  ', category: 'Limpieza', author: ' Ana ' })).toMatchObject({ title: 'Limpieza', description: 'Plaza limpia', author: 'Ana' });
  });
  it('asigna 15 puntos al reciclaje', () => expect(pointsForCategory('Reciclaje')).toBe(15));
  it('asigna 20 puntos al huerto', () => expect(pointsForCategory('Huerto')).toBe(20));
  it('asigna 10 puntos a movilidad', () => expect(pointsForCategory('Movilidad')).toBe(10));
  it('usa puntos por defecto si la entrada no los especifica', () => expect(normalizeActivity({ title: 'Huerto', description: 'Cultivo colectivo', category: 'Huerto', author: 'Ana' }).points).toBe(20));
  it('resume puntos, cantidad y categorías', () => expect(summarizeActivities([{ points: 15, category: 'Reciclaje' }, { points: 20, category: 'Huerto' }, { points: 15, category: 'Reciclaje' }])).toEqual({ points: 50, count: 3, categories: { Reciclaje: 2, Huerto: 1 } }));
});
